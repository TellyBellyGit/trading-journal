import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [callingApi, setCallingApi] = useState(false);

  // Debug: Log when component renders and errors change
  console.log('🔄 Login component rendering, errors:', errors, 'isLoading:', isLoading);
  
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('🔍 Login errors updated:', errors);
    }
  }, [errors]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clear any existing errors
    setErrors({});

    setCallingApi(true);
    try {
      await login(formData.email, formData.password);
      setCallingApi(false);
      onSuccess?.();
    } catch (error) {
      setCallingApi(false);
      console.log('Login form caught error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.log('Setting error message:', errorMessage);
      
      const newErrors = { submit: errorMessage };
      console.log('About to call setErrors with:', newErrors);
      setErrors(newErrors);
      
      console.log('setErrors called, current errors state should be:', newErrors);
      
      // DON'T call onSuccess or any other callbacks that might cause re-render
      return; // Stop execution here
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your trading journal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-12 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Calling API Message */}
          {callingApi && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-400">CALLING API</p>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}
          
          {/* Debug: Show all errors */}
          {Object.keys(errors).length > 0 && (
            <div className="text-xs text-gray-500">
              Debug - Errors: {JSON.stringify(errors)}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Switch to Register */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none focus:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center mb-2">Demo Credentials:</p>
          <div className="text-xs text-gray-300 space-y-1">
            <p><strong>Email:</strong> admin@tradingjournal.com</p>
            <p><strong>Password:</strong> defaultpassword123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;