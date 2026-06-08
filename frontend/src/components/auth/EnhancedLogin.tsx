import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

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
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [guestCredentials, setGuestCredentials] = useState<{ username: string; email: string; password: string } | null>(null);
  const [dbTestLoading, setDbTestLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);
  const [dbTestError, setDbTestError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError(null);
    setGuestCredentials(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/guest-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to create guest account');
      }

      // Show credentials to user
      setGuestCredentials(data.credentials);

      // Auto-fill the login form and let the user press Sign In manually
      setEmail(data.credentials.email);
      setPassword(data.credentials.password);
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to create guest account. Please try again.',
        type: 'server_error'
      });
    } finally {
      setGuestLoading(false);
    }
  };

  const handleTestDbConnection = async () => {
    setDbTestLoading(true);
    setDbTestResult(null);
    setDbTestError(null);

    const healthUrl = `${API_BASE_URL}/health`;
    const diagnoseUrl = `${API_BASE_URL}/auth/db-diagnose`;

    console.group('🗄️ [DB Test] Database Connection Diagnostic');
    console.log('🗄️ [DB Test] Starting database connection test...');
    console.log('🗄️ [DB Test] Base URL:', API_BASE_URL);

    try {
      // Step 1: Health check
      console.log('🗄️ [DB Test] Step 1: Checking backend health at', healthUrl);
      let healthOk = false;
      try {
        const healthResp = await fetch(healthUrl);
        const healthData = await healthResp.json();
        console.log('🗄️ [DB Test] Health check response status:', healthResp.status);
        console.log('🗄️ [DB Test] Health check response body:', healthData);
        healthOk = healthResp.ok;
      } catch (healthErr: any) {
        console.warn('🗄️ [DB Test] Health check FAILED:', healthErr?.message || healthErr);
        console.warn('🗄️ [DB Test] This may indicate the backend is not running or unreachable.');
      }

      // Step 2: DB diagnose
      console.log('🗄️ [DB Test] Step 2: Calling', diagnoseUrl);
      const startTime = performance.now();
      const resp = await fetch(diagnoseUrl);
      const elapsed = Math.round(performance.now() - startTime);
      const data = await resp.json();

      console.log(`🗄️ [DB Test] Response received in ${elapsed}ms, status: ${resp.status}`);
      console.log('🗄️ [DB Test] Full response:', JSON.stringify(data, null, 2));

      // Parse diagnostics
      if (resp.ok && data.connected) {
        console.log('🗄️ [DB Test] ✅ Database CONNECTION: OK');
        console.log('🗄️ [DB Test] Raw query (SELECT 1):', data.rawQuery);
        console.log('🗄️ [DB Test] User count:', data.userCount);
        console.log('🗄️ [DB Test] Sample users:', data.firstUsers);
        if (data.testEmails) {
          console.log('🗄️ [DB Test] Known email checks:', data.testEmails);
        }
      } else {
        console.error('🗄️ [DB Test] ❌ Database CONNECTION: FAILED');
        console.error('🗄️ [DB Test] Error details:', {
          connected: data.connected,
          error: data.error,
          code: data.code,
          meta: data.meta,
        });
      }

      console.log('🗄️ [DB Test] Health check passed:', healthOk);
      console.log('🗄️ [DB Test] === Diagnostic complete ===');
      console.groupEnd();

      setDbTestResult({
        healthOk,
        ...data,
        elapsed,
        status: resp.status,
      });
    } catch (err: any) {
      console.error('🗄️ [DB Test] ❌ Exception during DB test:', err?.message || err);
      console.error('🗄️ [DB Test] Full error:', err);
      console.groupEnd();

      setDbTestError(err?.message || 'Unknown error during database test');
    } finally {
      setDbTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🖥️ [LoginForm] handleSubmit fired');
    setLoading(true);
    setError(null);

    try {
      console.log('🖥️ [LoginForm] Calling login()...');
      await login(email, password);
      console.log('🖥️ [LoginForm] login() resolved successfully');
      onSuccess?.();
      console.log('🖥️ [LoginForm] onSuccess callback called');
    } catch (err: any) {
      console.log('🖥️ [LoginForm] login() threw error:', err?.type, err?.message);
      let errorData: LoginError;
      
      if (err?.type || err?.status) {
        // Structured error thrown by AuthContext
        errorData = {
          message: err.message || 'Login failed. Please try again.',
          type: err.type || 'unknown',
          attemptsRemaining: err.attemptsRemaining,
          retryAfter: err.retryAfter,
          canResendVerification: err.canResendVerification,
        };
      } else if (err.message.includes('429') || err.message.includes('Too many')) {
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
        const msg = err.message || 'Login failed. Please try again.';
        // Network error friendly mapping
        const isNetwork = /Failed to fetch|NetworkError/i.test(msg) || err?.type === 'network_error';
        const looksUnverified = /verify your email/i.test(msg);
        errorData = {
          message: isNetwork
            ? `Cannot connect to the API. Please ensure the backend is running and that VITE_API_URL points to ${API_BASE_URL}.`
            : msg,
          type: isNetwork ? 'network_error' : looksUnverified ? 'email_unverified' : 'unknown',
          canResendVerification: looksUnverified ? true : undefined,
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
                onClick={async () => {
                  if (!email) {
                    alert('Enter your email above first.');
                    return;
                  }
                  try {
                    const resp = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });
                    const data = await resp.json();
                    if (resp.ok) {
                      alert('Verification email sent! Check your inbox.');
                    } else {
                      alert(data.error || 'Failed to resend verification email');
                    }
                  } catch (e) {
                    alert('Failed to resend verification email. Please try again.');
                  }
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
                Email / Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email or username"
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
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      // Eye with slash (hidden)
                      <>
                        <path d="M12 4.5c7 0 10 7.5 10 7.5s-3 7.5-10 7.5-10-7.5-10-7.5 3-7.5 10-7.5z" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2"/>
                      </>
                    ) : (
                      // Simple eye (visible)
                      <>
                        <path d="M12 4.5c7 0 10 7.5 10 7.5s-3 7.5-10 7.5-10-7.5-10-7.5 3-7.5 10-7.5z" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {getErrorDisplay()}

          {/* Guest credentials display */}
          {guestCredentials && (
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-lg">👤</span>
                <div className="flex-1">
                  <h4 className="font-medium">Guest Account Created</h4>
                  <p className="mt-1">Save these credentials to return later:</p>
                  <div className="mt-2 space-y-1 font-mono text-xs">
                    <p><span className="text-gray-400">Username:</span> {guestCredentials.username}</p>
                    <p><span className="text-gray-400">Email:</span> {guestCredentials.email}</p>
                    <p><span className="text-gray-400">Password:</span> {guestCredentials.password}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          <div>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guestLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating guest account...
                </>
              ) : (
                'Enter as a Guest'
              )}
            </button>
          </div>

          {/* ── Database Connection Test ── */}
          <div className="border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={handleTestDbConnection}
              disabled={dbTestLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-teal-500/50 text-sm font-medium rounded-md text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dbTestLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing connection...
                </>
              ) : (
                '🗄️ Test Database Connection'
              )}
            </button>
          </div>

          {/* DB Test Results */}
          {dbTestResult && (
            <div className={`p-4 rounded-lg border text-sm font-mono ${dbTestResult.connected ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span>{dbTestResult.connected ? '✅' : '❌'}</span>
                <span className="font-bold">{dbTestResult.connected ? 'Database Connected' : 'Database Connection Failed'}</span>
                <span className="text-xs opacity-70">({dbTestResult.elapsed}ms)</span>
              </div>
              <div className="space-y-1 text-xs opacity-80">
                <p>Health: {dbTestResult.healthOk ? '✅ reachable' : '❌ unreachable'}</p>
                <p>Raw Query (SELECT 1): {dbTestResult.rawQuery || 'N/A'}</p>
                <p>User Count: {dbTestResult.userCount ?? 'N/A'}</p>
                {dbTestResult.firstUsers && dbTestResult.firstUsers.length > 0 && (
                  <div>
                    <p className="mb-1">First {dbTestResult.firstUsers.length} users:</p>
                    {dbTestResult.firstUsers.map((u: any) => (
                      <p key={u.id} className="pl-2">• {u.email} (id:{u.id}, active:{String(u.isActive)}, verified:{String(u.emailVerified)})</p>
                    ))}
                  </div>
                )}
                {!dbTestResult.connected && dbTestResult.error && (
                  <p className="text-red-300 mt-1">Error: {dbTestResult.error}</p>
                )}
                {!dbTestResult.connected && dbTestResult.code && (
                  <p className="text-red-300">Code: {dbTestResult.code}</p>
                )}
              </div>
            </div>
          )}

          {dbTestError && !dbTestResult && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              <div className="flex items-start space-x-2">
                <span>❌</span>
                <div className="flex-1">
                  <h4 className="font-medium">Connection Test Failed</h4>
                  <p className="mt-1 text-xs font-mono">{dbTestError}</p>
                  <p className="mt-2 text-xs opacity-70">Check the browser console (F12) for full diagnostic logs.</p>
                </div>
              </div>
            </div>
          )}

          {onSwitchToRegister && (
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
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