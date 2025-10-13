// AllTrades component with enhanced date filtering

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/trades'; // Import your API object
import type { Trade, TradeFilters, TradeStats, Broker } from '../types/Trade'; // Import your types
import type { PaginationInfo, DateContext } from '../api/trades'; // Import pagination type
import TradeDetails from './TradeDetails'; // Import TradeDetails component
import EditTrade from './EditTrade'; // Import EditTrade component
import Pagination from './Pagination'; // Import Pagination component
import { formatSimpleDate } from '../utils/formatters';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useSettings } from '../contexts/SettingsContext';

interface AllTradesProps {
  loading?: boolean;
  onTradeEdit: (trade: Trade) => void;
  onTradeDelete: (tradeId: number) => void;
  onTradeAdd: () => void;
  onExport: () => void;
}

// Truncated Assessment Component
const TruncatedAssessment: React.FC<{ assessment: string | null | undefined }> = ({ assessment }) => {
  if (!assessment || assessment.trim() === '') {
    return <span className="text-gray-500">-</span>;
  }
  
  const truncated = assessment.length > 40 ? assessment.substring(0, 40) + '...' : assessment;
  
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
  const { dateFormat } = useDateFormat();
  const { formatTradeTime } = useSettings();

// Debug logging (can be removed in production)
  // console.log('🚀 AllTrades component rendered/re-rendered');

  // State management
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [dateContext, setDateContext] = useState<DateContext | undefined>(undefined);
  const [itemsPerPage] = useState(20);
  
  // NEW: Trade details navigation state
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  
  // NEW: Edit trade navigation state
  const [editingTradeId, setEditingTradeId] = useState<number | 'new' | null>(null);

  // Ref for top pagination to scroll to
  const topPaginationRef = useRef<HTMLDivElement>(null);

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

  // Apply filters when they change (reset to page 1)
  useEffect(() => {
    applyFilters(1);
  }, [filters]);

  // Listen for add trade event from AppShell button
  useEffect(() => {
    const handleAddTradeEvent = () => {
      handleAddTrade();
    };

    window.addEventListener('triggerAddTrade', handleAddTradeEvent);
    
    return () => {
      window.removeEventListener('triggerAddTrade', handleAddTradeEvent);
    };
  }, []);

  // Auto-scroll to top pagination when component first mounts (only once)
  const hasInitiallyScrolled = useRef(false);
  
  useEffect(() => {
    if (!hasInitiallyScrolled.current) {
      const scrollToTopPagination = () => {
        if (topPaginationRef.current) {
          topPaginationRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          hasInitiallyScrolled.current = true;
        }
      };

      // Wait for pagination to be available and component to be fully rendered
      const timeoutId = setTimeout(() => {
        if (topPaginationRef.current) {
          scrollToTopPagination();
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array - only runs once on mount

  

  const loadInitialData = async (page: number = 1, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    try {
      setLoading(true);
      setError(null);

      // Use current sort config if no sort parameters provided
      const finalSortBy = sortBy || sortConfig.key;
      const finalSortOrder = sortOrder || sortConfig.direction;

      // Load trades with pagination, sorting, brokers, and stats in parallel
      const [tradesResponse, brokersData, statsData] = await Promise.all([
        api.trades.getAll(undefined, page, itemsPerPage, finalSortBy, finalSortOrder),
        api.brokers.getAll(),
        api.trades.getStats(),
      ]);

      setTrades(tradesResponse.trades);
      setPagination(tradesResponse.pagination);
      setDateContext(tradesResponse.dateContext);
      setCurrentPage(page);
      setBrokers(brokersData);
      setStats(statsData);
      
      // Set filtered trades to current page trades initially
      setFilteredTrades(tradesResponse.trades);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load trades data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (page: number = 1) => {
    try {
      // If no filters are applied, load paginated trades normally
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== '' && value !== null
      );

      if (!hasFilters) {
        // Load normal paginated data with current sorting
        const tradesResponse = await api.trades.getAll(undefined, page, itemsPerPage, sortConfig.key, sortConfig.direction);
        setTrades(tradesResponse.trades);
        setFilteredTrades(tradesResponse.trades);
        setPagination(tradesResponse.pagination);
        setDateContext(undefined); // Clear date context when no filters
        setCurrentPage(page);
        return;
      }

      // Use the search API for filtering with pagination and sorting
      const searchResponse = await api.trades.search(filters, page, itemsPerPage, sortConfig.key, sortConfig.direction);
      setTrades(searchResponse.trades);
      setFilteredTrades(searchResponse.trades);
      setPagination(searchResponse.pagination);
      setDateContext(searchResponse.dateContext);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Failed to apply filters. Please try again.');
    }
  };

  const handleSort = async (key: keyof Trade) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    // Server-side sorting: reload data with new sort parameters
    try {
      setLoading(true);
      
      // Check if we have active filters
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== '' && value !== null
      );

      if (hasFilters) {
        // Use search API with new sort order
        const searchResponse = await api.trades.search(filters, currentPage, itemsPerPage, key, direction);
        setTrades(searchResponse.trades);
        setFilteredTrades(searchResponse.trades);
        setPagination(searchResponse.pagination);
        setDateContext(searchResponse.dateContext);
      } else {
        // Use regular API with new sort order
        const tradesResponse = await api.trades.getAll(undefined, currentPage, itemsPerPage, key, direction);
        setTrades(tradesResponse.trades);
        setFilteredTrades(tradesResponse.trades);
        setPagination(tradesResponse.pagination);
        setDateContext(tradesResponse.dateContext);
      }
      
      // Scroll to top after successful sort
      setTimeout(() => {
        if (topPaginationRef.current) {
          topPaginationRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 200); // Increased delay for reliability
      
    } catch (err) {
      console.error('Error sorting trades:', err);
      setError('Failed to sort trades. Please try again.');
    } finally {
      setLoading(false);
    }
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
      // Refresh data after deletion - stay on current page if possible
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== '' && value !== null
      );
      
      if (hasFilters) {
        await applyFilters(currentPage);
      } else {
        await loadInitialData(currentPage);
      }
      
      onTradeDelete(tradeId);
    } catch (err) {
      console.error('Error deleting trade:', err);
      alert('Failed to delete trade. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadInitialData(currentPage);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    // Check if we have active filters
    const hasFilters = Object.values(filters).some(value => 
      value !== undefined && value !== '' && value !== null
    );
    
    const loadData = async () => {
      if (hasFilters) {
        await applyFilters(page);
      } else {
        await loadInitialData(page);
      }
      
      // Scroll back to top pagination after new data loads
      setTimeout(() => {
        if (topPaginationRef.current) {
          topPaginationRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    };
    
    loadData();
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
      //minimumFractionDigits: 2
      minimumFractionDigits: 0,    // Don't force decimals
      maximumFractionDigits: 4     // Allow up to 4 decimals
    }).format(value);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
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

  // NEW: Conditional rendering for TradeDetails - MUST be after all hooks
  if (selectedTradeId !== null) {
    return (
      <TradeDetails 
        tradeId={selectedTradeId} 
        onBack={() => {
          setSelectedTradeId(null);
          // Refresh data - respect current filters if any
          const hasFilters = Object.values(filters).some(value => 
            value !== undefined && value !== '' && value !== null
          );
          if (hasFilters) {
            applyFilters(currentPage);
          } else {
            loadInitialData(currentPage);
          }
          
          // Trigger autoscroll when returning from TradeDetails
          setTimeout(() => {
            if (topPaginationRef.current) {
              topPaginationRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 100);
        }}
      />
    );
  }

  // NOTE: EditTrade renders as a modal overlay near the end of JSX
  // NOTE: EditTrade will render as a modal overlay (see JSX at bottom)

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
            {dateContext?.isDateFiltered && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md">
                  📅 Date Filtered
                </span>
                <span className="text-xs text-gray-500">
                  Starting from {new Date(filters.fromDate!).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} • Sorted oldest first
                </span>
              </div>
            )}
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

      {/* Top Pagination */}
      {pagination && filteredTrades.length > 0 && (
        <div ref={topPaginationRef}>
          <Pagination 
            pagination={pagination} 
            dateContext={dateContext}
            onPageChange={handlePageChange} 
          />
        </div>
      )}

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

      {/* UPDATED Table View with Entry Time and Exit Time columns */}
      {viewMode === 'table' && filteredTrades.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTrades.size === filteredTrades.length && filteredTrades.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {getSortIcon('symbol')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('direction')}
                  >
                    Direction {getSortIcon('direction')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {getSortIcon('quantity')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entryPrice')}
                  >
                    Entry Price {getSortIcon('entryPrice')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('exitPrice')}
                  >
                    Exit Price {getSortIcon('exitPrice')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('pnl')}
                  >
                    P&L {getSortIcon('pnl')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('percentChange')}
                  >
                    % Change {getSortIcon('percentChange')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entryDate')}
                  >
                    Entry Date {getSortIcon('entryDate')}
                  </th>
                  {/* NEW: Entry Time column */}
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('entryTime')}
                  >
                    Entry Time {getSortIcon('entryTime')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('exitDate')}
                  >
                    Exit Date {getSortIcon('exitDate')}
                  </th>
                  {/* NEW: Exit Time column */}
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('exitTime')}
                  >
                    Exit Time {getSortIcon('exitTime')}
                  </th>
                  <th 
                    className="p-2 text-left text-gray-300 font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('assessment')}
                  >
                    Assessment {getSortIcon('assessment')}
                  </th>
                  <th className="p-2 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedTrades.has(trade.id)}
                        onChange={() => handleSelectTrade(trade.id)}
                        className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-2">
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
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="p-2 text-gray-300">{trade.quantity}</td>
                    <td className="p-2 text-gray-300">{formatCurrency(trade.entryPrice)}</td>
                    <td className="p-2 text-gray-300">{formatCurrency(trade.exitPrice)}</td>
                    <td className="p-2">
                      <span className={`font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`font-medium ${
                        (trade.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercentage(trade.percentChange)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="p-2 text-gray-300">{formatSimpleDate(trade.entryDate, dateFormat)}</td>
                    {/* NEW: Entry Time column */}
                    <td className="p-2 text-gray-300">{formatTradeTime(trade.entryTime, trade.entryDate)}</td>
                    <td className="p-2 text-gray-300">
                      {trade.status === 'Open' ? (
                        <span className="text-orange-400 italic">Open</span>
                      ) : (
                        formatSimpleDate(trade.exitDate, dateFormat)
                      )}
                    </td>
                    {/* NEW: Exit Time column */}
                    <td className="p-2 text-gray-300">
                      {trade.status === 'Open' ? (
                        <span className="text-orange-400 italic">—</span>
                      ) : (
                        formatTradeTime(trade.exitTime, trade.exitDate)
                      )}
                    </td>
                    <td className="p-2">
                      <TruncatedAssessment assessment={trade.assessment} />
                    </td>
                    <td className="p-2">
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

      {/* UPDATED Cards View - also includes entry/exit times */}
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
                      <p className="text-gray-400 text-sm">{formatSimpleDate(trade.entryDate, dateFormat)}</p>
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
                {/* NEW: Entry Time in cards */}
                <div>
                  <p className="text-gray-400 text-sm">Entry Time</p>
                  <p className="text-white font-medium">{formatTradeTime(trade.entryTime, trade.entryDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Exit Date</p>
                  <p className="text-white font-medium">
                    {trade.status === 'Open' ? (
                      <span className="text-orange-400 italic">Open</span>
                    ) : (
                      formatSimpleDate(trade.exitDate, dateFormat)
                    )}
                  </p>
                </div>
                {/* NEW: Exit Time in cards */}
                <div>
                  <p className="text-gray-400 text-sm">Exit Time</p>
                  <p className="text-white font-medium">
                    {trade.status === 'Open' ? (
                      <span className="text-orange-400 italic">—</span>
                    ) : (
                      formatTradeTime(trade.exitTime, trade.exitDate)
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

      {/* Bottom Pagination */}
      {pagination && filteredTrades.length > 0 && (
        <Pagination 
          pagination={pagination} 
          dateContext={dateContext}
          onPageChange={handlePageChange} 
          className="mt-6"
        />
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
                      // Refresh current page after bulk deletion
                      const hasFilters = Object.values(filters).some(value => 
                        value !== undefined && value !== '' && value !== null
                      );
                      if (hasFilters) {
                        applyFilters(currentPage);
                      } else {
                        loadInitialData(currentPage);
                      }
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

      {/* Edit Trade Modal Overlay */}
      {editingTradeId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => {
                setEditingTradeId(null);
                loadInitialData();
              }}
              className="absolute top-3 right-3 px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
              aria-label="Close"
            >
              ✕
            </button>

            {/* EditTrade form inside modal */}
            <EditTrade
              tradeId={editingTradeId}
              onBack={() => {
                setEditingTradeId(null);
                loadInitialData();
              }}
              onSave={() => {
                setEditingTradeId(null);
                loadInitialData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTrades;