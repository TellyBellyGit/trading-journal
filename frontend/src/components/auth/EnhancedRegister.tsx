import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegistrationError {
  message: string;
  type: string;
  details?: string[];
}

const EnhancedRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RegistrationError | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError({
        message: 'Passwords do not match',
        type: 'validation_error'
      });
      setLoading(false);
      return;
    }

    if (passwordStrength.strength < 4) {
      setError({
        message: 'Password is too weak',
        type: 'validation_error',
        details: [`Missing: ${passwordStrength.feedback.join(', ')}`]
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          timezone: formData.timezone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError({
          message: data.error || 'Registration failed',
          type: data.type || 'unknown',
          details: data.details
        });
        return;
      }

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

    } catch (err: any) {
      setError({
        message: err.message || 'Registration failed. Please try again.',
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      alert('Failed to resend verification email. Please try again.');
    }
  };

  const getErrorDisplay = () => {
    if (!error) return null;

    const baseClasses = "p-4 rounded-lg border text-sm";
    let classes = baseClasses;
    let icon = "⚠️";
    let title = "Error";

    switch (error.type) {
      case 'validation_error':
        classes += " bg-yellow-50 border-yellow-200 text-yellow-800";
        icon = "⚠️";
        title = "Validation Error";
        break;
      case 'conflict':
        classes += " bg-orange-50 border-orange-200 text-orange-800";
        icon = "👤";
        title = "Account Already Exists";
        break;
      default:
        classes += " bg-red-50 border-red-200 text-red-800";
    }

    return (
      <div className={classes}>
        <div className="flex items-start space-x-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="mt-1">{error.message}</p>
            {error.details && (
              <ul className="mt-2 list-disc list-inside text-xs">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getSuccessDisplay = () => {
    if (!success) return null;

    return (
      <div className="p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
        <div className="flex items-start space-x-2">
          <span className="text-lg">✅</span>
          <div className="flex-1">
            <h4 className="font-medium">Registration Successful!</h4>
            <p className="mt-1">
              Please check your email for a verification link. You must verify your email before you can log in.
            </p>
            <button 
              className="mt-3 text-green-600 hover:text-green-800 underline text-xs"
              onClick={handleResendVerification}
            >
              Didn't receive the email? Click to resend
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getPasswordStrengthIndicator = () => {
    if (!formData.password) return null;

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent you a verification link
            </p>
          </div>
          {getSuccessDisplay()}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="#login"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Navigate to login page
                  alert('Navigate to login page');
                }}
              >
                Sign in
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start tracking your trading journey
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-400 hover:text-gray-600">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              {getPasswordStrengthIndicator()}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                  {Intl.DateTimeFormat().resolvedOptions().timeZone} (Auto-detected)
                </option>
              </select>
            </div>
          </div>

          {getErrorDisplay()}

          <div>
            <button
              type="submit"
              disabled={loading || passwordStrength.strength < 4}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="#login"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Navigate to login page
                  alert('Navigate to login page');
                }}
              >
                Sign in
              </a>
            </span>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedRegister;