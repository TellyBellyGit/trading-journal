import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Login from './EnhancedLogin';
import Register from './Register';
import ResetPassword from './ResetPassword';
import ForgotPassword from './ForgotPassword';
import SimpleEmailVerification from './SimpleEmailVerification';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Helper function to detect reset token and determine initial auth mode
const getInitialAuthMode = (): 'login' | 'register' | 'reset-password' | 'forgot-password' | 'verify-email' => {
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const verifyParam = urlParams.get('verify');
  
  // Check if we're doing email verification
  if (verifyParam === 'email') {
    console.log('📧 Email verification detected');
    return 'verify-email';
  }
  
  // If there's a token parameter, show reset form
  if (resetToken && verifyParam !== 'email') {
    console.log('🔑 Reset token detected:', resetToken.substring(0, 8) + '...');
    return 'reset-password';
  }
  
  return 'login';
};

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset-password' | 'forgot-password' | 'verify-email'>(getInitialAuthMode());

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your trading journal...</p>
        </div>
      </div>
    );
  }

  // If there's a reset token, always show reset form regardless of auth status
  if (authMode === 'reset-password') {
    return (
      <div>
        <ResetPassword 
          onBackToLogin={() => {
            setAuthMode('login');
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      </div>
    );
  }

  // If showing forgot password form
  if (authMode === 'forgot-password') {
    return (
      <div>
        <ForgotPassword 
          onBackToLogin={() => setAuthMode('login')}
        />
      </div>
    );
  }

  // If showing email verification
  if (authMode === 'verify-email') {
    return <SimpleEmailVerification />;
  }

  // If user is authenticated, show the main app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show login or register form (reset and forgot-password are handled above)
  return (
    <div>
      {authMode === 'login' ? (
        <Login
          onSwitchToRegister={() => setAuthMode('register')}
          onForgotPassword={() => setAuthMode('forgot-password')}
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