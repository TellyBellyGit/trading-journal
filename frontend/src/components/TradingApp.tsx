import React, { useState } from 'react';
import AppShell from './AppShell';
import Dashboard from './Dashboard';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import PerformanceIndicatorsDashboard from './PerformanceIndicatorsDashboard';
import AllTrades from './AllTrades';
import ImportTrades from './ImportTrades';
import TradingCalendar from './TradingCalendar';
import Notes from './Notes';
import Settings from './Settings';
import DatePickerModal from './DatePickerModal';
import SubscriptionPage from '../pages/SubscriptionPage';
import Admin from '../pages/Admin';
import { subscriptionsApi } from '../api/subscriptions';
import { useEffect } from 'react';

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';


// Main Trading App Component (authenticated content)
const TradingApp: React.FC = () => {
  const [currentView, setCurrentView] = useState('original');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [upgradeNotification, setUpgradeNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    trigger: string;
  } | null>(null);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  // Monitor subscription status and show strategic upgrade prompts
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const status = await subscriptionsApi.getStatus();
        
        if (status.plan === 'free' && status.maxTrades > 0) {
          // Strategic upgrade moment 1: 80% usage
          if (status.usagePercentage >= 80 && status.usagePercentage < 95) {
            const tradesRemaining = status.maxTrades - status.tradeCount;
            setUpgradeNotification({
              show: true,
              title: 'Approaching Your Monthly Limit',
              message: `You have ${tradesRemaining} trades remaining this month. Upgrade to Pro for unlimited trades, rich text notes, and advanced analytics.`,
              trigger: '80_percent'
            });
          }
          // Strategic upgrade moment 2: Grace period
          else if (status.tradeCount > status.maxTrades) {
            const graceUsed = status.tradeCount - status.maxTrades;
            setUpgradeNotification({
              show: true,
              title: 'Using Grace Period',
              message: `You've used ${graceUsed} of your 2 grace trades. Upgrade now to continue adding trades next month without limits.`,
              trigger: 'grace_period'
            });
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    // Check status when component mounts and every 30 seconds
    checkSubscriptionStatus();
    const interval = setInterval(checkSubscriptionStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle dismissing upgrade notification
  const handleDismissUpgrade = () => {
    setUpgradeNotification(null);
  };

  // Handle upgrade action
  const handleUpgrade = () => {
    setCurrentView('subscription');
    setUpgradeNotification(null);
  };

  const handleNewTrade = () => {
    setCurrentView('all-trades');
    // Use setTimeout to ensure AllTrades component is mounted before triggering
    setTimeout(() => {
      // This will trigger the AllTrades add trade functionality
      // The AllTrades component will handle opening the EditTrade form
      const event = new CustomEvent('triggerAddTrade');
      window.dispatchEvent(event);
    }, 100);
  };

  // Show date picker modal for export
  const handleExportToAI = () => {
    setShowDatePicker(true);
  };

  // Actual export function called from date picker modal
  const performExportToAI = async (startDate: string, endDate: string) => {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    try {
      // Use the new efficient export API endpoint that filters at the database level
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/trades/export?startDate=${startDate}&endDate=${endDate}&status=Closed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch trades for export');
      
      const trades = await response.json();
      
      if (!trades.length) {
        alert('No closed trades found in the selected date range.');
        return;
      }

      // Format the data for AI analysis
      const formattedData = trades.map((trade: any) => ({
        Symbol: trade.symbol,
        Direction: trade.direction,
        'Entry Price': trade.entryPrice,
        'Exit Price': trade.exitPrice,
        'P&L': trade.pnl,
        'Percent Change': trade.percentChange,
        'Entry Date': trade.entryDate,
        'Exit Date': trade.exitDate,
        Duration: trade.duration,
        Assessment: trade.assessment || 'No assessment'
      }));

      // Convert to CSV format
      const csvContent = [
        Object.keys(formattedData[0]).join(','),
        ...formattedData.map(row => Object.values(row).join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-data-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Exported ${trades.length} trades to CSV file.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export trades. Please try again.');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'original':
        return <Dashboard onViewChange={handleViewChange} onExportToAI={handleExportToAI} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'performance-indicators':
        return <PerformanceIndicatorsDashboard />;
      case 'all-trades':
        return (
          <AllTrades
            onTradeAdd={() => {
              console.log('Add new trade');
            }}
            onTradeEdit={(trade) => {
              console.log('Edit trade:', trade);
            }}
            onTradeDelete={(tradeId) => {
              console.log('Delete trade:', tradeId);
            }}
            onExport={() => {
              console.log('Export trades');
            }}
          />
        );
      case 'import':
        return <ImportTrades />;
      case 'calendar':
        return <TradingCalendar />;
      case 'notes':
        return <Notes />;
      case 'settings':
        return <Settings />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onViewChange={handleViewChange} onExportToAI={handleExportToAI} />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'analytics':
        return 'Trading Analytics Dashboard';
      case 'enhanced':
        return 'Enhanced Trading Dashboard';
      case 'all-trades':
        return 'Trade List';
      case 'import':
        return 'Import Trades';
      case 'notes':
        return 'Trading Notes';
      case 'calendar':
        return 'Trading Calendar';
      case 'settings':
        return 'Settings';
      case 'subscription':
        return 'Subscription Management';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Trading Dashboard';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'analytics':
        return 'Comprehensive performance analysis with advanced metrics';
      case 'enhanced':
        return 'Professional metrics with time period analysis';
      case 'all-trades':
        return 'Complete trading history with advanced filtering';
      case 'import':
        return 'Upload broker statements to automatically import trades';
      case 'notes':
        return 'Journal entries and trade reflections with rich text editing';
      case 'calendar':
        return 'Visual calendar view of your trading activity';
      case 'settings':
        return 'Configure your trading journal preferences and risk management';
      case 'subscription':
        return 'Manage your subscription, billing, and plan upgrades';
      case 'admin':
        return 'System administration and user management';
      default:
        return 'Real-time trading performance';
    }
  };

  return (
    <>
      <AppShell 
        title={getTitle()} 
        subtitle={getSubtitle()}
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewTrade={handleNewTrade}
      >
        {renderContent()}
      </AppShell>
      
      {/* Strategic Upgrade Notification */}
      {upgradeNotification?.show && (
        <div className="fixed top-4 right-4 max-w-md z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-2">
                  ✨ {upgradeNotification.title}
                </h3>
                <p className="text-blue-100 text-xs mb-3">
                  {upgradeNotification.message}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpgrade}
                    className="px-3 py-1.5 bg-white text-blue-600 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
                  >
                    Upgrade Now
                  </button>
                  <button
                    onClick={handleDismissUpgrade}
                    className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs hover:bg-blue-800 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissUpgrade}
                className="ml-2 text-blue-200 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onExport={performExportToAI}
      />
    </>
  );
};

export default TradingApp;