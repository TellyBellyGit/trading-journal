import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useSettings } from '../contexts/SettingsContext';

// Navigation items matching your PyQt5 app
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', active: true },
  { id: 'trades', label: 'All Trades', icon: '📈', active: false },
  { id: 'analytics', label: 'Analytics', icon: '📊', active: false },
  { id: 'calendar', label: 'Calendar', icon: '📅', active: false },
  { id: 'notes', label: 'Notes', icon: '📝', active: false },
  { id: 'playbook', label: 'Performance Indicators', icon: '🎯', active: false },
  { id: 'import', label: 'Import', icon: '📤', active: false },
  { id: 'settings', label: 'Settings', icon: '⚙️', active: false },
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
  const { isUSFormat, toggleDateFormat } = useDateFormat();
  const { timeDisplay, toggleTimeDisplay } = useSettings();

  // Update sidebar state when view changes, but only for notes view or if user hasn't interacted
  useEffect(() => {
    if (currentView === 'notes') {
      setSidebarCollapsed(true);
    } else if (!hasUserInteracted && currentView === 'original') {
      // Only auto-collapse for dashboard if user hasn't manually changed the state
      setSidebarCollapsed(true);
    }
  }, [currentView, hasUserInteracted]);

  // Handle manual sidebar toggle
  const handleSidebarToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    setHasUserInteracted(true);
    // Save user preference
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
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
      case 'settings': return 'settings';
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
      case 'settings': return 'settings';
      default: return 'original';
    }
  };

  const activeNav = getNavIdFromView(currentView);

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
              <span className="text-white text-sm font-semibold">U</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Trader</p>
                <p className="text-xs text-gray-400 truncate">Active Session</p>
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
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">🔔</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">⚙️</span>
            </button>
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
    </div>
  );
};

export default AppShell;