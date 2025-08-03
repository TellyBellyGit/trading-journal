import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginError {
  message: string;
  type: string;
  attemptsRemaining?: number;
  retryAfter?: number;
  canResendVerification?: boolean;
}

interface EnhancedLoginProps {
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  onSuccess?: () => void;
}

const EnhancedLogin: React.FC<EnhancedLoginProps> = ({ onSwitchToRegister, onForgotPassword, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      let errorData: LoginError;
      
      if (err.message.includes('429') || err.message.includes('Too many')) {
        errorData = {
          message: 'Too many login attempts. Please try again in 15 minutes.',
          type: 'rate_limit'
        };
      } else if (err.response?.data) {
        // Parse structured error from our enhanced API
        const { error: message, type, attemptsRemaining, retryAfter, canResendVerification } = err.response.data;
        errorData = {
          message,
          type,
          attemptsRemaining,
          retryAfter,
          canResendVerification
        };
      } else {
        errorData = {
          message: err.message || 'Login failed. Please try again.',
          type: 'unknown'
        };
      }
      
      setError(errorData);
    } finally {
      setLoading(false);
    }
  };

  const getErrorDisplay = () => {
    if (!error) return null;

    const baseClasses = "p-4 rounded-lg border text-sm";
    let classes = baseClasses;
    let icon = "⚠️";
    let title = "Error";

    switch (error.type) {
      case 'rate_limit':
        classes += " bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
        icon = "⏱️";
        title = "Rate Limited";
        break;
      case 'account_locked':
        classes += " bg-red-500/10 border-red-500/20 text-red-400";
        icon = "🔒";
        title = "Account Locked";
        break;
      case 'email_unverified':
        classes += " bg-blue-500/10 border-blue-500/20 text-blue-400";
        icon = "📧";
        title = "Email Verification Required";
        break;
      case 'account_inactive':
        classes += " bg-gray-500/10 border-gray-500/20 text-gray-400";
        icon = "🚫";
        title = "Account Deactivated";
        break;
      case 'authentication_error':
        classes += " bg-red-500/10 border-red-500/20 text-red-400";
        icon = "🔐";
        title = "Authentication Failed";
        break;
      default:
        classes += " bg-red-500/10 border-red-500/20 text-red-400";
    }

    return (
      <div className={classes}>
        <div className="flex items-start space-x-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="mt-1">{error.message}</p>
            
            {error.attemptsRemaining !== undefined && (
              <p className="mt-2 font-medium">
                {error.attemptsRemaining} attempt{error.attemptsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
            
            {error.retryAfter && (
              <p className="mt-2 text-xs">
                Try again in {Math.ceil(error.retryAfter / 60)} minutes
              </p>
            )}

            {error.canResendVerification && (
              <button 
                className="mt-3 text-blue-400 hover:text-blue-300 underline text-xs"
                onClick={() => {
                  // TODO: Implement resend verification
                  alert('Resend verification functionality coming soon');
                }}
              >
                Resend verification email
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your trading journal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-400 hover:text-gray-300">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {getErrorDisplay()}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
                onClick={() => {
                  onForgotPassword?.();
                }}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (error?.type === 'rate_limit')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {onSwitchToRegister && (
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
                >
                  Sign up
                </button>
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EnhancedLogin;