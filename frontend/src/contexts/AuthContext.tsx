import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

// Types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  error: string | null;
  showSessionTimeoutModal: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loadInitialData: () => Promise<{ user: any; subscription: any; stats: any }>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  clearError: () => void;
  handleSessionTimeoutConfirm: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  message: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSessionTimeoutModal, setShowSessionTimeoutModal] = useState(false);



  // Initialize auth state from sessionStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = sessionStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          await refreshUser();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid stored data
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      } finally {
        setIsInitializing(false);
      }
    };

    // Clear auth data on page unload/navigation
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('refresh_token');
    };

    // Enhanced visibility change handler with timer (browser uses number timers)
    let visibilityTimer: number | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Start 5-minute timeout when user switches away
        visibilityTimer = setTimeout(() => {
          // Clear session data
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
          sessionStorage.removeItem('refresh_token');
          
          // Clear local auth state
          setToken(null);
          setUser(null);
          
          // Show session timeout modal
          setShowSessionTimeoutModal(true);
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        // User returned - cancel logout timer
        if (visibilityTimer) {
          clearTimeout(visibilityTimer);
          visibilityTimer = null;
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    initializeAuth();

    // Cleanup event listeners and timer
    return () => {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Helper: perform a single login fetch attempt
  const attemptLogin = async (email: string, password: string, timeoutMs: number = 15000) => {
    console.log('🔐 [Auth] Sending POST to', `${API_BASE_URL}/auth/login`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Login failed';
      
      const err = new Error(errorMessage) as any;
      err.type = errorData.type;
      err.attemptsRemaining = errorData.attemptsRemaining;
      err.retryAfter = errorData.retryAfter;
      err.canResendVerification = errorData.canResendVerification;
      err.status = response.status;
      throw err;
    }

    const data: AuthResponse = await response.json();
    return data;
  };

  // Check if an error is a cold-start / network issue (retry-able)
  const isRetryableError = (error: any): boolean => {
    if (error?.status) return false; // server responded with an auth error — don't retry
    const isTimeout = error?.name === 'AbortError';
    const isNetworkError = error?.message && /Failed to fetch|NetworkError/i.test(error.message);
    return isTimeout || isNetworkError;
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 [Auth] login() called with email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 [Auth] Attempting login...');
      
      // First attempt
      const data = await attemptLogin(email, password);
      
      // Success on first try
      setUser(data.user);
      setToken(data.token);
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));
      sessionStorage.setItem('refresh_token', data.refreshToken);
      console.log('🔐 [Auth] Login succeeded on first attempt');
      return;
      
    } catch (firstError: any) {
      console.log('🔐 [Auth] First attempt failed:', firstError?.name, firstError?.message);
      
      // If it's NOT a retryable error (e.g. wrong password), fail immediately
      if (!isRetryableError(firstError)) {
        const friendlyMessage = firstError?.message || 'Login failed';
        setError(friendlyMessage);
        const err = new Error(friendlyMessage) as any;
        err.type = firstError?.type || 'unknown';
        err.status = firstError?.status;
        err.attemptsRemaining = firstError?.attemptsRemaining;
        err.retryAfter = firstError?.retryAfter;
        err.canResendVerification = firstError?.canResendVerification;
        throw err;
      }

      // Retryable error — wait 3 seconds for Neon to wake up, then retry once
      console.log('🔐 [Auth] Cold start detected — waiting 3 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        console.log('🔐 [Auth] Retrying login (attempt 2)...');
        // Give the retry a bit more time since the DB should be waking up
        const data = await attemptLogin(email, password, 20000);
        
        // Success on retry
        setUser(data.user);
        setToken(data.token);
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        sessionStorage.setItem('refresh_token', data.refreshToken);
        console.log('🔐 [Auth] Login succeeded on retry');
        return;
        
      } catch (retryError: any) {
        console.log('🔐 [Auth] Retry also failed:', retryError?.name, retryError?.message);
        
        // Both attempts failed
        const isStillRetryable = isRetryableError(retryError);
        const friendlyMessage = isStillRetryable
          ? 'Unable to establish a connection after two attempts. The server may still be waking up — please wait a moment and try again.'
          : (retryError?.message || 'Login failed');

        setError(friendlyMessage);
        
        const err = new Error(friendlyMessage) as any;
        err.type = retryError?.status
          ? (retryError?.type || 'unknown')
          : (isStillRetryable ? 'timeout_error' : 'unknown');
        err.status = retryError?.status;
        err.attemptsRemaining = retryError?.attemptsRemaining;
        err.retryAfter = retryError?.retryAfter;
        err.canResendVerification = retryError?.canResendVerification;
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Registration failed' };
      }

      const data = await response.json();
      
      // Registration successful - no auto-login, user needs to verify email
      // Don't set user/token data here as registration requires email verification
      return {}; // Success - no error
      
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('refresh_token');
  };

  // Load initial data after login (user + subscription + basic stats)
  const loadInitialData = async (): Promise<{ user: any; subscription: any; stats: any }> => {
    try {
      const currentToken = token || sessionStorage.getItem('auth_token');
      
      if (!currentToken) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/initial-data`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, logout user
          logout();
          throw new Error('Authentication failed');
        }
        throw new Error('Failed to load initial data');
      }

      const data = await response.json();
      setUser(data.user);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));
      
      return data;
      
    } catch (error) {
      console.error('Load initial data error:', error);
      logout();
      throw error;
    }
  };

  // Refresh user data (lightweight version)
  const refreshUser = async (): Promise<void> => {
    try {
      const currentToken = token || sessionStorage.getItem('auth_token');
      
      if (!currentToken) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, logout user
          logout();
          return;
        }
        throw new Error('Failed to refresh user data');
      }

      const data = await response.json();
      setUser(data.user);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));
      
    } catch (error) {
      console.error('Refresh user error:', error);
      logout();
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (firstName: string, lastName: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      const updatedUser = data.user;

      // Update local state and sessionStorage
      setUser(updatedUser);
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Handle session timeout modal confirmation
  const handleSessionTimeoutConfirm = () => {
    setShowSessionTimeoutModal(false);
    // Force redirect to login by clearing everything and reloading
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isInitializing,
    isAuthenticated: !!user && !!token,
    error,
    showSessionTimeoutModal,
    login,
    register,
    logout,
    refreshUser,
    loadInitialData,
    updateProfile,
    clearError,
    handleSessionTimeoutConfirm,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export types for use in other components
export type { User, RegisterData };