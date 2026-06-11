// backend/src/services/market/TwelveDataProvider.ts
// Twelve Data market data provider.
// Free tier: 800 calls/day, 8 calls/min.
// Supports historical intraday data via the "date" parameter.

import { MarketDataProvider } from './MarketDataProvider';
import { OhlcvBar } from './types';
import { logger } from '../../utils/logger';

export class TwelveDataProvider extends MarketDataProvider {
  readonly name = 'Twelve Data';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twelvedata.com';

  constructor() {
    super();
    this.apiKey = process.env.TWELVE_DATA_API_KEY || '';
    if (!this.apiKey) {
      logger.warning('TWELVE_DATA_API_KEY not set in environment. Twelve Data provider will fail.');
    }
  }

  /**
   * Fetch candles from Twelve Data.
   * Uses time_series endpoint with optional "date" parameter for historical intraday.
   */
  async fetchCandles(
    symbol: string,
    interval: string,
    range: string,
    entryDate?: string
  ): Promise<OhlcvBar[]> {
    const normalizedSymbol = symbol.toUpperCase().trim();

    if (!this.apiKey) {
      throw new Error('TWELVE_DATA_API_KEY is not configured');
    }

    // Build URL
    const params = new URLSearchParams({
      symbol: normalizedSymbol,
      apikey: this.apiKey,
      outputsize: '5000',
    });

    const isDaily = interval === '1day';

    if (isDaily) {
      params.set('interval', '1day');
    } else {
      // Map our interval format to Twelve Data format
      const tdInterval = this.mapInterval(interval);
      params.set('interval', tdInterval);
    }

    // If entryDate is provided, use the "date" parameter for historical intraday
    if (entryDate && !isDaily) {
      const dateStr = entryDate.split('T')[0]; // Extract YYYY-MM-DD
      params.set('date', dateStr);
      logger.info(
        `TwelveData: fetching ${normalizedSymbol} interval=${interval} date=${dateStr}`
      );
    } else {
      logger.info(
        `TwelveData: fetching ${normalizedSymbol} interval=${interval} (no date filter)`
      );
    }

    const url = `${this.baseUrl}/time_series?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twelve Data HTTP ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();

      // Check for Twelve Data error
      if (data.status === 'error') {
        throw new Error(`Twelve Data error: ${data.message || 'Unknown error'}`);
      }

      if (data.code && data.message) {
        throw new Error(`Twelve Data error (${data.code}): ${data.message}`);
      }

      const values = data.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new Error(
          `No data returned for "${normalizedSymbol}". The market may have been closed (weekend/holiday) or the date is outside the available range.`
        );
      }

      // Convert to OhlcvBar format
      // Twelve Data returns bars in reverse chronological order (newest first)
      const bars: OhlcvBar[] = values
        .filter(
          (bar: any) =>
            bar.open != null &&
            bar.high != null &&
            bar.low != null &&
            bar.close != null
        )
        .map((bar: any) => ({
          time: Math.floor(new Date(bar.datetime).getTime() / 1000),
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: bar.volume ? parseFloat(bar.volume) : 0,
        }));

      // Sort ascending by time
      bars.sort((a, b) => a.time - b.time);

      logger.info(
        `TwelveData: got ${bars.length} bars for ${normalizedSymbol} (exchange: ${data.meta?.exchange || 'unknown'})`
      );

      return bars;
    } catch (error: any) {
      if (error.message?.startsWith('Twelve Data')) {
        throw error; // Re-throw our own descriptive errors
      }
      logger.error(`TwelveData error for ${normalizedSymbol}: ${error.message}`);
      throw new Error(
        `Failed to fetch data for "${normalizedSymbol}": ${error.message}`
      );
    }
  }

  /**
   * Map our interval strings to Twelve Data interval values.
   */
  private mapInterval(interval: string): string {
    switch (interval) {
      case '1m':
        return '1min';
      case '5m':
        return '5min';
      case '15m':
        return '15min';
      case '30m':
        return '30min';
      case '60m':
      case '1h':
        return '1h';
      case '1day':
        return '1day';
      default:
        return '5min';
    }
  }
}