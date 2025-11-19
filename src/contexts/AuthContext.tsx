import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import axios from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://ai-story-maker-backend.onrender.com/api';
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
      // Since we don't have Firebase setup, create a demo Google user
      const demoGoogleUser = {
        id: 'google-user-' + Date.now(),
        email: 'demo.google@storymaker.app',
        name: 'Demo Google User',
        picture: undefined,
        createdAt: new Date()
      };
      
      const mockToken = 'google-demo-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      setUser(demoGoogleUser);
      
      console.log('Demo Google sign-in successful (Firebase not configured)');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
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