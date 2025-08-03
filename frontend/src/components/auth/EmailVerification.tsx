import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface VerificationState {
  status: 'loading' | 'success' | 'error' | 'already_verified';
  message: string;
}

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email address...'
  });
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState({
        status: 'error',
        message: 'Invalid verification link. Please check your email for the correct verification link.'
      });
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.type === 'already_verified') {
          setState({
            status: 'already_verified',
            message: data.message
          });
        } else {
          setState({
            status: 'success',
            message: data.message
          });
        }
      } else {
        setState({
          status: 'error',
          message: data.error || 'Email verification failed. Please try again.'
        });
      }
    } catch (error) {
      setState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      alert('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return (
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return <span className="text-6xl">✅</span>;
      case 'already_verified':
        return <span className="text-6xl">✅</span>;
      case 'error':
        return <span className="text-6xl">❌</span>;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
      case 'already_verified':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionButton = () => {
    if (state.status === 'success' || state.status === 'already_verified') {
      return (
        <button
          onClick={() => {
            // TODO: Navigate to login page
            alert('Navigate to login page');
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue to Login
        </button>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your email to resend verification:
            </label>
            <div className="flex space-x-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleResendVerification}
                disabled={resending || !email}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => {
                // TODO: Navigate to register page
                alert('Navigate to register page');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Register New Account
            </button>
            
            <button
              onClick={() => {
                // TODO: Navigate to login page
                alert('Navigate to login page');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          <h2 className={`text-3xl font-extrabold ${getStatusColor()}`}>
            {state.status === 'loading' && 'Verifying Email...'}
            {state.status === 'success' && 'Email Verified!'}
            {state.status === 'already_verified' && 'Already Verified'}
            {state.status === 'error' && 'Verification Failed'}
          </h2>
          
          <p className="mt-4 text-gray-600">
            {state.message}
          </p>
        </div>

        <div className="mt-8">
          {getActionButton()}
        </div>

        {(state.status === 'success' || state.status === 'already_verified') && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              🎉 Welcome to Trading Journal! You can now log in and start tracking your trades.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Verification links expire after 24 hours. If your link has expired, you can request a new one above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;