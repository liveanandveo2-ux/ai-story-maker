import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import axios from 'axios';
import GoogleAuthService from '../services/googleAuth';

// API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_ENDPOINT || import.meta.env.VITE_BACKEND_HOST;
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token and verify with backend
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }

    // Set up Firebase auth state listener
    const unsubscribe = GoogleAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token and send to backend for verification
          const idToken = await GoogleAuthService.getCurrentIdToken();
          if (idToken) {
            const response = await axiosInstance.post('/auth/google', { idToken });
            
            if (response.data.success) {
              localStorage.setItem('authToken', response.data.token);
              setUser(response.data.user);
            }
          }
        } catch (error) {
          console.error('Firebase auth sync failed:', error);
          // Clear invalid token
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axiosInstance.get('/auth/verify');
      if (response.data.success && response.data.valid) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: backendUser, token } = response.data;
        localStorage.setItem('authToken', token);
        setUser(backendUser);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth authentication...');
      
      // Sign in with Google
      const { user: firebaseUser, idToken } = await GoogleAuthService.signInWithGoogle();
      
      console.log('Google sign-in successful, sending token to backend...');
      
      // Send ID token to backend for verification and JWT generation
      const response = await axiosInstance.post('/auth/google', { idToken });
      
      if (response.data.success) {
        const { user: backendUser, token } = response.data;
        
        // Store token with timestamp for session management
        const tokenData = {
          token,
          timestamp: Date.now(),
          expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('authTokenMeta', JSON.stringify(tokenData));
        setUser(backendUser);
        console.log('Backend authentication successful');
      } else {
        throw new Error(response.data.error);
      }
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // If Google auth failed, try to sign out from Firebase
      try {
        await GoogleAuthService.signOut();
      } catch (signOutError) {
        console.error('Failed to sign out from Firebase:', signOutError);
      }
      
      throw error;
    }
  };

  // Token refresh function
  const refreshToken = async () => {
    try {
      const response = await axiosInstance.post('/auth/refresh');
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        localStorage.setItem('authToken', token);
        
        // Update token metadata
        const tokenData = {
          token,
          timestamp: Date.now(),
          expiresIn: 7 * 24 * 60 * 60 * 1000
        };
        localStorage.setItem('authTokenMeta', JSON.stringify(tokenData));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenMeta = localStorage.getItem('authTokenMeta');
      if (tokenMeta) {
        try {
          const { timestamp, expiresIn } = JSON.parse(tokenMeta);
          const timeLeft = expiresIn - (Date.now() - timestamp);
          
          // Refresh token if less than 1 hour remaining
          if (timeLeft < 60 * 60 * 1000 && timeLeft > 0) {
            console.log('Token expiring soon, refreshing...');
            refreshToken();
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
        }
      }
    };

    // Check token expiration every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    checkTokenExpiration(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  const signOut = async () => {
    try {
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenMeta');
      setUser(null);
      
      // Sign out from Google as well
      await GoogleAuthService.signOut();
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear local state even if Google sign out fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenMeta');
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};