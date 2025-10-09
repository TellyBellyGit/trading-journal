import React, { useState, useEffect } from 'react';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

interface RegisterProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    timezone: 'UTC'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Separate field errors from submit errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');

  // Debug: Track all setSubmitError calls
  const setSubmitErrorWithLogging = (value: string) => {
    console.log('🔥 setSubmitError called with:', value);
    console.trace('Stack trace for setSubmitError call');
    setSubmitError(value);
  };

  // Quick test to detect component remounting
  useEffect(() => {
    console.log('🔍 Register component mounted/remounted');
    return () => console.log('🔍 Register component unmounting');
  }, []);
  
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Check if email exists (called on email field blur)
  const checkEmailExists = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return; // Don't check invalid emails
    
    try {
      console.log('🔍 Checking if email exists:', email);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok && response.status === 409) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'User already exists with this email';
        setFieldErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
      } else if (response.ok) {
        // Email is available, clear any existing error
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.log('Email existence check failed:', error);
    }
  };

  // Validate password strength
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return errors;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0]; // Show first error
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Only handle field validation errors now
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMIT STARTED ===');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      const result = await register(formData);
      
      if (result?.error) {
        // This should rarely happen now since we check email inline
        console.log('Unexpected registration error:', result.error);
        setFieldErrors(prev => ({
          ...prev,
          email: result.error
        }));
        return;
      }
      
      // Success - show success message
      console.log('🔥 REGISTRATION SUCCESS');
      setSubmitErrorWithLogging("Registration successful! Please check your email to verify your account before logging in.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.log('🔥 REGISTRATION ERROR:', errorMessage);
      setSubmitErrorWithLogging(errorMessage);
    }
    console.log('=== FORM SUBMIT ENDED ===');
  };

  // Get password strength indicator
  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password);
    const strength = 5 - errors.length;
    
    if (strength <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (strength <= 2) return { label: 'Fair', color: 'bg-yellow-500', width: '40%' };
    if (strength <= 3) return { label: 'Good', color: 'bg-blue-500', width: '60%' };
    if (strength <= 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-green-600', width: '100%' };
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  // Timezone options (simplified list)
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join our trading journal community</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  fieldErrors.firstName ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="John"
                disabled={isLoading}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  fieldErrors.lastName ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Doe"
                disabled={isLoading}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

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
              onBlur={(e) => checkEmailExists(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="john@example.com"
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Timezone Field */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
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
                  fieldErrors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Create a strong password"
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
            
            {/* Password Strength Indicator */}
            {formData.password && passwordStrength && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Password Strength</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.label === 'Weak' ? 'text-red-400' :
                    passwordStrength.label === 'Fair' ? 'text-yellow-400' :
                    passwordStrength.label === 'Good' ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
              </div>
            )}
            
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          
          {/* Submit Error/Success */}
          {submitError && (
            <div className={`border rounded-lg p-3 mt-4 ${
              submitError.includes('successful') || submitError.includes('check your email')
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <p className={`text-sm ${
                submitError.includes('successful') || submitError.includes('check your email')  
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>{submitError}</p>
            </div>
          )}  
          
          
          {/* Debug: Show both error states */}
          <div className="text-xs text-gray-500 mt-2">
            DEBUG - fieldErrors: {JSON.stringify(fieldErrors)} | submitError: {submitError}
          </div>

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
            Create Account
          </button>
        </form>

        {/* Switch to Login */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none focus:underline"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        )}
        
        {/* Debug Version */}
        <div className="text-xs text-gray-600 text-center mt-4">
          v4.1 - Added component remounting detection
        </div>
      </div>

    </div>
  );
};

export default Register;