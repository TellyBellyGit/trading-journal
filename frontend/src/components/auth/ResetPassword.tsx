import React, { useState, useEffect } from 'react';

interface ResetPasswordProps {
  onBackToLogin?: () => void;
}

interface ResetPasswordState {
  token: string | null;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  validating: boolean;
  success: boolean;
  error: string | null;
  tokenValid: boolean;
  userInfo: {
    email: string;
    firstName: string;
    expiresInMinutes: number;
  } | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBackToLogin }) => {
  // Get token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  console.log('🔄 ResetPassword component loaded with token:', token ? token.substring(0, 8) + '...' : 'null');
  
  const [state, setState] = useState<ResetPasswordState>({
    token,
    newPassword: '',
    confirmPassword: '',
    loading: false,
    validating: true,
    success: false,
    error: null,
    tokenValid: false,
    userInfo: null,
    showPassword: false,
    showConfirmPassword: false
  });

  useEffect(() => {
    if (state.token) {
      validateToken(state.token);
    } else {
      setState(prev => ({ 
        ...prev, 
        validating: false, 
        error: 'Invalid reset link. Please request a new password reset.' 
      }));
    }
  }, [state.token]);

  const validateToken = async (token: string) => {
    console.log('🚀 CALLING API: validate-reset-token with token:', token.substring(0, 8) + '...');
    
    try {
      const response = await fetch(`https://trading-journal-backend-5fi2.onrender.com/api/auth/validate-reset-token/${token}`);
      console.log('📡 API RETURNED STATUS:', response.status, response.ok ? 'OK' : 'ERROR');
      
      const data = await response.json();

      if (response.ok && data.valid) {
        setState(prev => ({ 
          ...prev, 
          validating: false, 
          tokenValid: true,
          userInfo: {
            email: data.email,
            firstName: data.firstName,
            expiresInMinutes: data.expiresInMinutes
          }
        }));
      } else {
        // 🔍 DEBUG: Log debug info from backend
        if (data.debug) {
          console.log('🔍 BACKEND DEBUG INFO:', data.debug);
        }
        
        setState(prev => ({ 
          ...prev, 
          validating: false, 
          error: data.error || 'Invalid or expired reset token' 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        validating: false, 
        error: 'Network error. Please try again.' 
      }));
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push('at least 8 characters');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('uppercase letter');

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('lowercase letter');

    if (/\d/.test(password)) strength++;
    else feedback.push('number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    else feedback.push('special character');

    return { strength, feedback };
  };

  const passwordStrength = getPasswordStrength(state.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.newPassword !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }

    if (passwordStrength.strength < 4) {
      setState(prev => ({ 
        ...prev, 
        error: `Password is too weak. Missing: ${passwordStrength.feedback.join(', ')}` 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('https://trading-journal-backend-5fi2.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: state.token, 
          newPassword: state.newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Password reset successful for user:', data.user?.email);
        setState(prev => ({ ...prev, success: true, loading: false }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error || 'Failed to reset password', 
          loading: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
        loading: false 
      }));
    }
  };

  const getPasswordStrengthIndicator = () => {
    if (!state.newPassword) return null;

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
      <div className="mt-2">
        <div className="flex space-x-1 mb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded ${
                level <= passwordStrength.strength ? colors[passwordStrength.strength - 1] || 'bg-gray-200' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Password strength: {labels[passwordStrength.strength - 1] || 'Very Weak'}
          {passwordStrength.feedback.length > 0 && (
            <span className="block mt-1">Missing: {passwordStrength.feedback.join(', ')}</span>
          )}
        </p>
      </div>
    );
  };

  if (state.validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!state.tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-20 w-20 flex items-center justify-center bg-red-100 rounded-full mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-3xl font-extrabold text-red-600 mb-4">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {state.error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // TODO: Navigate to forgot password page
                alert('Navigate to forgot password page');
              }}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request New Reset Link
            </button>
            
            <button
              onClick={() => {
                onBackToLogin?.();
              }}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-20 w-20 flex items-center justify-center bg-green-100 rounded-full mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-extrabold text-green-600 mb-4">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <button
            onClick={() => {
              onBackToLogin?.();
            }}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-blue-100 rounded-full mb-6">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back, <strong>{state.userInfo?.firstName}</strong>! 
            Please create a new secure password for <strong>{state.userInfo?.email}</strong>.
          </p>
          
          {state.userInfo && state.userInfo.expiresInMinutes <= 5 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm text-center">
                ⚠️ This reset link expires in {state.userInfo.expiresInMinutes} minute{state.userInfo.expiresInMinutes !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={state.showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={state.newPassword}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value, 
                    error: null 
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                >
                  <span className="text-gray-400 hover:text-gray-600">
                    {state.showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              {getPasswordStrengthIndicator()}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={state.showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={state.confirmPassword}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value, 
                    error: null 
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                >
                  <span className="text-gray-400 hover:text-gray-600">
                    {state.showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              {state.confirmPassword && state.newPassword !== state.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 text-lg">⚠️</span>
                <p className="text-red-800 text-sm">{state.error}</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={state.loading || passwordStrength.strength < 4 || state.newPassword !== state.confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;