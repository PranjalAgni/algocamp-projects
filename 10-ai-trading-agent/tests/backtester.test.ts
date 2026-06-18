/**
 * Tests for backtesting engine
 *
 * These tests verify that the backtester:
 * - Correctly executes BUY and SELL signals
 * - Tracks cash and position properly
 * - Calculates equity correctly
 * - Handles edge cases
 */

import { describe, it, expect } from 'vitest';
import { runBacktest, calculateBuyAndHold } from '../src/backtester/backtester.js';
import { calculateMetrics } from '../src/backtester/metrics.js';
import { OHLCData } from '../src/data/generateOHLC.js';
import { Signal } from '../src/strategy/smaCrossover.js';

// Helper to create simple OHLC data
function createSimpleData(closePrices: number[]): OHLCData[] {
  return closePrices.map((close, i) => ({
    date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
    open: close,
    high: close * 1.01,
    low: close * 0.99,
    close,
    volume: 1000000,
  }));
}

describe('Backtester Engine', () => {
  it('should execute a simple buy and sell', () => {
    // Prices: buy at 100, sell at 110
    const data = createSimpleData([100, 100, 110, 110]);
    const signals: Signal[] = ['HOLD', 'BUY', 'HOLD', 'SELL'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);

    // Buy at 100: buy 100 shares for $10,000
    // Sell at 110: sell 100 shares for $11,000
    expect(result.trades.length).toBe(2);
    expect(result.trades[0].type).toBe('BUY');
    expect(result.trades[0].price).toBe(100);
    expect(result.trades[0].shares).toBe(100);

    expect(result.trades[1].type).toBe('SELL');
    expect(result.trades[1].price).toBe(110);
    expect(result.trades[1].shares).toBe(100);

    expect(result.finalCash).toBe(11000);
    expect(result.finalPosition).toBe(0);
    expect(result.finalEquity).toBe(11000);
  });

  it('should not buy if already holding position', () => {
    const data = createSimpleData([100, 100, 100, 100]);
    const signals: Signal[] = ['BUY', 'BUY', 'BUY', 'SELL'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);

    // Should only execute first BUY and final SELL
    expect(result.trades.length).toBe(2);
    expect(result.trades[0].type).toBe('BUY');
    expect(result.trades[1].type).toBe('SELL');
  });

  it('should not sell if no position', () => {
    const data = createSimpleData([100, 100, 100, 100]);
    const signals: Signal[] = ['SELL', 'SELL', 'BUY', 'SELL'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);

    // Should ignore first two SELLs, execute BUY and final SELL
    expect(result.trades.length).toBe(2);
    expect(result.trades[0].type).toBe('BUY');
    expect(result.trades[1].type).toBe('SELL');
  });

  it('should handle holding position at end', () => {
    const data = createSimpleData([100, 110, 120]);
    const signals: Signal[] = ['HOLD', 'BUY', 'HOLD'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);

    // Buy at 110: 90 shares (10000/110 = 90.9, floor to 90)
    expect(result.trades.length).toBe(1);
    expect(result.trades[0].type).toBe('BUY');
    expect(result.trades[0].shares).toBe(90);

    // Still holding 90 shares at end
    expect(result.finalPosition).toBe(90);

    // Final equity = remaining cash + position value
    // Cash spent: 90 * 110 = 9900, remaining = 100
    // Position value: 90 * 120 = 10800
    // Total: 100 + 10800 = 10900
    expect(result.finalCash).toBe(100);
    expect(result.finalEquity).toBe(10900);
  });

  it('should track equity curve correctly', () => {
    const data = createSimpleData([100, 110, 120]);
    const signals: Signal[] = ['BUY', 'HOLD', 'SELL'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);

    expect(result.equityCurve.length).toBe(3);

    // Day 1: Buy 100 shares at 100, cash=0, equity=10000
    expect(result.equityCurve[0]).toBe(10000);

    // Day 2: Hold 100 shares at 110, cash=0, equity=11000
    expect(result.equityCurve[1]).toBe(11000);

    // Day 3: Sell at 120, cash=12000, equity=12000
    expect(result.equityCurve[2]).toBe(12000);
  });

  it('should throw error if data and signals length mismatch', () => {
    const data = createSimpleData([100, 110]);
    const signals: Signal[] = ['BUY'];

    expect(() => runBacktest(data, signals, 10000)).toThrow();
  });
});

describe('Buy and Hold Benchmark', () => {
  it('should calculate buy-and-hold correctly', () => {
    // Buy at 100, hold until 150
    const data = createSimpleData([100, 110, 120, 130, 140, 150]);
    const initialCash = 10000;

    const buyHoldEquity = calculateBuyAndHold(data, initialCash);

    // Buy 100 shares at 100, hold to 150
    // Final value: 100 * 150 = 15000
    expect(buyHoldEquity).toBe(15000);
  });

  it('should handle remaining cash from partial purchase', () => {
    // Initial cash doesn't divide evenly by start price
    const data = createSimpleData([99, 110]);
    const initialCash = 10000;

    const buyHoldEquity = calculateBuyAndHold(data, initialCash);

    // Can buy 101 shares at 99 = 9999, remaining cash = 1
    // Final: 101 * 110 + 1 = 11111
    expect(buyHoldEquity).toBe(11111);
  });
});

describe('Performance Metrics', () => {
  it('should calculate total return correctly', () => {
    const data = createSimpleData([100, 110]);
    const signals: Signal[] = ['BUY', 'SELL'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);
    const metrics = calculateMetrics(result);

    // 10000 -> 11000 = 10% return
    expect(metrics.totalReturn).toBe(10);
    expect(metrics.totalReturnDollar).toBe(1000);
  });

  it('should count number of trades correctly', () => {
    const data = createSimpleData([100, 110, 100, 110, 100]);
    const signals: Signal[] = ['BUY', 'SELL', 'BUY', 'SELL', 'HOLD'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);
    const metrics = calculateMetrics(result);

    // 4 transactions = 2 round-trip trades
    expect(result.trades.length).toBe(4);
    expect(metrics.numTrades).toBe(2);
  });

  it('should calculate win rate correctly', () => {
    const data = createSimpleData([100, 110, 100, 90, 100]);
    const signals: Signal[] = ['BUY', 'SELL', 'BUY', 'SELL', 'HOLD'];
    const initialCash = 10000;

    const result = runBacktest(data, signals, initialCash);
    const metrics = calculateMetrics(result);

    // Trade 1: Buy at 100, sell at 110 = WIN
    // Trade 2: Buy at 100, sell at 90 = LOSS
    // Win rate = 1/2 = 50%
    expect(metrics.winRate).toBe(50);
  });

  it('should calculate max drawdown correctly', () => {
    // Equity curve: 10000 -> 12000 -> 9000 -> 11000
    // Peak at 12000, trough at 9000
    // Drawdown = (12000 - 9000) / 12000 = 25%
    const equityCurve = [10000, 12000, 9000, 11000];
    const result = {
      initialCash: 10000,
      finalCash: 11000,
      finalPosition: 0,
      finalEquity: 11000,
      trades: [],
      equityCurve,
    };

    const metrics = calculateMetrics(result);
    expect(metrics.maxDrawdown).toBe(25);
  });

  it('should handle zero drawdown', () => {
    // Equity only goes up
    const equityCurve = [10000, 11000, 12000, 13000];
    const result = {
      initialCash: 10000,
      finalCash: 13000,
      finalPosition: 0,
      finalEquity: 13000,
      trades: [],
      equityCurve,
    };

    const metrics = calculateMetrics(result);
    expect(metrics.maxDrawdown).toBe(0);
  });
});
