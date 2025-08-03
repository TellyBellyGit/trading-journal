import React, { useState } from 'react';

interface RegisterProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailMessageColor, setEmailMessageColor] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const checkEmailExists = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;
    
    try {
      const response = await fetch('https://trading-journal-backend-5fi2.onrender.com/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.available) {
          setEmailMessage('E-mail OK');
          setEmailMessageColor('text-green-400');
        } else {
          setEmailMessage('');
          setEmailMessageColor('text-red-400');
        }
      } else {
        setEmailMessage('E-mail OK');
        setEmailMessageColor('text-green-400');
      }
    } catch (error) {
      setEmailMessage('E-mail OK');
      setEmailMessageColor('text-green-400');
    }
  };

  const handleEmailBlur = () => {
    checkEmailExists(email);
  };

  const handlePasswordFocus = () => {
    console.log('Password field focused - calling email check');
    checkEmailExists(email);
    setShowPasswordRequirements(true);
  };

  const handleConfirmPasswordFocus = () => {
    setShowPasswordRequirements(false);
  };

  const checkPasswordRequirements = (password: string) => {
    const requirements = [
      { text: 'contains at least 8 characters', met: password.length >= 8 },
      { text: 'contains at least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
      { text: 'contains at least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
      { text: 'contains at least one number (0-9)', met: /\d/.test(password) },
      { text: 'contains at least one special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) }
    ];
    return requirements;
  };

  const passwordRequirements = checkPasswordRequirements(password);
  const metRequirements = passwordRequirements.filter(req => req.met).length;
  const isPasswordValid = metRequirements === 5;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const canSubmit = firstName && lastName && email && isPasswordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch('https://trading-journal-backend-5fi2.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.toLowerCase(),
          password,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <style>{`
        .password-no-reveal::-ms-reveal,
        .password-no-reveal::-ms-clear {
          display: none;
        }
        .password-no-reveal::-webkit-credentials-auto-fill-button {
          display: none !important;
        }
        .password-no-reveal::-webkit-textfield-decoration-container {
          display: none !important;
        }
        
        /* Brand gradient classes from tradrdash marketing site */
        .brand-gradient {
          background: linear-gradient(to right, #2563eb, #9333ea) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 700 !important;
          filter: contrast(1.2) brightness(1.15) saturate(1.1) !important;
        }
        
        .brand-gradient-header {
          background: linear-gradient(90deg, #1d4ed8, #7c3aed, #9333ea) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 800 !important;
          filter: contrast(1.3) brightness(1.2) saturate(1.2) !important;
          text-shadow: 0 0 20px rgba(147, 51, 234, 0.3) !important;
          font-size: 1.05em !important;
        }
        
        .gradient-blue-purple {
          background: linear-gradient(to right, #3b82f6, #a855f7) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 600 !important;
          filter: contrast(1.1) brightness(1.1) !important;
        }
        
        .gradient-green-blue {
          background: linear-gradient(to right, #22c55e, #3b82f6) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 600 !important;
          filter: contrast(1.1) brightness(1.1) !important;
        }
        
        .gradient-purple-pink {
          background: linear-gradient(to right, #a855f7, #ec4899) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 600 !important;
          filter: contrast(1.1) brightness(1.1) !important;
        }
        
        .gradient-orange-red {
          background: linear-gradient(to right, #f97316, #ef4444) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
          will-change: transform !important;
          position: relative !important;
          font-weight: 600 !important;
          filter: contrast(1.1) brightness(1.1) !important;
        }
        
        /* Simple image rotation animation */
        @keyframes imageRotation {
          0%, 24% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }
        
        @keyframes imageRotation2 {
          0%, 24% { opacity: 0; }
          25%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        @keyframes imageRotation3 {
          0%, 49% { opacity: 0; }
          50%, 74% { opacity: 1; }
          75%, 100% { opacity: 0; }
        }
        
        @keyframes imageRotation4 {
          0%, 74% { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        
        .image-1 { animation: imageRotation 20s infinite; }
        .image-2 { animation: imageRotation2 20s infinite; }
        .image-3 { animation: imageRotation3 20s infinite; }
        .image-4 { animation: imageRotation4 20s infinite; }
      `}</style>
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        </div>

        {/* Registration Form */}
        <div className="flex gap-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md border border-gray-600 rounded-lg p-8">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email Address"
            />
            {emailMessage && (
              <p className={`mt-1 text-sm ${emailMessageColor}`}>{emailMessage}</p>
            )}
            {emailMessageColor === 'text-red-400' && !emailMessage && (
              <p className="mt-1 text-sm text-red-400">
                An account with this email address already exists.{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Create a password that:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handlePasswordFocus}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 password-no-reveal"
                placeholder="Password"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none text-sm"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
            {password && !isPasswordValid && (
              <p className="mt-1 text-sm text-red-400">Password invalid - must meet all 5 requirements</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={handleConfirmPasswordFocus}
                className={`w-full px-4 py-3 pr-12 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 password-no-reveal ${
                  confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm Password"
              />
              {confirmPassword && (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none text-sm"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="text-sm text-gray-400">
            By clicking Create account, I agree that I have read and accepted the{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              Terms of Use
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
            </a>.
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              canSubmit && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

          {/* Right Column with Border */}
          <div className="flex-1 border border-gray-600 rounded-lg p-5 ml-8">
            {/* Brand Header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">
                <span className="text-white">tradr</span>
                <span className="brand-gradient-header">dash</span>
              </h2>
              <p className="text-gray-400 text-sm">Master Your Trading Journey</p>
            </div>

            {/* Key Features */}
            <div className="mb-12 text-center">
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Key Features:</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-center">
                  <span className="text-sm font-bold brand-gradient">Rich Trade Journaling with Image Support</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="text-sm font-bold gradient-orange-red">Calendar Views & Timeline Analysis</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="text-sm font-bold gradient-purple-pink">AI-Powered Trade Analysis & Insights</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="text-sm font-bold gradient-blue-purple">Multi-Broker CSV Import System</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="text-sm font-bold gradient-green-blue">Comprehensive P&L Tracking & Analytics</span>
                </li>
              </ul>
            </div>

            {/* Auto-Rotating Screenshots */}
            <div className="mb-8 text-center" style={{marginTop: '100px'}}>
              <div className="relative w-80 h-60 mx-auto rounded-lg border border-gray-600 shadow-lg bg-gray-900 flex items-center justify-center">
                {/* All images stacked on top of each other */}
                <img 
                  src="/tradelist.png" 
                  alt="Trade List - Main Dashboard"
                  className="absolute max-w-full max-h-full object-contain image-1"
                />
                <img 
                  src="/Performance Indicators.png" 
                  alt="Performance Analytics Dashboard"
                  className="absolute max-w-full max-h-full object-contain image-2"
                />
                <img 
                  src="/Calendar.png" 
                  alt="Trading Calendar View"
                  className="absolute max-w-full max-h-full object-contain image-3"
                />
                <img 
                  src="/Performance.png" 
                  alt="Detailed Performance Charts"
                  className="absolute max-w-full max-h-full object-contain image-4"
                />
                
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Requirements - Show when typing password */}
            {password && showPasswordRequirements && (
              <div className="border-t border-gray-600 pt-6" style={{marginTop: '95px'}}>
                <div className="w-80 p-4 bg-gray-800 h-fit">
                  <p className="text-sm text-gray-300 mb-2 font-medium">
                    Password strength: {metRequirements} of 5 requirements met
                  </p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className={`text-xs flex items-center ${req.met ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="mr-2">{req.met ? '✓' : '✗'}</span>
                        {req.text}: {req.met ? 'met' : 'not met'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Switch to Login */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none focus:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Register;