console.log("In ALLTRADES Proper!!!.TSX");

import React, { useState, useEffect } from 'react';
import api from '../api/trades'; // Import your API object
import type { Trade, TradeFilters, TradeStats, Broker } from '../types/Trade'; // Import your types
import TradeDetails from './TradeDetails'; // Import TradeDetails component
import EditTrade from './EditTrade'; // Import EditTrade component

interface AllTradesProps {
  loading?: boolean;
  onTradeEdit: (trade: Trade) => void;
  onTradeDelete: (tradeId: number) => void;
  onTradeAdd: () => void;
  onExport: () => void;
}

// Truncated Assessment Component
const TruncatedAssessment: React.FC<{ assessment: string | null | undefined }> = ({ assessment }) => {
  if (!assessment) return <span className="text-gray-500">—</span>;
  
  const truncated = assessment.length > 50 ? assessment.substring(0, 50) + '...' : assessment;
  
  return (
    <span 
      className="text-gray-300 cursor-help" 
      title={assessment}
    >
      {truncated}
    </span>
  );
};

const AllTrades: React.FC<AllTradesProps> = ({
  loading: externalLoading = false,
  onTradeEdit,
  onTradeDelete,
  onTradeAdd,
  onExport,
}) => {

console.log('🚀 AllTrades component rendered/re-rendered');
  console.log('📊 Props received:', { externalLoading, onTradeEdit: !!onTradeEdit, onTradeDelete: !!onTradeDelete });

  // State management
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // NEW: Trade details navigation state
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  
  // NEW: Edit trade navigation state
  const [editingTradeId, setEditingTradeId] = useState<number | 'new' | null>(null);

  // Filter states - UPDATED
  const [filters, setFilters] = useState<TradeFilters>({
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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trade;
    direction: 'asc' | 'desc';
  }>({ key: 'entryDate', direction: 'desc' });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, trades]);

  

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trades, brokers, and stats in parallel
      const [tradesData, brokersData, statsData] = await Promise.all([
        api.trades.getAll(),
        api.brokers.getAll(),
        api.trades.getStats(),
      ]);

      setTrades(tradesData);
      setBrokers(brokersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load trades data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      // If no filters are applied, use all trades
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== '' && value !== null
      );

      if (!hasFilters) {
        setFilteredTrades(trades);
        return;
      }

      // Use the search API for filtering
      const searchResults = await api.trades.search(filters);
      setFilteredTrades(searchResults);
    } catch (err) {
      console.error('Error applying filters:', err);
      // Fallback to client-side filtering if API fails
      setFilteredTrades(trades);
    }
  };

  const handleSort = (key: keyof Trade) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sortedTrades = [...filteredTrades].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

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

  const handleFilterChange = (filterKey: keyof TradeFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === '' ? undefined : value
    }));
  };

  // NEW: Symbol click handler for trade details navigation
  const handleSymbolClick = (tradeId: number) => {
    console.log('Symbol clicked, trade ID:', tradeId); // Debug log
    setSelectedTradeId(tradeId);
  };

  // NEW: Edit trade handler
  const handleEditTrade = (tradeId: number) => {
    console.log('Edit trade clicked, trade ID:', tradeId);
    setEditingTradeId(tradeId);
  };

  // NEW: Add trade handler
  const handleAddTrade = () => {
    console.log('Add trade clicked');
    setEditingTradeId('new');
  };

  const handleTradeDeleteWithRefresh = async (tradeId: number) => {
    try {
      await api.trades.delete(tradeId);
      // Refresh data after deletion
      await loadInitialData();
      onTradeDelete(tradeId);
    } catch (err) {
      console.error('Error deleting trade:', err);
      alert('Failed to delete trade. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadInitialData();
  };

  const handleSelectAll = () => {
    if (selectedTrades.size === filteredTrades.length) {
      setSelectedTrades(new Set());
    } else {
      setSelectedTrades(new Set(filteredTrades.map(t => t.id)));
    }
  };

  const handleSelectTrade = (tradeId: number) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setSelectedTrades(newSelected);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getSortIcon = (columnKey: keyof Trade) => {
    if (sortConfig.key !== columnKey) return '↕️';
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
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading Trades...</h3>
        <p className="text-gray-400">Fetching your trade data from database</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-800 border border-red-600 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Trades</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Move here to ensure trades are loaded before rendering

// NEW: Conditional rendering for TradeDetails - MUST be after all hooks
  if (selectedTradeId !== null) {
    return (
      <TradeDetails 
        tradeId={selectedTradeId} 
        onBack={() => setSelectedTradeId(null)}
      />
    );
  }

  // NEW: Conditional rendering for EditTrade - MUST be after all hooks
if (editingTradeId !== null) {
  return (
    <EditTrade 
      tradeId={editingTradeId} 
      onBack={() => {
        setEditingTradeId(null);
        loadInitialData();
      }}
      onSave={() => {
        setEditingTradeId(null);
        loadInitialData(); // Refresh the trades list
      }}
    />
  );
}


  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Trades</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredTrades.length} of {trades.length} trades
              {selectedTrades.size > 0 && ` • ${selectedTrades.size} selected`}
              <span className="ml-2 text-blue-400">• Click any symbol to view details & add notes</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
            
            <button
              onClick={handleAddTrade}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + Add Trade
            </button>
            
            <button
              onClick={onExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              📊 Export
            </button>

            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                📋 Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                🎴 Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total P&L</p>
                <p className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(stats.totalPnL)}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-xl font-bold text-white">
                  {((stats.winningTrades / stats.totalTrades) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-xl font-bold text-white">{stats.totalTrades}</p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Open Trades</p>
                <p className="text-xl font-bold text-orange-400">{stats.openTrades}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATED Filters with Collapse/Expand */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            {!filtersExpanded && (
              <span className="text-gray-400 text-sm">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length > 0 && 
                  `${Object.values(filters).filter(v => v !== undefined && v !== '').length} active`
                }
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
            >
              <span>{filtersExpanded ? '▲ Collapse' : '▼ Expand'}</span>
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Collapsible Filters Content */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          filtersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Symbol</label>
                <input
                  type="text"
                  value={filters.symbol || ''}
                  onChange={(e) => handleFilterChange('symbol', e.target.value)}
                  placeholder="e.g., AAPL"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Direction</label>
                <select
                  value={filters.direction || ''}
                  onChange={(e) => handleFilterChange('direction', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Directions</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Broker</label>
                <select
                  value={filters.brokerId || ''}
                  onChange={(e) => handleFilterChange('brokerId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Brokers</option>
                  {brokers.map(broker => (
                    <option key={broker.id} value={broker.id}>{broker.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Has Notes</label>
                <select
                  value={filters.hasNotes === undefined ? '' : filters.hasNotes.toString()}
                  onChange={(e) => handleFilterChange('hasNotes', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Trades</option>
                  <option value="true">With Notes</option>
                  <option value="false">Without Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Has Assessment</label>
                <select
                  value={filters.hasAssessment === undefined ? '' : filters.hasAssessment.toString()}
                  onChange={(e) => handleFilterChange('hasAssessment', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Trades</option>
                  <option value="true">With Assessment</option>
                  <option value="false">Without Assessment</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTrades.length === 0 && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {trades.length === 0 ? 'No trades found' : 'No trades match your filters'}
          </h3>
          <p className="text-gray-400 mb-6">
            {trades.length === 0 
              ? 'Start by adding your first trade to track your trading performance.'
              : 'Try adjusting your filters or clearing them to see more trades.'
            }
          </p>
          {trades.length === 0 ? (
            <button
              onClick={handleAddTrade}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Add Your First Trade
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* UPDATED Table View */}
      {viewMode === 'table' && filteredTrades.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTrades.size === filteredTrades.length && filteredTrades.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {getSortIcon('symbol')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('direction')}
                  >
                    Direction {getSortIcon('direction')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {getSortIcon('quantity')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entryPrice')}
                  >
                    Entry Price {getSortIcon('entryPrice')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('exitPrice')}
                  >
                    Exit Price {getSortIcon('exitPrice')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('pnl')}
                  >
                    P&L {getSortIcon('pnl')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('percentChange')}
                  >
                    % Change {getSortIcon('percentChange')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entryDate')}
                  >
                    Entry Date {getSortIcon('entryDate')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('exitDate')}
                  >
                    Exit Date {getSortIcon('exitDate')}
                  </th>
                  <th 
                    className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('assessment')}
                  >
                    Assessment {getSortIcon('assessment')}
                  </th>
                  <th className="p-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedTrades.has(trade.id)}
                        onChange={() => handleSelectTrade(trade.id)}
                        className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      {/* NEW: Clickable symbol for trade details */}
                      <button
                        onClick={() => handleSymbolClick(trade.id)}
                        className="flex items-center space-x-3 hover:bg-gray-600 rounded p-1 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500">
                          <span className="text-white font-bold text-xs">
                            {trade.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-white font-medium group-hover:text-blue-400">{trade.symbol}</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{trade.quantity}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(trade.entryPrice)}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(trade.exitPrice)}</td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        (trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercentage(trade.percentChange)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{formatDate(trade.entryDate)}</td>
                    <td className="p-4 text-gray-300">
                      {trade.status === 'Open' ? (
                        <span className="text-orange-400 italic">Open</span>
                      ) : (
                        formatDate(trade.exitDate)
                      )}
                    </td>
                    <td className="p-4">
                      <TruncatedAssessment assessment={trade.assessment} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleEditTrade(trade.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPDATED Cards View */}
      {viewMode === 'cards' && filteredTrades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrades.map((trade) => (
            <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* NEW: Clickable symbol in card view */}
                  <button
                    onClick={() => handleSymbolClick(trade.id)}
                    className="flex items-center space-x-3 hover:bg-gray-700 rounded p-2 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500">
                      <span className="text-white font-bold">{trade.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-blue-400">{trade.symbol}</h3>
                      <p className="text-gray-400 text-sm">{formatDate(trade.entryDate)}</p>
                    </div>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTrades.has(trade.id)}
                    onChange={() => handleSelectTrade(trade.id)}
                    className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Direction</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {trade.direction}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {trade.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Quantity</p>
                  <p className="text-white font-medium">{trade.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Entry Price</p>
                  <p className="text-white font-medium">{formatCurrency(trade.entryPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Exit Date</p>
                  <p className="text-white font-medium">
                    {trade.status === 'Open' ? (
                      <span className="text-orange-400 italic">Open</span>
                    ) : (
                      formatDate(trade.exitDate)
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-400 text-sm">P&L</p>
                    <p className={`text-lg font-bold ${
                      (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">% Change</p>
                    <p className={`text-lg font-bold ${
                      (trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercentage(trade.percentChange)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-gray-400 text-sm mb-1">Assessment</p>
                  <TruncatedAssessment assessment={trade.assessment} />
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => handleEditTrade(trade.id)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Edit Trade
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTrades.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">
              {selectedTrades.size} trade{selectedTrades.size > 1 ? 's' : ''} selected
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTrades(new Set())}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                Clear Selection
              </button>
              
              <button
                onClick={() => {
                  // Handle bulk export of selected trades
                  console.log('Export selected trades:', Array.from(selectedTrades));
                  alert(`Export ${selectedTrades.size} selected trades`);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Export Selected
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedTrades.size} selected trades?`)) {
                    // Handle bulk delete
                    Promise.all(
                      Array.from(selectedTrades).map(id => api.trades.delete(id))
                    ).then(() => {
                      setSelectedTrades(new Set());
                      loadInitialData();
                    }).catch(err => {
                      console.error('Error deleting trades:', err);
                      alert('Failed to delete some trades. Please try again.');
                    });
                  }
                }}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTrades;