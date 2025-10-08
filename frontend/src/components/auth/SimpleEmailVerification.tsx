import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

interface VerificationState {
  status: 'loading' | 'success' | 'error' | 'already_verified';
  message: string;
}

const SimpleEmailVerification: React.FC = () => {
  const [state, setState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email address...'
  });

  // Get token from URL parameters
  const getTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

  useEffect(() => {
    const token = getTokenFromUrl();
    
    if (!token) {
      setState({
        status: 'error',
        message: 'Invalid verification link. Please check your email for the correct verification link.'
      });
      return;
    }

    verifyEmail(token);
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setState({
          status: 'success',
          message: 'Email verified successfully! You can now log in to your account.'
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setState({
          status: data.message?.includes('already verified') ? 'already_verified' : 'error',
          message: data.message || 'Verification failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return (
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        );
      case 'success':
        return <div className="text-6xl mb-4">✅</div>;
      case 'already_verified':
        return <div className="text-6xl mb-4">✅</div>;
      case 'error':
        return <div className="text-6xl mb-4">❌</div>;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'success':
      case 'already_verified':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          {getStatusIcon()}
          <h1 className="text-2xl font-bold text-white mb-4">
            Email Verification
          </h1>
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {state.message}
          </p>
          
          {state.status === 'success' && (
            <div className="text-sm text-gray-400">
              Redirecting to login in 3 seconds...
            </div>
          )}
          
          {(state.status === 'error' || state.status === 'already_verified') && (
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleEmailVerification;