# 02 · Customer Support Agent

Project 01 showed that a model can *ask* to call a function. This project closes the loop:
the agent picks a tool, you run it, the result flows back, and a final answer is generated
from real data instead of a guess. That query → tool → observe → answer cycle is the whole
idea behind an "agent."

The agent has three tools - look up an order, search a FAQ, open a support ticket - backed
by JSON files. It runs live against OpenAI, or offline with a deterministic keyword planner
so you can study the loop without a key.

## Run it

```bash
npm install
npm run demo     # four sample queries through the loop (offline, no key needed)
npm test         # vitest: tool unit tests + agent integration tests
```

The demo prints `[MODE: MOCK — no API key]`. Copy `.env.example` to `.env`, set
`OPENAI_API_KEY`, and the same code path switches to live mode and lets GPT-4o-mini choose
the tools instead of the keyword planner.

## The idea worth taking away

The agent never answers from its own knowledge. Every response is *grounded* in a tool
result:

```
user query → planner picks tool(s) → agent runs them → results fed back → final answer
```

The planner and the executor are deliberately separate. The planner only *decides* which
tools to call (returning name + arguments); `executeTool` in `agent.ts` actually runs them
and captures the result or the error. That split is what lets the same loop drive a dumb
keyword matcher and a real LLM without changing the orchestration - swap the planner, keep
the loop.

## Live vs mock: the honest difference

The loop in `agent.ts` is built to iterate up to `MAX_ITERATIONS` (5): call tools, feed
results back, let the planner decide whether to keep going. In **live mode** the model can
genuinely use that - call a tool, look at the result, then call another.

In **mock mode** the keyword planner returns "done" after the first pass (see the early
return in `mockPlanner.ts`), so it always does exactly one iteration. This is worth
noticing rather than glossing over: the mock demonstrates the *shape* of the loop, not
multi-step reasoning. If you want to see real iteration, you need a live key.

## Files

```
src/
  agent.ts                # the loop: plan → execute → observe → respond
  types.ts                # ToolCall, ToolResult, AgentIteration, AgentResponse
  tools/
    lookupOrder.ts        # order lookup (+ its tool definition)
    searchFAQ.ts          # keyword FAQ search
    createTicket.ts       # ticket creation
  planner/
    mockPlanner.ts        # offline keyword planner (single iteration)
    openaiPlanner.ts      # live OpenAI function-calling planner
  data/
    orders.json           # sample orders
    faq.json              # sample FAQ entries
  demo.ts                 # four sample queries end to end
tests/
  tools.test.ts           # each tool in isolation
  agent.test.ts           # the loop over a full query
```

Note that `agent.ts` colocates each tool's *definition* (the schema handed to the model)
with its *implementation*. Keeping the description the model reads next to the code that
runs is the small habit that keeps tool calling from silently drifting out of sync.

## Where to go next

- Break the mock's single-iteration ceiling: make `mockPlanner` return a second tool call
  based on the first result (e.g. look up an order, then search the FAQ for its product).
  You'll feel exactly why the loop has an iteration limit.
- The FAQ search here is plain keyword matching, so "money back" won't find the "refund"
  article. Project 03 replaces that with embeddings, where meaning - not shared words -
  decides what matches.
