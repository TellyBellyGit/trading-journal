import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import MetricsDashboard from './components/MetricsDashboard'; // Your existing placeholder
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard'; // NEW analytics dashboard
import PerformanceIndicatorsDashboard from './components/PerformanceIndicatorsDashboard'; // NEW performance indicators dashboard
import AllTrades from './components/AllTrades';
import ImportTrades from './components/ImportTrades';
import TradingCalendar from './components/TradingCalendar';
import Notes from './components/Notes';
import './index.css';

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';

// Types matching your Prisma schema
interface Trade {
  id: number;
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  profitLoss?: number;
  percentChange?: number;
  orderType: string;
  assessment?: string;
  capitalDeployed: number;
  entryDate: string;
  exitDate?: string;
  duration?: number;
  status: 'Open' | 'Closed';
  commentary?: string;
  createdAt: string;
  updatedAt: string;
  broker?: {
    id: number;
    name: string;
  };
}

interface DashboardStats {
  totalTrades: number;
  totalPnL: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  avgTrade: number;
}

// API service functions
const api = {
  // Fetch all trades
  getTrades: async (): Promise<Trade[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  },

  // Fetch dashboard statistics
  getStats: async (): Promise<DashboardStats | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  },

  // Fetch recent trades (limit to last 10)
  getRecentTrades: async (limit: number = 4): Promise<Trade[]> => {
    try {
      const response = await api.getTrades();
      // Handle paginated response format
      const trades = response.trades || response;
      return trades
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      return [];
    }
  }
};

// Enhanced Dashboard Content Component with Real Data
const OriginalDashboard = () => {
  console.log("🔥 ORIGINAL DASHBOARD IS RENDERING!"); 
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  console.log("🔥 CURRENT STATE:", { loading, stats, recentTrades });

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      console.log("🔥 STARTING TO LOAD DASHBOARD DATA"); 
      setLoading(true);
      setError(null);
      
      console.log("🔥 CALLING API ENDPOINTS"); 
      const [statsData, tradesData] = await Promise.all([
        api.getStats(),
        api.getRecentTrades(4)
      ]);
      
      console.log("🔥 API RESPONSES:", { statsData, tradesData });
      setStats(statsData);
      setRecentTrades(tradesData);
    } catch (error) {
      console.error('🔥 ERROR LOADING DASHBOARD:', error);
      setError('Failed to load dashboard data');
    } finally {
      console.log("🔥 FINISHED LOADING");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle calendar date clicks
  const handleCalendarDateClick = (date: string, trades: Trade[]) => {
    setSelectedDate(date);
    setSelectedDateTrades(trades);
  };

  const closeTradeModal = () => {
    setSelectedDateTrades(null);
    setSelectedDate('');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    console.log("🔥 SHOWING LOADING STATE! Loading value:", loading);
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="w-8 h-8 bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate metrics for display
  const metrics = [
    { 
      title: 'Total Trades', 
      value: stats?.totalTrades?.toString() || '0', 
      color: 'blue', 
      icon: '📊' 
    },
    { 
      title: 'Total P/L', 
      value: stats?.totalPnL ? formatCurrency(stats.totalPnL) : '$0.00', 
      color: stats?.totalPnL && stats.totalPnL >= 0 ? 'green' : 'red', 
      icon: '💰' 
    },
    { 
      title: 'Win Rate', 
      value: stats?.winRate ? `${stats.winRate.toFixed(1)}%` : '0%', 
      color: 'purple', 
      icon: '🎯' 
    },
    { 
      title: 'Avg Trade', 
      value: stats?.avgTrade ? formatCurrency(stats.avgTrade) : '$0.00', 
      color: 'orange', 
      icon: '📈' 
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">{metric.title}</h3>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${
              metric.color === 'blue' ? 'text-blue-400' :
              metric.color === 'green' ? 'text-green-400' :
              metric.color === 'red' ? 'text-red-400' :
              metric.color === 'purple' ? 'text-purple-400' :
              'text-orange-400'
            }`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades from Database */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
            <button
              onClick={loadDashboardData}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="p-6">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400">No trades found</p>
                <p className="text-gray-500 text-sm mt-2">Create your first trade to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700">
                    <tr className="text-left">
                      <th className="pb-3 text-gray-400 text-sm font-medium">Symbol</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Direction</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Entry Date</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Entry Time</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Quantity</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Entry Price</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Exit Price</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">P&L</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">% Change</th>
                      <th className="pb-3 text-gray-400 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">{trade.symbol.slice(0, 2)}</span>
                            </div>
                            <span className="text-white font-medium">{trade.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">{formatDate(trade.entryDate)}</td>
                        <td className="py-3 text-gray-300 text-sm">{trade.entryTime || '-'}</td>
                        <td className="py-3 text-gray-300 font-medium">{trade.quantity}</td>
                        <td className="py-3 text-gray-300 font-medium">{formatCurrency(trade.entryPrice)}</td>
                        <td className="py-3 text-gray-300 font-medium">
                          {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold ${(trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {trade.profitLoss !== null && trade.profitLoss !== undefined ? formatCurrency(trade.profitLoss) : '-'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold ${(trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {trade.percentChange !== null && trade.percentChange !== undefined ?
                              `${trade.percentChange > 0 ? '+' : ''}${trade.percentChange.toFixed(2)}%` : '-'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                            }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'New Trade', icon: '📝', color: 'blue' },
              { label: 'Analytics', icon: '📊', color: 'purple' },
              { label: 'Import Data', icon: '📤', color: 'green' },
              { label: 'Export Report', icon: '📄', color: 'orange' }
            ].map((action, index) => (
              <button key={index} className={`
                w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors
                ${action.color === 'blue' ? 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' :
                  action.color === 'purple' ? 'border-purple-600 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400' :
                  action.color === 'green' ? 'border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400' :
                  'border-orange-600 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400'
                }
              `}>
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Calendar */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <TradingCalendar onDateClick={handleCalendarDateClick} />
      </div>

      {/* Trade Details Modal */}
      {selectedDateTrades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                Trades for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={closeTradeModal}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedDateTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">📅</div>
                  <p>No trades found for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="font-semibold text-lg text-white">
                            {trade.symbol}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.direction === 'Long' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-red-600 text-white'
                          }`}>
                            {trade.direction}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === 'Open' 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }`}>
                            {trade.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            (trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.profitLoss ? formatCurrency(trade.profitLoss) : '$0.00'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {trade.percentChange ? `${trade.percentChange > 0 ? '+' : ''}${trade.percentChange.toFixed(2)}%` : '0%'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                        <div>
                          <div className="font-medium text-gray-400">Quantity</div>
                          <div>{trade.quantity?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-400">Entry Price</div>
                          <div>{formatCurrency(trade.entryPrice || 0)}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-400">Exit Price</div>
                          <div>{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-400">Duration</div>
                          <div>{trade.duration || 0} days</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Main App Component
function App() {
  console.log("🔥 NEW APP COMPONENT IS RUNNING!"); 
  const [currentView, setCurrentView] = useState('original');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
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

  const renderContent = () => {
    console.log("🔥 Current view is:", currentView); 
    return (
      <div className="transition-all duration-300">
        {currentView === 'original' && <OriginalDashboard />}
        {currentView === 'analytics' && <AnalyticsDashboard />}
        {currentView === 'enhanced' && <MetricsDashboard />}
        {currentView === 'performance-indicators' && <PerformanceIndicatorsDashboard />}
        {currentView === 'all-trades' && (
          <AllTrades
            onTradeAdd={() => {
              console.log('Add new trade');
              // TODO: Navigate to add trade form or open modal
            }}
            onTradeEdit={(trade) => {
              console.log('Edit trade:', trade);
              // TODO: Handle trade editing
            }}
            onTradeDelete={(tradeId) => {
              console.log('Delete trade:', tradeId);
              // TODO: Handle trade deletion
            }}
            onExport={() => {
              console.log('Export trades');
              // TODO: Export trades to CSV/Excel
            }}
          />
        )}
        {currentView === 'import' && <ImportTrades />}
        {currentView === 'notes' && <Notes />}
      </div>
    );
  };

  const getTitle = () => {
    return currentView === 'analytics' 
      ? 'Trading Analytics Dashboard' 
      : currentView === 'enhanced'
      ? 'Enhanced Trading Dashboard' 
      : currentView === 'all-trades'
      ? 'Trade List'
      : currentView === 'import'
      ? 'Import Trades'
      : currentView === 'notes'
      ? 'Trading Notes'
      : 'Trading Dashboard';
  };

  const getSubtitle = () => {
    return currentView === 'analytics'
      ? 'Comprehensive performance analysis with advanced metrics'
      : currentView === 'enhanced'
      ? 'Professional metrics with time period analysis'
      : currentView === 'all-trades'
      ? 'Complete trading history with advanced filtering'
      : currentView === 'import'
      ? 'Upload broker statements to automatically import trades'
      : currentView === 'notes'
      ? 'Journal entries and trade reflections with rich text editing'
      : 'Real-time trading performance';
  };

  return (
    <AppShell 
      title={getTitle()} 
      subtitle={getSubtitle()}
      currentView={currentView}
      onViewChange={handleViewChange}
      onNewTrade={handleNewTrade}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;