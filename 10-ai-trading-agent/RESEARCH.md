# AI Trading Agent - Research

## Important Disclaimer
**THIS IS A LEARNING SIMULATION FOR EDUCATIONAL PURPOSES ONLY.**

This project is NOT:
- Financial advice
- A real trading system
- Connected to any brokerage or live markets
- Suitable for actual trading decisions

This project IS:
- A learning sandbox for understanding backtesting concepts
- An exploration of technical indicators and trading strategies
- A demonstration of how to evaluate trading decisions systematically
- A safe environment to experiment with algorithmic trading ideas

Never use code like this for real trading without proper risk management, regulatory compliance, and professional financial advice.

---

## Concept Overview

**Algorithmic trading** involves using computer programs to make trading decisions based on predefined rules or models. A **backtesting system** evaluates how a trading strategy would have performed on historical data.

### Key Components

1. **Market Data (OHLC)**: Open, High, Low, Close prices for each time period
2. **Technical Indicators**: Mathematical transformations of price data
3. **Trading Strategy**: Rules that generate buy/sell/hold signals
4. **Backtester**: Simulates executing trades and tracks portfolio performance
5. **Performance Metrics**: Quantify how well the strategy worked

---

## Technical Indicators (Learning Focus)

### 1. Simple Moving Average (SMA)
- **What**: Average price over N periods
- **Why**: Smooths out noise, shows trend direction
- **Formula**: `SMA(n) = sum(prices[-n:]) / n`
- **Use**: Crossovers (short-term crosses above long-term = bullish signal)

### 2. Exponential Moving Average (EMA)
- **What**: Weighted average giving more weight to recent prices
- **Why**: More responsive to recent price changes than SMA
- **Formula**: `EMA(t) = price(t) * k + EMA(t-1) * (1-k)` where `k = 2/(n+1)`
- **Use**: Similar to SMA but reacts faster to trend changes

### 3. Relative Strength Index (RSI)
- **What**: Momentum oscillator (0-100)
- **Why**: Identifies overbought (>70) or oversold (<30) conditions
- **Formula**: `RSI = 100 - (100 / (1 + RS))` where `RS = avg_gain / avg_loss`
- **Use**: Reversal signals (buy when oversold, sell when overbought)

---

## Trading Strategy: SMA Crossover

A classic beginner strategy:
- Calculate SMA(fast) and SMA(slow), e.g., SMA(20) and SMA(50)
- **Buy signal**: Fast crosses above slow (golden cross)
- **Sell signal**: Fast crosses below slow (death cross)
- **Hold**: No crossover occurred

This is trend-following: assumes momentum continues.

---

## Backtesting Loop

```
1. Start with initial cash (e.g., $10,000)
2. For each historical data point:
   a. Calculate indicators
   b. Generate signal (buy/sell/hold)
   c. Execute trade if signal and conditions met
   d. Track current position and cash
3. Calculate final equity (cash + position value)
4. Compute metrics: return %, win rate, max drawdown, etc.
```

**Position sizing**: For simplicity, we'll use "all-in" (buy as much as possible with available cash, sell entire position).

---

## Performance Metrics

- **Total Return %**: `(final_equity - initial_equity) / initial_equity * 100`
- **Number of Trades**: Buy + sell transactions
- **Win Rate**: `winning_trades / total_trades * 100`
- **Max Drawdown**: Largest peak-to-trough decline in equity
- **Comparison**: Strategy vs. "buy and hold" (buy at start, hold until end)

Buy-and-hold is the benchmark. A strategy should ideally beat it (adjusted for risk).

---

## Data Source (Offline)

For this learning project, we'll use **synthetic OHLC data** generated via a seeded random walk:
- Deterministic (same seed = same data every time)
- Realistic price movements (upward bias with volatility)
- No network calls, no API keys required
- Bundled in the codebase

Alternative: Include a small CSV of real historical data (e.g., 100 days of a stock). For v1, synthetic is cleaner.

---

## Optional: LLM as "Analyst"

An interesting extension: use an LLM to provide commentary on market conditions.

**LIVE mode** (OPENAI_API_KEY present):
- Pass recent price data and indicators to GPT
- Ask: "Given this data, what is the trend outlook?"
- Return qualitative commentary (not used for actual trades)

**MOCK mode** (no key):
- Return deterministic canned commentary based on indicator values
- E.g., if RSI > 70: "Market appears overbought"

**Important**: The LLM is NOT making trading decisions. The core strategy is rule-based. The LLM just adds educational context about what a human analyst might observe.

---

## Libraries Considered

- **Technical Indicators**: Built from scratch (learning goal). Libraries like `technicalindicators` exist but we want to understand the math.
- **Data Generation**: Simple TypeScript functions using seeded PRNG (e.g., `seedrandom` package).
- **Charting**: Out of scope for v1. Print ASCII tables or simple text output.
- **LLM**: OpenAI SDK for optional commentary.

---

## Practical Assumptions

1. **No transaction costs**: Trades are free (unrealistic but simplifies learning)
2. **Perfect execution**: Orders fill at closing price (ignores slippage)
3. **No short selling**: Only long positions
4. **All-in position sizing**: Use all cash on buy, sell entire position
5. **Daily timeframe**: Each data point is one day (could extend to intraday)
6. **Single asset**: Trade one stock/asset only

These simplifications let us focus on the backtesting mechanics and indicator logic.

---

## References

- **Technical Analysis**: Investopedia articles on SMA, EMA, RSI
- **Backtesting Concepts**: QuantStart blog, Zipline documentation (Python)
- **TypeScript Financial Libraries**: `technicalindicators` npm package (reference only)
- **Algorithmic Trading Books**: "Algorithmic Trading" by Ernest Chan (for deeper reading)

---

## Next Steps (PLAN.md)

1. Generate synthetic OHLC data
2. Implement indicators (SMA, EMA, RSI) with tests
3. Build SMA crossover strategy
4. Create backtester engine
5. Add performance metrics calculator
6. Optional: LLM analyst with mock fallback
7. Demo script showing full backtest run
