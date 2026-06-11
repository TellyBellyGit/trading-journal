// frontend/src/utils/emaCalculator.ts
// Exponential Moving Average calculation utilities.
//
// EMA Formula:
//   EMA = (close - prevEMA) * multiplier + prevEMA
//   multiplier = 2 / (period + 1)
//
// The first EMA value is seeded with the SMA of the first 'period' bars.

export interface EmaLine {
  time: number;       // Unix timestamp in seconds
  value: number;      // EMA value
}

/**
 * Calculate Exponential Moving Average from an array of OHLC bars.
 *
 * @param bars      Array of bars sorted ascending by time, each with a 'close' price
 * @param period    EMA period (e.g., 50, 200)
 * @returns         Array of { time, value } for lightweight-charts LineSeries
 */
export function calculateEMA(
  bars: Array<{ time: number; close: number }>,
  period: number
): EmaLine[] {
  if (bars.length === 0 || period <= 0) return [];

  const result: EmaLine[] = [];
  const multiplier = 2 / (period + 1);

  // Seed: first EMA value is the SMA of the first 'period' bars
  if (bars.length < period) {
    // Not enough bars for a proper EMA — use SMA of available bars
    let sum = 0;
    for (let i = 0; i < bars.length; i++) {
      sum += bars[i].close;
    }
    const avg = sum / bars.length;
    for (let i = 0; i < bars.length; i++) {
      result.push({ time: bars[i].time, value: avg });
    }
    return result;
  }

  // Calculate SMA for the seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += bars[i].close;
  }

  let ema = sum / period;
  result.push({ time: bars[period - 1].time, value: ema });

  // Calculate EMA for remaining bars
  for (let i = period; i < bars.length; i++) {
    ema = (bars[i].close - ema) * multiplier + ema;
    result.push({ time: bars[i].time, value: ema });
  }

  return result;
}