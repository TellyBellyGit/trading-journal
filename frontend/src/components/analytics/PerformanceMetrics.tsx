// components/analytics/PerformanceMetrics.tsx
import React from 'react';
import type { AnalyticsData } from './AnalyticsDashboard';

interface PerformanceMetricsProps {
  data: AnalyticsData;
  isCollapsed: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'yellow' | 'indigo';
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  trend 
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400', 
    red: 'text-red-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    indigo: 'text-indigo-400'
  };

  const trendColorClasses = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      
      <div className="mb-2">
        <p className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${trendColorClasses[trend.direction]}`}>
            {trendIcons[trend.direction]} {trend.value}
          </span>
        </div>
      )}
    </div>
  );
};

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data, isCollapsed }) => {

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate gain/loss ratio
  const gainLossRatio = Math.abs(data.avgWin / data.avgLoss);

  // Determine colors based on values
  const getPLColor = (value: number): 'green' | 'red' => value >= 0 ? 'green' : 'red';
  const getWinRateColor = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate >= 60) return 'green';
    if (rate >= 45) return 'orange';
    return 'red';
  };
  const getProfitFactorColor = (pf: number): 'green' | 'orange' | 'red' => {
    if (pf >= 2.0) return 'green';
    if (pf >= 1.0) return 'orange';
    return 'red';
  };

  const metrics: MetricCardProps[] = [
    {
      title: 'Total P&L',
      value: formatCurrency(data.totalPL),
      icon: '💰',
      color: getPLColor(data.totalPL),
      subtitle: `From ${data.totalTrades} trades`
    },
    {
      title: 'Win Rate',
      value: `${data.winRate.toFixed(1)}%`,
      icon: '🎯',
      color: getWinRateColor(data.winRate),
      subtitle: `${data.winCount}W / ${data.lossCount}L`
    },
    {
      title: 'Profit Factor',
      value: data.profitFactor >= 5 ? '>5.00x' : `${data.profitFactor.toFixed(2)}x`,
      icon: '⚡',
      color: getProfitFactorColor(data.profitFactor),
      subtitle: 'Gross profits ÷ gross losses'
    },
    {
      title: 'Gain/Loss Ratio',
      value: `${gainLossRatio.toFixed(2)}:1`,
      icon: '⚖️',
      color: gainLossRatio >= 1.5 ? 'green' : gainLossRatio >= 1.0 ? 'orange' : 'red',
      subtitle: 'Average win ÷ average loss'
    },
    {
      title: 'Average Win',
      value: formatCurrency(data.avgWin),
      icon: '📈',
      color: 'green',
      subtitle: `From ${data.winCount} winning trades`
    },
    {
      title: 'Average Loss',
      value: formatCurrency(Math.abs(data.avgLoss)),
      icon: '📉',
      color: 'red',
      subtitle: `From ${data.lossCount} losing trades`
    },
    {
      title: 'Highest Gain',
      value: formatCurrency(data.highestGain),
      icon: '🚀',
      color: 'green',
      subtitle: 'Best single trade'
    },
    {
      title: 'Highest Loss',
      value: formatCurrency(Math.abs(data.highestLoss)),
      icon: '⛔',
      color: 'red',
      subtitle: 'Worst single trade'
    },
    {
      title: 'Return on Capital',
      value: formatPercentage(data.returnOnCapital),
      icon: '💹',
      color: getPLColor(data.returnOnCapital),
      subtitle: `On ${formatCurrency(data.totalCapital)} deployed`
    },
    {
      title: 'Open Trades',
      value: data.openTrades.toString(),
      icon: '⏳',
      color: 'orange',
      subtitle: 'Currently active positions'
    },
    {
      title: 'Total Shares',
      value: data.totalShares.toLocaleString(),
      icon: '📊',
      color: 'blue',
      subtitle: 'Volume traded'
    },
    {
      title: 'Avg Capital/Trade',
      value: formatCurrency(data.avgCapitalPerTrade),
      icon: '🎲',
      color: 'purple',
      subtitle: 'Average position size'
    }
  ];

  return (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
      isCollapsed ? 'max-h-0 opacity-0' : 'max-h-none opacity-100'
    }`}>
      <div className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>📊</span>
            <span>Key Performance Indicators</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.slice(0, 4).map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>📈</span>
            <span>Detailed Analytics</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.slice(4, 8).map((metric, index) => (
              <MetricCard key={index + 4} {...metric} />
            ))}
          </div>
        </div>

        {/* Capital & Trading Volume */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>💼</span>
            <span>Capital & Trading Volume</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.slice(8).map((metric, index) => (
              <MetricCard key={index + 8} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;