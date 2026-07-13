/**
 * LLM Market Analyst (Optional)
 *
 * Provides qualitative commentary on market conditions using an LLM.
 *
 * LIVE mode (OPENAI_API_KEY present):
 * - Calls OpenAI API with market data and indicators
 * - Returns AI-generated market analysis
 *
 * MOCK mode (no API key):
 * - Returns deterministic canned commentary based on indicator values
 * - Ensures the system runs completely offline
 *
 * IMPORTANT: The LLM is NOT making trading decisions. The core strategy
 * is rule-based (SMA crossover). This is just educational commentary to
 * demonstrate how an LLM could be integrated into a trading system for
 * qualitative analysis.
 *
 * Learning note: Real trading systems might use LLMs for:
 * - Sentiment analysis of news/social media
 * - Summarizing earnings reports
 * - Generating trade explanations for audit trails
 * But critical trading decisions should remain algorithmic and testable.
 */

import OpenAI from 'openai';

interface MarketData {
  recentPrices: number[];
  currentPrice: number;
  fastSMA?: number;
  slowSMA?: number;
  rsi?: number;
  fastPeriod?: number;
  slowPeriod?: number;
}

let mode: 'LIVE' | 'MOCK' | null = null;
let openai: OpenAI | null = null;

/**
 * Initialize the analyst mode
 */
function initializeMode(): void {
  if (mode !== null) return;

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    mode = 'LIVE';
    openai = new OpenAI({ apiKey });
    console.log('[MODE: LIVE — OpenAI API enabled]');
  } else {
    mode = 'MOCK';
    console.log('[MODE: MOCK — no API key, using canned responses]');
  }
}

/**
 * Get market commentary from LLM or mock
 *
 * @param data Market data with prices and indicators
 * @returns Market analysis commentary
 */
export async function getMarketCommentary(data: MarketData): Promise<string> {
  initializeMode();

  if (mode === 'LIVE' && openai) {
    return getLiveCommentary(data);
  } else {
    return getMockCommentary(data);
  }
}

/**
 * Build the LLM prompt from market data.
 *
 * Exported so tests can assert the SMA period labels match the periods the
 * strategy actually used - feeding the model "Fast SMA (20)" when the demo ran
 * a 10-period SMA would be a silent factual error the model can't detect.
 */
export function buildLivePrompt(data: MarketData): string {
  const { recentPrices, currentPrice, fastSMA, slowSMA, rsi, fastPeriod, slowPeriod } = data;

  return `You are a market analyst reviewing trading data. Provide a brief (2-3 sentences) qualitative assessment of current market conditions.

Current Price: $${currentPrice.toFixed(2)}
Recent Prices (last 10 days): ${recentPrices.slice(-10).map(p => `$${p.toFixed(2)}`).join(', ')}
${fastSMA ? `Fast SMA (${fastPeriod ?? '?'}): $${fastSMA.toFixed(2)}` : ''}
${slowSMA ? `Slow SMA (${slowPeriod ?? '?'}): $${slowSMA.toFixed(2)}` : ''}
${rsi ? `RSI (14): ${rsi.toFixed(2)}` : ''}

Provide a brief market outlook based on this data.`;
}

/**
 * Get commentary from OpenAI API
 */
async function getLiveCommentary(data: MarketData): Promise<string> {
  try {
    const prompt = buildLivePrompt(data);

    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a concise market analyst. Provide brief, professional analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No commentary available.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return 'Error generating live commentary. Falling back to mock mode.';
  }
}

/**
 * Get deterministic mock commentary based on indicators
 */
function getMockCommentary(data: MarketData): string {
  const { currentPrice, recentPrices, fastSMA, slowSMA, rsi } = data;

  // Calculate basic trend
  const priceChange = currentPrice - recentPrices[recentPrices.length - 10];
  const trendPercent = (priceChange / recentPrices[recentPrices.length - 10]) * 100;

  let commentary = '';

  // Price trend
  if (trendPercent > 5) {
    commentary += 'Market shows strong upward momentum over the recent period. ';
  } else if (trendPercent > 0) {
    commentary += 'Market displays modest bullish trend. ';
  } else if (trendPercent > -5) {
    commentary += 'Market shows slight bearish pressure. ';
  } else {
    commentary += 'Market experiencing significant downward movement. ';
  }

  // SMA analysis
  if (fastSMA && slowSMA) {
    if (fastSMA > slowSMA) {
      commentary += 'Short-term momentum remains above long-term trend (bullish positioning). ';
    } else {
      commentary += 'Short-term momentum below long-term trend (bearish positioning). ';
    }
  }

  // RSI analysis
  if (rsi !== undefined) {
    if (rsi > 70) {
      commentary += `RSI at ${rsi.toFixed(0)} indicates overbought conditions - potential reversal risk.`;
    } else if (rsi < 30) {
      commentary += `RSI at ${rsi.toFixed(0)} suggests oversold levels - possible bounce opportunity.`;
    } else {
      commentary += `RSI at ${rsi.toFixed(0)} reflects balanced momentum.`;
    }
  }

  return commentary.trim();
}

/**
 * Get current mode (for testing/debugging)
 */
export function getMode(): 'LIVE' | 'MOCK' | null {
  return mode;
}
