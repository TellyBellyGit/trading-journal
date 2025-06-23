import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
console.log("In ALLTRADES Proper!!!.TSX");
import { useState, useEffect } from 'react';
import api from '../api/trades'; // Import your API object
import TradeDetails from './TradeDetails'; // Import TradeDetails component
import EditTrade from './EditTrade'; // Import EditTrade component
import Pagination from './Pagination'; // Import Pagination component
import { formatSimpleDate } from '../utils/formatters';
import { useDateFormat } from '../contexts/DateFormatContext';
// Truncated Assessment Component
const TruncatedAssessment = ({ assessment }) => {
    if (!assessment)
        return _jsx("span", { className: "text-gray-500", children: "\u2014" });
    const truncated = assessment.length > 50 ? assessment.substring(0, 50) + '...' : assessment;
    return (_jsx("span", { className: "text-gray-300 cursor-help", title: assessment, children: truncated }));
};
const AllTrades = ({ loading: externalLoading = false, onTradeEdit, onTradeDelete, onTradeAdd, onExport, }) => {
    const { dateFormat } = useDateFormat();
    console.log('🚀 AllTrades component rendered/re-rendered');
    console.log('📊 Props received:', { externalLoading, onTradeEdit: !!onTradeEdit, onTradeDelete: !!onTradeDelete });
    // State management
    const [trades, setTrades] = useState([]);
    const [filteredTrades, setFilteredTrades] = useState([]);
    const [brokers, setBrokers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrades, setSelectedTrades] = useState(new Set());
    const [viewMode, setViewMode] = useState('table');
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [itemsPerPage] = useState(20);
    // NEW: Trade details navigation state
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    // NEW: Edit trade navigation state
    const [editingTradeId, setEditingTradeId] = useState(null);
    // Filter states - UPDATED
    const [filters, setFilters] = useState({
        symbol: '',
        direction: undefined,
        status: undefined,
        hasNotes: undefined,
        hasAssessment: undefined,
        fromDate: '',
        brokerId: undefined,
    });
    // NEW: Filters panel collapse state
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'entryDate', direction: 'desc' });
    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);
    // Apply filters when they change (reset to page 1)
    useEffect(() => {
        applyFilters(1);
    }, [filters]);
    const loadInitialData = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            // Load trades with pagination, brokers, and stats in parallel
            const [tradesResponse, brokersData, statsData] = await Promise.all([
                api.trades.getAll(undefined, page, itemsPerPage),
                api.brokers.getAll(),
                api.trades.getStats(),
            ]);
            setTrades(tradesResponse.trades);
            setPagination(tradesResponse.pagination);
            setCurrentPage(page);
            setBrokers(brokersData);
            setStats(statsData);
            // Set filtered trades to current page trades initially
            setFilteredTrades(tradesResponse.trades);
        }
        catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load trades data. Please check your connection.');
        }
        finally {
            setLoading(false);
        }
    };
    const applyFilters = async (page = 1) => {
        try {
            // If no filters are applied, load paginated trades normally
            const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '' && value !== null);
            if (!hasFilters) {
                // Load normal paginated data
                const tradesResponse = await api.trades.getAll(undefined, page, itemsPerPage);
                setTrades(tradesResponse.trades);
                setFilteredTrades(tradesResponse.trades);
                setPagination(tradesResponse.pagination);
                setCurrentPage(page);
                return;
            }
            // Use the search API for filtering with pagination
            const searchResponse = await api.trades.search(filters, page, itemsPerPage);
            setTrades(searchResponse.trades);
            setFilteredTrades(searchResponse.trades);
            setPagination(searchResponse.pagination);
            setCurrentPage(page);
        }
        catch (err) {
            console.error('Error applying filters:', err);
            setError('Failed to apply filters. Please try again.');
        }
    };
    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        const sortedTrades = [...filteredTrades].sort((a, b) => {
            const aValue = a[key];
            const bValue = b[key];
            if (aValue === null || aValue === undefined)
                return 1;
            if (bValue === null || bValue === undefined)
                return -1;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });
        setFilteredTrades(sortedTrades);
    };
    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: value === '' ? undefined : value
        }));
    };
    // NEW: Symbol click handler for trade details navigation
    const handleSymbolClick = (tradeId) => {
        console.log('Symbol clicked, trade ID:', tradeId); // Debug log
        setSelectedTradeId(tradeId);
    };
    // NEW: Edit trade handler
    const handleEditTrade = (tradeId) => {
        console.log('Edit trade clicked, trade ID:', tradeId);
        setEditingTradeId(tradeId);
    };
    // NEW: Add trade handler
    const handleAddTrade = () => {
        console.log('Add trade clicked');
        setEditingTradeId('new');
    };
    const handleTradeDeleteWithRefresh = async (tradeId) => {
        try {
            await api.trades.delete(tradeId);
            // Refresh data after deletion - stay on current page if possible
            const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '' && value !== null);
            if (hasFilters) {
                await applyFilters(currentPage);
            }
            else {
                await loadInitialData(currentPage);
            }
            onTradeDelete(tradeId);
        }
        catch (err) {
            console.error('Error deleting trade:', err);
            alert('Failed to delete trade. Please try again.');
        }
    };
    const handleRefresh = () => {
        loadInitialData(currentPage);
    };
    // Handle page changes
    const handlePageChange = (page) => {
        // Check if we have active filters
        const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '' && value !== null);
        if (hasFilters) {
            applyFilters(page);
        }
        else {
            loadInitialData(page);
        }
    };
    const handleSelectAll = () => {
        if (selectedTrades.size === filteredTrades.length) {
            setSelectedTrades(new Set());
        }
        else {
            setSelectedTrades(new Set(filteredTrades.map(t => t.id)));
        }
    };
    const handleSelectTrade = (tradeId) => {
        const newSelected = new Set(selectedTrades);
        if (newSelected.has(tradeId)) {
            newSelected.delete(tradeId);
        }
        else {
            newSelected.add(tradeId);
        }
        setSelectedTrades(newSelected);
    };
    const formatCurrency = (value) => {
        if (value === null || value === undefined)
            return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            //minimumFractionDigits: 2
            minimumFractionDigits: 0, // Don't force decimals
            maximumFractionDigits: 4 // Allow up to 4 decimals
        }).format(value);
    };
    const formatPercentage = (value) => {
        if (value === null || value === undefined)
            return '—';
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    };
    // NEW: Format time function for entry/exit times
    const formatTime = (timeString) => {
        if (!timeString)
            return '—';
        // If it's already in HH:MM:SS format, just return first 5 chars (HH:MM)
        if (timeString.includes(':')) {
            return timeString.substring(0, 8); // HH:MM
        }
        return timeString;
    };
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey)
            return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };
    // UPDATED: Clear filters function
    const clearFilters = () => {
        setFilters({
            symbol: '',
            direction: undefined,
            status: undefined,
            hasNotes: undefined,
            hasAssessment: undefined,
            fromDate: '',
            brokerId: undefined,
        });
    };
    // Loading state
    if (loading || externalLoading) {
        return (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Loading Trades..." }), _jsx("p", { className: "text-gray-400", children: "Fetching your trade data from database" })] }));
    }
    // Error state
    if (error) {
        return (_jsxs("div", { className: "bg-gray-800 border border-red-600 rounded-lg p-8 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Error Loading Trades" }), _jsx("p", { className: "text-gray-400 mb-6", children: error }), _jsx("button", { onClick: handleRefresh, className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", children: "Try Again" })] }));
    }
    // NEW: Conditional rendering for TradeDetails - MUST be after all hooks
    if (selectedTradeId !== null) {
        return (_jsx(TradeDetails, { tradeId: selectedTradeId, onBack: () => setSelectedTradeId(null) }));
    }
    // NEW: Conditional rendering for EditTrade - MUST be after all hooks
    if (editingTradeId !== null) {
        return (_jsx(EditTrade, { tradeId: editingTradeId, onBack: () => {
                setEditingTradeId(null);
                loadInitialData();
            }, onSave: () => {
                setEditingTradeId(null);
                loadInitialData(); // Refresh the trades list
            } }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "All Trades" }), _jsxs("p", { className: "text-gray-400 text-sm mt-1", children: [filteredTrades.length, " of ", trades.length, " trades", selectedTrades.size > 0 && ` • ${selectedTrades.size} selected`, _jsx("span", { className: "ml-2 text-blue-400", children: "\u2022 Click any symbol to view details & add notes" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("button", { onClick: handleRefresh, className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", disabled: loading, children: loading ? '🔄 Loading...' : '🔄 Refresh' }), _jsx("button", { onClick: handleAddTrade, className: "px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors", children: "+ Add Trade" }), _jsx("button", { onClick: onExport, className: "px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors", children: "\uD83D\uDCCA Export" }), _jsxs("div", { className: "flex bg-gray-700 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('table'), className: `px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`, children: "\uD83D\uDCCB Table" }), _jsx("button", { onClick: () => setViewMode('cards'), className: `px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`, children: "\uD83C\uDFB4 Cards" })] })] })] }) }), stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total P&L" }), _jsx("p", { className: `text-xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(stats.totalPnL) })] }), _jsx("div", { className: "text-2xl", children: "\uD83D\uDCB0" })] }) }), _jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Win Rate" }), _jsxs("p", { className: "text-xl font-bold text-white", children: [((stats.winningTrades / stats.totalTrades) * 100).toFixed(1), "%"] })] }), _jsx("div", { className: "text-2xl", children: "\uD83C\uDFAF" })] }) }), _jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Trades" }), _jsx("p", { className: "text-xl font-bold text-white", children: stats.totalTrades })] }), _jsx("div", { className: "text-2xl", children: "\uD83D\uDCC8" })] }) }), _jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Open Trades" }), _jsx("p", { className: "text-xl font-bold text-orange-400", children: stats.openTrades })] }), _jsx("div", { className: "text-2xl", children: "\u23F3" })] }) })] })), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-700", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Filters" }), !filtersExpanded && (_jsx("span", { className: "text-gray-400 text-sm", children: Object.values(filters).filter(v => v !== undefined && v !== '').length > 0 &&
                                            `${Object.values(filters).filter(v => v !== undefined && v !== '').length} active` }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setFiltersExpanded(!filtersExpanded), className: "px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center space-x-1", children: _jsx("span", { children: filtersExpanded ? '▲ Collapse' : '▼ Expand' }) }), _jsx("button", { onClick: clearFilters, className: "px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors", children: "Clear All" })] })] }), _jsx("div", { className: `transition-all duration-300 ease-in-out overflow-hidden ${filtersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`, children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Symbol" }), _jsx("input", { type: "text", value: filters.symbol || '', onChange: (e) => handleFilterChange('symbol', e.target.value), placeholder: "e.g., AAPL", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Direction" }), _jsxs("select", { value: filters.direction || '', onChange: (e) => handleFilterChange('direction', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Directions" }), _jsx("option", { value: "Long", children: "Long" }), _jsx("option", { value: "Short", children: "Short" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Status" }), _jsxs("select", { value: filters.status || '', onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "Closed", children: "Closed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Broker" }), _jsxs("select", { value: filters.brokerId || '', onChange: (e) => handleFilterChange('brokerId', e.target.value ? parseInt(e.target.value) : undefined), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Brokers" }), brokers.map(broker => (_jsx("option", { value: broker.id, children: broker.name }, broker.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "From Date" }), _jsx("input", { type: "date", value: filters.fromDate || '', onChange: (e) => handleFilterChange('fromDate', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Has Notes" }), _jsxs("select", { value: filters.hasNotes === undefined ? '' : filters.hasNotes.toString(), onChange: (e) => handleFilterChange('hasNotes', e.target.value === '' ? undefined : e.target.value === 'true'), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Trades" }), _jsx("option", { value: "true", children: "With Notes" }), _jsx("option", { value: "false", children: "Without Notes" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Has Assessment" }), _jsxs("select", { value: filters.hasAssessment === undefined ? '' : filters.hasAssessment.toString(), onChange: (e) => handleFilterChange('hasAssessment', e.target.value === '' ? undefined : e.target.value === 'true'), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Trades" }), _jsx("option", { value: "true", children: "With Assessment" }), _jsx("option", { value: "false", children: "Without Assessment" })] })] })] }) }) })] }), filteredTrades.length === 0 && !loading && (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCCA" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: trades.length === 0 ? 'No trades found' : 'No trades match your filters' }), _jsx("p", { className: "text-gray-400 mb-6", children: trades.length === 0
                            ? 'Start by adding your first trade to track your trading performance.'
                            : 'Try adjusting your filters or clearing them to see more trades.' }), trades.length === 0 ? (_jsx("button", { onClick: handleAddTrade, className: "px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors", children: "Add Your First Trade" })) : (_jsx("button", { onClick: clearFilters, className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", children: "Clear All Filters" }))] })), viewMode === 'table' && filteredTrades.length > 0 && (_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "p-4 text-left", children: _jsx("input", { type: "checkbox", checked: selectedTrades.size === filteredTrades.length && filteredTrades.length > 0, onChange: handleSelectAll, className: "rounded border-gray-500 text-blue-600 focus:ring-blue-500" }) }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('symbol'), children: ["Symbol ", getSortIcon('symbol')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('direction'), children: ["Direction ", getSortIcon('direction')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('quantity'), children: ["Quantity ", getSortIcon('quantity')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('entryPrice'), children: ["Entry Price ", getSortIcon('entryPrice')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('exitPrice'), children: ["Exit Price ", getSortIcon('exitPrice')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('pnl'), children: ["P&L ", getSortIcon('pnl')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('percentChange'), children: ["% Change ", getSortIcon('percentChange')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('status'), children: ["Status ", getSortIcon('status')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('entryDate'), children: ["Entry Date ", getSortIcon('entryDate')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('entryTime'), children: ["Entry Time ", getSortIcon('entryTime')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('exitDate'), children: ["Exit Date ", getSortIcon('exitDate')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('exitTime'), children: ["Exit Time ", getSortIcon('exitTime')] }), _jsxs("th", { className: "p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors", onClick: () => handleSort('assessment'), children: ["Assessment ", getSortIcon('assessment')] }), _jsx("th", { className: "p-4 text-left text-gray-300 font-medium", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: filteredTrades.map((trade) => (_jsxs("tr", { className: "hover:bg-gray-700/50 transition-colors", children: [_jsx("td", { className: "p-4", children: _jsx("input", { type: "checkbox", checked: selectedTrades.has(trade.id), onChange: () => handleSelectTrade(trade.id), className: "rounded border-gray-500 text-blue-600 focus:ring-blue-500" }) }), _jsx("td", { className: "p-4", children: _jsxs("button", { onClick: () => handleSymbolClick(trade.id), className: "flex items-center space-x-3 hover:bg-gray-600 rounded p-1 transition-colors group", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500", children: _jsx("span", { className: "text-white font-bold text-xs", children: trade.symbol.slice(0, 2) }) }), _jsx("span", { className: "text-white font-medium group-hover:text-blue-400", children: trade.symbol })] }) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction }) }), _jsx("td", { className: "p-4 text-gray-300", children: trade.quantity }), _jsx("td", { className: "p-4 text-gray-300", children: formatCurrency(trade.entryPrice) }), _jsx("td", { className: "p-4 text-gray-300", children: formatCurrency(trade.exitPrice) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(trade.pnl) }) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `font-medium ${(trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatPercentage(trade.percentChange) }) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`, children: trade.status }) }), _jsx("td", { className: "p-4 text-gray-300", children: formatSimpleDate(trade.entryDate, dateFormat) }), _jsx("td", { className: "p-4 text-gray-300 font-mono text-sm", children: formatTime(trade.entryTime) }), _jsx("td", { className: "p-4 text-gray-300", children: trade.status === 'Open' ? (_jsx("span", { className: "text-orange-400 italic", children: "Open" })) : (formatSimpleDate(trade.exitDate, dateFormat)) }), _jsx("td", { className: "p-4 text-gray-300 font-mono text-sm", children: trade.status === 'Open' ? (_jsx("span", { className: "text-orange-400 italic", children: "\u2014" })) : (formatTime(trade.exitTime)) }), _jsx("td", { className: "p-4", children: _jsx(TruncatedAssessment, { assessment: trade.assessment }) }), _jsx("td", { className: "p-4", children: _jsx("button", { onClick: () => handleEditTrade(trade.id), className: "px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors", children: "Edit" }) })] }, trade.id))) })] }) }) })), viewMode === 'cards' && filteredTrades.length > 0 && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTrades.map((trade) => (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "flex items-center space-x-3", children: _jsxs("button", { onClick: () => handleSymbolClick(trade.id), className: "flex items-center space-x-3 hover:bg-gray-700 rounded p-2 transition-colors group", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500", children: _jsx("span", { className: "text-white font-bold", children: trade.symbol.slice(0, 2) }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold group-hover:text-blue-400", children: trade.symbol }), _jsx("p", { className: "text-gray-400 text-sm", children: formatSimpleDate(trade.entryDate, dateFormat) })] })] }) }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("input", { type: "checkbox", checked: selectedTrades.has(trade.id), onChange: () => handleSelectTrade(trade.id), className: "rounded border-gray-500 text-blue-600 focus:ring-blue-500" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Direction" }), _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Status" }), _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`, children: trade.status })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Quantity" }), _jsx("p", { className: "text-white font-medium", children: trade.quantity })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Entry Price" }), _jsx("p", { className: "text-white font-medium", children: formatCurrency(trade.entryPrice) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Entry Time" }), _jsx("p", { className: "text-white font-medium font-mono text-sm", children: formatTime(trade.entryTime) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Exit Date" }), _jsx("p", { className: "text-white font-medium", children: trade.status === 'Open' ? (_jsx("span", { className: "text-orange-400 italic", children: "Open" })) : (formatSimpleDate(trade.exitDate, dateFormat)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Exit Time" }), _jsx("p", { className: "text-white font-medium font-mono text-sm", children: trade.status === 'Open' ? (_jsx("span", { className: "text-orange-400 italic", children: "\u2014" })) : (formatTime(trade.exitTime)) })] })] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "P&L" }), _jsx("p", { className: `text-lg font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(trade.pnl) })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "% Change" }), _jsx("p", { className: `text-lg font-bold ${(trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatPercentage(trade.percentChange) })] })] }), _jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-gray-400 text-sm mb-1", children: "Assessment" }), _jsx(TruncatedAssessment, { assessment: trade.assessment })] }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: () => handleEditTrade(trade.id), className: "w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors", children: "Edit Trade" }) })] })] }, trade.id))) })), pagination && (_jsx(Pagination, { pagination: pagination, onPageChange: handlePageChange, className: "mt-6" })), selectedTrades.size > 0 && (_jsx("div", { className: "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-white font-medium", children: [selectedTrades.size, " trade", selectedTrades.size > 1 ? 's' : '', " selected"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setSelectedTrades(new Set()), className: "px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors", children: "Clear Selection" }), _jsx("button", { onClick: () => {
                                        // Handle bulk export of selected trades
                                        console.log('Export selected trades:', Array.from(selectedTrades));
                                        alert(`Export ${selectedTrades.size} selected trades`);
                                    }, className: "px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors", children: "Export Selected" }), _jsx("button", { onClick: () => {
                                        if (window.confirm(`Are you sure you want to delete ${selectedTrades.size} selected trades?`)) {
                                            // Handle bulk delete
                                            Promise.all(Array.from(selectedTrades).map(id => api.trades.delete(id))).then(() => {
                                                setSelectedTrades(new Set());
                                                // Refresh current page after bulk deletion
                                                const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '' && value !== null);
                                                if (hasFilters) {
                                                    applyFilters(currentPage);
                                                }
                                                else {
                                                    loadInitialData(currentPage);
                                                }
                                            }).catch(err => {
                                                console.error('Error deleting trades:', err);
                                                alert('Failed to delete some trades. Please try again.');
                                            });
                                        }
                                    }, className: "px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors", children: "Delete Selected" })] })] }) }))] }));
};
export default AllTrades;
