// ⚠️ ⚠️ ⚠️ UNUSED COMPONENT - DO NOT EDIT ⚠️ ⚠️ ⚠️
// 
// THIS FILE IS NOT BEING USED IN THE APPLICATION!
// 
// The actual dashboard is the inline "OriginalDashboard" component 
// defined within /frontend/src/App.tsx (lines 340-720)
// 
// This file contains an advanced dashboard implementation that was
// evaluated but not adopted. It should NOT be modified as it's not
// part of the active codebase.
// 
// ⚠️ ⚠️ ⚠️ UNUSED COMPONENT - DO NOT EDIT ⚠️ ⚠️ ⚠️

import React, { useState } from 'react';
import MetricsCard from '../components/MetricsCard';
import RecentTrades from '../components/RecentTrades';
import QuickActions from '../components/QuickActions';
import TradingCalendar from '../components/TradingCalendar';
import useDashboardData from '../hooks/useDashboardData';
import { Formatters } from '../utils/formatters';
import { useDateFormat } from '../contexts/DateFormatContext';
import type { Trade } from '../types/Trade';

// Enhanced chart components
import DonutChart from '../components/charts/DonutChart';
import GaugeChart from '../components/charts/GaugeChart';
import AnimatedCounter from '../components/charts/AnimatedCounter';
import SparklineChart from '../components/charts/SparklineChart';
import RadarChart from '../components/charts/RadarChart';
import RiskHeatmap from '../components/charts/RiskHeatmap';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';

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
  const { dateFormat } = useDateFormat();
  const [selectedDateTrades, setSelectedDateTrades] = useState<Trade[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
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
    derivedData,
    weeklyPerformance
  } = useDashboardData(30000); // Refresh every 30 seconds

  const handleCalendarDateClick = (date: string, trades: Trade[]) => {
    setSelectedDate(date);
    setSelectedDateTrades(trades);
  };

  const closeTradeModal = () => {
    setSelectedDateTrades(null);
    setSelectedDate('');
  };

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
        
        {/* Key Performance Indicators */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-blue-500 rounded-full mr-4"></div>
            <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
              Live Metrics
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total P/L with Animated Counter */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">Total P/L</h3>
                  <p className="text-gray-500 text-xs mt-1">Cumulative profit/loss</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{metrics.totalPnL >= 0 ? '📈' : '📉'}</span>
                </div>
              </div>
              <div className="mb-4">
                <AnimatedCounter
                  to={metrics.totalPnL}
                  formatter="currency"
                  color={metrics.totalPnL >= 0 ? 'green' : 'red'}
                  size="xl"
                  loading={loading}
                />
                <div className="flex items-center mt-2 space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    metrics.totalPnL >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {metrics.totalPnL >= 0 ? '↗️ Profitable' : '↘️ Loss'}
                  </div>
                </div>
              </div>
              {/* Mini sparkline for recent performance */}
              <div className="mt-4">
                <SparklineChart
                  data={weeklyPerformance.map((week, i) => ({ value: week.pnl, date: week.period }))}
                  color={metrics.totalPnL >= 0 ? '#10B981' : '#EF4444'}
                  height={30}
                  animate={true}
                />
              </div>
            </div>

            {/* Win Rate with Donut Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">Win Rate</h3>
                  <p className="text-gray-500 text-xs mt-1">Success percentage</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {metrics.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {metrics.winningTrades}W / {metrics.losingTrades}L
                  </div>
                </div>
                <DonutChart
                  data={[
                    { name: 'Wins', value: metrics.winningTrades, color: '#10B981' },
                    { name: 'Losses', value: metrics.losingTrades, color: '#EF4444' }
                  ]}
                  size={80}
                  innerRadius={25}
                  outerRadius={35}
                  showLabels={false}
                />
              </div>
            </div>

            {/* Profit Factor with Gauge Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">Profit Factor</h3>
                  <p className="text-gray-500 text-xs mt-1">Gross profit / Gross loss</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚖️</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <GaugeChart
                  value={metrics.profitFactor === Infinity ? 3 : metrics.profitFactor}
                  min={0}
                  max={3}
                  target={2.0}
                  label=""
                  color={metrics.profitFactor >= 1.5 ? 'green' : metrics.profitFactor >= 1.0 ? 'orange' : 'red'}
                  size={100}
                />
                <div className="text-sm text-center mt-2">
                  <span className={`font-medium ${
                    metrics.profitFactor >= 1.5 ? 'text-green-600' : 
                    metrics.profitFactor >= 1.0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {metrics.profitFactor >= 1.5 ? 'Excellent' : 
                     metrics.profitFactor >= 1.0 ? 'Good' : 'Poor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Trades with Counter */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">Total Trades</h3>
                  <p className="text-gray-500 text-xs mt-1">Executed positions</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div className="mb-4">
                <AnimatedCounter
                  to={metrics.totalTrades}
                  formatter="number"
                  color="blue"
                  size="xl"
                  decimals={0}
                  loading={loading}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {metrics.openTrades} open • {metrics.closedTrades} closed
                </div>
              </div>
              {/* Progress bar for target */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Monthly Target</span>
                  <span>{Math.min((metrics.totalTrades / 100) * 100, 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((metrics.totalTrades / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Left Column - Recent Trades */}
          <div className="lg:col-span-3">
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

          {/* Trading Calendar */}
          <TradingCalendar onDateClick={handleCalendarDateClick} />
        </div>
      </div>

      {/* Trade Details Modal */}
      {selectedDateTrades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Trades for {Formatters.date(new Date(selectedDate), { format: 'long', dateFormat })}
              </h3>
              <button
                onClick={closeTradeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedDateTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <p>No trades found for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateTrades.map((trade, index) => (
                    <div
                      key={trade.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onTradeClick?.(trade)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="font-semibold text-lg text-gray-900">
                            {trade.symbol}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.direction === 'Long' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.direction}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.status === 'Open' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {trade.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Formatters.currency(trade.pnl || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {Formatters.percentage(trade.percentChange || 0)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="font-medium">Quantity</div>
                          <div>{trade.quantity?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium">Entry Price</div>
                          <div>{Formatters.currency(trade.entryPrice || 0)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Exit Price</div>
                          <div>{trade.exitPrice ? Formatters.currency(trade.exitPrice) : 'Open'}</div>
                        </div>
                        <div>
                          <div className="font-medium">Duration</div>
                          <div>{trade.duration || 0} days</div>
                        </div>
                      </div>
                      
                      {trade.strategy && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Strategy:</span> {trade.strategy}
                        </div>
                      )}
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