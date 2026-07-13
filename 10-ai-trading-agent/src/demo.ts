/**
 * AI Trading Agent Demo
 *
 * Demonstrates a complete backtesting workflow:
 * 1. Generate synthetic market data
 * 2. Calculate technical indicators
 * 3. Generate trading signals from strategy
 * 4. Run backtest simulation
 * 5. Calculate and compare performance metrics
 * 6. (Optional) Get LLM market commentary
 *
 * This is a LEARNING SIMULATION - NOT for real trading!
 */

import 'dotenv/config';
import { generateOHLC, getClosePrices } from './data/generateOHLC.js';
import { calculateRSI } from './indicators/rsi.js';
import { smaCrossoverStrategy } from './strategy/smaCrossover.js';
import { runBacktest, calculateBuyAndHold } from './backtester/backtester.js';
import { calculateMetrics, compareStrategies } from './backtester/metrics.js';
import { getMarketCommentary } from './llm/analyst.js';

console.log('='.repeat(70));
console.log('AI TRADING AGENT - BACKTEST SIMULATION');
console.log('='.repeat(70));
console.log();
console.log('⚠️  DISCLAIMER: This is a learning simulation for educational purposes only.');
console.log('   NOT financial advice. NOT for real trading. NOT connected to live markets.');
console.log();

async function main() {
  // 1. Generate synthetic market data
  console.log('📊 Generating synthetic OHLC data...');
  const data = generateOHLC({
    days: 100,
    startPrice: 100,
    seed: 'trading-sim-2024',
    drift: 0.0003,      // Reduced drift
    volatility: 0.03,   // Increased volatility for more crossovers
  });
  const prices = getClosePrices(data);

  console.log(`   Generated ${data.length} days of market data`);
  console.log(`   Start date: ${data[0].date}, End date: ${data[data.length - 1].date}`);
  console.log(`   Start price: $${data[0].close}, End price: $${data[data.length - 1].close}`);
  console.log();

  // 2. Calculate indicators and generate signals
  console.log('📈 Running SMA Crossover Strategy...');
  // Using shorter periods (10, 30) for more active trading in demo
  const FAST_PERIOD = 10;
  const SLOW_PERIOD = 30;
  const strategyResult = smaCrossoverStrategy(prices, FAST_PERIOD, SLOW_PERIOD);
  const { signals, fastSMA, slowSMA } = strategyResult;

  // Calculate RSI for additional context
  const rsi = calculateRSI(prices, 14);

  // Count signals
  const buySignals = signals.filter(s => s === 'BUY').length;
  const sellSignals = signals.filter(s => s === 'SELL').length;
  console.log(`   Generated ${buySignals} BUY signals and ${sellSignals} SELL signals`);
  console.log();

  // 3. Run backtest
  console.log('💰 Running backtest simulation...');
  const initialCash = 10000;
  const result = runBacktest(data, signals, initialCash);

  console.log(`   Initial cash: $${result.initialCash.toFixed(2)}`);
  console.log(`   Final equity: $${result.finalEquity.toFixed(2)}`);
  console.log(`   Executed ${result.trades.length} transactions (${result.trades.length / 2} round trips)`);
  console.log();

  // 4. Calculate metrics
  console.log('📊 Performance Metrics:');
  const metrics = calculateMetrics(result);

  console.log(`   Total Return: ${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}% ($${metrics.totalReturnDollar >= 0 ? '+' : ''}${metrics.totalReturnDollar.toFixed(2)})`);
  console.log(`   Number of Trades: ${metrics.numTrades}`);
  console.log(`   Win Rate: ${metrics.winRate.toFixed(2)}%`);
  console.log(`   Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%`);
  console.log();

  // 5. Compare to buy-and-hold
  console.log('📉 Benchmark Comparison:');
  const buyHoldEquity = calculateBuyAndHold(data, initialCash);
  const buyHoldReturn = ((buyHoldEquity - initialCash) / initialCash) * 100;

  console.log(`   Buy-and-Hold: ${buyHoldReturn >= 0 ? '+' : ''}${buyHoldReturn.toFixed(2)}% (Final: $${buyHoldEquity.toFixed(2)})`);
  console.log(`   Strategy: ${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}% (Final: $${result.finalEquity.toFixed(2)})`);
  console.log(`   ${compareStrategies(result.finalEquity, buyHoldEquity, initialCash)}`);
  console.log();

  // 6. Show sample trades
  if (result.trades.length > 0) {
    console.log('📝 Sample Trades (first 5):');
    console.log('   Date       | Type | Price    | Shares | Value');
    console.log('   ' + '-'.repeat(55));
    result.trades.slice(0, 5).forEach(trade => {
      console.log(
        `   ${trade.date} | ${trade.type.padEnd(4)} | $${trade.price.toFixed(2).padStart(7)} | ${trade.shares.toString().padStart(6)} | $${trade.value.toFixed(2).padStart(9)}`
      );
    });
    if (result.trades.length > 5) {
      console.log(`   ... and ${result.trades.length - 5} more trades`);
    }
    console.log();
  }

  // 7. Show equity curve sample
  console.log('📈 Equity Curve (sample, every 10 days):');
  console.log('   Day | Equity');
  console.log('   ' + '-'.repeat(20));
  for (let i = 0; i < result.equityCurve.length; i += 10) {
    console.log(`   ${(i + 1).toString().padStart(3)} | $${result.equityCurve[i].toFixed(2)}`);
  }
  // Always show final
  const lastIdx = result.equityCurve.length - 1;
  console.log(`   ${(lastIdx + 1).toString().padStart(3)} | $${result.equityCurve[lastIdx].toFixed(2)}`);
  console.log();

  // 8. Get LLM market commentary (optional)
  console.log('🤖 LLM Market Commentary:');
  const commentary = await getMarketCommentary({
    recentPrices: prices,
    currentPrice: prices[prices.length - 1],
    fastSMA: fastSMA[fastSMA.length - 1],
    slowSMA: slowSMA[slowSMA.length - 1],
    rsi: rsi[rsi.length - 1],
    fastPeriod: FAST_PERIOD,
    slowPeriod: SLOW_PERIOD,
  });
  console.log(`   ${commentary}`);
  console.log();

  console.log('='.repeat(70));
  console.log('✅ Backtest complete! Remember: This is for learning, not real trading.');
  console.log('='.repeat(70));
}

main().catch(error => {
  console.error('Error running demo:', error);
  process.exit(1);
});
