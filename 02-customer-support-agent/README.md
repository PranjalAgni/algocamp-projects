# Customer Support Agent

A learning project demonstrating **tool/function calling** and the **agent loop pattern** in AI applications.

This TypeScript-based customer support agent can:
- Look up order status from a mock database
- Search a FAQ knowledge base for help articles
- Create support tickets for complex issues
- Orchestrate multiple tools to answer questions

The agent demonstrates a complete agentic workflow: user query → tool selection → tool execution → response generation.

## Key Learning Concepts

1. **Tool/Function Calling**: The agent has access to structured tools (functions) and can decide when and how to use them
2. **Agent Loop**: An iterative process where the agent reasons, calls tools, observes results, and continues until it has enough information
3. **Grounding**: Instead of hallucinating answers, the agent retrieves real data from tools
4. **Dual Mode**: Runs with OpenAI API (live) or deterministic keyword matching (mock) for offline learning

## Features

- **3 Tools**:
  - `lookupOrder(orderId)`: Retrieves order details
  - `searchFAQ(query)`: Searches FAQ knowledge base
  - `createTicket(issue, priority)`: Creates support tickets
- **Dual Mode Operation**:
  - **LIVE**: Uses OpenAI GPT-4o-mini for intelligent reasoning (requires `OPENAI_API_KEY`)
  - **MOCK**: Keyword-based planner for offline demo (no API key needed)
- **Agent Loop**: Multi-step reasoning with iteration limits
- **Complete Test Coverage**: Unit tests for tools, integration tests for agent loop

## Installation

```bash
npm install
```

## Usage

### Run Demo (works offline!)

```bash
npm run demo
```

### Run Tests

```bash
npm test
```

### Switch to Live Mode

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key: `OPENAI_API_KEY=sk-...`
3. Run demo: `npm run demo`

The agent will automatically detect the API key and use live mode.

## Project Structure

```
src/
  agent.ts              # Main agent loop orchestrator
  types.ts              # TypeScript type definitions
  tools/                # Tool implementations
    lookupOrder.ts      # Order database lookup
    searchFAQ.ts        # FAQ search with keyword matching
    createTicket.ts     # Support ticket creation
  planner/              # Mode-specific planners
    mockPlanner.ts      # Offline keyword-based planner
    openaiPlanner.ts    # Live OpenAI function calling
  data/                 # Static data files
    orders.json         # 8 fake orders
    faq.json            # 15 FAQ entries
demo.ts                 # Demonstration script
tests/                  # Vitest test suite
  tools.test.ts         # Tool unit tests
  agent.test.ts         # Agent integration tests
```

## Example Output

```
======================================================================
Customer Support Agent Demo
======================================================================

======================================================================
Query 1: "What's the status of order ORD-001?"
======================================================================
[MODE: MOCK — no API key]


[Iteration 1] Tool calls:
  - lookupOrder({"orderId":"ORD-001"})
  - searchFAQ({"query":"What's the status of order ORD-001?"})

[Generating response...]

[Final Answer]
I found order ORD-001 for Alice Johnson.
Status: shipped
Items: CloudStore Pro Plan - 1 year, Premium Support
Total: $599.99
Order date: 2026-06-10
Tracking: TRACK-123456

I couldn't find any relevant help articles for that topic.

[Summary] 1 iteration(s), Mode: mock



======================================================================
Query 2: "What's your refund policy?"
======================================================================
[MODE: MOCK — no API key]


[Iteration 1] Tool calls:
  - searchFAQ({"query":"refund"})

[Generating response...]

[Final Answer]
Here's what I found:

1. What is your refund policy?
We offer a 30-day money-back guarantee on all plans. If you're not satisfied, contact support for a full refund within 30 days of purchase.

[Summary] 1 iteration(s), Mode: mock



======================================================================
Query 3: "I found a bug in the checkout process"
======================================================================
[MODE: MOCK — no API key]


[Iteration 1] Tool calls:
  - createTicket({"issue":"I found a bug in the checkout process","priority":"medium"})
[Ticket Created] ID: TICKET-1781717976590-XPGYGM2M0, Priority: medium, Issue: I found a bug in the checkout process

[Generating response...]

[Final Answer]
I've created a support ticket for you: TICKET-1781717976590-XPGYGM2M0
Our support team will get back to you shortly.

[Summary] 1 iteration(s), Mode: mock



======================================================================
Query 4: "Can you help with order ORD-002 and explain shipping?"
======================================================================
[MODE: MOCK — no API key]


[Iteration 1] Tool calls:
  - lookupOrder({"orderId":"ORD-002"})
  - searchFAQ({"query":"shipping"})

[Generating response...]

[Final Answer]
I found order ORD-002 for Bob Smith.
Status: processing
Items: CloudStore Basic Plan - 1 month
Total: $29.99
Order date: 2026-06-15

Here's what I found:

1. How long does shipping take?
Digital products are delivered instantly. For physical items (if applicable), standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee.

[Summary] 1 iteration(s), Mode: mock

======================================================================
Demo completed!
======================================================================
```

## Test Results

```
 RUN  v1.6.1 /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/02-customer-support-agent

 ✓ tests/tools.test.ts  (10 tests) 28ms
 ✓ tests/agent.test.ts  (5 tests) 11ms

 Test Files  2 passed (2)
      Tests  15 passed (15)
   Start at  23:09:42
   Duration  755ms (transform 148ms, setup 0ms, collect 347ms, tests 39ms, environment 0ms, prepare 321ms)
```

## How It Works

### Agent Loop (Simplified)

```
1. User asks: "What's the status of order ORD-001?"
2. Planner analyzes query → decides to call lookupOrder("ORD-001")
3. Agent executes tool → gets order details
4. Planner sees results → decides it has enough info
5. Agent generates response using the order data
```

### Mock Mode Logic

The mock planner uses keyword matching to select tools:
- Order IDs (ORD-XXX) or "order"/"status" → `lookupOrder`
- "refund", "policy", "shipping", "help" → `searchFAQ`
- "bug", "error", "broken", "problem" → `createTicket`

This is deterministic and demonstrates the agent architecture without requiring an API.

### Live Mode Logic

When `OPENAI_API_KEY` is set:
- Uses OpenAI's function calling feature
- GPT-4o-mini intelligently selects tools based on context
- Generates natural language responses
- Can handle complex multi-turn reasoning

## Technical Details

- **Language**: TypeScript (strict mode)
- **Module System**: ESM
- **Runtime**: Node.js 22.17.0
- **Testing**: Vitest
- **Dependencies**: `openai`, `dotenv`
- **No Database**: Uses JSON files for simplicity

## Limitations (By Design)

This is a learning project, so:
- Single-turn only (no conversation memory)
- Simple keyword matching in mock mode
- Basic FAQ search (no embeddings/vector search)
- No authentication or user context
- Max 5 iterations (prevents infinite loops)

## Future Enhancements (Stretch Goals)

See PLAN.md for ideas:
- Multi-turn conversations with memory
- Vector embeddings for semantic FAQ search
- Streaming responses
- Web UI
- More tools (shipment tracking, order updates)
- Chain-of-thought reasoning traces

## License

MIT
