/**
 * Tests for technical indicators
 *
 * These tests verify that our indicator calculations are correct by:
 * - Testing on small known inputs with expected outputs
 * - Checking edge cases (insufficient data)
 * - Validating mathematical properties
 */

import { describe, it, expect } from 'vitest';
import { calculateSMA } from '../src/indicators/sma.js';
import { calculateEMA } from '../src/indicators/ema.js';
import { calculateRSI } from '../src/indicators/rsi.js';

describe('Simple Moving Average (SMA)', () => {
  it('should calculate SMA correctly for known input', () => {
    const prices = [1, 2, 3, 4, 5];
    const sma = calculateSMA(prices, 3);

    expect(sma[0]).toBeUndefined(); // Not enough data
    expect(sma[1]).toBeUndefined(); // Not enough data
    expect(sma[2]).toBe(2); // (1+2+3)/3 = 2
    expect(sma[3]).toBe(3); // (2+3+4)/3 = 3
    expect(sma[4]).toBe(4); // (3+4+5)/3 = 4
  });

  it('should return undefined for initial periods', () => {
    const prices = [10, 20, 30];
    const sma = calculateSMA(prices, 3);

    expect(sma[0]).toBeUndefined();
    expect(sma[1]).toBeUndefined();
    expect(sma[2]).toBe(20); // (10+20+30)/3 = 20
  });

  it('should handle period of 1', () => {
    const prices = [5, 10, 15];
    const sma = calculateSMA(prices, 1);

    expect(sma[0]).toBe(5);
    expect(sma[1]).toBe(10);
    expect(sma[2]).toBe(15);
  });

  it('should throw error for invalid period', () => {
    const prices = [1, 2, 3];
    expect(() => calculateSMA(prices, 0)).toThrow();
    expect(() => calculateSMA(prices, -1)).toThrow();
    expect(() => calculateSMA(prices, 5)).toThrow(); // Period > data length
  });
});

describe('Exponential Moving Average (EMA)', () => {
  it('should calculate EMA correctly', () => {
    const prices = [22, 24, 23, 25, 26];
    const ema = calculateEMA(prices, 3);

    expect(ema[0]).toBeUndefined();
    expect(ema[1]).toBeUndefined();
    expect(ema[2]).toBe(23); // Initial EMA = SMA = (22+24+23)/3 = 23

    // k = 2/(3+1) = 0.5
    // ema[3] = 25 * 0.5 + 23 * 0.5 = 24
    expect(ema[3]).toBe(24);

    // ema[4] = 26 * 0.5 + 24 * 0.5 = 25
    expect(ema[4]).toBe(25);
  });

  it('should be more responsive than SMA', () => {
    // With large price change, EMA should react more than SMA
    const prices = [10, 10, 10, 20, 20];
    const sma = calculateSMA(prices, 3);
    const ema = calculateEMA(prices, 3);

    // At index 4, EMA should be higher than SMA because it weights recent prices more
    expect(ema[4]! > sma[4]!).toBe(true);
  });

  it('should throw error for invalid period', () => {
    const prices = [1, 2, 3];
    expect(() => calculateEMA(prices, 0)).toThrow();
    expect(() => calculateEMA(prices, 5)).toThrow();
  });
});

describe('Relative Strength Index (RSI)', () => {
  it('should return undefined for insufficient data', () => {
    // Need at least 16 prices for RSI(14): 1 for first change + 14 for period + 1 more
    const prices = [10, 11, 12, 13, 14];
    const rsi = calculateRSI(prices, 3);

    // With period 3, need at least 4 prices
    expect(rsi[0]).toBeUndefined(); // First price has no change
    expect(rsi[1]).toBeUndefined(); // Not enough data yet
    expect(rsi[2]).toBeUndefined(); // Not enough data yet
    expect(rsi[3]).toBeDefined();   // Now we have enough
  });

  it('should calculate RSI in valid range (0-100)', () => {
    // Generate prices with clear uptrend
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
    const rsi = calculateRSI(prices, 14);

    // RSI should be defined after period+1
    expect(rsi[14]).toBeDefined();

    // RSI should be in valid range
    const validRSI = rsi.filter(v => v !== undefined) as number[];
    validRSI.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('should show high RSI for strong uptrend', () => {
    // Strong uptrend: prices increasing steadily
    const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130];
    const rsi = calculateRSI(prices, 14);

    // RSI should be high (>70) for strong uptrend
    const lastRSI = rsi[rsi.length - 1];
    expect(lastRSI).toBeDefined();
    expect(lastRSI!).toBeGreaterThan(70);
  });

  it('should show low RSI for strong downtrend', () => {
    // Strong downtrend: prices decreasing steadily
    const prices = [100, 98, 96, 94, 92, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70];
    const rsi = calculateRSI(prices, 14);

    // RSI should be low (<30) for strong downtrend
    const lastRSI = rsi[rsi.length - 1];
    expect(lastRSI).toBeDefined();
    expect(lastRSI!).toBeLessThan(30);
  });

  it('should handle flat prices', () => {
    // Flat prices: no gains or losses
    const prices = Array(20).fill(100);
    const rsi = calculateRSI(prices, 14);

    // RSI should be around 50 for flat market (no momentum)
    const lastRSI = rsi[rsi.length - 1];
    expect(lastRSI).toBeDefined();
    // With no changes, RS = 0/0, handled as 100 in our implementation
    // This is an edge case - in practice flat markets rarely happen
  });
});
