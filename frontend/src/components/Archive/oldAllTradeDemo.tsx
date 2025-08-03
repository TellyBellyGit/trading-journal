import React, { useState, useMemo } from 'react';

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

interface Trade {
  id: number;
  symbol: string;
  side: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  status: 'Open' | 'Closed';
  pnl: number;
}

const AllTradesDemo: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof Trade>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // 🔥 ADDING BACK: Complex filter object - THIS MIGHT BE THE CULPRIT
  const [filters, setFilters] = useState({
    symbol: '',
    side: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minPnL: '',
    maxPnL: ''
  });

  // Filter and sort trades with complex filtering
  const filteredAndSortedTrades = useMemo(() => {
    console.log('Complex filtering and sorting...');
    console.log('Current filters:', filters);
    
    // Step 1: Complex filtering - 🔥 THIS IS THE SUSPECT
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
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
      
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
  }, [filters, sortField, sortDirection]); // 🔥 CRITICAL: filters object as dependency

  // Stats calculation
  const stats = useMemo(() => {
    console.log('Calculating stats...');
    const total = filteredAndSortedTrades.length;
    const open = filteredAndSortedTrades.filter(t => t.status === 'Open').length;
    const closed = filteredAndSortedTrades.filter(t => t.status === 'Closed').length;
    const totalPnL = filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = filteredAndSortedTrades.filter(t => t.pnl > 0).length;
    const winRate = total > 0 ? (winningTrades / total) * 100 : 0;
    
    return { total, open, closed, totalPnL, winRate };
  }, [filteredAndSortedTrades]);

  const handleSort = (field: keyof Trade) => {
    console.log('Sorting by:', field);
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 🔥 ADDING BACK: Reset filters function
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">All Trades (+ Complex Filters)</h2>
            <p className="text-gray-400">
              Showing {filteredAndSortedTrades.length} of {sampleTrades.length} trades
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                📊 Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                📋 Cards
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🔍 Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Trades</p>
          <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Open</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.open}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Closed</p>
          <p className="text-2xl font-bold text-gray-300">{stats.closed}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total P&L</p>
          <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.totalPnL)}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-2xl font-bold text-purple-400">{stats.winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* 🔥 ADDING BACK: Complex Filter Panel */}
      {showFilters && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <button
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Symbol</label>
              <input
                type="text"
                value={filters.symbol}
                onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="e.g., AAPL"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Side</label>
              <select
                value={filters.side}
                onChange={(e) => setFilters(prev => ({ ...prev, side: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Min P&L</label>
              <input
                type="number"
                value={filters.minPnL}
                onChange={(e) => setFilters(prev => ({ ...prev, minPnL: e.target.value }))}
                placeholder="0"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Max P&L</label>
              <input
                type="number"
                value={filters.maxPnL}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPnL: e.target.value }))}
                placeholder="10000"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  {[
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'side', label: 'Side' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'entryPrice', label: 'Entry Price' },
                    { key: 'exitPrice', label: 'Exit Price' },
                    { key: 'entryDate', label: 'Entry Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'pnl', label: 'P&L' }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort(key as keyof Trade)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{label}</span>
                        {sortField === key && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{trade.symbol.slice(0, 2)}</span>
                        </div>
                        <span className="font-medium text-white">{trade.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.side === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{trade.quantity}</td>
                    <td className="px-4 py-3 text-gray-300">${trade.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(trade.entryDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTrades.map((trade) => (
            <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{trade.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{trade.symbol}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    trade.side === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.side}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white">{trade.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry:</span>
                  <span className="text-white">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={trade.status === 'Open' ? 'text-yellow-400' : 'text-gray-300'}>
                    {trade.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <span className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(trade.pnl)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
        <p className="text-orange-400 font-semibold">🔧 Testing: Complex Filters Added</p>
        <p className="text-gray-300 text-sm mt-1">
          Try typing in the filter fields. If this hangs when typing, we found the culprit!
          Watch console for excessive "Complex filtering..." logs.
        </p>
      </div>
    </div>
  );
};

export default AllTradesDemo;