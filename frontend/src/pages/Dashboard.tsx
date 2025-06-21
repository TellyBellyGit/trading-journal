import React from 'react';
import MetricsCard from '../components/MetricsCard';
import RecentTrades from '../components/RecentTrades';
import QuickActions from '../components/QuickActions';
import useDashboardData from '../hooks/useDashboardData';
import { Formatters } from '../utils/formatters';
import type { Trade } from '../types/Trade';

export interface DashboardProps {
  onNewTrade: () => void;
  onAnalytics?: () => void;
  onImport?: () => void;
  onPlayBook?: () => void;
  onCalendar?: () => void;
  onViewAllTrades?: () => void;
  onTradeClick?: (trade: Trade) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNewTrade,
  onAnalytics,
  onImport,
  onPlayBook,
  onCalendar,
  onViewAllTrades,
  onTradeClick
}) => {
  // Use the custom hook for dashboard data
  const {
    trades,
    metrics,
    recentTrades,
    topSymbols,
    loading,
    error,
    lastUpdated,
    refresh,
    derivedData
  } = useDashboardData(30000); // Refresh every 30 seconds

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={refresh} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Retry Connection
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
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-gray-600">Track and analyze your trading performance</p>
                {lastUpdated && (
                  <div className="text-xs text-gray-500">
                    Last updated: {Formatters.relativeDate(lastUpdated)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refresh}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                {loading ? '🔄' : '↻'} Refresh
              </button>
              <button 
                onClick={onNewTrade}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                + New Trade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Primary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Trades"
            value={metrics.totalTrades}
            icon="📊"
            color="#3B82F6"
            subtitle={`${metrics.openTrades} open, ${metrics.closedTrades} closed`}
            loading={loading}
          />
          <MetricsCard
            title="Total P/L"
            value={Formatters.currency(metrics.totalPnL)}
            icon={metrics.totalPnL >= 0 ? "📈" : "📉"}
            color={metrics.totalPnL >= 0 ? "#10B981" : "#EF4444"}
            subtitle={derivedData.isProftable ? "Profitable" : "Needs improvement"}
            loading={loading}
          />
          <MetricsCard
            title="Win Rate"
            value={Formatters.winRate(metrics.winRate)}
            icon="🎯"
            color="#8B5CF6"
            subtitle={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
            loading={loading}
          />
          <MetricsCard
            title="Avg Trade"
            value={Formatters.currency(metrics.avgTrade)}
            icon="💰"
            color="#F59E0B"
            subtitle={`Best: ${Formatters.compactCurrency(metrics.largestWin)}`}
            loading={loading}
          />
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Profit Factor"
            value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
            icon="⚖️"
            color={metrics.profitFactor >= 1.5 ? "#10B981" : metrics.profitFactor >= 1.0 ? "#F59E0B" : "#EF4444"}
            subtitle={metrics.profitFactor >= 1.5 ? "Excellent" : metrics.profitFactor >= 1.0 ? "Good" : "Poor"}
            loading={loading}
          />
          <MetricsCard
            title="Avg Win"
            value={Formatters.currency(metrics.avgWin)}
            icon="🟢"
            color="#10B981"
            subtitle={`${metrics.winningTrades} winning trades`}
            loading={loading}
          />
          <MetricsCard
            title="Avg Loss"
            value={Formatters.currency(metrics.avgLoss)}
            icon="🔴"
            color="#EF4444"
            subtitle={`${metrics.losingTrades} losing trades`}
            loading={loading}
          />
          <MetricsCard
            title="Volume"
            value={Formatters.compactCurrency(metrics.totalVolume)}
            icon="💼"
            color="#6B7280"
            subtitle="Total capital deployed"
            loading={loading}
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Left Column - Recent Trades */}
          <div className="lg:col-span-2">
            <RecentTrades 
              trades={recentTrades} 
              loading={loading}
              maxTrades={8}
              onViewAll={onViewAllTrades}
              onTradeClick={onTradeClick}
            />
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <QuickActions 
              onNewTrade={onNewTrade}
              onAnalytics={onAnalytics}
              onImport={onImport}
              onPlayBook={onPlayBook}
              onCalendar={onCalendar}
            />
          </div>
        </div>

        {/* Bottom Section - Top Symbols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Symbols Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Symbols</h3>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : topSymbols.length > 0 ? (
              <div className="space-y-3">
                {topSymbols.map((symbol, index) => (
                  <div key={symbol.symbol} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{symbol.symbol}</div>
                        <div className="text-sm text-gray-500">{symbol.trades} trades</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${Formatters.profitLoss(symbol.pnl).color}`}>
                        {Formatters.profitLoss(symbol.pnl).formatted}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">📊</div>
                <p>No symbol data available</p>
              </div>
            )}
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="space-y-4">
              
              {/* Risk-Reward Ratio */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Risk-Reward Ratio</div>
                  <div className="text-sm text-gray-500">Average win vs average loss</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {derivedData.riskRewardRatio > 0 ? derivedData.riskRewardRatio.toFixed(2) : '-'}:1
                  </div>
                  <div className={`text-xs ${derivedData.riskRewardRatio >= 2 ? 'text-green-600' : derivedData.riskRewardRatio >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {derivedData.riskRewardRatio >= 2 ? 'Excellent' : derivedData.riskRewardRatio >= 1 ? 'Good' : 'Poor'}
                  </div>
                </div>
              </div>

              {/* Expected Value */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Expected Value</div>
                  <div className="text-sm text-gray-500">Per trade expectation</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${derivedData.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Formatters.currency(derivedData.expectedValue)}
                  </div>
                  <div className={`text-xs ${derivedData.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {derivedData.expectedValue >= 0 ? 'Positive edge' : 'Negative edge'}
                  </div>
                </div>
              </div>

              {/* Trading Consistency */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Consistency Score</div>
                  <div className="text-sm text-gray-500">Overall performance quality</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${derivedData.consistency ? 'text-green-600' : 'text-yellow-600'}`}>
                    {derivedData.consistency ? 'Strong' : 'Developing'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {metrics.winRate.toFixed(0)}% win rate
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;