import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import MetricsDashboard from './components/MetricsDashboard';
import AllTrades from './components/AllTrades';
import ImportTrades from './components/ImportTrades';
import './index.css';
import { API_BASE_URL } from './config/api';

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
      const trades = await api.getTrades();
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

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-700/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl">📈</span>
              <p className="text-gray-400 mt-2">Performance Chart</p>
              <p className="text-gray-500 text-sm">
                {stats?.totalTrades ? `Based on ${stats.totalTrades} trades` : 'Component coming next...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardSelector = ({ currentView, onViewChange }: { 
  currentView: string; 
  onViewChange: (view: string) => void; 
}) => {
  console.log("🔥 DASHBOARD SELECTOR IS RENDERING!", currentView);
  return (
    <div className="p-6 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard View</h2>
          <p className="text-gray-400 text-sm">Choose your preferred dashboard layout</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewChange('original')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'original'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => onViewChange('enhanced')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'enhanced'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
          >
            ⚡ Metrics
          </button>
          <button
            onClick={() => onViewChange('all-trades')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'all-trades'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
          >
            📋 Trades
          </button>
          <button
            onClick={() => onViewChange('import')}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'import'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
          >
            📤 Import
          </button>
        </div>
      </div>
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

  const renderContent = () => {
    console.log("🔥 Current view is:", currentView); 
    return (
      <div>
        <DashboardSelector 
          currentView={currentView} 
          onViewChange={handleViewChange} 
        />
        
        <div className="transition-all duration-300">
          {currentView === 'original' && <OriginalDashboard />}
          {currentView === 'enhanced' && <MetricsDashboard />}
          {currentView === 'all-trades' && (
            <AllTrades
              onTradeAdd={() => {
                console.log('Add new trade');
                // TODO: Navigate to add trade form or open modal
              }}
              onExport={() => {
                console.log('Export trades');
                // TODO: Export trades to CSV/Excel
              }}
            />
          )}
          {currentView === 'import' && <ImportTrades />}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    return currentView === 'enhanced' 
      ? 'Enhanced Trading Dashboard' 
      : currentView === 'all-trades'
      ? 'Trade List'
      : currentView === 'import'
      ? 'Import Trades'
      : 'Trading Dashboard';
  };

  const getSubtitle = () => {
    return currentView === 'enhanced'
      ? 'Professional metrics with time period analysis'
      : currentView === 'all-trades'
      ? 'Complete trading history with advanced filtering'
      : currentView === 'import'
      ? 'Upload broker statements to automatically import trades'
      : 'Real-time trading performance';
  };

  return (
    <AppShell title={getTitle()} subtitle={getSubtitle()}>
      {renderContent()}
    </AppShell>
  );
}

export default App;