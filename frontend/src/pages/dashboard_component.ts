import React, { useState, useEffect } from 'react';
import { tradesApi } from '../api/trades';
import type { Trade } from '../types/Trade';

// Placeholder components - we'll create these next
const MetricsCard = ({ title, value, icon, color }: { 
  title: string; 
  value: string; 
  icon: string; 
  color: string; 
}) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{borderLeftColor: color}}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const QuickActions = ({ onNewTrade }: { onNewTrade: () => void }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-4">
      <button 
        onClick={onNewTrade}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
      >
        📝 New Trade
      </button>
      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium transition-colors">
        📊 Analytics
      </button>
      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium transition-colors">
        📤 Import
      </button>
      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium transition-colors">
        📚 PlayBook
      </button>
    </div>
  </div>
);

const RecentTrades = ({ trades, loading }: { trades: Trade[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All →
        </button>
      </div>
      
      {trades.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No trades recorded yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 uppercase">Direction</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 uppercase">P/L</th>
                <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="border-b border-gray-100">
                  <td className="py-3 px-1 font-medium text-gray-900">{trade.symbol}</td>
                  <td className="py-3 px-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.direction === 'Long' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3 px-1">
                    {trade.profitLoss !== null ? (
                      <span className={trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${trade.profitLoss.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-1 text-sm text-gray-500">
                    {new Date(trade.entryDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const tradesData = await tradesApi.getAll();
        setTrades(tradesData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Make sure the backend server is running.');
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate dashboard metrics
  const totalTrades = trades.length;
  const closedTrades = trades.filter(t => t.profitLoss !== null);
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.profitLoss || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
  const avgTrade = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;

  const handleNewTrade = () => {
    // This will eventually navigate to the trade form
    console.log('Navigate to new trade form');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
              <p className="text-gray-600 mt-1">Track and analyze your trading performance</p>
            </div>
            <button 
              onClick={handleNewTrade}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + New Trade
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Trades"
            value={totalTrades.toString()}
            icon="📊"
            color="#3B82F6"
          />
          <MetricsCard
            title="Total P/L"
            value={`$${totalPnL.toFixed(2)}`}
            icon={totalPnL >= 0 ? "📈" : "📉"}
            color={totalPnL >= 0 ? "#10B981" : "#EF4444"}
          />
          <MetricsCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            icon="🎯"
            color="#8B5CF6"
          />
          <MetricsCard
            title="Avg Trade"
            value={`$${avgTrade.toFixed(2)}`}
            icon="💰"
            color="#F59E0B"
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Recent Trades */}
          <div className="lg:col-span-2">
            <RecentTrades trades={trades} loading={loading} />
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <QuickActions onNewTrade={handleNewTrade} />
          </div>
        </div>

        {/* Bottom Section - Performance Chart Placeholder */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Performance chart coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;