// backend/src/services/market/YahooFinanceProvider.ts
// Yahoo Finance market data provider using yahoo-finance2 package.
// No API key required. Rate-limited to avoid throttling.
// Uses require() to avoid ESM/CJS interop issues with yahoo-finance2 default export.

import { MarketDataProvider } from './MarketDataProvider';
import { OhlcvBar } from './types';
import { logger } from '../../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const YahooFinanceClass = require('yahoo-finance2').default;

export class YahooFinanceProvider extends MarketDataProvider {
  readonly name = 'Yahoo Finance';
  private yf: any;

  constructor() {
    super();
    // yahoo-finance2 v3+: default export is a class that must be instantiated
    this.yf = new YahooFinanceClass();
  }

  /**
   * Fetch candles from Yahoo Finance.
   * Maps yahoo-finance2 output to our unified OhlcvBar format.
   */
  async fetchCandles(
    symbol: string,
    interval: string,
    range: string
  ): Promise<OhlcvBar[]> {
    const normalizedSymbol = symbol.toUpperCase().trim();

    // Map our interval/range to yahoo-finance2 period1/period2/interval params
    const { period1, period2, yahooInterval } = this.mapIntervalAndRange(interval, range);

    logger.info(
      `YahooFinance: fetching ${normalizedSymbol} interval=${yahooInterval} from ${new Date(period1 * 1000).toISOString()} to ${new Date(period2 * 1000).toISOString()}`
    );

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await this.yf.chart(normalizedSymbol, {
        period1,
        period2,
        interval: yahooInterval as any,
        includePrePost: true, // Extended hours data
      });

      if (!result || !result.quotes || result.quotes.length === 0) {
        throw new Error(`No data returned for symbol "${normalizedSymbol}". It may be invalid or delisted.`);
      }

      // Map quotes to OhlcvBar[]
      const bars: OhlcvBar[] = result.quotes
        .filter((q) =>
          q.open !== null &&
          q.high !== null &&
          q.low !== null &&
          q.close !== null
        )
        .map((q) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000), // Unix seconds
          open: q.open as number,
          high: q.high as number,
          low: q.low as number,
          close: q.close as number,
          volume: (q.volume as number) || 0,
        }));

      logger.info(
        `YahooFinance: got ${bars.length} bars for ${normalizedSymbol} (filtered from ${result.quotes.length} quotes)`
      );

      return bars;
    } catch (error: any) {
      logger.error(`YahooFinance error for ${normalizedSymbol}: ${error.message}`);
      throw new Error(`Failed to fetch data for "${normalizedSymbol}": ${error.message}`);
    }
  }

  /**
   * Map our simplified interval + range to yahoo-finance2 period1/period2/interval.
   */
  private mapIntervalAndRange(interval: string, range: string) {
    const now = Math.floor(Date.now() / 1000);
    let period1: number;
    let period2: number = now;
    let yahooInterval: string;

    // Determine period1 based on range
    switch (range) {
      case '1d':
        period1 = now - 2 * 24 * 60 * 60; // 2 days back to ensure we get enough data
        break;
      case '5d':
        period1 = now - 7 * 24 * 60 * 60; // 7 days back for safety margin
        break;
      case '1mo':
        period1 = now - 35 * 24 * 60 * 60; // ~35 days
        break;
      default:
        period1 = now - 2 * 24 * 60 * 60;
    }

    // Map our interval strings to yahoo-finance2 interval values
    switch (interval) {
      case '1m':
        yahooInterval = '1m';
        break;
      case '2m':
        yahooInterval = '2m';
        break;
      case '5m':
        yahooInterval = '5m';
        break;
      case '15m':
        yahooInterval = '15m';
        break;
      case '30m':
        yahooInterval = '30m';
        break;
      case '60m':
      case '1h':
        yahooInterval = '60m';
        break;
      default:
        yahooInterval = '5m';
    }

    return { period1, period2, yahooInterval };
  }
}