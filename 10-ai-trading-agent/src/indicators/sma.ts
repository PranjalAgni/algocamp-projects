/**
 * Simple Moving Average (SMA)
 *
 * The SMA is the arithmetic mean of the last N prices.
 * It smooths out short-term price fluctuations and highlights longer-term trends.
 *
 * Formula: SMA(n) = (P1 + P2 + ... + Pn) / n
 * where P1...Pn are the last n prices
 *
 * Example: For prices [1, 2, 3, 4, 5] with period 3:
 * - Index 0-1: undefined (not enough data)
 * - Index 2: (1+2+3)/3 = 2
 * - Index 3: (2+3+4)/3 = 3
 * - Index 4: (3+4+5)/3 = 4
 *
 * Learning note: SMA is a "lagging" indicator because it's based on past prices.
 * A crossover of two SMAs (short period crossing above long period) is a common
 * bullish signal.
 */

/**
 * Calculate Simple Moving Average
 *
 * @param prices Array of prices (typically closing prices)
 * @param period Number of periods to average (e.g., 20 for SMA-20)
 * @returns Array of SMA values, with undefined for initial periods where not enough data
 */
export function calculateSMA(prices: number[], period: number): (number | undefined)[] {
  if (period <= 0) {
    throw new Error('Period must be positive');
  }
  if (period > prices.length) {
    throw new Error('Period cannot be larger than data length');
  }

  const result: (number | undefined)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      // Not enough data yet
      result.push(undefined);
    } else {
      // Calculate average of last 'period' prices
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      const sma = sum / period;
      result.push(Number(sma.toFixed(2)));
    }
  }

  return result;
}
