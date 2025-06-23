import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatTradeDate } from '../utils/formatters';
const RecentTrades = ({ trades, loading = false, maxTrades = 5, onViewAll, onTradeClick }) => {
    const formatCurrency = (value) => {
        if (value === null || value === undefined)
            return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };
    const getTradeStatus = (trade) => {
        if (trade.profitLoss === null || trade.profitLoss === undefined) {
            return { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-100' };
        }
        else if (trade.profitLoss > 0) {
            return { label: 'Profit', color: 'text-green-700', bgColor: 'bg-green-100' };
        }
        else if (trade.profitLoss < 0) {
            return { label: 'Loss', color: 'text-red-700', bgColor: 'bg-red-100' };
        }
        else {
            return { label: 'Break Even', color: 'text-gray-700', bgColor: 'bg-gray-100' };
        }
    };
    const getProfitLossDisplay = (trade) => {
        if (trade.profitLoss === null || trade.profitLoss === undefined) {
            return { value: '-', color: 'text-gray-400' };
        }
        const color = trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600';
        const value = formatCurrency(trade.profitLoss);
        return { value, color };
    };
    const recentTrades = trades.slice(0, maxTrades);
    if (loading) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("div", { className: "h-6 bg-gray-200 rounded w-32" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-16" })] }), _jsx("div", { className: "space-y-4", children: [...Array(3)].map((_, i) => (_jsxs("div", { className: "flex justify-between items-center py-3 border-b border-gray-100", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-8 w-8 bg-gray-200 rounded-full" }), _jsxs("div", { children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-16 mb-1" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-12" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-16 mb-1" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-20" })] })] }, i))) })] }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Trades" }), _jsx("p", { className: "text-sm text-gray-500", children: trades.length === 0 ? 'No trades yet' : `${trades.length} total trades` })] }), onViewAll && trades.length > 0 && (_jsxs("button", { onClick: onViewAll, className: "text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center", children: ["View All", _jsx("svg", { className: "ml-1 w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] }))] }), trades.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCCA" }), _jsx("p", { className: "text-gray-500 text-lg mb-2", children: "No trades recorded yet" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Start by adding your first trade" })] })) : (_jsx("div", { className: "space-y-1", children: recentTrades.map((trade, index) => {
                    const status = getTradeStatus(trade);
                    const pnl = getProfitLossDisplay(trade);
                    const isClickable = !!onTradeClick;
                    return (_jsxs("div", { onClick: () => onTradeClick?.(trade), className: `
                  flex items-center justify-between py-4 px-3 rounded-lg border border-transparent
                  transition-all duration-200
                  ${isClickable ? 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer' : ''}
                  ${index !== recentTrades.length - 1 ? 'border-b border-gray-100' : ''}
                `, children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-blue-700 font-bold text-sm", children: trade.symbol.slice(0, 2) }) }), _jsx("div", { className: `absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${trade.direction === 'Long' ? 'bg-green-500' : 'bg-red-500'}`, children: _jsx("span", { className: "text-white font-bold", children: trade.direction === 'Long' ? '↗' : '↘' }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "font-semibold text-gray-900", children: trade.symbol }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`, children: status.label })] }), _jsx("p", { className: "text-sm text-gray-500", children: formatTradeDate(trade.entryDate) })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `font-semibold ${pnl.color}`, children: pnl.value }), trade.percentChange !== null && trade.percentChange !== undefined && (_jsxs("div", { className: `text-sm ${pnl.color}`, children: [trade.percentChange >= 0 ? '+' : '', trade.percentChange.toFixed(2), "%"] })), _jsxs("div", { className: "text-xs text-gray-500", children: [trade.quantity, " shares"] })] })] }, trade.id));
                }) })), trades.length > maxTrades && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-100 text-center", children: _jsxs("button", { onClick: onViewAll, className: "text-sm text-gray-500 hover:text-gray-700 transition-colors", children: ["+", trades.length - maxTrades, " more trades"] }) }))] }));
};
export default RecentTrades;
