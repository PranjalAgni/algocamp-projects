/**
 * SMA Crossover Trading Strategy
 *
 * This is a classic trend-following strategy based on two moving averages:
 * - Fast SMA (short period, e.g., 20 days): Responds quickly to price changes
 * - Slow SMA (long period, e.g., 50 days): Shows longer-term trend
 *
 * Signals:
 * - GOLDEN CROSS (BUY): Fast SMA crosses above Slow SMA
 *   → Indicates bullish momentum, uptrend beginning
 * - DEATH CROSS (SELL): Fast SMA crosses below Slow SMA
 *   → Indicates bearish momentum, downtrend beginning
 * - HOLD: No crossover detected
 *
 * Learning note: This strategy works well in trending markets but generates
 * false signals in choppy/sideways markets (whipsaws). It's a "lagging"
 * strategy that captures trends after they've started.
 */

import { calculateSMA } from '../indicators/sma.js';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface StrategyResult {
  signals: Signal[];
  fastSMA: (number | undefined)[];
  slowSMA: (number | undefined)[];
}

/**
 * Generate trading signals using SMA crossover strategy
 *
 * @param prices Array of prices (typically closing prices)
 * @param fastPeriod Period for fast SMA (default: 20)
 * @param slowPeriod Period for slow SMA (default: 50)
 * @returns Strategy result with signals and indicator values
 */
export function smaCrossoverStrategy(
  prices: number[],
  fastPeriod: number = 20,
  slowPeriod: number = 50
): StrategyResult {
  if (fastPeriod >= slowPeriod) {
    throw new Error('Fast period must be less than slow period');
  }

  // Calculate both SMAs
  const fastSMA = calculateSMA(prices, fastPeriod);
  const slowSMA = calculateSMA(prices, slowPeriod);

  const signals: Signal[] = [];

  for (let i = 0; i < prices.length; i++) {
    // Need both current and previous values to detect crossover
    if (
      i === 0 ||
      fastSMA[i] === undefined ||
      slowSMA[i] === undefined ||
      fastSMA[i - 1] === undefined ||
      slowSMA[i - 1] === undefined
    ) {
      // Not enough data yet
      signals.push('HOLD');
      continue;
    }

    const currentFast = fastSMA[i]!;
    const currentSlow = slowSMA[i]!;
    const prevFast = fastSMA[i - 1]!;
    const prevSlow = slowSMA[i - 1]!;

    // Detect crossovers
    if (prevFast <= prevSlow && currentFast > currentSlow) {
      // Golden cross: fast crossed above slow
      signals.push('BUY');
    } else if (prevFast >= prevSlow && currentFast < currentSlow) {
      // Death cross: fast crossed below slow
      signals.push('SELL');
    } else {
      // No crossover
      signals.push('HOLD');
    }
  }

  return {
    signals,
    fastSMA,
    slowSMA,
  };
}
