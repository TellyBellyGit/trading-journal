// components/analytics/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import ProfitFactorGauge from './ProfitFactorGauge';
import PLChart from './PLChart';
import PerformanceMetrics from './PerformanceMetrics';
import WinRateDonut from './WinRateDonut';
import TradingAssessment from './TradingAssessment';
import TimePeriodSelector from './TimePeriodSelector';

// Types for analytics data
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

interface AnalyticsDashboardProps {
  loading?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ loading = false }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('ytd');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data based on selected period
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build API endpoint based on selected period
      let endpoint = '';
      const baseUrl = 'http://localhost:3001/api';
      
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

      // Fetch data from backend
      const response = await fetch(endpoint);
      
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

  // Generate trading assessment
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
          <h3 className="text-xl font-semibold text-white mb-2">Loading Analytics...</h3>
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
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h3>
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
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Trading Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              Comprehensive performance analysis for {analyticsData.totalTrades} trades
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
      </div>

      {/* Time Period Selector */}
      <TimePeriodSelector
        selectedPeriod={selectedPeriod}
        selectedDate={selectedDate}
        onPeriodChange={handlePeriodChange}
      />

      {/* Performance Metrics KPI Cards */}
      <PerformanceMetrics data={analyticsData} />

      {/* Main Analytics Grid */}
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

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Capital Deployment */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Capital Deployment</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Total Capital Deployed</p>
              <p className="text-white font-semibold">
                ${analyticsData.totalCapital.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Return on Capital</p>
              <p className={`font-semibold ${analyticsData.returnOnCapital >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analyticsData.returnOnCapital > 0 ? '+' : ''}{analyticsData.returnOnCapital.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Capital per Trade</p>
              <p className="text-white font-semibold">
                ${analyticsData.avgCapitalPerTrade.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Shares Traded</p>
              <p className="text-white font-semibold">
                {analyticsData.totalShares.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Losing Streak Analysis */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Losing Streak Analysis</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Worst Streak</p>
              <p className="text-white font-semibold">
                {analyticsData.losingStreaks.worstStreak} consecutive losses
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Streaks (3+)</p>
              <p className="text-white font-semibold">
                {analyticsData.losingStreaks.totalStreaks}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Average Length</p>
              <p className="text-white font-semibold">
                {analyticsData.losingStreaks.avgLength.toFixed(1)} trades
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Damage</p>
              <p className="text-red-400 font-semibold">
                ${analyticsData.losingStreaks.totalDamage.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg per Streak</p>
              <p className="text-red-400 font-semibold">
                ${analyticsData.losingStreaks.avgDamage.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Extremes */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">Extreme Values</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Highest Gain</p>
              <p className="text-green-400 font-semibold">
                +${analyticsData.highestGain.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Highest Loss</p>
              <p className="text-red-400 font-semibold">
                ${analyticsData.highestLoss.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Average Win</p>
              <p className="text-green-400 font-semibold">
                +${analyticsData.avgWin.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Average Loss</p>
              <p className="text-red-400 font-semibold">
                ${analyticsData.avgLoss.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Gain/Loss Ratio</p>
              <p className="text-white font-semibold">
                {Math.abs(analyticsData.avgWin / analyticsData.avgLoss).toFixed(2)}:1
              </p>
            </div>
          </div>
        </div>

        {/* Trade Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-4">Trade Status</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-white font-semibold">
                {analyticsData.totalTrades}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Winning Trades</p>
              <p className="text-green-400 font-semibold">
                {analyticsData.winCount}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Losing Trades</p>
              <p className="text-red-400 font-semibold">
                {analyticsData.lossCount}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Open Trades</p>
              <p className="text-orange-400 font-semibold">
                {analyticsData.openTrades}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-blue-400 font-semibold">
                {analyticsData.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;