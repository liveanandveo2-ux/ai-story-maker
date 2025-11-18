import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import StoryCreator from './components/StoryCreator';
import StoryViewer from './components/StoryViewer';
import StorybookViewer from './components/StorybookViewer';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Component wrapper to suppress React Router v7 warnings
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            AI Story Maker
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Where imagination meets intelligence,
            <span className="text-blue-600 font-semibold block mt-2">
              crafting stories that come alive
            </span>
          </p>
          
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Setting up your magical story world...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginScreen />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/create"
        element={user ? <StoryCreator /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/story/:id"
        element={user ? <StoryViewer /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/storybook/:id"
        element={user ? <StorybookViewer /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;