// components/PerformanceIndicatorsDashboard.tsx
import React, { useState, useEffect } from 'react';
import ProfitFactorGauge from './analytics/ProfitFactorGauge';
import PLChart from './analytics/PLChart';
import WinRateDonut from './analytics/WinRateDonut';
import TradingAssessment from './analytics/TradingAssessment';
import TimePeriodSelector from './analytics/TimePeriodSelector';
import { PieChartWinRate } from './VisualWinRate';
import { ProfitFactorDoughnut, TradesDoughnut, PLDoughnut } from './VisualDoughnuts';

// Import the same types from AnalyticsDashboard
export interface AnalyticsData {
  totalTrades: number;
  totalPL: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  highestGain: number;
  highestLoss: number;
  winCount: number;
  lossCount: number;
  openTrades: number;
  totalCapital: number;
  returnOnCapital: number;
  avgCapitalPerTrade: number;
  totalShares: number;
  losingStreaks: {
    worstStreak: number;
    totalStreaks: number;
    avgLength: number;
    totalDamage: number;
    avgDamage: number;
  };
  plTimeSeries: Array<{
    date: string;
    cumulativePL: number;
  }>;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'ytd' | 'previous-year';

interface PerformanceIndicatorsDashboardProps {
  loading?: boolean;
}

// Enhanced Visual KPI Card Component
interface VisualKPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  target?: number;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'yellow';
  description: string;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const VisualKPICard: React.FC<VisualKPICardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  target,
  color,
  description,
  showProgress = false,
  size = 'medium'
}) => {
  const colorSchemes = {
    blue: {
      primary: 'text-blue-400',
      bg: 'bg-blue-600/10',
      border: 'border-blue-600/30',
      hover: 'hover:border-blue-500',
      gradient: 'from-blue-600/20 to-blue-800/10',
      ring: 'ring-blue-500/20'
    },
    green: {
      primary: 'text-green-400',
      bg: 'bg-green-600/10',
      border: 'border-green-600/30',
      hover: 'hover:border-green-500',
      gradient: 'from-green-600/20 to-green-800/10',
      ring: 'ring-green-500/20'
    },
    red: {
      primary: 'text-red-400',
      bg: 'bg-red-600/10',
      border: 'border-red-600/30',
      hover: 'hover:border-red-500',
      gradient: 'from-red-600/20 to-red-800/10',
      ring: 'ring-red-500/20'
    },
    purple: {
      primary: 'text-purple-400',
      bg: 'bg-purple-600/10',
      border: 'border-purple-600/30',
      hover: 'hover:border-purple-500',
      gradient: 'from-purple-600/20 to-purple-800/10',
      ring: 'ring-purple-500/20'
    },
    orange: {
      primary: 'text-orange-400',
      bg: 'bg-orange-600/10',
      border: 'border-orange-600/30',
      hover: 'hover:border-orange-500',
      gradient: 'from-orange-600/20 to-orange-800/10',
      ring: 'ring-orange-500/20'
    },
    yellow: {
      primary: 'text-yellow-400',
      bg: 'bg-yellow-600/10',
      border: 'border-yellow-600/30',
      hover: 'hover:border-yellow-500',
      gradient: 'from-yellow-600/20 to-yellow-800/10',
      ring: 'ring-yellow-500/20'
    }
  };

  const scheme = colorSchemes[color];
  
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    if (unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
    
    if (unit === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    
    if (Math.abs(val) >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    
    return val.toLocaleString();
  };

  const getProgressPercentage = (): number => {
    if (!target || typeof value === 'string') return 0;
    return Math.min((value / target) * 100, 100);
  };

  return (
    <div className={`
      group relative bg-gray-800 border ${scheme.border} rounded-xl ${sizeClasses[size]}
      transition-all duration-300 ${scheme.hover}
      hover:shadow-2xl hover:shadow-${color}-500/10 hover:scale-[1.02] cursor-pointer
    `}>
      
      {/* Background Gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${scheme.gradient} 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl
      `} />
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-gray-500 text-xs mt-1">{description}</p>
          </div>
          
          {/* Icon */}
          <div className={`
            w-12 h-12 ${scheme.bg} rounded-xl flex items-center justify-center
            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12
          `}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>

        {/* Value Display */}
        <div className="mb-4">
          <div className={`text-3xl font-bold ${scheme.primary} mb-2`}>
            {formatValue(value)}
          </div>
          
          {/* Trend Indicator */}
          {trend && (
            <div className="flex items-center space-x-2">
              <div className={`
                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                ${trend.isPositive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
                }
              `}>
                <span className="text-sm">
                  {trend.isPositive ? '↗️' : '↘️'}
                </span>
                <span>
                  {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                vs {trend.period}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && target && typeof value === 'number' && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress to Target</span>
              <span>{getProgressPercentage().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 bg-gradient-to-r ${scheme.gradient} rounded-full transition-all duration-1000`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Target: {formatValue(target)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PerformanceIndicatorsDashboard: React.FC<PerformanceIndicatorsDashboardProps> = ({ loading = false }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('ytd');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Same API loading logic as AnalyticsDashboard
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build API endpoint based on selected period (exact same logic)
      let endpoint = '';
      const baseUrl = 'http://localhost:3002/api';
      
      switch (selectedPeriod) {
        case 'daily':
          endpoint = `${baseUrl}/trades/analytics/daily/${selectedDate}`;
          break;
        case 'weekly':
          endpoint = `${baseUrl}/trades/analytics/weekly/${selectedDate}`;
          break;
        case 'monthly':
          endpoint = `${baseUrl}/trades/analytics/monthly/${selectedDate}`;
          break;
        case 'ytd':
          const currentYear = new Date(selectedDate).getFullYear();
          endpoint = `${baseUrl}/trades/analytics/ytd/${currentYear}`;
          break;
        case 'previous-year':
          const targetYear = new Date(selectedDate).getFullYear();
          endpoint = `${baseUrl}/trades/analytics/previous-year/${targetYear}`;
          break;
        default:
          endpoint = `${baseUrl}/trades/analytics/summary`;
      }

      console.log('Fetching analytics from:', endpoint);

      // Fetch data from backend with authentication - using authenticated API
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Analytics data received:', data);
      
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load analytics data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when period or date changes
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, selectedDate]);

  // Handle period change
  const handlePeriodChange = (period: TimePeriod, date?: string) => {
    setSelectedPeriod(period);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Generate trading assessment (same logic)
  const generateAssessment = (data: AnalyticsData): string => {
    const { winRate, profitFactor, avgWin, avgLoss } = data;
    const gainLossRatio = Math.abs(avgWin / avgLoss);

    if (data.lossCount === 0 && data.winCount > 0) {
      return "Don't get cocky kid!! Perfect win rate, but sustainable edge requires experiencing losses too.";
    }

    if (data.winCount === 0 && data.lossCount > 0) {
      return "Back to school!! No winning trades indicates fundamental issues with your strategy or execution.";
    }

    if (gainLossRatio < 0.5) {
      return `CRITICAL RISK ISSUE: Your ${gainLossRatio.toFixed(1)}:1 gain/loss ratio means your losses are ${(1/gainLossRatio).toFixed(1)}x larger than your wins. Win rate of ${winRate.toFixed(0)}% is irrelevant with such poor risk control.`;
    }

    if (gainLossRatio < 1.0) {
      return `Risk management alert: ${gainLossRatio.toFixed(1)}:1 gain/loss ratio means your average loss is larger than your average win. Even with ${winRate.toFixed(0)}% win rate, this approach isn't sustainable.`;
    }

    if (winRate >= 55 && gainLossRatio >= 2.0) {
      return `Excellent trading: ${winRate.toFixed(0)}% win rate with ${gainLossRatio.toFixed(1)}:1 gain/loss ratio indicates a strong edge and proper position sizing.`;
    }

    if (winRate >= 55 && gainLossRatio >= 1.0) {
      return `Good performance: Your ${winRate.toFixed(0)}% win rate is solid, and ${gainLossRatio.toFixed(1)}:1 gain/loss ratio is acceptable. Focus on letting winners run more to improve results.`;
    }

    return `Breaking even: ${winRate.toFixed(0)}% win rate and ${gainLossRatio.toFixed(1)}:1 gain/loss ratio are both adequate but not exceptional. Need improvement for consistent profitability.`;
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Performance Indicators...</h3>
          <p className="text-gray-400">Calculating your trading performance metrics</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-gray-800 border border-red-600 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Performance Indicators</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Performance Data Available</h3>
          <p className="text-gray-400 mb-4">
            No trading data found for the selected {selectedPeriod} period.
          </p>
          <p className="text-gray-500 text-sm">
            {selectedPeriod === 'daily' && `No trades found for ${new Date(selectedDate).toLocaleDateString()}`}
            {selectedPeriod === 'weekly' && `No trades found for the week of ${new Date(selectedDate).toLocaleDateString()}`}
            {selectedPeriod === 'monthly' && `No trades found for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            {selectedPeriod === 'ytd' && `No trades found for ${new Date(selectedDate).getFullYear()} year-to-date`}
            {selectedPeriod === 'previous-year' && `No trades found for ${new Date(selectedDate).getFullYear()}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Indicators</h1>
          <p className="text-gray-400 text-sm mt-1">
            Visual performance analysis for {analyticsData.totalTrades} trades
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Time Period Selector */}
      <TimePeriodSelector
        selectedPeriod={selectedPeriod}
        selectedDate={selectedDate}
        onPeriodChange={handlePeriodChange}
      />


      {/* Enhanced Visual KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* P&L Card with Doughnut */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/10 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Total P&L</h3>
              <p className="text-gray-500 text-xs mt-1">Cumulative profit/loss</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <PLDoughnut 
              totalPL={analyticsData.totalPL}
              totalCapital={analyticsData.totalCapital}
              size="large"
            />
          </div>
        </div>
        
        {/* Win Rate Card with Pie Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Win Rate</h3>
              <p className="text-gray-500 text-xs mt-1">Percentage of winning trades</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <PieChartWinRate 
              winRate={analyticsData.winRate} 
              size="large"
              showPercentage={true}
            />
          </div>
        </div>
        
        {/* Profit Factor Card with Doughnut */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/10 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Profit Factor</h3>
              <p className="text-gray-500 text-xs mt-1">Gross profit vs gross loss</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ProfitFactorDoughnut 
              grossProfit={analyticsData.avgWin * analyticsData.winCount}
              grossLoss={analyticsData.avgLoss * analyticsData.lossCount}
              size="large"
            />
          </div>
        </div>
        
        {/* Total Trades Card with Doughnut */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Total Trades</h3>
              <p className="text-gray-500 text-xs mt-1">Winning vs losing trades</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <TradesDoughnut 
              winningTrades={analyticsData.winCount}
              losingTrades={analyticsData.lossCount}
              size="large"
            />
          </div>
        </div>
        
        {/* Text-based cards for remaining metrics */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/10 hover:scale-[1.02]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Average Win</h3>
              <p className="text-gray-500 text-xs mt-1">Average profit per winning trade</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(analyticsData.avgWin)}
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 hover:scale-[1.02]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Average Loss</h3>
              <p className="text-gray-500 text-xs mt-1">Average loss per losing trade</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-2">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Math.abs(analyticsData.avgLoss))}
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Return on Capital</h3>
              <p className="text-gray-500 text-xs mt-1">ROI on deployed capital</p>
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${analyticsData.returnOnCapital >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analyticsData.returnOnCapital > 0 ? '+' : ''}{analyticsData.returnOnCapital.toFixed(2)}%
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-[1.02]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Risk/Reward Ratio</h3>
              <p className="text-gray-500 text-xs mt-1">Average win vs average loss</p>
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${Math.abs(analyticsData.avgWin / analyticsData.avgLoss) >= 2.0 ? 'text-green-400' : 'text-orange-400'}`}>
            {Math.abs(analyticsData.avgWin / analyticsData.avgLoss).toFixed(2)}:1
          </div>
        </div>
      </div>

      {/* Visual Components from Original Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profit Factor Gauge */}
        <div className="lg:col-span-1">
          <ProfitFactorGauge 
            profitFactor={analyticsData.profitFactor}
            className="h-120"
          />
        </div>

        {/* Win Rate Donut */}
        <div className="lg:col-span-1">
          <WinRateDonut 
            winRate={analyticsData.winRate}
            winCount={analyticsData.winCount}
            lossCount={analyticsData.lossCount}
            className="h-120"
          />
        </div>

        {/* Trading Assessment */}
        <div className="lg:col-span-1">
          <TradingAssessment
            assessment={generateAssessment(analyticsData)}
            profitFactor={analyticsData.profitFactor}
            className="h-120"
          />
        </div>
      </div>

      {/* P&L Chart */}
      <div className="mt-8">
        <PLChart 
          data={analyticsData.plTimeSeries}
          totalPL={analyticsData.totalPL}
        />
      </div>
    </div>
  );
};

export default PerformanceIndicatorsDashboard;