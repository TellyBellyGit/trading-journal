// backend/src/routes/market.ts
// Market data routes - fetches OHLCV chart data from configured provider.
//
// GET /api/market/chart/:symbol?interval=5m&range=1d&entryDate=2026-05-19
//   - interval: '1m' | '5m' | '15m' | '1h' (default: '5m')
//   - range: '1d' | '5d' | '1mo' (default: '1d')
//   - entryDate: ISO date from trade row (for freshness warning)
//
// GET /api/market/symbols - returns unique symbols from user's trades

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { YahooFinanceProvider } from '../services/market/YahooFinanceProvider';
import { ChartResponse, VALID_INTERVALS } from '../services/market/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Initialize the market data provider (swap this line to change providers)
const marketProvider = new YahooFinanceProvider();

// Simple in-memory cache to avoid rate-limiting Yahoo Finance
const cache = new Map<string, { data: ChartResponse; expiry: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

// GET /api/market/chart/:symbol
router.get('/chart/:symbol', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = (req.query.interval as string) || '5m';
    const range = (req.query.range as string) || '1d';
    const entryDate = req.query.entryDate as string | undefined;

    // Validate symbol
    if (!symbol || symbol.trim().length === 0) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Validate interval
    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({
        error: `Invalid interval. Must be one of: ${VALID_INTERVALS.join(', ')}`,
      });
    }

    // Check cache
    const cacheKey = `${symbol.toUpperCase()}:${interval}:${range}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      logger.info(`Market cache HIT for ${cacheKey}`);
      return res.json(cached.data);
    }

    logger.info(`Market request: symbol=${symbol} interval=${interval} range=${range} entryDate=${entryDate || 'none'}`);

    // Fetch from provider
    const bars = await marketProvider.fetchCandles(symbol, interval, range);

    // Calculate freshness info
    const freshness = buildFreshnessInfo(entryDate, bars);

    const response: ChartResponse = {
      symbol: symbol.toUpperCase(),
      interval,
      range,
      bars,
      freshness,
      provider: marketProvider.name,
      timestamp: new Date().toISOString(),
    };

    // Store in cache
    cache.set(cacheKey, { data: response, expiry: Date.now() + CACHE_TTL_MS });

    res.json(response);
  } catch (error: any) {
    logger.error(`Market chart error for ${req.params.symbol}: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch market data',
      details: error.message,
    });
  }
});

// GET /api/market/symbols - returns unique symbols from user's trades for the dropdown
router.get('/symbols', authenticateToken, async (req, res) => {
  try {
    const symbols = await prisma.trade.findMany({
      where: { userId: req.user!.userId },
      select: { symbol: true },
      distinct: ['symbol'],
      orderBy: { symbol: 'asc' },
    });

    res.json({
      symbols: symbols.map((s) => s.symbol),
      count: symbols.length,
    });
  } catch (error: any) {
    logger.error(`Market symbols error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

/**
 * Build freshness warning info.
 * Yahoo Finance intraday data can be delayed up to ~15-20 minutes during market hours,
 * and after-hours data isn't available until the next trading day.
 */
function buildFreshnessInfo(
  entryDate: string | undefined,
  bars: { time: number }[]
): { isDelayed: boolean; message?: string } {
  if (!entryDate) {
    return { isDelayed: false };
  }

  const entryDateStr = entryDate.split('T')[0]; // YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  if (entryDateStr === todayStr) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isDelayed: true,
        message: 'Markets are closed on weekends. Data shown is from the last trading session.',
      };
    }

    // Check if outside market hours (9:30 AM - 4:00 PM ET ≈ 14:30-21:00 UTC)
    const utcHour = now.getUTCHours();
    if (utcHour < 13 || utcHour > 20) {
      return {
        isDelayed: true,
        message: 'Markets are currently closed. Intraday data may reflect the previous trading session.',
      };
    }

    // During market hours, warn about potential 15-20 min delay
    if (bars.length > 0) {
      const lastBarTime = new Date(bars[bars.length - 1].time * 1000);
      const minutesAgo = Math.floor((now.getTime() - lastBarTime.getTime()) / 60_000);
      if (minutesAgo > 10) {
        return {
          isDelayed: true,
          message: `Intraday data may be delayed ~15-20 minutes (last bar ~${minutesAgo} minutes ago).`,
        };
      }
    }
  }

  return { isDelayed: false };
}

export default router;