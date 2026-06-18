# AI Trading Agent — Learning Project

**⚠️ IMPORTANT DISCLAIMER: This is a LEARNING SIMULATION for educational purposes ONLY.**

This project is NOT:
- Financial advice
- A real trading system
- Connected to any brokerage or live markets
- Suitable for actual trading decisions

This is a sandbox for learning about:
- Backtesting fundamentals
- Technical indicators (SMA, EMA, RSI)
- Trading strategy development
- Performance metrics and analysis
- How LLMs could be integrated (optionally)

---

## What It Does

This project implements a complete algorithmic trading backtesting system:

1. **Synthetic Data Generation**: Creates deterministic OHLC (Open, High, Low, Close) market data using a seeded random walk
2. **Technical Indicators**: Implements SMA, EMA, and RSI from scratch with detailed comments
3. **Trading Strategy**: SMA crossover strategy (golden cross = buy, death cross = sell)
4. **Backtesting Engine**: Simulates executing trades, tracks portfolio value, maintains equity curve
5. **Performance Metrics**: Calculates return %, win rate, max drawdown, and compares vs. buy-and-hold
6. **Optional LLM Analyst**: Provides market commentary (LIVE with OpenAI API key, MOCK without)

---

## Installation

```bash
npm install
```

---

## Usage

### Run the Demo (Backtest Simulation)

```bash
npm run demo
```

This runs a complete backtest on 100 days of synthetic data and prints a detailed report.

### Run Tests

```bash
npm test
```

Runs unit tests for indicators and backtesting logic.

---

## Example Output

```
======================================================================
AI TRADING AGENT - BACKTEST SIMULATION
======================================================================

⚠️  DISCLAIMER: This is a learning simulation for educational purposes only.
   NOT financial advice. NOT for real trading. NOT connected to live markets.

📊 Generating synthetic OHLC data...
   Generated 100 days of market data
   Start date: 2024-01-01, End date: 2024-04-09
   Start price: $100.73, End price: $144.07

📈 Running SMA Crossover Strategy...
   Generated 2 BUY signals and 3 SELL signals

💰 Running backtest simulation...
   Initial cash: $10000.00
   Final equity: $12095.20
   Executed 4 transactions (2 round trips)

📊 Performance Metrics:
   Total Return: +20.95% ($+2095.20)
   Number of Trades: 2
   Win Rate: 50.00%
   Max Drawdown: 9.98%

📉 Benchmark Comparison:
   Buy-and-Hold: +42.91% (Final: $14290.66)
   Strategy: +20.95% (Final: $12095.20)
   Strategy UNDERPERFORMED by 21.95%

📝 Sample Trades (first 5):
   Date       | Type | Price    | Shares | Value
   -------------------------------------------------------
   2024-02-05 | BUY  | $ 121.16 |     82 | $  9935.12
   2024-03-16 | SELL | $ 158.84 |     82 | $ 13024.88
   2024-03-17 | BUY  | $ 154.93 |     84 | $ 13014.12
   2024-03-20 | SELL | $ 143.09 |     84 | $ 12019.56

📈 Equity Curve (sample, every 10 days):
   Day | Equity
   --------------------
     1 | $10000.00
    11 | $10000.00
    21 | $10000.00
    31 | $10000.00
    41 | $10858.54
    51 | $12650.24
    61 | $12450.16
    71 | $12770.78
    81 | $12095.20
    91 | $12095.20
   100 | $12095.20

🤖 LLM Market Commentary:
[MODE: MOCK — no API key, using canned responses]
   Market shows strong upward momentum over the recent period. Short-term momentum below long-term trend (bearish positioning). RSI at 53 reflects balanced momentum.

======================================================================
✅ Backtest complete! Remember: This is for learning, not real trading.
======================================================================
```

---

## Enabling Live LLM Commentary

The system runs in **MOCK mode** by default (no API key required).

To enable **LIVE mode** with OpenAI API:

1. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

3. Run the demo again. You'll see `[MODE: LIVE — OpenAI API enabled]`

**Note**: The LLM commentary is purely educational and does NOT affect trading decisions. The core strategy is rule-based.

---

## Project Structure

```
src/
├── data/
│   └── generateOHLC.ts          # Synthetic market data generator
├── indicators/
│   ├── sma.ts                   # Simple Moving Average
│   ├── ema.ts                   # Exponential Moving Average
│   └── rsi.ts                   # Relative Strength Index
├── strategy/
│   └── smaCrossover.ts          # SMA crossover trading strategy
├── backtester/
│   ├── backtester.ts            # Core backtesting engine
│   └── metrics.ts               # Performance metrics calculator
├── llm/
│   └── analyst.ts               # Optional LLM analyst (LIVE/MOCK)
└── demo.ts                      # Main demo script

tests/
├── indicators.test.ts           # Indicator tests
└── backtester.test.ts           # Backtester tests
```

---

## Key Learning Concepts

### Technical Indicators (Built from Scratch)

1. **SMA (Simple Moving Average)**: Arithmetic mean of last N prices. Smooths noise, shows trends.
2. **EMA (Exponential Moving Average)**: Weighted average favoring recent prices. More responsive than SMA.
3. **RSI (Relative Strength Index)**: Momentum oscillator (0-100). >70 = overbought, <30 = oversold.

### Trading Strategy

**SMA Crossover**:
- Fast SMA (10-day) crosses above Slow SMA (30-day) = **BUY** (golden cross)
- Fast SMA crosses below Slow SMA = **SELL** (death cross)
- Otherwise = **HOLD**

Classic trend-following strategy. Works in trending markets, whipsaws in choppy markets.

### Backtesting

Simulates executing trades on historical data:
1. Start with initial cash ($10,000)
2. For each day: calculate indicators → generate signal → execute trade
3. Track cash, position, equity curve
4. Calculate metrics: return, win rate, max drawdown

### Performance Metrics

- **Total Return**: % gain/loss from start to finish
- **Number of Trades**: How many buy/sell pairs
- **Win Rate**: % of profitable trades
- **Max Drawdown**: Largest peak-to-trough decline (risk measure)
- **vs. Buy-and-Hold**: Compare strategy to passive benchmark

---

## Simplifications (For Learning)

These simplifications let us focus on core concepts:

1. **No transaction costs**: Trades are free (unrealistic)
2. **Perfect execution**: Orders fill at close price (no slippage)
3. **No short selling**: Only long positions
4. **All-in sizing**: Use all cash on buy, sell entire position
5. **Single asset**: One stock only
6. **Daily timeframe**: One data point per day
7. **Synthetic data**: Deterministic random walk (no real market data)

Real trading systems would need proper risk management, transaction costs, slippage modeling, position sizing, diversification, and regulatory compliance.

---

## Extending This Project

Ideas for further learning (see `PLAN.md` for details):

- Implement RSI-based strategy or combined indicators
- Add real historical data import (CSV)
- Parameter optimization (grid search for best SMA periods)
- Walk-forward testing (train/test split)
- Risk metrics (Sharpe ratio, Sortino ratio)
- Multiple assets / portfolio allocation
- Transaction costs and slippage modeling
- ASCII visualization of equity curve

---

## Files

- `RESEARCH.md` — Background on concepts, indicators, and approaches
- `PLAN.md` — Implementation plan and stretch goals
- `README.md` — This file
- `.env.example` — Environment variables template
- `.gitignore` — Excludes node_modules, .env, etc.

---

## Resources

- [Investopedia: Technical Indicators](https://www.investopedia.com/terms/t/technicalindicator.asp)
- [SMA vs EMA](https://www.investopedia.com/ask/answers/071414/whats-difference-between-moving-average-and-exponential-moving-average.asp)
- [RSI Explained](https://www.investopedia.com/terms/r/rsi.asp)
- [Backtesting Basics](https://www.investopedia.com/terms/b/backtesting.asp)
- Book: "Algorithmic Trading" by Ernest Chan (for deeper study)

---

## License

MIT — This is a learning project. Use at your own risk. NOT financial advice.
