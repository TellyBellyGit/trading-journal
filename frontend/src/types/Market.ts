// frontend/src/types/Market.ts
// Types for market chart data

export interface OhlcvBar {
  time: number;    // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FreshnessInfo {
  isDelayed: boolean;
  message?: string;
}

export interface TradeMarker {
  time: number;    // Unix timestamp in seconds
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown' | 'square';
  text: string;
  size?: number;
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

export interface SymbolsResponse {
  symbols: string[];
  count: number;
}

export interface ChartViewParams {
  symbol: string;
  entryDate: string;  // ISO date string from trade
  entryTime?: string;
  entryPrice?: number;
  exitDate?: string | null;
  exitTime?: string | null;
  exitPrice?: number | null;
}