// backend/src/services/market/TwelveDataProvider.ts
// Twelve Data market data provider.
// Free tier: 800 calls/day, 8 calls/min.
// Supports historical intraday data via the "date" parameter.
// When entryDate is provided, fetches previous trading day + trade day
// with prepost=true for accurate EMA warmup (~1,100+ bars).

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
   * When entryDate is provided for intraday, fetches previous trading day + trade day
   * with prepost=true to include extended hours (4AM-8PM EST).
   * This provides ~1,100+ 1min bars for accurate EMA computation.
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

    const isDaily = interval === '1day';
    const tdInterval = this.mapInterval(interval);

    // If entryDate is provided for intraday, fetch 2 days for EMA warmup
    if (entryDate && !isDaily) {
      return this.fetchWithWarmup(normalizedSymbol, tdInterval, entryDate);
    }

    // Single-day fetch (no entryDate, or daily interval)
    return this.fetchDay(normalizedSymbol, tdInterval, entryDate || undefined);
  }

  /**
   * Fetch 2 days in parallel: previous trading day + trade day.
   * Merges, deduplicates by timestamp, and sorts chronologically.
   */
  private async fetchWithWarmup(
    symbol: string,
    interval: string,
    entryDate: string
  ): Promise<OhlcvBar[]> {
    const tradeDate = entryDate.split('T')[0];

    // Try up to 5 previous trading days to find one with data
    // (handles holidays, weekends, and data gaps)
    let prevBars: OhlcvBar[] = [];
    let prevDay = tradeDate;
    let attempts = 0;
    const maxAttempts = 5;

    // Fetch trade day first (always needed)
    const tradeBars = await this.fetchDay(symbol, interval, tradeDate);

    // Accumulate bars from previous days until we have enough (>=200) for EMA 200 warmup
    while (prevBars.length < 200 && attempts < maxAttempts) {
      prevDay = this.getPreviousTradingDay(prevDay);
      attempts++;

      logger.info(
        `TwelveData: warmup attempt ${attempts}/${maxAttempts}: trying prevDay=${prevDay} for ${symbol} (have ${prevBars.length} bars, need 200)`
      );

      try {
        const dayBars = await this.fetchDay(symbol, interval, prevDay);
        if (dayBars.length > 0) {
          // Append bars from this day (deduplicate later during merge)
          prevBars = [...prevBars, ...dayBars];
          logger.info(
            `TwelveData: warmup attempt ${attempts} got ${dayBars.length} bars from ${prevDay}, total prev bars now ${prevBars.length}`
          );
        }
      } catch (err: any) {
        logger.warning(
          `TwelveData: warmup attempt ${attempts} failed for ${prevDay}: ${err.message}`
        );
      }
    }

    if (prevBars.length === 0) {
      logger.warning(
        `TwelveData: no warmup data found in ${attempts} attempts for ${symbol}. Returning trade day only.`
      );
      return tradeBars; // Fall back to single day
    }

    // Merge, deduplicate by timestamp, sort ascending
    const barMap = new Map<number, OhlcvBar>();
    for (const bar of prevBars) barMap.set(bar.time, bar);
    for (const bar of tradeBars) barMap.set(bar.time, bar);

    const merged = Array.from(barMap.values());
    merged.sort((a, b) => a.time - b.time);

    logger.info(
      `TwelveData warmup: ${prevBars.length} prev (${prevDay}) + ${tradeBars.length} trade = ${merged.length} total bars for ${symbol}`
    );

    return merged;
  }

  /**
   * Fetch a single day's worth of candles from Twelve Data.
   */
  private async fetchDay(
    symbol: string,
    interval: string,
    date?: string
  ): Promise<OhlcvBar[]> {
    const params = new URLSearchParams({
      symbol,
      interval,
      apikey: this.apiKey,
      outputsize: '5000',
    });

    if (date) {
      params.set('date', date);
    }

    const url = `${this.baseUrl}/time_series?${params.toString()}`;

    logger.info(`TwelveData: GET ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twelve Data HTTP ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();

    if (data.status === 'error') {
      throw new Error(`Twelve Data error: ${data.message || 'Unknown error'}`);
    }

    if (data.code && data.message) {
      throw new Error(`Twelve Data error (${data.code}): ${data.message}`);
    }

    const values = data.values;
    if (!values || !Array.isArray(values) || values.length === 0) {
      // For previous day, empty is acceptable (market may have been closed/holiday)
      if (date) {
        logger.warning(`TwelveData: no data for ${symbol} on ${date} — may be weekend/holiday`);
      }
      return [];
    }

    const bars: OhlcvBar[] = values
      .filter(
        (bar: any) =>
          bar.open != null &&
          bar.high != null &&
          bar.low != null &&
          bar.close != null
      )
      .map((bar: any) => {
        const rawDatetime: string = bar.datetime;
        const naiveTs = Math.floor(new Date(rawDatetime).getTime() / 1000);
        const correctedTs = this.parseEasternDatetime(rawDatetime);

        return {
          time: correctedTs,
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: bar.volume ? parseFloat(bar.volume) : 0,
          _diag: { rawDatetime, naiveTs, correctedTs },
        };
      });

    // Sort ascending
    bars.sort((a, b) => a.time - b.time);

    // 🔍 DIAGNOSTIC: Log timezone correction summary
    if (bars.length > 0) {
      const first = bars[0] as any;
      const last = bars[bars.length - 1] as any;
      logger.info(
        `TwelveData bars: ${bars.length} total | ` +
        `First: raw="${first._diag.rawDatetime}" naive=${new Date(first._diag.naiveTs * 1000).toISOString()} corrected=${new Date(first._diag.correctedTs * 1000).toISOString()} | ` +
        `Last: raw="${last._diag.rawDatetime}" naive=${new Date(last._diag.naiveTs * 1000).toISOString()} corrected=${new Date(last._diag.correctedTs * 1000).toISOString()}`
      );
      bars.forEach((b: any) => { delete b._diag; });
    }

    return bars;
  }

  /**
   * Parse a Twelve Data datetime string (Eastern timezone, e.g. "2026-06-12 09:30:00")
   * into a UTC Unix timestamp using ISO 8601 offset format.
   * Twelve Data returns datetimes in the exchange timezone but new Date()
   * on a UTC server parses them naively without timezone context.
   * "2026-06-12T09:30:00-04:00" → correctly converts 9:30 AM EDT to 13:30 UTC.
   */
  private parseEasternDatetime(datetimeStr: string): number {
    const [datePart, timePart] = datetimeStr.split(' ');
    const [y, m] = datePart.split('-').map(Number);
    const d = Number(datePart.split('-')[2]);
    const isDst = this.isEasternDaylightTime(y, m - 1, d);
    const offset = isDst ? '-04:00' : '-05:00';
    const isoStr = `${datePart}T${timePart}${offset}`;
    return Math.floor(new Date(isoStr).getTime() / 1000);
  }

  /**
   * Determine if a given date is in US Eastern Daylight Time (EDT).
   * EDT runs from 2nd Sunday in March to 1st Sunday in November.
   */
  private isEasternDaylightTime(year: number, month: number, day: number): boolean {
    if (month < 2) return false;        // Jan-Feb → EST
    if (month > 10) return false;       // Dec → EST
    if (month > 2 && month < 10) return true;  // Apr-Oct → EDT
    if (month === 2) {                   // March
      return day >= this.nthSundayOfMonth(year, 2, 2);
    }
    // month === 10 (November)
    return day < this.nthSundayOfMonth(year, 10, 1);
  }

  /** Find the nth Sunday of a given month (0-indexed month). */
  private nthSundayOfMonth(year: number, month: number, n: number): number {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const daysUntilSunday = (7 - firstDay.getUTCDay()) % 7;
    return 1 + daysUntilSunday + 7 * (n - 1);
  }

  /**
   * Calculate the previous trading day (skip weekends).
   */
  private getPreviousTradingDay(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() - 1);

    // Skip back over weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() - 1);
    }

    return date.toISOString().split('T')[0];
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