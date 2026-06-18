/**
 * Synthetic OHLC (Open, High, Low, Close) data generator
 *
 * Creates deterministic market data using a seeded random walk.
 * This ensures reproducible results across runs (same seed = same data).
 *
 * The generated prices simulate:
 * - Upward bias (slight drift)
 * - Volatility (random daily movements)
 * - Realistic OHLC relationships (high >= open,close; low <= open,close)
 */

import seedrandom from 'seedrandom';

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface GenerateOptions {
  days?: number;
  startPrice?: number;
  seed?: string;
  drift?: number;      // Daily drift (upward bias)
  volatility?: number; // Daily volatility
}

/**
 * Generate synthetic OHLC market data
 *
 * @param options Configuration for data generation
 * @returns Array of daily OHLC data points
 */
export function generateOHLC(options: GenerateOptions = {}): OHLCData[] {
  const {
    days = 100,
    startPrice = 100,
    seed = 'trading-sim-2024',
    drift = 0.0005,      // ~0.05% daily upward bias
    volatility = 0.02,   // ~2% daily volatility
  } = options;

  const rng = seedrandom(seed);
  const data: OHLCData[] = [];

  let currentPrice = startPrice;
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < days; i++) {
    // Calculate date
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Open is previous close (or start price for day 0)
    const open = currentPrice;

    // Generate close using random walk with drift
    // Returns are normally distributed (approximated with Box-Muller transform)
    const u1 = rng();
    const u2 = rng();
    const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const dailyReturn = drift + volatility * normalRandom;
    const close = open * (1 + dailyReturn);

    // Generate high and low
    // High is the maximum of open, close, plus some random upward move
    // Low is the minimum of open, close, minus some random downward move
    const range = Math.abs(close - open);
    const highExtra = range * (0.2 + rng() * 0.3); // 20-50% extension
    const lowExtra = range * (0.2 + rng() * 0.3);

    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;

    // Generate volume (random but realistic range)
    const volume = Math.floor(1000000 + rng() * 2000000);

    data.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    // Update current price for next iteration
    currentPrice = close;
  }

  return data;
}

/**
 * Extract closing prices from OHLC data
 * Useful for indicator calculations that only need close prices
 */
export function getClosePrices(data: OHLCData[]): number[] {
  return data.map(d => d.close);
}
