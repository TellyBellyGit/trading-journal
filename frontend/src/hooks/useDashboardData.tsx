import { useState, useEffect, useCallback, useMemo } from 'react';
import { tradesApi } from '../api/trades';
import type { Trade } from '../types/Trade';

export interface DashboardMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalPnL: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  avgTrade: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  totalVolume: number;
  avgHoldTime: number;
}

export interface PeriodPerformance {
  period: string;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface DashboardData {
  trades: Trade[];
  metrics: DashboardMetrics;
  recentTrades: Trade[];
  topSymbols: Array<{ symbol: string; trades: number; pnl: number }>;
  monthlyPerformance: PeriodPerformance[];
  weeklyPerformance: PeriodPerformance[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const useDashboardData = (refreshInterval?: number) => {
  const [data, setData] = useState<DashboardData>({
    trades: [],
    metrics: {
      totalTrades: 0,
      closedTrades: 0,
      openTrades: 0,
      totalPnL: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      lossRate: 0,
      avgWin: 0,
      avgLoss: 0,
      avgTrade: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      totalVolume: 0,
      avgHoldTime: 0,
    },
    recentTrades: [],
    topSymbols: [],
    monthlyPerformance: [],
    weeklyPerformance: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Calculate comprehensive metrics from trades
  const calculateMetrics = useCallback((trades: Trade[]): DashboardMetrics => {
    const totalTrades = trades.length;
    const closedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined);
    const openTrades = trades.filter(t => t.pnl === null || t.pnl === undefined);
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
    
    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const closedCount = closedTrades.length;
    
    const winRate = closedCount > 0 ? (winCount / closedCount) * 100 : 0;
    const lossRate = closedCount > 0 ? (lossCount / closedCount) * 100 : 0;
    
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const avgWin = winCount > 0 ? totalWins / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
    const avgTrade = closedCount > 0 ? totalPnL / closedCount : 0;
    
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.pnl || 0)) 
      : 0;
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.pnl || 0)) 
      : 0;
    
    const totalVolume = trades.reduce((sum, trade) => {
      return sum + (trade.quantity * trade.entryPrice);
    }, 0);

    // Calculate average hold time (simplified - in hours)
    const tradesWithDuration = trades.filter(t => t.duration !== null && t.duration !== undefined);
    const avgHoldTime = tradesWithDuration.length > 0
      ? tradesWithDuration.reduce((sum, trade) => sum + (parseInt(trade.duration) || 0), 0) / tradesWithDuration.length
      : 0;

    return {
      totalTrades,
      closedTrades: closedCount,
      openTrades: openTrades.length,
      totalPnL,
      winningTrades: winCount,
      losingTrades: lossCount,
      winRate,
      lossRate,
      avgWin,
      avgLoss,
      avgTrade,
      profitFactor,
      largestWin,
      largestLoss,
      totalVolume,
      avgHoldTime,
    };
  }, []);

  // Calculate top performing symbols
  const calculateTopSymbols = useCallback((trades: Trade[]) => {
    const symbolMap = new Map<string, { trades: number; pnl: number }>();
    
    trades.forEach(trade => {
      const current = symbolMap.get(trade.symbol) || { trades: 0, pnl: 0 };
      symbolMap.set(trade.symbol, {
        trades: current.trades + 1,
        pnl: current.pnl + (trade.pnl || 0)
      });
    });

    return Array.from(symbolMap.entries())
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);
  }, []);

  // Calculate period performance
  const calculatePeriodPerformance = useCallback((trades: Trade[], period: 'month' | 'week') => {
    const now = new Date();
    const periods: PeriodPerformance[] = [];
    
    for (let i = 0; i < (period === 'month' ? 12 : 8); i++) {
      const periodStart = new Date(now);
      const periodEnd = new Date(now);
      
      if (period === 'month') {
        periodStart.setMonth(now.getMonth() - i);
        periodStart.setDate(1);
        periodEnd.setMonth(now.getMonth() - i + 1);
        periodEnd.setDate(0);
      } else {
        periodStart.setDate(now.getDate() - (i * 7));
        periodEnd.setDate(now.getDate() - ((i - 1) * 7));
      }
      
      const periodTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryDate);
        return tradeDate >= periodStart && tradeDate <= periodEnd;
      });
      
      const pnl = periodTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const closedTrades = periodTrades.filter(t => t.pnl !== null && t.pnl !== undefined);
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
      
      periods.unshift({
        period: period === 'month' 
          ? periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : `Week ${i + 1}`,
        pnl,
        trades: periodTrades.length,
        winRate
      });
    }
    
    return periods;
  }, []);

  // Main data fetching function
  const fetchDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const trades = await tradesApi.getAllLegacy();
      const metrics = calculateMetrics(trades);
      const recentTrades = trades.slice(0, 10); // Last 10 trades
      const topSymbols = calculateTopSymbols(trades);
      const monthlyPerformance = calculatePeriodPerformance(trades, 'month');
      const weeklyPerformance = calculatePeriodPerformance(trades, 'week');
      
      setData({
        trades,
        metrics,
        recentTrades,
        topSymbols,
        monthlyPerformance,
        weeklyPerformance,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data. Make sure the backend server is running.',
      }));
    }
  }, [calculateMetrics, calculateTopSymbols, calculatePeriodPerformance]);

  // Refresh function for manual updates
  const refresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    fetchDashboardData();
    
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, refreshInterval]);

  // Memoized derived data
  const derivedData = useMemo(() => {
    const { metrics } = data;
    
    return {
      isProftable: metrics.totalPnL > 0,
      riskRewardRatio: metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 0,
      expectedValue: (metrics.winRate / 100) * metrics.avgWin - (metrics.lossRate / 100) * metrics.avgLoss,
      sharpeRatio: 0, // Would need additional data to calculate properly
      maxDrawdown: 0, // Would need to track running P&L to calculate
      consistency: metrics.winRate >= 50 && metrics.profitFactor > 1.2,
    };
  }, [data.metrics]);

  return {
    ...data,
    derivedData,
    refresh,
    isLoading: data.loading,
    hasError: !!data.error,
  };
};

export default useDashboardData;