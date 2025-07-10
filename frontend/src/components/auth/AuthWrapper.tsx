import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import Register from './Register';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your trading journal...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the main app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show login or register form
  return (
    <div>
      {authMode === 'login' ? (
        <Login
          onSwitchToRegister={() => setAuthMode('register')}
          onSuccess={() => {
            // Authentication success is handled by the AuthContext
            // The component will re-render when isAuthenticated becomes true
          }}
        />
      ) : (
        <Register
          onSwitchToLogin={() => setAuthMode('login')}
          onSuccess={() => {
            // Authentication success is handled by the AuthContext
            // The component will re-render when isAuthenticated becomes true
          }}
        />
      )}
    </div>
  );
};

export default AuthWrapper;