import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // For demo purposes, create a mock user
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@storymaker.app',
        name: 'Demo User',
        picture: undefined,
        createdAt: new Date()
      };
      setUser(mockUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Demo sign-in - just create mock user
      const mockUser = {
        id: 'email-user-' + Date.now(),
        email,
        name: email.split('@')[0],
        picture: undefined,
        createdAt: new Date()
      };
      
      const mockToken = 'email-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      setUser(mockUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Demo Google sign-in - simulate successful OAuth
      const mockUser = {
        id: 'google-user-' + Date.now(),
        email: 'google.demo@storymaker.app',
        name: 'Demo Google User',
        picture: undefined,
        createdAt: new Date()
      };
      
      const mockToken = 'google-demo-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      setUser(mockUser);
      
      console.log('Demo Google sign-in successful');
    } catch (error) {
      console.error('Google sign in error:', error);
      
      // Fallback: create demo user anyway
      const mockUser = {
        id: 'google-fallback-' + Date.now(),
        email: 'google.demo@storymaker.app',
        name: 'Demo Google User',
        picture: undefined,
        createdAt: new Date()
      };
      
      const mockToken = 'google-fallback-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      setUser(mockUser);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
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