import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MetricsCard = ({ title, value, icon = "📊", color = "#3B82F6", subtitle, trend, loading = false }) => {
    if (loading) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-md p-6 border-l-4 animate-pulse", style: { borderLeftColor: color }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-2/3 mb-2" }), _jsx("div", { className: "h-8 bg-gray-200 rounded w-1/2 mb-1" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/3" })] }), _jsx("div", { className: "w-12 h-12 bg-gray-200 rounded-full" })] }) }));
    }
    const formatValue = (val) => {
        if (typeof val === 'number') {
            // Format large numbers with K, M notation
            if (Math.abs(val) >= 1000000) {
                return `${(val / 1000000).toFixed(1)}M`;
            }
            else if (Math.abs(val) >= 1000) {
                return `${(val / 1000).toFixed(1)}K`;
            }
            return val.toFixed(2);
        }
        return val.toString();
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4", style: { borderLeftColor: color }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-sm font-medium text-gray-600 uppercase tracking-wide", children: title }) }), _jsx("div", { className: "text-2xl p-2 rounded-full opacity-80", style: { backgroundColor: `${color}20` }, children: icon })] }), _jsx("div", { className: "mb-2", children: _jsx("p", { className: "text-3xl font-bold text-gray-900 leading-tight", children: formatValue(value) }) }), _jsxs("div", { className: "flex items-center justify-between", children: [subtitle && (_jsx("p", { className: "text-xs text-gray-500", children: subtitle })), trend && (_jsxs("div", { className: `flex items-center text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`, children: [_jsx("span", { className: "mr-1", children: trend.isPositive ? '↗️' : '↘️' }), _jsxs("span", { children: [trend.isPositive ? '+' : '', trend.value.toFixed(1), "%"] }), _jsx("span", { className: "text-gray-500 ml-1", children: trend.label })] }))] }), title.toLowerCase().includes('rate') && typeof value === 'string' && value.includes('%') && (_jsx("div", { className: "mt-3", children: _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "h-2 rounded-full transition-all duration-300", style: {
                            width: `${Math.min(parseFloat(value.replace('%', '')), 100)}%`,
                            backgroundColor: color
                        } }) }) }))] }));
};
export default MetricsCard;
