import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import TradeDetails from './TradeDetails';
// Sample trade data
const sampleTrades = [
    { id: 1, symbol: 'AAPL', side: 'Long', entryPrice: 175.50, exitPrice: 182.30, quantity: 100, entryDate: '2024-01-15', exitDate: '2024-01-20', status: 'Closed', pnl: 680.00 },
    { id: 2, symbol: 'TSLA', side: 'Short', entryPrice: 250.00, exitPrice: 245.50, quantity: 50, entryDate: '2024-01-18', exitDate: '2024-01-22', status: 'Closed', pnl: 225.00 },
    { id: 3, symbol: 'MSFT', side: 'Long', entryPrice: 410.20, exitPrice: null, quantity: 75, entryDate: '2024-01-25', exitDate: null, status: 'Open', pnl: -150.75 },
    { id: 4, symbol: 'GOOGL', side: 'Long', entryPrice: 142.80, exitPrice: 147.90, quantity: 60, entryDate: '2024-01-12', exitDate: '2024-01-16', status: 'Closed', pnl: 306.00 },
    { id: 5, symbol: 'AMZN', side: 'Short', entryPrice: 155.00, exitPrice: 152.30, quantity: 80, entryDate: '2024-01-20', exitDate: '2024-01-24', status: 'Closed', pnl: 216.00 },
    { id: 6, symbol: 'META', side: 'Long', entryPrice: 485.90, exitPrice: null, quantity: 40, entryDate: '2024-01-28', exitDate: null, status: 'Open', pnl: 320.80 },
    { id: 7, symbol: 'NVDA', side: 'Long', entryPrice: 875.00, exitPrice: 920.50, quantity: 25, entryDate: '2024-01-10', exitDate: '2024-01-14', status: 'Closed', pnl: 1137.50 },
    { id: 8, symbol: 'SPY', side: 'Long', entryPrice: 475.20, exitPrice: 478.90, quantity: 200, entryDate: '2024-01-22', exitDate: '2024-01-26', status: 'Closed', pnl: 740.00 },
];
const AllTradesDemo = () => {
    // 🔥 FIX: ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
    const [viewMode, setViewMode] = useState('table');
    const [showFilters, setShowFilters] = useState(false);
    const [sortField, setSortField] = useState('entryDate');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    // Filter state
    const [filters, setFilters] = useState({
        symbol: '',
        side: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        minPnL: '',
        maxPnL: ''
    });
    // Filter and sort trades
    const filteredAndSortedTrades = useMemo(() => {
        console.log('Complex filtering and sorting...');
        // Step 1: Complex filtering
        let filtered = sampleTrades.filter(trade => {
            const matchesSymbol = !filters.symbol || trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase());
            const matchesSide = !filters.side || trade.side === filters.side;
            const matchesStatus = !filters.status || trade.status === filters.status;
            const matchesDateFrom = !filters.dateFrom || trade.entryDate >= filters.dateFrom;
            const matchesDateTo = !filters.dateTo || trade.entryDate <= filters.dateTo;
            const matchesMinPnL = !filters.minPnL || trade.pnl >= parseFloat(filters.minPnL);
            const matchesMaxPnL = !filters.maxPnL || trade.pnl <= parseFloat(filters.maxPnL);
            return matchesSymbol && matchesSide && matchesStatus && matchesDateFrom && matchesDateTo && matchesMinPnL && matchesMaxPnL;
        });
        // Step 2: Sort
        const sorted = [...filtered].sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            // Handle null values
            if (aVal === null && bVal === null)
                return 0;
            if (aVal === null)
                return sortDirection === 'asc' ? 1 : -1;
            if (bVal === null)
                return sortDirection === 'asc' ? -1 : 1;
            // String comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            // Number comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
        return sorted;
    }, [filters, sortField, sortDirection]);
    // Stats calculation
    const stats = useMemo(() => {
        const total = filteredAndSortedTrades.length;
        const open = filteredAndSortedTrades.filter(t => t.status === 'Open').length;
        const closed = filteredAndSortedTrades.filter(t => t.status === 'Closed').length;
        const totalPnL = filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0);
        const winningTrades = filteredAndSortedTrades.filter(t => t.pnl > 0).length;
        const winRate = total > 0 ? (winningTrades / total) * 100 : 0;
        return { total, open, closed, totalPnL, winRate };
    }, [filteredAndSortedTrades]);
    // 🔥 FIXED: NOW ALL HOOKS ARE CALLED, SO WE CAN SAFELY RETURN CONDITIONALLY
    if (selectedTradeId !== null) {
        return (_jsx(TradeDetails, { tradeId: selectedTradeId, onBack: () => setSelectedTradeId(null) }));
    }
    // Handler functions
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    const handleSymbolClick = (tradeId) => {
        console.log('Symbol clicked, trade ID:', tradeId); // Debug log
        setSelectedTradeId(tradeId);
    };
    const resetFilters = () => {
        setFilters({
            symbol: '',
            side: '',
            status: '',
            dateFrom: '',
            dateTo: '',
            minPnL: '',
            maxPnL: ''
        });
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "All Trades" }), _jsxs("p", { className: "text-gray-400", children: ["Showing ", filteredAndSortedTrades.length, " of ", sampleTrades.length, " trades", _jsx("span", { className: "ml-2 text-blue-400", children: "\u2022 Click any symbol to view details & add notes" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("div", { className: "flex bg-gray-700 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('table'), className: `px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`, children: "\uD83D\uDCCA Table" }), _jsx("button", { onClick: () => setViewMode('cards'), className: `px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`, children: "\uD83D\uDCCB Cards" })] }), _jsx("button", { onClick: () => setShowFilters(!showFilters), className: `px-4 py-2 rounded-lg font-medium transition-colors ${showFilters ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "\uD83D\uDD0D Filters" })] })] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Trades" }), _jsx("p", { className: "text-2xl font-bold text-blue-400", children: stats.total })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Open" }), _jsx("p", { className: "text-2xl font-bold text-yellow-400", children: stats.open })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Closed" }), _jsx("p", { className: "text-2xl font-bold text-gray-300", children: stats.closed })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total P&L" }), _jsx("p", { className: `text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(stats.totalPnL) })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Win Rate" }), _jsxs("p", { className: "text-2xl font-bold text-purple-400", children: [stats.winRate.toFixed(1), "%"] })] })] }), showFilters && (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Advanced Filters" }), _jsx("button", { onClick: resetFilters, className: "px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors", children: "Reset All" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Symbol" }), _jsx("input", { type: "text", value: filters.symbol, onChange: (e) => setFilters(prev => ({ ...prev, symbol: e.target.value })), placeholder: "e.g., AAPL", className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Side" }), _jsxs("select", { value: filters.side, onChange: (e) => setFilters(prev => ({ ...prev, side: e.target.value })), className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "Long", children: "Long" }), _jsx("option", { value: "Short", children: "Short" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Status" }), _jsxs("select", { value: filters.status, onChange: (e) => setFilters(prev => ({ ...prev, status: e.target.value })), className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "Closed", children: "Closed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Date From" }), _jsx("input", { type: "date", value: filters.dateFrom, onChange: (e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value })), className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Date To" }), _jsx("input", { type: "date", value: filters.dateTo, onChange: (e) => setFilters(prev => ({ ...prev, dateTo: e.target.value })), className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Min P&L" }), _jsx("input", { type: "number", value: filters.minPnL, onChange: (e) => setFilters(prev => ({ ...prev, minPnL: e.target.value })), placeholder: "0", className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-1", children: "Max P&L" }), _jsx("input", { type: "number", value: filters.maxPnL, onChange: (e) => setFilters(prev => ({ ...prev, maxPnL: e.target.value })), placeholder: "10000", className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] })] })] })), viewMode === 'table' && (_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-700 border-b border-gray-600", children: _jsx("tr", { children: [
                                        { key: 'symbol', label: 'Symbol' },
                                        { key: 'side', label: 'Side' },
                                        { key: 'quantity', label: 'Quantity' },
                                        { key: 'entryPrice', label: 'Entry Price' },
                                        { key: 'exitPrice', label: 'Exit Price' },
                                        { key: 'entryDate', label: 'Entry Date' },
                                        { key: 'status', label: 'Status' },
                                        { key: 'pnl', label: 'P&L' }
                                    ].map(({ key, label }) => (_jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors", onClick: () => handleSort(key), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: label }), sortField === key && (_jsx("span", { className: "text-blue-400", children: sortDirection === 'asc' ? '↑' : '↓' }))] }) }, key))) }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: filteredAndSortedTrades.map((trade) => (_jsxs("tr", { className: "hover:bg-gray-700/50", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("button", { onClick: () => handleSymbolClick(trade.id), className: "flex items-center space-x-2 hover:bg-gray-600 rounded p-1 transition-colors group", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-500", children: _jsx("span", { className: "text-white font-bold text-xs", children: trade.symbol.slice(0, 2) }) }), _jsx("span", { className: "font-medium text-white group-hover:text-blue-400", children: trade.symbol })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.side === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: trade.side }) }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: trade.quantity }), _jsxs("td", { className: "px-4 py-3 text-gray-300", children: ["$", trade.entryPrice.toFixed(2)] }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-' }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: formatDate(trade.entryDate) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`, children: trade.status }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(trade.pnl) }) })] }, trade.id))) })] }) }) })), viewMode === 'cards' && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredAndSortedTrades.map((trade) => (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors", children: [_jsxs("button", { onClick: () => handleSymbolClick(trade.id), className: "flex items-center space-x-3 mb-4 w-full text-left hover:bg-gray-700 rounded p-2 transition-colors group", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-500", children: _jsx("span", { className: "text-white font-bold text-sm", children: trade.symbol.slice(0, 2) }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white group-hover:text-blue-400", children: trade.symbol }), _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: trade.side })] })] }), _jsxs("div", { className: "space-y-2 mb-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Quantity:" }), _jsx("span", { className: "text-white", children: trade.quantity })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Entry:" }), _jsxs("span", { className: "text-white", children: ["$", trade.entryPrice.toFixed(2)] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Status:" }), _jsx("span", { className: trade.status === 'Open' ? 'text-yellow-400' : 'text-gray-300', children: trade.status })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-700", children: _jsx("span", { className: `text-lg font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(trade.pnl) }) })] }, trade.id))) })), filteredAndSortedTrades.length === 0 && (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCCA" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "No trades found" }), _jsx("p", { className: "text-gray-400 mb-6", children: sampleTrades.length === 0
                            ? "You haven't made any trades yet. Create your first trade to get started!"
                            : "No trades match your current filters. Try adjusting your search criteria." }), sampleTrades.length === 0 ? (_jsx("button", { className: "px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors", children: "\u2795 Create First Trade" })) : (_jsx("button", { onClick: resetFilters, className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", children: "\uD83D\uDD04 Clear Filters" }))] }))] }));
};
export default AllTradesDemo;
