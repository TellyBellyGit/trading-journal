import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MetricCard = ({ title, value, icon, color, subtitle, trend }) => {
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
    return (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-gray-400 text-sm font-medium", children: title }), _jsx("span", { className: "text-2xl", children: icon })] }), _jsxs("div", { className: "mb-2", children: [_jsx("p", { className: `text-2xl font-bold ${colorClasses[color]}`, children: value }), subtitle && (_jsx("p", { className: "text-gray-500 text-sm mt-1", children: subtitle }))] }), trend && (_jsx("div", { className: "flex items-center space-x-1", children: _jsxs("span", { className: `text-sm font-medium ${trendColorClasses[trend.direction]}`, children: [trendIcons[trend.direction], " ", trend.value] }) }))] }));
};
const PerformanceMetrics = ({ data }) => {
    // Helper function to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };
    // Helper function to format percentage
    const formatPercentage = (value) => {
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };
    // Calculate gain/loss ratio
    const gainLossRatio = Math.abs(data.avgWin / data.avgLoss);
    // Determine colors based on values
    const getPLColor = (value) => value >= 0 ? 'green' : 'red';
    const getWinRateColor = (rate) => {
        if (rate >= 60)
            return 'green';
        if (rate >= 45)
            return 'orange';
        return 'red';
    };
    const getProfitFactorColor = (pf) => {
        if (pf >= 2.0)
            return 'green';
        if (pf >= 1.0)
            return 'orange';
        return 'red';
    };
    const metrics = [
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-white mb-4 flex items-center space-x-2", children: [_jsx("span", { children: "\uD83D\uDCCA" }), _jsx("span", { children: "Key Performance Indicators" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: metrics.slice(0, 4).map((metric, index) => (_jsx(MetricCard, { ...metric }, index))) })] }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-white mb-4 flex items-center space-x-2", children: [_jsx("span", { children: "\uD83D\uDCC8" }), _jsx("span", { children: "Detailed Analytics" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: metrics.slice(4, 8).map((metric, index) => (_jsx(MetricCard, { ...metric }, index + 4))) })] }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-white mb-4 flex items-center space-x-2", children: [_jsx("span", { children: "\uD83D\uDCBC" }), _jsx("span", { children: "Capital & Trading Volume" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: metrics.slice(8).map((metric, index) => (_jsx(MetricCard, { ...metric }, index + 8))) })] })] }));
};
export default PerformanceMetrics;
