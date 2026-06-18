# AI Trading Agent — Implementation Plan

## v1 Goals

Build a complete backtesting system that:
1. Generates deterministic synthetic OHLC price data
2. Calculates technical indicators from scratch (SMA, EMA, RSI)
3. Implements a simple SMA crossover strategy
4. Backtests the strategy on historical data
5. Compares strategy performance vs. buy-and-hold
6. Optionally uses an LLM for market commentary (with mock fallback)
7. Runs completely offline with zero API keys

## File Layout

```
10-ai-trading-agent/
├── src/
│   ├── data/
│   │   └── generateOHLC.ts          # Synthetic data generator
│   ├── indicators/
│   │   ├── sma.ts                   # Simple Moving Average
│   │   ├── ema.ts                   # Exponential Moving Average
│   │   └── rsi.ts                   # Relative Strength Index
│   ├── strategy/
│   │   └── smaCrossover.ts          # SMA crossover strategy
│   ├── backtester/
│   │   ├── backtester.ts            # Core backtest engine
│   │   └── metrics.ts               # Performance metrics
│   ├── llm/
│   │   └── analyst.ts               # Optional LLM analyst (LIVE/MOCK)
│   └── demo.ts                      # Main demo script
├── tests/
│   ├── indicators.test.ts           # Test SMA, EMA, RSI
│   └── backtester.test.ts           # Test backtest logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── RESEARCH.md
├── PLAN.md
└── README.md
```

## Implementation Steps

### 1. Project Setup
- Initialize package.json (TypeScript, ESM, tsx, vitest)
- Configure tsconfig.json for ESM
- Add vitest.config.ts
- Create .gitignore

### 2. Data Generation (src/data/generateOHLC.ts)
- Use `seedrandom` for deterministic PRNG
- Generate ~100 days of OHLC data
- Start at $100, simulate random walk with upward bias
- Export typed data structure

### 3. Indicators (src/indicators/)
**SMA (sma.ts)**:
- Input: array of prices, period N
- Output: array of SMA values (undefined for first N-1 points)
- Well-commented with formula

**EMA (ema.ts)**:
- Input: array of prices, period N
- Output: array of EMA values
- Calculate smoothing constant k = 2/(N+1)

**RSI (rsi.ts)**:
- Input: array of prices, period N (typically 14)
- Calculate price changes, separate gains/losses
- Use EMA of gains/losses
- Return RSI values (0-100)

### 4. Strategy (src/strategy/smaCrossover.ts)
- Calculate SMA(20) and SMA(50)
- Detect crossovers: compare previous vs. current
- Return signals: 'BUY', 'SELL', 'HOLD'
- Export array of signals aligned with data

### 5. Backtester (src/backtester/)
**backtester.ts**:
- Input: OHLC data, signals, initial cash
- State: cash, position (shares owned), equity history
- Logic:
  - BUY: if cash > 0 and no position, buy max shares
  - SELL: if position > 0, sell all shares
  - HOLD: do nothing
- Track: trades, equity curve
- Output: final cash, position, trades list

**metrics.ts**:
- Calculate:
  - Total return %
  - Number of trades
  - Win rate (trades that made profit)
  - Max drawdown (peak-to-trough equity decline)
- Also calculate buy-and-hold return for comparison

### 6. LLM Analyst (src/llm/analyst.ts)
- Check for OPENAI_API_KEY in process.env
- LIVE: Call OpenAI API with recent data, get commentary
- MOCK: Return canned commentary based on indicator values
- Print `[MODE: LIVE]` or `[MODE: MOCK — no API key]`
- Export async function `getMarketCommentary(data, indicators)`

### 7. Demo Script (src/demo.ts)
- Generate OHLC data
- Calculate indicators
- Run strategy to get signals
- Run backtester
- Calculate metrics
- (Optional) Get LLM commentary
- Print:
  - Mode banner
  - Data summary (date range, starting price, ending price)
  - Equity curve (sample points)
  - Trades table
  - Metrics comparison (strategy vs. buy-and-hold)
  - LLM commentary (if enabled)

### 8. Tests (tests/)
**indicators.test.ts**:
- Test SMA on small known input: `[1,2,3,4,5]`, period 3 → `[undefined, undefined, 2, 3, 4]`
- Test EMA calculation correctness
- Test RSI on known sequence (check against expected values)

**backtester.test.ts**:
- Mock OHLC data: 10 days, simple prices
- Mock signals: ['HOLD','BUY','HOLD','HOLD','SELL','HOLD',...]
- Assert:
  - After BUY: cash decreases, position increases
  - After SELL: cash increases, position = 0
  - Final equity = expected value

### 9. Documentation
**README.md**:
- What it is (learning project, NOT financial advice)
- How to install: `npm install`
- How to run demo: `npm run demo`
- How to run tests: `npm test`
- How to enable LLM (set OPENAI_API_KEY in .env)
- Example output (paste real output after testing)

**.env.example**:
```
OPENAI_API_KEY=your-key-here-optional
```

## Commands

- `npm install` — install dependencies
- `npm run demo` — run backtest demo (src/demo.ts via tsx)
- `npm test` — run vitest

## Dependencies

- `seedrandom` — deterministic random number generation
- `openai` — OpenAI SDK (optional LLM)
- `dotenv` — load .env file
- `tsx` — run TypeScript directly
- `vitest` — testing
- `typescript` — compiler
- `@types/node` — Node type definitions
- `@types/seedrandom` — seedrandom types

## Validation Checklist

Before completion:
- [ ] `npm install` succeeds
- [ ] `npm run demo` runs and prints full backtest report
- [ ] `npm test` passes all tests
- [ ] Demo works WITHOUT any API key (MOCK mode)
- [ ] README includes real output example
- [ ] All files have clear comments explaining concepts

## Stretch Goals (Not v1)

- Multiple strategies (RSI-based, combined indicators)
- Parameter optimization (grid search for best SMA periods)
- Real historical data loader (CSV import)
- Visualization (ASCII charts or export to CSV for plotting)
- Risk metrics (Sharpe ratio, Sortino ratio)
- Multiple assets / portfolio allocation
- Walk-forward testing (train/test split)
- Commission/slippage modeling
