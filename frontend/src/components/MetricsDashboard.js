import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
//##import EnhancedMetricsCard, { TimePeriod, MetricData } from './EnhancedMetricsCard';
import EnhancedMetricsCard from './EnhancedMetricsCard';
// Sample data generator for different time periods
const generateSampleData = () => {
    return {
        totalPnL: {
            daily: {
                current: 1245.67,
                previous: 987.34,
                trend: { value: 258.33, percentage: 26.2, isPositive: true, label: 'yesterday' },
                target: 1500,
                unit: 'currency'
            },
            weekly: {
                current: 8750.23,
                previous: 7234.56,
                trend: { value: 1515.67, percentage: 20.9, isPositive: true, label: 'last week' },
                target: 10000,
                unit: 'currency'
            },
            monthly: {
                current: 34567.89,
                previous: 28934.23,
                trend: { value: 5633.66, percentage: 19.5, isPositive: true, label: 'last month' },
                target: 40000,
                unit: 'currency'
            },
            yearly: {
                current: 187654.32,
                previous: 156432.18,
                trend: { value: 31222.14, percentage: 20.0, isPositive: true, label: 'last year' },
                target: 200000,
                unit: 'currency'
            }
        },
        winRate: {
            daily: {
                current: 72.5,
                previous: 68.3,
                trend: { value: 4.2, percentage: 6.1, isPositive: true, label: 'yesterday' },
                target: 75,
                unit: 'percentage'
            },
            weekly: {
                current: 69.8,
                previous: 71.2,
                trend: { value: -1.4, percentage: -2.0, isPositive: false, label: 'last week' },
                target: 75,
                unit: 'percentage'
            },
            monthly: {
                current: 68.5,
                previous: 65.7,
                trend: { value: 2.8, percentage: 4.3, isPositive: true, label: 'last month' },
                target: 75,
                unit: 'percentage'
            },
            yearly: {
                current: 67.9,
                previous: 63.4,
                trend: { value: 4.5, percentage: 7.1, isPositive: true, label: 'last year' },
                target: 75,
                unit: 'percentage'
            }
        },
        totalTrades: {
            daily: {
                current: 23,
                previous: 18,
                trend: { value: 5, percentage: 27.8, isPositive: true, label: 'yesterday' },
                target: 30,
                unit: 'number'
            },
            weekly: {
                current: 147,
                previous: 132,
                trend: { value: 15, percentage: 11.4, isPositive: true, label: 'last week' },
                target: 200,
                unit: 'number'
            },
            monthly: {
                current: 634,
                previous: 578,
                trend: { value: 56, percentage: 9.7, isPositive: true, label: 'last month' },
                target: 800,
                unit: 'number'
            },
            yearly: {
                current: 7284,
                previous: 6456,
                trend: { value: 828, percentage: 12.8, isPositive: true, label: 'last year' },
                target: 8000,
                unit: 'number'
            }
        },
        avgTrade: {
            daily: {
                current: 54.16,
                previous: 54.85,
                trend: { value: -0.69, percentage: -1.3, isPositive: false, label: 'yesterday' },
                unit: 'currency'
            },
            weekly: {
                current: 59.52,
                previous: 54.82,
                trend: { value: 4.70, percentage: 8.6, isPositive: true, label: 'last week' },
                unit: 'currency'
            },
            monthly: {
                current: 54.53,
                previous: 50.06,
                trend: { value: 4.47, percentage: 8.9, isPositive: true, label: 'last month' },
                unit: 'currency'
            },
            yearly: {
                current: 25.77,
                previous: 24.23,
                trend: { value: 1.54, percentage: 6.4, isPositive: true, label: 'last year' },
                unit: 'currency'
            }
        },
        profitFactor: {
            daily: {
                current: 1.85,
                previous: 1.67,
                trend: { value: 0.18, percentage: 10.8, isPositive: true, label: 'yesterday' },
                target: 2.0,
                unit: 'number'
            },
            weekly: {
                current: 1.73,
                previous: 1.81,
                trend: { value: -0.08, percentage: -4.4, isPositive: false, label: 'last week' },
                target: 2.0,
                unit: 'number'
            },
            monthly: {
                current: 1.92,
                previous: 1.78,
                trend: { value: 0.14, percentage: 7.9, isPositive: true, label: 'last month' },
                target: 2.0,
                unit: 'number'
            },
            yearly: {
                current: 1.84,
                previous: 1.69,
                trend: { value: 0.15, percentage: 8.9, isPositive: true, label: 'last year' },
                target: 2.0,
                unit: 'number'
            }
        },
        riskReward: {
            daily: {
                current: 2.3,
                previous: 2.1,
                trend: { value: 0.2, percentage: 9.5, isPositive: true, label: 'yesterday' },
                target: 3.0,
                unit: 'number'
            },
            weekly: {
                current: 2.1,
                previous: 2.4,
                trend: { value: -0.3, percentage: -12.5, isPositive: false, label: 'last week' },
                target: 3.0,
                unit: 'number'
            },
            monthly: {
                current: 2.45,
                previous: 2.18,
                trend: { value: 0.27, percentage: 12.4, isPositive: true, label: 'last month' },
                target: 3.0,
                unit: 'number'
            },
            yearly: {
                current: 2.32,
                previous: 2.07,
                trend: { value: 0.25, percentage: 12.1, isPositive: true, label: 'last year' },
                target: 3.0,
                unit: 'number'
            }
        }
    };
};
const MetricsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('daily');
    const sampleData = generateSampleData();
    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };
    return (_jsxs("div", { className: "p-6 space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Enhanced Metrics Dashboard" }), _jsx("p", { className: "text-gray-400 mt-1", children: "Professional trading metrics with time period analysis" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-gray-400 text-sm font-medium", children: "Period:" }), _jsx("div", { className: "flex space-x-1 bg-gray-800 p-1 rounded-lg border border-gray-700", children: [
                                            { key: 'daily', label: 'Daily', short: 'D' },
                                            { key: 'weekly', label: 'Weekly', short: 'W' },
                                            { key: 'monthly', label: 'Monthly', short: 'M' },
                                            { key: 'yearly', label: 'Yearly', short: 'Y' }
                                        ].map((period) => (_jsx("button", { onClick: () => handlePeriodChange(period.key), className: `
                    px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${selectedPeriod === period.key
                                                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}
                  `, title: period.label, children: period.short }, period.key))) }), _jsx("span", { className: "text-gray-500 text-sm", children: selectedPeriod === 'daily' ? 'Today' :
                                            selectedPeriod === 'weekly' ? 'This Week' :
                                                selectedPeriod === 'monthly' ? 'This Month' : 'This Year' })] }), _jsx("div", { className: "h-6 w-px bg-gray-600" }), _jsxs("button", { onClick: handleRefresh, disabled: loading, className: "btn-primary flex items-center space-x-2", children: [_jsx("span", { children: loading ? '🔄' : '↻' }), _jsx("span", { children: "Refresh" })] })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-white mb-4", children: "Primary Performance Metrics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsx(EnhancedMetricsCard, { title: "Total P/L", icon: "\uD83D\uDCB0", color: "green", description: "Cumulative profit/loss", data: sampleData.totalPnL, selectedPeriod: selectedPeriod, loading: loading, showProgress: true, priority: "high" }), _jsx(EnhancedMetricsCard, { title: "Win Rate", icon: "\uD83C\uDFAF", color: "purple", description: "Percentage of winning trades", data: sampleData.winRate, selectedPeriod: selectedPeriod, loading: loading, showProgress: true, priority: "high" }), _jsx(EnhancedMetricsCard, { title: "Total Trades", icon: "\uD83D\uDCCA", color: "blue", description: "Number of executed trades", data: sampleData.totalTrades, selectedPeriod: selectedPeriod, loading: loading, showProgress: true, priority: "medium" })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-white mb-4", children: "Advanced Analytics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsx(EnhancedMetricsCard, { title: "Average Trade", icon: "\uD83D\uDCC8", color: "orange", description: "Average profit per trade", data: sampleData.avgTrade, selectedPeriod: selectedPeriod, loading: loading, priority: "medium" }), _jsx(EnhancedMetricsCard, { title: "Profit Factor", icon: "\u2696\uFE0F", color: "yellow", description: "Gross profit / Gross loss", data: sampleData.profitFactor, selectedPeriod: selectedPeriod, loading: loading, showProgress: true, priority: "medium" }), _jsx(EnhancedMetricsCard, { title: "Risk/Reward", icon: "\u26A1", color: "red", description: "Average win / Average loss", data: sampleData.riskReward, selectedPeriod: selectedPeriod, loading: loading, showProgress: true, priority: "low" })] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-xl p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Component Features" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-white mb-2", children: "Interactive Features:" }), _jsxs("ul", { className: "space-y-1 text-gray-400", children: [_jsx("li", { children: "\u2022 Hover for detailed breakdown" }), _jsx("li", { children: "\u2022 Click D/W/M/Y for time periods" }), _jsx("li", { children: "\u2022 Animated value transitions" }), _jsx("li", { children: "\u2022 Progress bars for targets" }), _jsx("li", { children: "\u2022 Trend indicators with arrows" })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-white mb-2", children: "Visual Indicators:" }), _jsxs("ul", { className: "space-y-1 text-gray-400", children: [_jsx("li", { children: "\u2022 Color-coded trends (green/red)" }), _jsx("li", { children: "\u2022 Priority levels (high/medium/low)" }), _jsx("li", { children: "\u2022 Loading skeleton animations" }), _jsx("li", { children: "\u2022 Hover effects and gradients" }), _jsx("li", { children: "\u2022 Responsive grid layouts" })] })] })] })] })] }));
};
export default MetricsDashboard;
