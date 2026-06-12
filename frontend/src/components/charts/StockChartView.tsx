// StockChartView.tsx
// Full-page view for the chart — symbol selector, interval toggle, date picker, chart.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import StockChart from './StockChart';
import { marketApi } from '../../api/market';
import { tradesApi } from '../../api/trades';
import type { OhlcvBar, FreshnessInfo, ChartViewParams, TradeMarker } from '../../types/Market';
import { calculateEMA } from '../../utils/emaCalculator';

interface StockChartViewProps {
  prefill?: ChartViewParams;
  onBack: () => void;
}

const INTERVALS = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
];

const StockChartView: React.FC<StockChartViewProps> = ({ prefill, onBack }) => {
  const [symbol, setSymbol] = useState(prefill?.symbol || '');
  const [interval, setInterval] = useState('1m');
  const [showEma, setShowEma] = useState(true);
  const [entryDate, setEntryDate] = useState(
    prefill?.entryDate ? prefill.entryDate.split('T')[0] : ''
  );
  const [tradeSymbols, setTradeSymbols] = useState<string[]>([]);
  const [bars, setBars] = useState<OhlcvBar[]>([]);
  const [freshness, setFreshness] = useState<FreshnessInfo>({ isDelayed: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [provider, setProvider] = useState('');
  const [daySymbols, setDaySymbols] = useState<string[]>([]);
  const [changeDropdownOpen, setChangeDropdownOpen] = useState(false);
  const changeDropdownRef = useRef<HTMLDivElement>(null);

  // Load trade symbols for dropdown
  useEffect(() => {
    marketApi.getSymbols()
      .then((res) => setTradeSymbols(res.symbols))
      .catch(() => {});
  }, []);

  // Load symbols from the same entry date for "Change" dropdown
  useEffect(() => {
    const loadDaySymbols = async () => {
      const dateToUse = entryDate || prefill?.entryDate?.split('T')[0];
      if (!dateToUse) {
        setDaySymbols([]);
        return;
      }
      try {
        const allTrades = await tradesApi.getAllLegacy();
        console.log(`📋 All trades fetched: ${allTrades.length}`);
        // Filter trades that match the entry date (ignoring time)
        const matchingTrades = allTrades.filter((t: any) => {
          const tradeDate = (t.entryDate || '').split('T')[0];
          return tradeDate === dateToUse;
        });
        console.log(`📋 Matching trades for ${dateToUse}: ${matchingTrades.length}`, matchingTrades);
        const symbols = [...new Set(matchingTrades.map((t: any) => t.symbol).filter(Boolean))] as string[];
        setDaySymbols(symbols);
      } catch (err) {
        console.error('Failed to load day symbols:', err);
        setDaySymbols([]);
      }
    };
    loadDaySymbols();
  }, [entryDate, prefill?.entryDate]);

  // Close Change dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (changeDropdownRef.current && !changeDropdownRef.current.contains(e.target as Node)) {
        setChangeDropdownOpen(false);
      }
    };
    if (changeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [changeDropdownOpen]);

  // Auto-fetch if prefill provided
  useEffect(() => {
    if (prefill?.symbol) {
      fetchChart(prefill.symbol, interval, prefill.entryDate);
    }
  }, []);

  // Compute EMAs from bars (client-side, using close prices)
  const ema50 = useMemo(() => {
    if (!showEma || bars.length === 0) return undefined;
    return calculateEMA(bars, 50);
  }, [bars, showEma]);

  const ema200 = useMemo(() => {
    if (!showEma || bars.length === 0) return undefined;
    return calculateEMA(bars, 200);
  }, [bars, showEma]);

  // Build entry/exit markers from prefill trade data
  const markers: TradeMarker[] = useMemo(() => {
    const result: TradeMarker[] = [];
    if (!prefill) return result;

    // Combine date and time to get a timestamp
    const combineDateTime = (dateStr: string, timeStr?: string): number => {
      if (!timeStr) return Math.floor(new Date(dateStr).getTime() / 1000);
      // Try parsing as "HH:MM" or "HH:MM:SS"
      const datePart = dateStr.split('T')[0];
      return Math.floor(new Date(`${datePart}T${timeStr}`).getTime() / 1000);
    };

    // Entry marker
    if (prefill.entryPrice != null) {
      const entryTs = combineDateTime(prefill.entryDate, prefill.entryTime);
      if (!isNaN(entryTs)) {
        result.push({
          time: entryTs,
          position: 'belowBar',
          color: '#22c55e',  // green-500
          shape: 'arrowUp',
          text: `Entry $${prefill.entryPrice.toFixed(2)}`,
          size: 2,
        });
      }
    }

    // Exit marker
    if (prefill.exitPrice != null && prefill.exitDate && prefill.exitDate !== 'null') {
      const exitTs = combineDateTime(prefill.exitDate, prefill.exitTime || undefined);
      if (!isNaN(exitTs)) {
        result.push({
          time: exitTs,
          position: 'aboveBar',
          color: '#ef4444',  // red-500
          shape: 'arrowDown',
          text: `Exit $${prefill.exitPrice.toFixed(2)}`,
          size: 2,
        });
      }
    }

    return result;
  }, [prefill]);

  const fetchChart = useCallback(async (
    sym: string,
    intv: string,
    entry?: string
  ) => {
    if (!sym.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const range = '5d'; // Fetch 5 days of data with extended hours
      const response = await marketApi.getChart(sym.trim(), intv, range, entry);
      console.log(
        `📊 Chart data: ${response.bars.length} bars for ${sym.trim()} at ${intv}` +
        (entry ? ` (entryDate: ${entry.split('T')[0]})` : '') +
        ` | Provider: ${response.provider}`
      );
      setBars(response.bars);
      setFreshness(response.freshness);
      setProvider(response.provider);
    } catch (err: any) {
      const msg = err?.response?.data?.details || err?.message || 'Failed to fetch chart data';
      setError(msg);
      setBars([]);
      setFreshness({ isDelayed: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChart(symbol, interval, entryDate || undefined);
  };

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    if (symbol.trim()) {
      fetchChart(symbol, newInterval, entryDate || undefined);
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    setChangeDropdownOpen(false);
    fetchChart(newSymbol, interval, entryDate || undefined);
  };

  const handleOpenTradingView = () => {
    const ticker = symbol || prefill?.symbol;
    if (!ticker) return;
    window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h2 className="text-lg font-semibold text-white">
            Stock Chart
            {provider ? <span className="text-gray-400 text-sm ml-2">via {provider}</span> : null}
          </h2>
          {markers.length > 0 && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              🎯 Entry/Exit markers
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700">
        <form onSubmit={handleSymbolSubmit} className="flex flex-wrap items-end gap-4">
          {/* Symbol input */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-400 text-sm mb-1">Symbol</label>
            <div className="flex">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL, TSLA..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                list="trade-symbols"
              />
              <datalist id="trade-symbols">
                {tradeSymbols.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              {/* Change dropdown - always show when there's a date context */}
              {(entryDate || prefill?.entryDate) && (
                <div className="relative" ref={changeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setChangeDropdownOpen(!changeDropdownOpen)}
                    className="px-3 py-2 bg-gray-600 border-y border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-500 transition-colors whitespace-nowrap"
                  >
                    Change ▾
                  </button>
                  {changeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {daySymbols.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                          No other tickers found
                        </div>
                      ) : (
                        daySymbols.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSymbolChange(s)}
                            className={`w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white transition-colors ${
                              s === symbol ? 'bg-blue-600/30 text-blue-300' : ''
                            }`}
                          >
                            {s}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !symbol.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '...' : 'Load'}
              </button>
            </div>
          </div>

          {/* Today's Chart button */}
          <div className="self-end">
            <button
              type="button"
              onClick={handleOpenTradingView}
              disabled={!(symbol || prefill?.symbol)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Open today's chart on TradingView"
            >
              📈 Today's Chart
            </button>
          </div>

          {/* Interval selector */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Interval</label>
            <div className="flex bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
              {INTERVALS.map((intv) => (
                <button
                  key={intv.value}
                  type="button"
                  onClick={() => handleIntervalChange(intv.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    interval === intv.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {intv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry date (for freshness warning) */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Entry Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Chart area */}
      <div className="flex-1 p-6 min-h-0">
        {/* Error state */}
        {error && searched && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Initial state prompt */}
        {!searched && !loading && !prefill && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">📈 Enter a stock symbol</p>
              <p className="text-gray-500 text-sm">
                Type a ticker or select one from your trade history
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {(searched || loading || prefill) && (
          <div className="relative w-full" style={{ height: 'calc(100vh - 300px)', minHeight: '450px' }}>
            <StockChart
              key={symbol || prefill?.symbol || 'chart'}
              bars={bars}
              symbol={symbol || prefill?.symbol || ''}
              interval={interval}
              freshness={freshness}
              loading={loading}
              markers={markers}
              ema50={ema50}
              ema200={ema200}
            />
            {/* EMA toggle overlay */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setShowEma(!showEma)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  showEma
                    ? 'bg-blue-600/60 border-blue-500 text-white'
                    : 'bg-gray-800/80 border-gray-600 text-gray-400 hover:text-gray-200'
                }`}
                title="Toggle EMA 50 / 200 indicators"
              >
                <span style={{ color: showEma ? '#60a5fa' : '#9ca3af' }}>‒‒</span>
                {' EMA'}
                <span className="ml-1 text-[10px] opacity-60">50/200</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChartView;