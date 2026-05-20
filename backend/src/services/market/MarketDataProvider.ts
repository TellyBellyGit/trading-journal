// backend/src/services/market/MarketDataProvider.ts
// Abstract interface for market data providers.
// Swap providers by creating a new class that implements this interface.

import { OhlcvBar } from './types';

export abstract class MarketDataProvider {
  /** Human-readable name for the provider (shown in API responses) */
  abstract readonly name: string;

  /**
   * Fetch candle/OHLCV data for a symbol.
   * @param symbol  Ticker symbol (e.g., 'AAPL', 'TSLA')
   * @param interval Bar interval: '1m', '5m', '15m', '1h'
   * @param range    Date range: '1d', '5d', '1mo'
   * @returns Promise resolving to an array of OhlcvBar objects
   */
  abstract fetchCandles(
    symbol: string,
    interval: string,
    range: string
  ): Promise<OhlcvBar[]>;
}