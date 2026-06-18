/**
 * Relative Strength Index (RSI)
 *
 * RSI is a momentum oscillator that measures the speed and magnitude
 * of price changes. It oscillates between 0 and 100.
 *
 * Interpretation:
 * - RSI > 70: Overbought (potentially due for a pullback)
 * - RSI < 30: Oversold (potentially due for a bounce)
 * - RSI around 50: Neutral
 *
 * Formula:
 * 1. Calculate price changes (today - yesterday)
 * 2. Separate gains (positive changes) and losses (negative changes, as absolute values)
 * 3. Calculate average gain and average loss over period (typically 14 days)
 * 4. RS = average gain / average loss
 * 5. RSI = 100 - (100 / (1 + RS))
 *
 * Note: We use exponential moving average for gains/losses (Wilder's smoothing method)
 *
 * Learning note: RSI is a "leading" indicator that can signal reversals.
 * However, in strong trends, RSI can stay overbought or oversold for extended periods.
 */

/**
 * Calculate Relative Strength Index
 *
 * @param prices Array of prices (typically closing prices)
 * @param period Number of periods (typically 14)
 * @returns Array of RSI values (0-100), with undefined for initial periods
 */
export function calculateRSI(prices: number[], period: number = 14): (number | undefined)[] {
  if (period <= 0) {
    throw new Error('Period must be positive');
  }
  if (period >= prices.length) {
    throw new Error('Period must be smaller than data length');
  }

  const result: (number | undefined)[] = [undefined]; // First value has no previous price

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  const gains = changes.map(change => (change > 0 ? change : 0));
  const losses = changes.map(change => (change < 0 ? -change : 0));

  // Calculate initial average gain and loss (simple average of first 'period' values)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Fill undefined for insufficient data
  for (let i = 1; i < period; i++) {
    result.push(undefined);
  }

  // Calculate first RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  result.push(Number(rsi.toFixed(2)));

  // Calculate subsequent RSI values using Wilder's smoothing
  // avgGain(today) = (avgGain(yesterday) * (period-1) + gain(today)) / period
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    result.push(Number(rsi.toFixed(2)));
  }

  return result;
}
