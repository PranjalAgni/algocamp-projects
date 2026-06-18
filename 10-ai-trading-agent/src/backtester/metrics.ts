/**
 * Performance Metrics Calculator
 *
 * Calculates various metrics to evaluate trading strategy performance.
 *
 * Key metrics:
 * - Total Return %: How much money did we make/lose?
 * - Number of Trades: How active was the strategy?
 * - Win Rate: What percentage of trades were profitable?
 * - Max Drawdown: What was the largest peak-to-trough decline?
 *
 * Learning note: A good strategy should ideally:
 * - Beat buy-and-hold (adjusted for risk)
 * - Have acceptable drawdown (risk management)
 * - Generate reasonable number of trades (not too many = overtrading)
 * - Have >50% win rate (though high win rate isn't always necessary)
 */

import { BacktestResult, Trade } from './backtester.js';

export interface PerformanceMetrics {
  totalReturn: number;        // %
  totalReturnDollar: number;  // $
  numTrades: number;
  winRate: number;            // %
  maxDrawdown: number;        // %
}

/**
 * Calculate performance metrics from backtest results
 *
 * @param result Backtest result
 * @returns Performance metrics
 */
export function calculateMetrics(result: BacktestResult): PerformanceMetrics {
  const { initialCash, finalEquity, trades, equityCurve } = result;

  // Total return
  const totalReturnDollar = finalEquity - initialCash;
  const totalReturn = (totalReturnDollar / initialCash) * 100;

  // Number of trades (count buy+sell pairs, not individual transactions)
  const numTrades = Math.floor(trades.length / 2);

  // Win rate: percentage of profitable round-trip trades
  const winRate = calculateWinRate(trades);

  // Max drawdown: largest peak-to-trough decline
  const maxDrawdown = calculateMaxDrawdown(equityCurve);

  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    totalReturnDollar: Number(totalReturnDollar.toFixed(2)),
    numTrades,
    winRate,
    maxDrawdown,
  };
}

/**
 * Calculate win rate from trades
 * Pairs BUY and SELL trades, checks if profitable
 */
function calculateWinRate(trades: Trade[]): number {
  if (trades.length < 2) return 0;

  let wins = 0;
  let total = 0;

  // Pair up BUY and SELL trades
  for (let i = 0; i < trades.length - 1; i += 2) {
    if (trades[i].type === 'BUY' && trades[i + 1]?.type === 'SELL') {
      total++;
      const buyValue = trades[i].value;
      const sellValue = trades[i + 1].value;
      if (sellValue > buyValue) {
        wins++;
      }
    }
  }

  if (total === 0) return 0;
  return Number(((wins / total) * 100).toFixed(2));
}

/**
 * Calculate maximum drawdown from equity curve
 * Max drawdown = largest percentage decline from a peak
 *
 * Formula:
 * - Track running maximum (peak)
 * - For each point, calculate drawdown = (peak - current) / peak
 * - Return the maximum drawdown observed
 */
function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0;

  let maxEquity = equityCurve[0];
  let maxDrawdown = 0;

  for (const equity of equityCurve) {
    // Update peak
    if (equity > maxEquity) {
      maxEquity = equity;
    }

    // Calculate drawdown from peak
    const drawdown = ((maxEquity - equity) / maxEquity) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return Number(maxDrawdown.toFixed(2));
}

/**
 * Compare strategy performance to buy-and-hold
 *
 * @param strategyEquity Final equity from strategy
 * @param buyHoldEquity Final equity from buy-and-hold
 * @param initialCash Starting cash
 * @returns Comparison string
 */
export function compareStrategies(
  strategyEquity: number,
  buyHoldEquity: number,
  initialCash: number
): string {
  const strategyReturn = ((strategyEquity - initialCash) / initialCash) * 100;
  const buyHoldReturn = ((buyHoldEquity - initialCash) / initialCash) * 100;
  const difference = strategyReturn - buyHoldReturn;

  if (difference > 0) {
    return `Strategy OUTPERFORMED by ${difference.toFixed(2)}%`;
  } else if (difference < 0) {
    return `Strategy UNDERPERFORMED by ${Math.abs(difference).toFixed(2)}%`;
  } else {
    return 'Strategy MATCHED buy-and-hold';
  }
}
