/**
 * Exponential Moving Average (EMA)
 *
 * The EMA gives more weight to recent prices, making it more responsive
 * to new information than the Simple Moving Average.
 *
 * Formula:
 * - Smoothing constant: k = 2 / (period + 1)
 * - EMA(today) = price(today) * k + EMA(yesterday) * (1 - k)
 *
 * Initial EMA is typically the SMA of the first N prices.
 *
 * Learning note: Because EMA reacts faster to price changes, crossovers
 * happen sooner than with SMA, providing earlier signals (but potentially
 * more false signals too).
 *
 * Example: For prices [22, 24, 23, 25, 26] with period 3:
 * - EMA(0-1): undefined
 * - EMA(2): SMA of first 3 = (22+24+23)/3 = 23
 * - k = 2/(3+1) = 0.5
 * - EMA(3): 25 * 0.5 + 23 * 0.5 = 24
 * - EMA(4): 26 * 0.5 + 24 * 0.5 = 25
 */

/**
 * Calculate Exponential Moving Average
 *
 * @param prices Array of prices (typically closing prices)
 * @param period Number of periods (e.g., 12 for EMA-12)
 * @returns Array of EMA values, with undefined for initial periods
 */
export function calculateEMA(prices: number[], period: number): (number | undefined)[] {
  if (period <= 0) {
    throw new Error('Period must be positive');
  }
  if (period > prices.length) {
    throw new Error('Period cannot be larger than data length');
  }

  const result: (number | undefined)[] = [];
  const k = 2 / (period + 1); // Smoothing constant

  // Fill initial values with undefined
  for (let i = 0; i < period - 1; i++) {
    result.push(undefined);
  }

  // Calculate initial EMA as SMA of first 'period' prices
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let ema = sum / period;
  result.push(Number(ema.toFixed(2)));

  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    result.push(Number(ema.toFixed(2)));
  }

  return result;
}
