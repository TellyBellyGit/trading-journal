import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TradeTable = ({ trades, onDelete, loading = false }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };
    const formatPercent = (value) => {
        return `${value.toFixed(2)}%`;
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const formatDuration = (minutes) => {
        if (!minutes)
            return '-';
        if (minutes < 60)
            return `${minutes.toFixed(1)}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.floor(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white p-6 rounded-lg shadow-md", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/4 mb-4" }), _jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => (_jsx("div", { className: "h-4 bg-gray-200 rounded" }, i))) })] }) }));
    }
    if (trades.length === 0) {
        return (_jsx("div", { className: "bg-white p-6 rounded-lg shadow-md text-center", children: _jsx("p", { className: "text-gray-500", children: "No trades recorded yet. Add your first trade above!" }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md overflow-hidden", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-bold", children: "Trade History" }), _jsxs("p", { className: "text-sm text-gray-600", children: [trades.length, " trade", trades.length !== 1 ? 's' : ''] })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Symbol" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Direction" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Quantity" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Entry" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Exit" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "P/L" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "%" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Duration" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: trades.map((trade) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "font-medium text-gray-900", children: trade.symbol }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${trade.direction === 'Long'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'}`, children: trade.direction }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: trade.quantity }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatCurrency(trade.entryPrice) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: trade.exitPrice ? formatCurrency(trade.exitPrice) : '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: trade.profitLoss !== null && trade.profitLoss !== undefined ? (_jsx("span", { className: trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600', children: formatCurrency(trade.profitLoss) })) : ('-') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: trade.percentChange !== null && trade.percentChange !== undefined ? (_jsx("span", { className: trade.percentChange >= 0 ? 'text-green-600' : 'text-red-600', children: formatPercent(trade.percentChange) })) : ('-') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDuration(trade.duration) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(trade.entryDate) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: _jsx("button", { onClick: () => onDelete(trade.id), className: "text-red-600 hover:text-red-800 font-medium", children: "Delete" }) })] }, trade.id))) })] }) })] }));
};
export default TradeTable;
