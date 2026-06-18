/**
 * Backtesting Engine
 *
 * Simulates executing trades based on strategy signals and tracks performance.
 *
 * The backtester maintains state:
 * - cash: Available money to buy assets
 * - position: Number of shares currently held
 * - equity: Total portfolio value (cash + position value)
 *
 * Trading logic:
 * - BUY: If we have cash and no position, buy as many shares as possible
 * - SELL: If we have a position, sell all shares
 * - HOLD: Do nothing
 *
 * Simplifications (for learning):
 * - No transaction costs (unrealistic but simplifies the math)
 * - Perfect execution at close price (no slippage)
 * - "All-in" position sizing (use all cash, sell entire position)
 * - No short selling (can only be long or flat)
 * - Single asset only
 *
 * Learning note: Real backtesting would need to consider commissions, slippage,
 * market impact, realistic position sizing, and risk management.
 */

import { OHLCData } from '../data/generateOHLC.js';
import { Signal } from '../strategy/smaCrossover.js';

export interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  value: number;
}

export interface BacktestResult {
  initialCash: number;
  finalCash: number;
  finalPosition: number;
  finalEquity: number;
  trades: Trade[];
  equityCurve: number[];
}

/**
 * Run backtest simulation
 *
 * @param data Historical OHLC data
 * @param signals Trading signals for each day
 * @param initialCash Starting cash amount
 * @returns Backtest results with trades and final portfolio state
 */
export function runBacktest(
  data: OHLCData[],
  signals: Signal[],
  initialCash: number = 10000
): BacktestResult {
  if (data.length !== signals.length) {
    throw new Error('Data and signals arrays must have same length');
  }

  let cash = initialCash;
  let position = 0; // Number of shares owned
  const trades: Trade[] = [];
  const equityCurve: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const { date, close } = data[i];
    const signal = signals[i];

    // Execute trade based on signal
    if (signal === 'BUY' && cash > 0 && position === 0) {
      // Buy as many shares as possible
      const shares = Math.floor(cash / close);
      if (shares > 0) {
        const cost = shares * close;
        cash -= cost;
        position += shares;

        trades.push({
          date,
          type: 'BUY',
          price: close,
          shares,
          value: cost,
        });
      }
    } else if (signal === 'SELL' && position > 0) {
      // Sell entire position
      const revenue = position * close;
      cash += revenue;

      trades.push({
        date,
        type: 'SELL',
        price: close,
        shares: position,
        value: revenue,
      });

      position = 0;
    }

    // Calculate current equity (cash + position value)
    const equity = cash + position * close;
    equityCurve.push(Number(equity.toFixed(2)));
  }

  // Calculate final equity (in case we're still holding position)
  const finalPrice = data[data.length - 1].close;
  const finalEquity = cash + position * finalPrice;

  return {
    initialCash,
    finalCash: Number(cash.toFixed(2)),
    finalPosition: position,
    finalEquity: Number(finalEquity.toFixed(2)),
    trades,
    equityCurve,
  };
}

/**
 * Calculate buy-and-hold benchmark
 * Buy at the start, hold until the end
 *
 * @param data Historical OHLC data
 * @param initialCash Starting cash amount
 * @returns Final equity from buy-and-hold strategy
 */
export function calculateBuyAndHold(data: OHLCData[], initialCash: number = 10000): number {
  const startPrice = data[0].close;
  const endPrice = data[data.length - 1].close;

  // Buy as many shares as possible at start
  const shares = Math.floor(initialCash / startPrice);
  const remainingCash = initialCash - shares * startPrice;

  // Final value
  const finalEquity = remainingCash + shares * endPrice;
  return Number(finalEquity.toFixed(2));
}
