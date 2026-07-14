# 10 · AI Trading Agent

A backtester is the one tool that keeps trading honest: it replays a strategy over historical
data and asks "would this rule actually have made money?" This project builds a full backtesting
loop from scratch - synthetic price data, three technical indicators, an SMA-crossover strategy,
a trade simulator, and performance metrics - then bolts an *optional* LLM commentator on the side.
The point to internalize is that **the LLM touches nothing that matters**: the trading decisions
are rule-based and testable, and the model only narrates. That separation is the whole lesson.

> This is a learning simulation. It is not financial advice, not connected to any brokerage or
> live market, and not usable for real trading. The data is a synthetic random walk.

## Run it

```bash
npm install
npm run demo    # backtests 100 days of synthetic data, prints a full report (mock LLM)
npm test        # vitest suite (27 tests, deterministic, offline)
```

No API key needed. Without one the LLM commentary is a deterministic canned string; with one it
switches to `gpt-4o-mini` (see [Live commentary](#live-commentary)). Either way the numbers are
identical - the model never enters the trading path.

## The one idea

A backtest is a loop over days that maintains three pieces of state - `cash`, `position` (shares
held), and the running `equity` curve - and mutates them according to a signal:

```
for each day:
  signal = strategy(prices up to today)   # BUY / SELL / HOLD, rule-based
  if BUY  and flat:  spend all cash on shares
  if SELL and long:  sell the whole position
  record equity = cash + position * close  # mark to market every day
```

That's `runBacktest` in `src/backtester/backtester.ts`, and it's deliberately blunt: all-in
sizing, no fees, no slippage, fills at the close. Those simplifications (listed in full below)
are what let the loop stay ~40 readable lines so the *mechanics* are visible. The strategy that
feeds it (`src/strategy/smaCrossover.ts`) is equally plain: buy when the fast SMA crosses above
the slow one (golden cross), sell when it crosses below (death cross). Crossover detection needs
*yesterday and today* of both averages - comparing only today's values would fire a signal on
every day the fast SMA sits above the slow, not just the day it crosses.

## Indicators, built by hand

All three live in `src/indicators/` with the math spelled out, because implementing them is more
instructive than importing them:

- **SMA** - arithmetic mean of the last N closes. Lagging by construction; smooths noise.
- **EMA** - weights recent prices more (`k = 2/(period+1)`), so it reacts faster than SMA.
- **RSI** - momentum oscillator 0-100 using Wilder's smoothing. `>70` overbought, `<30` oversold.

Each returns `undefined` for the leading days where there isn't enough data yet, rather than
faking a value - a small honesty that matters, because a strategy that reads a fabricated early
SMA would trade on noise.

## Reading the report

The demo's headline result is the honest part: on the default synthetic series the SMA-crossover
strategy returns **+20.95%** while simple buy-and-hold returns **+42.91%**. The strategy
*underperforms the benchmark by ~22 points*. That is not a bug and not tuned away - it's the
lesson. A trend-following strategy sits in cash during the early flat stretch (the equity curve
is a flat $10,000 for the first ~40 days) and only catches part of the move, while buy-and-hold
is fully exposed the whole time. In a steadily rising market, being clever loses to being
invested. The metrics that quantify this:

- **Total Return** - end equity vs. start, in % and dollars.
- **Win Rate** - fraction of round-trip trades that closed green. 50% here (one of two won).
- **Max Drawdown** - largest peak-to-trough drop in the equity curve; the risk you'd have stomached.
- **vs. Buy-and-Hold** - the benchmark every strategy has to beat to justify its complexity.

## The LLM is a passenger, not the driver

`src/llm/analyst.ts` produces one paragraph of market commentary. Read the code and you'll see it
is never consulted by `runBacktest` or `smaCrossoverStrategy` - it runs *after* the backtest, on
the final indicator values, purely to demonstrate how an LLM *could* sit alongside a trading
system (sentiment, trade-explanation audit trails) without being trusted with the decision. Two
things worth knowing:

**Mock commentary is a rule tree, not a model.** With no API key, `getMockCommentary` branches on
the 10-day trend, the fast-vs-slow SMA relationship, and the RSI band to stitch three canned
sentences. It's deterministic and offline by design - but it "understands" nothing; it's the same
"mock proves the shape, not the intelligence" pattern as the earlier projects. The banner
`[MODE: MOCK — no API key, using canned responses]` says so out loud.

**The live prompt must be told the *actual* SMA periods.** The demo runs a 10/30-period crossover,
not the textbook 20/50. The prompt builder (`buildLivePrompt`) therefore takes `fastPeriod` /
`slowPeriod` from the demo and labels the numbers `Fast SMA (10)` / `Slow SMA (30)`. This is a
fixed bug: the prompt used to hard-code `(20)` / `(50)`, so in live mode the model was handed the
right *values* under the wrong *labels* - a silent factual error an LLM can't detect and will
happily reason from. `tests/analyst.test.ts` now pins the labels to the periods passed in. The
lesson generalizes: when you feed structured facts to a model, a mislabeled field is worse than a
missing one, because the model trusts it.

## Simplifications (deliberate, so the loop stays readable)

No transaction costs · perfect fills at the close (no slippage) · long-only (no shorting) ·
all-in sizing · one asset · daily bars · synthetic data. Real systems need fees, slippage,
position sizing, diversification, and risk management - every one of these would add realism at
the cost of obscuring the core loop, so they're left as the extensions below.

## Live commentary

```bash
cp .env.example .env
# set OPENAI_API_KEY=sk-...
npm run demo    # banner flips to [MODE: LIVE — OpenAI API enabled]
```

The strategy, trades, and every metric are byte-for-byte identical to mock mode - only the
commentary paragraph changes. That invariance is the design working: the model is decoration on a
deterministic core.

## Files

```
src/
  data/generateOHLC.ts     seeded random walk → deterministic OHLC bars
  indicators/sma.ts        simple moving average
  indicators/ema.ts        exponential moving average (faster reacting)
  indicators/rsi.ts        Wilder-smoothed momentum oscillator
  strategy/smaCrossover.ts golden/death cross → BUY/SELL/HOLD signals
  backtester/backtester.ts the day loop: cash, position, equity curve
  backtester/metrics.ts    return, win rate, max drawdown, benchmark compare
  llm/analyst.ts           optional commentary (mock rule-tree or gpt-4o-mini)
  demo.ts                  wires it all together and prints the report
tests/
  indicators, backtester, analyst
```

`RESEARCH.md` and `PLAN.md` record the background concepts and stretch goals.

## Where to go next

- **Make the strategy earn its keep.** It loses to buy-and-hold on this rising series. Give it a
  *falling* series instead (set a negative `drift`, e.g. `-0.005`, in `demo.ts`) and the result
  flips: the trend-follower sits in cash through the decline and finishes roughly flat while a
  fully-invested buy-and-hold sinks well into the red, so it wins by *not losing*. Note what does
  **not** help: just cranking up
  `volatility` on a flat/sideways series makes it worse, not better - the extra false crossovers
  whipsaw it into buying high and selling low. Crossovers earn their keep by dodging sustained
  downtrends, not by trading a choppy market more.
- **Add a risk-adjusted metric.** Total return ignores volatility; add a Sharpe ratio to
  `metrics.ts` and see whether the "worse" strategy was actually less risky per unit of return.
- **Swap the signal source.** Build an RSI-based strategy (buy oversold, sell overbought) behind
  the same `Signal[]` contract the backtester consumes, and the loop won't need a single change -
  the same interface-seam idea as project 09's swappable stages.
