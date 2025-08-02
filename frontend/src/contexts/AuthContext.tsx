import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loadInitialData: () => Promise<{ user: any; subscription: any; stats: any }>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  clearError: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:3002/api';


  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          await refreshUser();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null); // Clear any existing errors
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Login failed';
        
        // Store error in context state instead of DOM manipulation
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data: AuthResponse = await response.json();
      
      // Store auth data
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('refresh_token', data.refreshToken);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
  };

  // Load initial data after login (user + subscription + basic stats)
  const loadInitialData = async (): Promise<{ user: any; subscription: any; stats: any }> => {
    try {
      const currentToken = token || localStorage.getItem('auth_token');
      
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
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
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
      const currentToken = token || localStorage.getItem('auth_token');
      
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
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
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

      // Update local state and localStorage
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

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

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    error,
    login,
    register,
    logout,
    refreshUser,
    loadInitialData,
    updateProfile,
    clearError,
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