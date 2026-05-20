// backend/src/services/market/types.ts
// Shared types for market data providers

export interface OhlcvBar {
  time: number;    // Unix timestamp in seconds (lightweight-charts format)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartRequest {
  symbol: string;
  interval: string;   // '1m' | '5m' | '15m' | '1h'
  range: string;      // '1d' | '5d' | '1mo'
  entryDate?: string; // ISO date string from trade (for freshness check)
}

export interface FreshnessInfo {
  isDelayed: boolean;
  message?: string;
}

export interface ChartResponse {
  symbol: string;
  interval: string;
  range: string;
  bars: OhlcvBar[];
  freshness: FreshnessInfo;
  provider: string;
  timestamp: string;
}

// Mapping from Yahoo Finance interval/range to yahoo-finance2 params
export const VALID_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '1h'];
export const DEFAULT_INTERVAL = '5m';
export const DEFAULT_RANGE = '1d';