import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// components/analytics/AnalyticsDashboard.tsx
import { useState, useEffect } from 'react';
import ProfitFactorGauge from './ProfitFactorGauge';
import PLChart from './PLChart';
import PerformanceMetrics from './PerformanceMetrics';
import WinRateDonut from './WinRateDonut';
import TradingAssessment from './TradingAssessment';
import TimePeriodSelector from './TimePeriodSelector';
const AnalyticsDashboard = ({ loading = false }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('ytd');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Load analytics data based on selected period
    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Build API endpoint based on selected period
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
            // Fetch data from backend
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Analytics data received:', data);
            setAnalyticsData(data);
        }
        catch (err) {
            console.error('Error loading analytics data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Failed to load analytics data: ${errorMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Load data when period or date changes
    useEffect(() => {
        loadAnalyticsData();
    }, [selectedPeriod, selectedDate]);
    // Handle period change
    const handlePeriodChange = (period, date) => {
        setSelectedPeriod(period);
        if (date) {
            setSelectedDate(date);
        }
    };
    // Generate trading assessment
    const generateAssessment = (data) => {
        const { winRate, profitFactor, avgWin, avgLoss } = data;
        const gainLossRatio = Math.abs(avgWin / avgLoss);
        if (data.lossCount === 0 && data.winCount > 0) {
            return "Don't get cocky kid!! Perfect win rate, but sustainable edge requires experiencing losses too.";
        }
        if (data.winCount === 0 && data.lossCount > 0) {
            return "Back to school!! No winning trades indicates fundamental issues with your strategy or execution.";
        }
        if (gainLossRatio < 0.5) {
            return `CRITICAL RISK ISSUE: Your ${gainLossRatio.toFixed(1)}:1 gain/loss ratio means your losses are ${(1 / gainLossRatio).toFixed(1)}x larger than your wins. Win rate of ${winRate.toFixed(0)}% is irrelevant with such poor risk control.`;
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
        return (_jsx("div", { className: "p-6 space-y-6", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Loading Analytics..." }), _jsx("p", { className: "text-gray-400", children: "Calculating your trading performance metrics" })] }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-gray-800 border border-red-600 rounded-lg p-8 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Error Loading Analytics" }), _jsx("p", { className: "text-gray-400 mb-6", children: error }), _jsx("button", { onClick: loadAnalyticsData, className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", children: "Try Again" })] }) }));
    }
    if (!analyticsData) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCCA" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "No Data Available" }), _jsxs("p", { className: "text-gray-400 mb-4", children: ["No trading data found for the selected ", selectedPeriod, " period."] }), _jsxs("p", { className: "text-gray-500 text-sm", children: [selectedPeriod === 'daily' && `No trades found for ${new Date(selectedDate).toLocaleDateString()}`, selectedPeriod === 'weekly' && `No trades found for the week of ${new Date(selectedDate).toLocaleDateString()}`, selectedPeriod === 'monthly' && `No trades found for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, selectedPeriod === 'ytd' && `No trades found for ${new Date(selectedDate).getFullYear()} year-to-date`, selectedPeriod === 'previous-year' && `No trades found for ${new Date(selectedDate).getFullYear()}`] })] }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Trading Analytics" }), _jsxs("p", { className: "text-gray-400 text-sm mt-1", children: ["Comprehensive performance analysis for ", analyticsData.totalTrades, " trades"] })] }), _jsx("div", { className: "flex gap-3", children: _jsx("button", { onClick: loadAnalyticsData, className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", disabled: isLoading, children: isLoading ? '🔄 Loading...' : '🔄 Refresh' }) })] }) }), _jsx(TimePeriodSelector, { selectedPeriod: selectedPeriod, selectedDate: selectedDate, onPeriodChange: handlePeriodChange }), _jsx(PerformanceMetrics, { data: analyticsData }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsx(ProfitFactorGauge, { profitFactor: analyticsData.profitFactor, className: "h-120" }) }), _jsx("div", { className: "lg:col-span-1", children: _jsx(WinRateDonut, { winRate: analyticsData.winRate, winCount: analyticsData.winCount, lossCount: analyticsData.lossCount, className: "h-120" }) }), _jsx("div", { className: "lg:col-span-1", children: _jsx(TradingAssessment, { assessment: generateAssessment(analyticsData), profitFactor: analyticsData.profitFactor, className: "h-120" }) })] }), _jsx("div", { className: "mt-8", children: _jsx(PLChart, { data: analyticsData.plTimeSeries, totalPL: analyticsData.totalPL }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-400 mb-4", children: "Capital Deployment" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Capital Deployed" }), _jsxs("p", { className: "text-white font-semibold", children: ["$", analyticsData.totalCapital.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Return on Capital" }), _jsxs("p", { className: `font-semibold ${analyticsData.returnOnCapital >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [analyticsData.returnOnCapital > 0 ? '+' : '', analyticsData.returnOnCapital.toFixed(2), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Avg Capital per Trade" }), _jsxs("p", { className: "text-white font-semibold", children: ["$", analyticsData.avgCapitalPerTrade.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Shares Traded" }), _jsx("p", { className: "text-white font-semibold", children: analyticsData.totalShares.toLocaleString() })] })] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-red-400 mb-4", children: "Losing Streak Analysis" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Worst Streak" }), _jsxs("p", { className: "text-white font-semibold", children: [analyticsData.losingStreaks.worstStreak, " consecutive losses"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Streaks (3+)" }), _jsx("p", { className: "text-white font-semibold", children: analyticsData.losingStreaks.totalStreaks })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Average Length" }), _jsxs("p", { className: "text-white font-semibold", children: [analyticsData.losingStreaks.avgLength.toFixed(1), " trades"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Damage" }), _jsxs("p", { className: "text-red-400 font-semibold", children: ["$", analyticsData.losingStreaks.totalDamage.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Avg per Streak" }), _jsxs("p", { className: "text-red-400 font-semibold", children: ["$", analyticsData.losingStreaks.avgDamage.toLocaleString()] })] })] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-purple-400 mb-4", children: "Extreme Values" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Highest Gain" }), _jsxs("p", { className: "text-green-400 font-semibold", children: ["+$", analyticsData.highestGain.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Highest Loss" }), _jsxs("p", { className: "text-red-400 font-semibold", children: ["$", analyticsData.highestLoss.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Average Win" }), _jsxs("p", { className: "text-green-400 font-semibold", children: ["+$", analyticsData.avgWin.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Average Loss" }), _jsxs("p", { className: "text-red-400 font-semibold", children: ["$", analyticsData.avgLoss.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Gain/Loss Ratio" }), _jsxs("p", { className: "text-white font-semibold", children: [Math.abs(analyticsData.avgWin / analyticsData.avgLoss).toFixed(2), ":1"] })] })] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-orange-400 mb-4", children: "Trade Status" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Trades" }), _jsx("p", { className: "text-white font-semibold", children: analyticsData.totalTrades })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Winning Trades" }), _jsx("p", { className: "text-green-400 font-semibold", children: analyticsData.winCount })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Losing Trades" }), _jsx("p", { className: "text-red-400 font-semibold", children: analyticsData.lossCount })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Open Trades" }), _jsx("p", { className: "text-orange-400 font-semibold", children: analyticsData.openTrades })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Win Rate" }), _jsxs("p", { className: "text-blue-400 font-semibold", children: [analyticsData.winRate.toFixed(1), "%"] })] })] })] })] })] }));
};
export default AnalyticsDashboard;
