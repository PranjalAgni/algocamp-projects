/**
 * Tests for the LLM analyst prompt builder.
 *
 * The mock demo never exercises the LIVE path, so this pins the one thing that
 * path can silently get wrong: the SMA period labels in the prompt must match
 * the periods the strategy actually ran. Feeding the model "Fast SMA (20)" when
 * the demo used a 10-period SMA is a factual error the model can't catch.
 */

import { describe, it, expect } from 'vitest';
import { buildLivePrompt } from '../src/llm/analyst.js';

describe('buildLivePrompt', () => {
  it('labels the SMAs with the periods passed in, not hard-coded 20/50', () => {
    const prompt = buildLivePrompt({
      recentPrices: [100, 101, 102],
      currentPrice: 102,
      fastSMA: 101.5,
      slowSMA: 100.8,
      rsi: 55,
      fastPeriod: 10,
      slowPeriod: 30,
    });

    expect(prompt).toContain('Fast SMA (10): $101.50');
    expect(prompt).toContain('Slow SMA (30): $100.80');
    expect(prompt).not.toContain('Fast SMA (20)');
    expect(prompt).not.toContain('Slow SMA (50)');
  });

  it('omits SMA lines entirely when the values are absent', () => {
    const prompt = buildLivePrompt({
      recentPrices: [100, 101, 102],
      currentPrice: 102,
    });

    expect(prompt).not.toContain('Fast SMA');
    expect(prompt).not.toContain('Slow SMA');
    expect(prompt).toContain('Current Price: $102.00');
  });
});
