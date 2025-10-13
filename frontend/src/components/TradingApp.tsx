/**
 * TradingApp component (top-level app UI orchestrator)
 *
 * Purpose:
 * - Controls which major view is displayed (dashboard, analytics, trades, import, notes, calendar, settings, subscription, admin).
 * - Supplies `AppShell` with the correct title/subtitle and renders the chosen content within the shell.
 * - Coordinates cross-cutting features like upgrade notifications and the date picker modal.
 *
 * High-level flow:
 * - Holds `currentView` state and uses `renderContent()` to return the appropriate view component.
 * - Computes titles and subtitles via `getTitle()` and `getSubtitle()`; defaults are intentionally minimal.
 * - Integrates with `AuthContext` and API modules (`tradesApi`, `subscriptionsApi`, `analysisApi`, `notesApi`).
 *
 * Extending:
 * - To add a new view:
 *   1) Create the view component.
 *   2) Add a case in `renderContent()` and update `getTitle()` / `getSubtitle()`.
 *   3) Optionally add a nav item in `AppShell` via `getNavigationItems`.
 *
 * Notes:
 * - This component is rendered inside `App.tsx` within `AuthWrapper` and `AuthProvider`.
 * - App-wide layout and header controls live in `AppShell`; TradingApp focuses on view orchestration.
 */
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
import { tradesApi, exportTrades } from '../api/trades';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnalysisProgressModal from './AnalysisProgressModal';
import { analysisApi } from '../api/analysis';
import { notesApi } from '../api/notes';


// Main Trading App Component (authenticated content)
const TradingApp: React.FC = () => {
  const { user } = useAuth();
  
  // Set initial view based on user role: Admin users start on Admin Dashboard, regular users on Trading Dashboard
  const getInitialView = () => {
    return user?.isAdmin ? 'admin' : 'original';
  };
  
  const [currentView, setCurrentView] = useState(getInitialView());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'sending' | 'analyzing' | 'formatting' | 'completed' | 'error'>('sending');
  const [analysisError, setAnalysisError] = useState<string>('');
  const [analysisTradeCount, setAnalysisTradeCount] = useState<number>(0);
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
    try {
      const allTrades = await exportTrades(startDate, endDate, 'Closed');
      
      if (!allTrades.length) {
        alert('No closed trades found.');
        return;
      }

      const csvContent = [
        'Symbol,Direction,Entry Price,Exit Price,P&L,Percent Change,Entry Date,Exit Date,Duration,Assessment',
        ...allTrades.map((trade: any) => 
          `${trade.symbol},${trade.direction},${trade.entryPrice},${trade.exitPrice || ''},${trade.pnl || ''},${trade.percentChange || ''},${trade.entryDate},${trade.exitDate || ''},${trade.duration || ''},${trade.assessment || ''}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Exported ${allTrades.length} trades to CSV file.`);

      // Start AI Analysis
      await performAIAnalysis(allTrades, startDate, endDate);
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    }
  };

  // AI Analysis function
  const performAIAnalysis = async (trades: any[], startDate: string, endDate: string) => {
    try {
      // Show modal and set initial status
      setAnalysisTradeCount(trades.length);
      setAnalysisStatus('sending');
      setShowAnalysisModal(true);
      setAnalysisError('');

      // Wait a bit to show "sending" status
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update to analyzing status
      setAnalysisStatus('analyzing');

      // Call AI analysis API
      const analysisResult = await analysisApi.analyzeTrades(trades);

      // Update to formatting status
      setAnalysisStatus('formatting');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create note with analysis
      const noteTitle = `${startDate} to ${endDate} ANALYSIS`;
      await notesApi.create({
        title: noteTitle,
        content: analysisResult.analysis,
        category: 'AI Analysis',
        tags: ['trading-analysis', 'ai-generated', 'portfolio-review']
      });

      // Show completion
      setAnalysisStatus('completed');
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setAnalysisStatus('error');
      setAnalysisError(error.message || 'Failed to analyze trades');
    }
  };

  // Handle analysis modal close
  const handleAnalysisModalClose = () => {
    setShowAnalysisModal(false);
    if (analysisStatus === 'completed') {
      // Navigate to notes section
      setCurrentView('notes');
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
        return '';
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

      {/* Analysis Progress Modal */}
      <AnalysisProgressModal
        isOpen={showAnalysisModal}
        status={analysisStatus}
        tradeCount={analysisTradeCount}
        errorMessage={analysisError}
        onClose={handleAnalysisModalClose}
      />
    </>
  );
};

export default TradingApp;