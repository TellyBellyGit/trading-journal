import React, { useState, useEffect } from 'react';
import TradingCalendar from './TradingCalendar';
import { Trade, TradeStats } from '../types/Trade';
import { tradesApi } from '../api/trades';

// Calculate longest consecutive streak in recent trades
const calculateCurrentStreak = (trades: { id: number; pnl: number | null; entryDate: string }[]) => {
  // Add validation to ensure trades is an array
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return { type: 'none', count: 0, display: 'No Trades' };
  }
  
  // Filter only closed trades with P&L data, sorted by most recent first
  const closedTrades = trades
    .filter(trade => {
      return trade.pnl !== null && trade.pnl !== undefined;
    })
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  
  if (closedTrades.length === 0) return { type: 'none', count: 0, display: 'No Closed Trades' };
  
  // Take last 10 trades for context
  const last10Trades = closedTrades.slice(0, 10);
  
  // Count wins and losses in last 10
  let wins = 0;
  let losses = 0;
  
  for (const trade of last10Trades) {
    if (trade.pnl !== undefined && trade.pnl !== null && trade.pnl > 0) {
      wins++;
    } else if (trade.pnl !== undefined && trade.pnl !== null) {
      losses++;
    }
  }
  
  // Find longest consecutive streak in the last 10 trades
  let longestStreak = 0;
  let longestStreakType = 'win'; // 'win' or 'loss'
  let currentStreak = 1;
  let currentType = '';
  
  // Initialize with first trade
  if (last10Trades.length > 0) {
    const firstTradePnl = last10Trades[0].pnl;
    if (firstTradePnl !== undefined && firstTradePnl !== null) {
      currentType = firstTradePnl > 0 ? 'win' : 'loss';
      longestStreak = 1;
      longestStreakType = currentType;
    }
  }
  
  // Check each subsequent trade
  for (let i = 1; i < last10Trades.length; i++) {
    const tradePnl = last10Trades[i].pnl;
    if (tradePnl === undefined || tradePnl === null) continue;
    const tradeType = tradePnl > 0 ? 'win' : 'loss';
    
    if (tradeType === currentType) {
      // Extend current streak
      currentStreak++;
    } else {
      // Check if current streak is longest so far
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakType = currentType;
      }
      // Start new streak
      currentStreak = 1;
      currentType = tradeType;
    }
  }
  
  // Check final streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    longestStreakType = currentType;
  }
  
  // Format display with 2 lines
  const line1 = `Last ${last10Trades.length} trades: ${wins} Wins ${losses} Losses`;
  const line2 = `${longestStreak} consecutive ${longestStreakType}${longestStreak > 1 ? (longestStreakType === 'win' ? 's' : 'es') : ''}`;
  const display = `${line1}\n${line2}`;
  
  return { 
    type: longestStreakType, 
    count: longestStreak, 
    display: display 
  };
};

// Enhanced Dashboard Component with Real Data
interface DashboardProps {
  onViewChange?: (view: string) => void;
  onExportToAI?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange, onExportToAI }) => {
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<{ id: number; pnl: number | null; entryDate: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Load dashboard data using new combined endpoint
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Single API call to get all dashboard data
      const dashboardData = await tradesApi.getDashboard();
      
      setStats(dashboardData.stats);
      setRecentTrades(dashboardData.recentTrades);
      setAllTrades(dashboardData.allTrades);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
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

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(allTrades);

  // Calculate metrics for display
  const metrics = [
    { 
      title: 'Total Trades', 
      value: stats?.totalTrades?.toString() || '0', 
      color: 'blue'
    },
    { 
      title: 'Total P/L', 
      value: stats?.totalPnL ? formatCurrency(stats.totalPnL) : '$0.00', 
      color: stats?.totalPnL && stats.totalPnL >= 0 ? 'green' : 'red'
    },
    { 
      title: 'Win Rate', 
      value: stats?.winRate ? `${stats.winRate.toFixed(1)}%` : '0%', 
      color: 'purple'
    },
    { 
      title: 'Avg Trade', 
      value: stats?.avgPnL ? formatCurrency(stats.avgPnL) : '$0.00', 
      color: 'orange'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="mb-2">
              <h3 className="text-gray-400 text-sm font-medium">{metric.title}</h3>
            </div>
            <p className={`text-2xl font-bold ${
              metric.color === 'blue' ? 'text-blue-400' :
              metric.color === 'green' ? 'text-green-400' :
              metric.color === 'red' ? 'text-red-400' :
              metric.color === 'purple' ? 'text-purple-400' :
              metric.color === 'gray' ? 'text-gray-400' :
              'text-orange-400'
            }`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Trades from Database */}
        <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
            <button
              onClick={loadDashboardData}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="p-6">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8">
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
                          <span className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {(trade.pnl !== null && trade.pnl !== undefined) ? formatCurrency(trade.pnl) : '-'}
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

        {/* Current Streak & Quick Actions */}
        <div className="space-y-6">
          {/* Current Streak Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Current Streak
              </h3>
            </div>
            <div className="p-6">
              <div className={`${
                currentStreak.type === 'win' ? 'text-green-400' :
                currentStreak.type === 'loss' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {currentStreak.display.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex} className={lineIndex === 0 ? 'text-sm font-medium' : 'text-lg font-bold mt-2'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
            {[
              { label: 'List Trades', color: 'blue', action: () => onViewChange?.('all-trades') },
              { label: 'Analytics', color: 'purple', action: () => onViewChange?.('analytics') },
              { label: 'Import Data', color: 'green', action: () => onViewChange?.('import') },
              { label: 'Export to AI', color: 'orange', action: () => onExportToAI?.() }
            ].map((action, index) => (
              <button 
                key={index} 
                onClick={action.action}
                className={`
                  w-full flex items-center justify-center p-3 rounded-lg border transition-colors
                  ${action.color === 'blue' ? 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' :
                    action.color === 'purple' ? 'border-purple-600 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400' :
                    action.color === 'green' ? 'border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400' :
                    'border-orange-600 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400'
                  }
                `}
              >
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
            </div>
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
                            (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl ? formatCurrency(trade.pnl) : '$0.00'}
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

export default Dashboard;