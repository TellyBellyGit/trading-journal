import React from 'react';
import type { Trade } from '../types/Trade';
import { formatTradeDate } from '../utils/formatters';

export interface RecentTradesProps {
  trades: Trade[];
  loading?: boolean;
  maxTrades?: number;
  onViewAll?: () => void;
  onTradeClick?: (trade: Trade) => void;
}

const RecentTrades: React.FC<RecentTradesProps> = ({
  trades,
  loading = false,
  maxTrades = 5,
  onViewAll,
  onTradeClick
}) => {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };


  const getTradeStatus = (trade: Trade): { label: string; color: string; bgColor: string } => {
    if (trade.pnl === null || trade.pnl === undefined) {
      return { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    } else if (trade.pnl > 0) {
      return { label: 'Profit', color: 'text-green-700', bgColor: 'bg-green-100' };
    } else if (trade.pnl < 0) {
      return { label: 'Loss', color: 'text-red-700', bgColor: 'bg-red-100' };
    } else {
      return { label: 'Break Even', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    }
  };

  const getProfitLossDisplay = (trade: Trade) => {
    if (trade.pnl === null || trade.pnl === undefined) {
      return { value: '-', color: 'text-gray-400' };
    }
    
    const color = trade.pnl >= 0 ? 'text-green-600' : 'text-red-600';
    const value = formatCurrency(trade.pnl);
    return { value, color };
  };

  const recentTrades = trades.slice(0, maxTrades);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
          <p className="text-sm text-gray-500">
            {trades.length === 0 ? 'No trades yet' : `${trades.length} total trades`}
          </p>
        </div>
        {onViewAll && trades.length > 0 && (
          <button 
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center"
          >
            View All
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Content */}
      {trades.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 text-lg mb-2">No trades recorded yet</p>
          <p className="text-gray-400 text-sm">Start by adding your first trade</p>
        </div>
      ) : (
        <div className="space-y-1">
          {recentTrades.map((trade, index) => {
            const status = getTradeStatus(trade);
            const pnl = getProfitLossDisplay(trade);
            const isClickable = !!onTradeClick;
            
            return (
              <div
                key={trade.id}
                onClick={() => onTradeClick?.(trade)}
                className={`
                  flex items-center justify-between py-4 px-3 rounded-lg border border-transparent
                  transition-all duration-200
                  ${isClickable ? 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer' : ''}
                  ${index !== recentTrades.length - 1 ? 'border-b border-gray-100' : ''}
                `}
              >
                {/* Left Side - Symbol and Direction */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {trade.symbol.slice(0, 2)}
                      </span>
                    </div>
                    {/* Direction indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      trade.direction === 'Long' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white font-bold">
                        {trade.direction === 'Long' ? '↗' : '↘'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{trade.symbol}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatTradeDate(trade.entryDate)}
                    </p>
                  </div>
                </div>

                {/* Right Side - P/L and Details */}
                <div className="text-right">
                  <div className={`font-semibold ${pnl.color}`}>
                    {pnl.value}
                  </div>
                  {trade.percentChange !== null && trade.percentChange !== undefined && (
                    <div className={`text-sm ${pnl.color}`}>
                      {trade.percentChange >= 0 ? '+' : ''}{trade.percentChange.toFixed(2)}%
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {trade.quantity} shares
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer - Show more indicator */}
      {trades.length > maxTrades && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button 
            onClick={onViewAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            +{trades.length - maxTrades} more trades
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTrades;