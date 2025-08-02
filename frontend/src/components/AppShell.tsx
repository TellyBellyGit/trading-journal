import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionPricing from './SubscriptionPricing';
import { subscriptionsApi } from '../api/subscriptions';

const API_BASE_URL = 'http://localhost:3002/api';

// Navigation items matching your PyQt5 app
const getNavigationItems = (isAdmin: boolean = false) => [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', active: true },
  { id: 'trades', label: 'All Trades', icon: '📈', active: false },
  { id: 'analytics', label: 'Analytics', icon: '📊', active: false },
  { id: 'calendar', label: 'Calendar', icon: '📅', active: false },
  { id: 'notes', label: 'Notes', icon: '📝', active: false },
  { id: 'playbook', label: 'Performance Indicators', icon: '🎯', active: false },
  { id: 'import', label: 'Import', icon: '📤', active: false },
  { id: 'subscription', label: 'Subscription', icon: '💳', active: false },
  { id: 'settings', label: 'Settings', icon: '⚙️', active: false },
  ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '👥', active: false }] : []),
];

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  currentView?: string;
  onViewChange?: (view: string) => void;
  onNewTrade?: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  title = "Trading Journal",
  subtitle = "Professional Trading Management System",
  currentView = 'original',
  onViewChange,
  onNewTrade
}) => {
  // Initialize sidebar state - start collapsed for dashboard, preserve user choice afterwards
  const getInitialCollapsedState = () => {
    // Check if user has a saved preference
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    // If no saved state, start collapsed for dashboard
    return currentView === 'original';
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsedState);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [clearDataInput, setClearDataInput] = useState('');
  const [clearingData, setClearingData] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const { isUSFormat, toggleDateFormat } = useDateFormat();
  const { timeDisplay, toggleTimeDisplay } = useSettings();
  const { user, logout, updateProfile } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update sidebar state when view changes, but only for notes view or if user hasn't interacted
  useEffect(() => {
    if (currentView === 'notes') {
      setSidebarCollapsed(true);
    } else if (!hasUserInteracted && currentView === 'original') {
      // Only auto-collapse for dashboard if user hasn't manually changed the state
      setSidebarCollapsed(true);
    }
  }, [currentView, hasUserInteracted]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle manual sidebar toggle
  const handleSidebarToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    setHasUserInteracted(true);
    // Save user preference
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Handle clear all data
  const handleClearAllData = async () => {
    if (clearDataInput !== 'CLEAR ALL TRADE') {
      alert('Please type "CLEAR ALL TRADE" exactly to confirm.');
      return;
    }

    setClearingData(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/clear-user-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('All your trade data has been cleared successfully.');
        setShowClearDataModal(false);
        setClearDataInput('');
        // Optionally reload the page to reflect changes
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to clear data: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to clear data. Please try again.');
      console.error('Clear data error:', error);
    } finally {
      setClearingData(false);
    }
  };

  // Load subscription status
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      console.log('📊 Loading subscription status...');
      const status = await subscriptionsApi.getStatus();
      console.log('📊 Subscription status loaded:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  }, []);

  // Load subscription status on component mount and listen for updates
  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user]);

  // Listen for subscription status updates (e.g., after reset)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('🔄 Subscription update event received, reloading status...');
      loadSubscriptionStatus();
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    };
  }, [loadSubscriptionStatus]);

  // Listen for subscription modal events from other components
  useEffect(() => {
    const handleOpenSubscriptionModal = () => {
      if (onViewChange) {
        onViewChange('subscription');
      }
    };

    window.addEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    
    return () => {
      window.removeEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    };
  }, [onViewChange]);

  // Handle profile editing
  const handleProfileEdit = () => {
    if (user) {
      setProfileFirstName(user.firstName);
      setProfileLastName(user.lastName);
      setShowProfileEditModal(true);
    }
  };

  const handleProfileSave = async () => {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      alert('Both first name and last name are required');
      return;
    }

    try {
      setUpdatingProfile(true);
      await updateProfile(profileFirstName.trim(), profileLastName.trim());
      setShowProfileEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle dropdown menu actions
  const handleUserAction = (action: string) => {
    setUserDropdownOpen(false);
    
    switch (action) {
      case 'clear-data':
        setShowClearDataModal(true);
        break;
      case 'profile':
        handleProfileEdit();
        break;
      case 'account-settings':
        // Placeholder - will be implemented later
        alert('Account Settings - Coming Soon');
        break;
      case 'billing':
        if (onViewChange) {
          onViewChange('subscription');
        }
        break;
      case 'delete-account':
        // Placeholder - will be implemented later
        alert('Delete Account - Coming Soon');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  // Map current view to navigation ID
  const getNavIdFromView = (view: string) => {
    switch(view) {
      case 'original': return 'dashboard';
      case 'calendar': return 'calendar';
      case 'analytics': return 'analytics';
      case 'all-trades': return 'trades';
      case 'notes': return 'notes';
      case 'import': return 'import';
      case 'performance-indicators': return 'playbook';
      case 'subscription': return 'subscription';
      case 'settings': return 'settings';
      case 'admin': return 'admin';
      default: return 'dashboard';
    }
  };

  // Map navigation ID to view
  const getViewFromNavId = (navId: string) => {
    switch(navId) {
      case 'dashboard': return 'original';
      case 'calendar': return 'calendar';
      case 'analytics': return 'analytics';
      case 'trades': return 'all-trades';
      case 'notes': return 'notes';
      case 'import': return 'import';
      case 'playbook': return 'performance-indicators';
      case 'subscription': return 'subscription';
      case 'settings': return 'settings';
      case 'admin': return 'admin';
      default: return 'original';
    }
  };

  const activeNav = getNavIdFromView(currentView);
  const navigationItems = getNavigationItems(user?.isAdmin || false);

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`
        bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        
        {/* Logo/Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TJ</span>
              </div>
              <span className="text-white font-semibold text-lg">Trading Journal</span>
            </div>
          )}
          <button
            onClick={handleSidebarToggle}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const newView = getViewFromNavId(item.id);
                onViewChange?.(newView);
              }}
              className={`
                w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeNav === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
              `}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="text-lg">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-700">
          <div className={`
            flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Trader'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'Active Session'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && (
              <span className="text-gray-400 text-sm">{subtitle}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search trades..."
                className="w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>

            {/* Date Format Toggle */}
            <button 
              onClick={toggleDateFormat}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={`Current format: ${isUSFormat ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}`}
            >
              <span className="text-xs">📅</span>
              <span className="ml-1">{isUSFormat ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}</span>
            </button>

            {/* Time Display Toggle */}
            <button 
              onClick={toggleTimeDisplay}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={`Current time display: ${timeDisplay === 'local' ? 'UK Local Time' : 'Eastern Time'}`}
            >
              <span className="text-xs">🕐</span>
              <span className="ml-1">{timeDisplay === 'local' ? 'Local' : 'EST'}</span>
            </button>

            {/* Action Buttons */}
            <button 
              onClick={onNewTrade}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add Trade
            </button>
            
            {/* Usage Indicator for Free Users */}
            {subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.maxTrades > 0 && subscriptionStatus.usagePercentage >= 50 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg">
                <span className="text-xs text-gray-400">Trades:</span>
                <span className={`text-xs font-medium ${
                  subscriptionStatus.usagePercentage >= 90 ? 'text-red-400' :
                  subscriptionStatus.usagePercentage >= 70 ? 'text-yellow-400' : 'text-gray-300'
                }`}>
                  {subscriptionStatus.tradeCount}/{subscriptionStatus.maxTrades}
                </span>
                <div className="w-12 bg-gray-600 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${
                      subscriptionStatus.usagePercentage >= 90 ? 'bg-red-500' :
                      subscriptionStatus.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(subscriptionStatus.usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">🔔</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">⚙️</span>
            </button>

            {/* User Dropdown Menu */}
            <div className="relative pl-4 border-l border-gray-600" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-300 hidden md:inline">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                </span>
                <span className="text-gray-400 text-xs">
                  {userDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {/* User Info Header */}
                    <div className="px-4 py-2 border-b border-gray-600">
                      <p className="text-sm font-medium text-white">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user?.email || 'Active Session'}
                      </p>
                      
                      {/* Subscription Status */}
                      {subscriptionStatus && (
                        <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-300 capitalize">{subscriptionStatus.plan} Plan</span>
                            {subscriptionStatus.plan !== 'free' && (
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                subscriptionStatus.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                              }`}>
                                {subscriptionStatus.status}
                              </span>
                            )}
                          </div>
                          {subscriptionStatus.maxTrades > 0 && (
                            <div>
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span>Trades this month</span>
                                <span className={`${
                                  subscriptionStatus.usagePercentage >= 90 ? 'text-red-400 font-medium' :
                                  subscriptionStatus.usagePercentage >= 70 ? 'text-yellow-400 font-medium' : 'text-gray-400'
                                }`}>
                                  {subscriptionStatus.tradeCount}/{subscriptionStatus.maxTrades}
                                  {subscriptionStatus.tradeCount > subscriptionStatus.maxTrades && (
                                    <span className="text-red-400"> (Grace: {subscriptionStatus.tradeCount - subscriptionStatus.maxTrades}/2)</span>
                                  )}
                                </span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all ${
                                    subscriptionStatus.usagePercentage >= 90 ? 'bg-red-500' :
                                    subscriptionStatus.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(subscriptionStatus.usagePercentage, 100)}%` }}
                                />
                              </div>
                              {subscriptionStatus.usagePercentage >= 80 && (
                                <div className={`text-xs mt-1 ${
                                  subscriptionStatus.usagePercentage >= 90 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {subscriptionStatus.usagePercentage >= 90 
                                    ? '⚠️ Almost at limit!' 
                                    : '📊 Approaching limit'
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => handleUserAction('profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      User Profile
                    </button>
                    
                    <button
                      onClick={() => handleUserAction('account-settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Account Settings
                    </button>
                    
                    <button
                      onClick={() => handleUserAction('billing')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Billing & Subscription
                    </button>

                    <div className="border-t border-gray-600 my-1"></div>
                    
                    <button
                      onClick={() => handleUserAction('clear-data')}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors"
                    >
                      Clear All Data
                    </button>
                    
                    <button
                      onClick={() => handleUserAction('delete-account')}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors"
                    >
                      Delete Account
                    </button>

                    <div className="border-t border-gray-600 my-1"></div>
                    
                    <button
                      onClick={() => handleUserAction('logout')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="h-full">
            {children}
          </div>
        </main>

        {/* Status Bar */}
        <footer className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Connected to API</span>
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Last updated: 2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Database: PostgreSQL</span>
            <span>|</span>
            <span>Records: 1,247</span>
          </div>
        </footer>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Clear All Trade Data
            </h3>
            <p className="text-gray-300 mb-4">
              This action will permanently delete all your trades, notes, and personal data. 
              Broker information will be preserved as it's shared across users.
            </p>
            <p className="text-red-400 font-medium mb-4">
              This action cannot be undone!
            </p>
            <p className="text-gray-300 mb-4">
              To confirm, type <span className="font-mono bg-gray-700 px-2 py-1 rounded">CLEAR ALL TRADE</span> exactly:
            </p>
            <input
              type="text"
              value={clearDataInput}
              onChange={(e) => setClearDataInput(e.target.value)}
              placeholder="Type confirmation here..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !clearingData) {
                  handleClearAllData();
                }
              }}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleClearAllData}
                disabled={clearingData || clearDataInput !== 'CLEAR ALL TRADE'}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  clearingData || clearDataInput !== 'CLEAR ALL TRADE'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {clearingData ? 'Clearing...' : 'Clear All Data'}
              </button>
              <button
                onClick={() => {
                  setShowClearDataModal(false);
                  setClearDataInput('');
                }}
                disabled={clearingData}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Pricing Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-screen overflow-y-auto">
            <SubscriptionPricing
              currentPlan={subscriptionStatus?.plan || 'free'}
              onClose={() => {
                setShowSubscriptionModal(false);
                loadSubscriptionStatus(); // Refresh subscription status
              }}
            />
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter first name"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter last name"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleProfileSave}
                disabled={updatingProfile || !profileFirstName.trim() || !profileLastName.trim()}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  updatingProfile || !profileFirstName.trim() || !profileLastName.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowProfileEditModal(false);
                  setProfileFirstName('');
                  setProfileLastName('');
                }}
                disabled={updatingProfile}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;