import React, { useState } from 'react';
//##import EnhancedMetricsCard, { TimePeriod, MetricData } from './EnhancedMetricsCard';

import EnhancedMetricsCard from './EnhancedMetricsCard';
import type { TimePeriod, MetricData } from './EnhancedMetricsCard';

// Sample data generator for different time periods
const generateSampleData = (): Record<string, Record<TimePeriod, MetricData>> => {
  return {
    totalPnL: {
      daily: {
        current: 1245.67,
        previous: 987.34,
        trend: { value: 258.33, percentage: 26.2, isPositive: true, label: 'yesterday' },
        target: 1500,
        unit: 'currency' as const
      },
      weekly: {
        current: 8750.23,
        previous: 7234.56,
        trend: { value: 1515.67, percentage: 20.9, isPositive: true, label: 'last week' },
        target: 10000,
        unit: 'currency' as const
      },
      monthly: {
        current: 34567.89,
        previous: 28934.23,
        trend: { value: 5633.66, percentage: 19.5, isPositive: true, label: 'last month' },
        target: 40000,
        unit: 'currency' as const
      },
      yearly: {
        current: 187654.32,
        previous: 156432.18,
        trend: { value: 31222.14, percentage: 20.0, isPositive: true, label: 'last year' },
        target: 200000,
        unit: 'currency' as const
      }
    },
    winRate: {
      daily: {
        current: 72.5,
        previous: 68.3,
        trend: { value: 4.2, percentage: 6.1, isPositive: true, label: 'yesterday' },
        target: 75,
        unit: 'percentage' as const
      },
      weekly: {
        current: 69.8,
        previous: 71.2,
        trend: { value: -1.4, percentage: -2.0, isPositive: false, label: 'last week' },
        target: 75,
        unit: 'percentage' as const
      },
      monthly: {
        current: 68.5,
        previous: 65.7,
        trend: { value: 2.8, percentage: 4.3, isPositive: true, label: 'last month' },
        target: 75,
        unit: 'percentage' as const
      },
      yearly: {
        current: 67.9,
        previous: 63.4,
        trend: { value: 4.5, percentage: 7.1, isPositive: true, label: 'last year' },
        target: 75,
        unit: 'percentage' as const
      }
    },
    totalTrades: {
      daily: {
        current: 23,
        previous: 18,
        trend: { value: 5, percentage: 27.8, isPositive: true, label: 'yesterday' },
        target: 30,
        unit: 'number' as const
      },
      weekly: {
        current: 147,
        previous: 132,
        trend: { value: 15, percentage: 11.4, isPositive: true, label: 'last week' },
        target: 200,
        unit: 'number' as const
      },
      monthly: {
        current: 634,
        previous: 578,
        trend: { value: 56, percentage: 9.7, isPositive: true, label: 'last month' },
        target: 800,
        unit: 'number' as const
      },
      yearly: {
        current: 7284,
        previous: 6456,
        trend: { value: 828, percentage: 12.8, isPositive: true, label: 'last year' },
        target: 8000,
        unit: 'number' as const
      }
    },
    avgTrade: {
      daily: {
        current: 54.16,
        previous: 54.85,
        trend: { value: -0.69, percentage: -1.3, isPositive: false, label: 'yesterday' },
        unit: 'currency' as const
      },
      weekly: {
        current: 59.52,
        previous: 54.82,
        trend: { value: 4.70, percentage: 8.6, isPositive: true, label: 'last week' },
        unit: 'currency' as const
      },
      monthly: {
        current: 54.53,
        previous: 50.06,
        trend: { value: 4.47, percentage: 8.9, isPositive: true, label: 'last month' },
        unit: 'currency' as const
      },
      yearly: {
        current: 25.77,
        previous: 24.23,
        trend: { value: 1.54, percentage: 6.4, isPositive: true, label: 'last year' },
        unit: 'currency' as const
      }
    },
    profitFactor: {
      daily: {
        current: 1.85,
        previous: 1.67,
        trend: { value: 0.18, percentage: 10.8, isPositive: true, label: 'yesterday' },
        target: 2.0,
        unit: 'number' as const
      },
      weekly: {
        current: 1.73,
        previous: 1.81,
        trend: { value: -0.08, percentage: -4.4, isPositive: false, label: 'last week' },
        target: 2.0,
        unit: 'number' as const
      },
      monthly: {
        current: 1.92,
        previous: 1.78,
        trend: { value: 0.14, percentage: 7.9, isPositive: true, label: 'last month' },
        target: 2.0,
        unit: 'number' as const
      },
      yearly: {
        current: 1.84,
        previous: 1.69,
        trend: { value: 0.15, percentage: 8.9, isPositive: true, label: 'last year' },
        target: 2.0,
        unit: 'number' as const
      }
    },
    riskReward: {
      daily: {
        current: 2.3,
        previous: 2.1,
        trend: { value: 0.2, percentage: 9.5, isPositive: true, label: 'yesterday' },
        target: 3.0,
        unit: 'number' as const
      },
      weekly: {
        current: 2.1,
        previous: 2.4,
        trend: { value: -0.3, percentage: -12.5, isPositive: false, label: 'last week' },
        target: 3.0,
        unit: 'number' as const
      },
      monthly: {
        current: 2.45,
        previous: 2.18,
        trend: { value: 0.27, percentage: 12.4, isPositive: true, label: 'last month' },
        target: 3.0,
        unit: 'number' as const
      },
      yearly: {
        current: 2.32,
        previous: 2.07,
        trend: { value: 0.25, percentage: 12.1, isPositive: true, label: 'last year' },
        target: 3.0,
        unit: 'number' as const
      }
    }
  };
};

const MetricsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');
  const sampleData = generateSampleData();

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Enhanced Metrics Dashboard</h1>
          <p className="text-gray-400 mt-1">Professional trading metrics with time period analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Global Time Period Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Period:</span>
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
              {[
                { key: 'daily', label: 'Daily', short: 'D' },
                { key: 'weekly', label: 'Weekly', short: 'W' },
                { key: 'monthly', label: 'Monthly', short: 'M' },
                { key: 'yearly', label: 'Yearly', short: 'Y' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key as TimePeriod)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${selectedPeriod === period.key
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }
                  `}
                  title={period.label}
                >
                  {period.short}
                </button>
              ))}
            </div>
            <span className="text-gray-500 text-sm">
              {selectedPeriod === 'daily' ? 'Today' :
               selectedPeriod === 'weekly' ? 'This Week' :
               selectedPeriod === 'monthly' ? 'This Month' : 'This Year'}
            </span>
          </div>
          
          <div className="h-6 w-px bg-gray-600"></div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <span>{loading ? '🔄' : '↻'}</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Primary Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EnhancedMetricsCard
            title="Total P/L"
            icon="💰"
            color="green"
            description="Cumulative profit/loss"
            data={sampleData.totalPnL}
            selectedPeriod={selectedPeriod}
            loading={loading}
            showProgress={true}
            priority="high"
          />
          
          <EnhancedMetricsCard
            title="Win Rate"
            icon="🎯"
            color="purple"
            description="Percentage of winning trades"
            data={sampleData.winRate}
            selectedPeriod={selectedPeriod}
            loading={loading}
            showProgress={true}
            priority="high"
          />
          
          <EnhancedMetricsCard
            title="Total Trades"
            icon="📊"
            color="blue"
            description="Number of executed trades"
            data={sampleData.totalTrades}
            selectedPeriod={selectedPeriod}
            loading={loading}
            showProgress={true}
            priority="medium"
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Advanced Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EnhancedMetricsCard
            title="Average Trade"
            icon="📈"
            color="orange"
            description="Average profit per trade"
            data={sampleData.avgTrade}
            selectedPeriod={selectedPeriod}
            loading={loading}
            priority="medium"
          />
          
          <EnhancedMetricsCard
            title="Profit Factor"
            icon="⚖️"
            color="yellow"
            description="Gross profit / Gross loss"
            data={sampleData.profitFactor}
            selectedPeriod={selectedPeriod}
            loading={loading}
            showProgress={true}
            priority="medium"
          />
          
          <EnhancedMetricsCard
            title="Risk/Reward"
            icon="⚡"
            color="red"
            description="Average win / Average loss"
            data={sampleData.riskReward}
            selectedPeriod={selectedPeriod}
            loading={loading}
            showProgress={true}
            priority="low"
          />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Component Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">Interactive Features:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Hover for detailed breakdown</li>
              <li>• Click D/W/M/Y for time periods</li>
              <li>• Animated value transitions</li>
              <li>• Progress bars for targets</li>
              <li>• Trend indicators with arrows</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Visual Indicators:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Color-coded trends (green/red)</li>
              <li>• Priority levels (high/medium/low)</li>
              <li>• Loading skeleton animations</li>
              <li>• Hover effects and gradients</li>
              <li>• Responsive grid layouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;