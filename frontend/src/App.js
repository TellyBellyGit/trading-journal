import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import MetricsDashboard from './components/MetricsDashboard'; // Your existing placeholder
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard'; // NEW analytics dashboard
import AllTrades from './components/AllTrades';
import ImportTrades from './components/ImportTrades';
import TradingCalendar from './components/TradingCalendar';
import './index.css';
// API configuration
const API_BASE_URL = 'http://localhost:3002/api';
// API service functions
const api = {
    // Fetch all trades
    getTrades: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/trades`);
            if (!response.ok)
                throw new Error('Failed to fetch trades');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching trades:', error);
            return [];
        }
    },
    // Fetch dashboard statistics
    getStats: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/trades/stats`);
            if (!response.ok)
                throw new Error('Failed to fetch stats');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    },
    // Fetch recent trades (limit to last 10)
    getRecentTrades: async (limit = 4) => {
        try {
            const response = await api.getTrades();
            // Handle paginated response format
            const trades = response.trades || response;
            return trades
                .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
                .slice(0, limit);
        }
        catch (error) {
            console.error('Error fetching recent trades:', error);
            return [];
        }
    }
};
// Enhanced Dashboard Content Component with Real Data
const OriginalDashboard = () => {
    console.log("🔥 ORIGINAL DASHBOARD IS RENDERING!");
    const [stats, setStats] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDateTrades, setSelectedDateTrades] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    console.log("🔥 CURRENT STATE:", { loading, stats, recentTrades });
    // Load dashboard data
    const loadDashboardData = async () => {
        try {
            console.log("🔥 STARTING TO LOAD DASHBOARD DATA");
            setLoading(true);
            setError(null);
            console.log("🔥 CALLING API ENDPOINTS");
            const [statsData, tradesData] = await Promise.all([
                api.getStats(),
                api.getRecentTrades(4)
            ]);
            console.log("🔥 API RESPONSES:", { statsData, tradesData });
            setStats(statsData);
            setRecentTrades(tradesData);
        }
        catch (error) {
            console.error('🔥 ERROR LOADING DASHBOARD:', error);
            setError('Failed to load dashboard data');
        }
        finally {
            console.log("🔥 FINISHED LOADING");
            setLoading(false);
        }
    };
    useEffect(() => {
        loadDashboardData();
    }, []);
    // Handle calendar date clicks
    const handleCalendarDateClick = (date, trades) => {
        setSelectedDate(date);
        setSelectedDateTrades(trades);
    };
    const closeTradeModal = () => {
        setSelectedDateTrades(null);
        setSelectedDate('');
    };
    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };
    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };
    // Loading state
    if (loading) {
        console.log("🔥 SHOWING LOADING STATE! Loading value:", loading);
        return (_jsx("div", { className: "p-6 space-y-6", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [1, 2, 3, 4].map((i) => (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "h-4 bg-gray-700 rounded w-20" }), _jsx("div", { className: "w-8 h-8 bg-gray-700 rounded" })] }), _jsx("div", { className: "h-8 bg-gray-700 rounded w-24" })] }, i))) }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-900/20 border border-red-700 rounded-lg p-6 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "text-xl font-semibold text-red-400 mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-gray-300 mb-4", children: error }), _jsx("button", { onClick: loadDashboardData, className: "px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: "Try Again" })] }) }));
    }
    // Calculate metrics for display
    const metrics = [
        {
            title: 'Total Trades',
            value: stats?.totalTrades?.toString() || '0',
            color: 'blue',
            icon: '📊'
        },
        {
            title: 'Total P/L',
            value: stats?.totalPnL ? formatCurrency(stats.totalPnL) : '$0.00',
            color: stats?.totalPnL && stats.totalPnL >= 0 ? 'green' : 'red',
            icon: '💰'
        },
        {
            title: 'Win Rate',
            value: stats?.winRate ? `${stats.winRate.toFixed(1)}%` : '0%',
            color: 'purple',
            icon: '🎯'
        },
        {
            title: 'Avg Trade',
            value: stats?.avgTrade ? formatCurrency(stats.avgTrade) : '$0.00',
            color: 'orange',
            icon: '📈'
        }
    ];
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: metrics.map((metric, index) => (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-gray-400 text-sm font-medium", children: metric.title }), _jsx("span", { className: "text-2xl", children: metric.icon })] }), _jsx("p", { className: `text-2xl font-bold ${metric.color === 'blue' ? 'text-blue-400' :
                                metric.color === 'green' ? 'text-green-400' :
                                    metric.color === 'red' ? 'text-red-400' :
                                        metric.color === 'purple' ? 'text-purple-400' :
                                            'text-orange-400'}`, children: metric.value })] }, index))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg", children: [_jsxs("div", { className: "p-6 border-b border-gray-700 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Recent Trades" }), _jsx("button", { onClick: loadDashboardData, className: "text-sm text-blue-400 hover:text-blue-300 transition-colors", children: "\uD83D\uDD04 Refresh" })] }), _jsx("div", { className: "p-6", children: recentTrades.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCCA" }), _jsx("p", { className: "text-gray-400", children: "No trades found" }), _jsx("p", { className: "text-gray-500 text-sm mt-2", children: "Create your first trade to get started!" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "border-b border-gray-700", children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Symbol" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Direction" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Entry Date" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Entry Time" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Quantity" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Entry Price" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Exit Price" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "P&L" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "% Change" }), _jsx("th", { className: "pb-3 text-gray-400 text-sm font-medium", children: "Status" })] }) }), _jsx("tbody", { children: recentTrades.map((trade) => (_jsxs("tr", { className: "border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 transition-colors", children: [_jsx("td", { className: "py-3", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-xs", children: trade.symbol.slice(0, 2) }) }), _jsx("span", { className: "text-white font-medium", children: trade.symbol })] }) }), _jsx("td", { className: "py-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction }) }), _jsx("td", { className: "py-3 text-gray-300", children: formatDate(trade.entryDate) }), _jsx("td", { className: "py-3 text-gray-300 text-sm", children: trade.entryTime || '-' }), _jsx("td", { className: "py-3 text-gray-300 font-medium", children: trade.quantity }), _jsx("td", { className: "py-3 text-gray-300 font-medium", children: formatCurrency(trade.entryPrice) }), _jsx("td", { className: "py-3 text-gray-300 font-medium", children: trade.exitPrice ? formatCurrency(trade.exitPrice) : '-' }), _jsx("td", { className: "py-3", children: _jsx("span", { className: `font-semibold ${(trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: trade.profitLoss !== null && trade.profitLoss !== undefined ? formatCurrency(trade.profitLoss) : '-' }) }), _jsx("td", { className: "py-3", children: _jsx("span", { className: `font-semibold ${(trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: trade.percentChange !== null && trade.percentChange !== undefined ?
                                                                    `${trade.percentChange > 0 ? '+' : ''}${trade.percentChange.toFixed(2)}%` : '-' }) }), _jsx("td", { className: "py-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`, children: trade.status }) })] }, trade.id))) })] }) })) })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Quick Actions" }) }), _jsx("div", { className: "p-6 space-y-4", children: [
                                    { label: 'New Trade', icon: '📝', color: 'blue' },
                                    { label: 'Analytics', icon: '📊', color: 'purple' },
                                    { label: 'Import Data', icon: '📤', color: 'green' },
                                    { label: 'Export Report', icon: '📄', color: 'orange' }
                                ].map((action, index) => (_jsxs("button", { className: `
                w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors
                ${action.color === 'blue' ? 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' :
                                        action.color === 'purple' ? 'border-purple-600 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400' :
                                            action.color === 'green' ? 'border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400' :
                                                'border-orange-600 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400'}
              `, children: [_jsx("span", { className: "text-lg", children: action.icon }), _jsx("span", { className: "font-medium", children: action.label })] }, index))) })] })] }), _jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: _jsx(TradingCalendar, { onDateClick: handleCalendarDateClick }) }), selectedDateTrades && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b border-gray-700", children: [_jsxs("h3", { className: "text-xl font-semibold text-white", children: ["Trades for ", new Date(selectedDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })] }), _jsx("button", { onClick: closeTradeModal, className: "text-gray-400 hover:text-gray-200 text-2xl", children: "\u00D7" })] }), _jsx("div", { className: "p-6 overflow-y-auto max-h-[60vh]", children: selectedDateTrades.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-400", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCC5" }), _jsx("p", { children: "No trades found for this date" })] })) : (_jsx("div", { className: "space-y-4", children: selectedDateTrades.map((trade) => (_jsxs("div", { className: "border border-gray-700 rounded-lg p-4 hover:bg-gray-700/30 transition-colors", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "font-semibold text-lg text-white", children: trade.symbol }), _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.direction === 'Long'
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-red-600 text-white'}`, children: trade.direction }), _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open'
                                                                ? 'bg-orange-600 text-white'
                                                                : 'bg-gray-600 text-white'}`, children: trade.status })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-lg font-bold ${(trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`, children: trade.profitLoss ? formatCurrency(trade.profitLoss) : '$0.00' }), _jsx("div", { className: "text-sm text-gray-400", children: trade.percentChange ? `${trade.percentChange > 0 ? '+' : ''}${trade.percentChange.toFixed(2)}%` : '0%' })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-400", children: "Quantity" }), _jsx("div", { children: trade.quantity?.toLocaleString() })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-400", children: "Entry Price" }), _jsx("div", { children: formatCurrency(trade.entryPrice || 0) })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-400", children: "Exit Price" }), _jsx("div", { children: trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-400", children: "Duration" }), _jsxs("div", { children: [trade.duration || 0, " days"] })] })] })] }, trade.id))) })) })] }) }))] }));
};
const DashboardSelector = ({ currentView, onViewChange }) => {
    console.log("🔥 DASHBOARD SELECTOR IS RENDERING!", currentView);
    return (_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Dashboard View" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Choose your preferred dashboard layout" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => onViewChange('original'), className: `
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'original'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
            `, children: "\uD83D\uDCCA Dashboard" }), _jsx("button", { onClick: () => onViewChange('analytics'), className: `
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'analytics'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
            `, children: "\u26A1 Analytics" }), _jsx("button", { onClick: () => onViewChange('all-trades'), className: `
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'all-trades'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
            `, children: "\uD83D\uDCCB Trades" }), _jsx("button", { onClick: () => onViewChange('import'), className: `
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${currentView === 'import'
                                ? 'bg-orange-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
            `, children: "\uD83D\uDCE4 Import" })] })] }) }));
};
// Main App Component
function App() {
    console.log("🔥 NEW APP COMPONENT IS RUNNING!");
    const [currentView, setCurrentView] = useState('original');
    const handleViewChange = (view) => {
        setCurrentView(view);
    };
    const renderContent = () => {
        console.log("🔥 Current view is:", currentView);
        return (_jsxs("div", { children: [_jsx(DashboardSelector, { currentView: currentView, onViewChange: handleViewChange }), _jsxs("div", { className: "transition-all duration-300", children: [currentView === 'original' && _jsx(OriginalDashboard, {}), currentView === 'analytics' && _jsx(AnalyticsDashboard, {}), currentView === 'enhanced' && _jsx(MetricsDashboard, {}), currentView === 'all-trades' && (_jsx(AllTrades, { onTradeAdd: () => {
                                console.log('Add new trade');
                                // TODO: Navigate to add trade form or open modal
                            }, onTradeEdit: (trade) => {
                                console.log('Edit trade:', trade);
                                // TODO: Handle trade editing
                            }, onTradeDelete: (tradeId) => {
                                console.log('Delete trade:', tradeId);
                                // TODO: Handle trade deletion
                            }, onExport: () => {
                                console.log('Export trades');
                                // TODO: Export trades to CSV/Excel
                            } })), currentView === 'import' && _jsx(ImportTrades, {})] })] }));
    };
    const getTitle = () => {
        return currentView === 'analytics'
            ? 'Trading Analytics Dashboard'
            : currentView === 'enhanced'
                ? 'Enhanced Trading Dashboard'
                : currentView === 'all-trades'
                    ? 'Trade List'
                    : currentView === 'import'
                        ? 'Import Trades'
                        : 'Trading Dashboard';
    };
    const getSubtitle = () => {
        return currentView === 'analytics'
            ? 'Comprehensive performance analysis with advanced metrics'
            : currentView === 'enhanced'
                ? 'Professional metrics with time period analysis'
                : currentView === 'all-trades'
                    ? 'Complete trading history with advanced filtering'
                    : currentView === 'import'
                        ? 'Upload broker statements to automatically import trades'
                        : 'Real-time trading performance';
    };
    return (_jsx(AppShell, { title: getTitle(), subtitle: getSubtitle(), children: renderContent() }));
}
export default App;
