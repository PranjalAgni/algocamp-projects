# Customer Support Agent — Plan

## v1 Scope

Build a TypeScript-based customer support agent that demonstrates tool calling and agent loop patterns.

### Core Features
1. **Three tools**:
   - `lookupOrder(orderId)`: Returns order details from orders.json
   - `searchFAQ(query)`: Searches FAQs with simple string matching
   - `createTicket(issue)`: Creates a support ticket (logs to console/returns ticket ID)

2. **Dual-mode operation**:
   - **LIVE mode**: Uses OpenAI API with gpt-4o-mini for real AI reasoning
   - **MOCK mode**: Keyword-based planner selects tools deterministically
   - Banner on startup: `[MODE: LIVE]` or `[MODE: MOCK — no API key]`

3. **Agent loop**:
   - Parse user query
   - LLM/planner decides which tools to call
   - Execute tools and collect results
   - Feed results back to LLM/planner
   - Generate final response
   - Max 5 iterations to prevent loops

4. **Demo script** (`npm run demo`):
   - Query 1: "What's the status of order ORD-001?"
   - Query 2: "What's your refund policy?"
   - Query 3: "I found a bug in the checkout process"
   - Query 4: "Can you help with order ORD-002 and explain shipping?"
   - Prints tool calls + final answers

5. **Tests** (vitest):
   - Tool correctness: lookupOrder finds valid/invalid orders
   - Tool correctness: searchFAQ returns relevant results
   - Tool correctness: createTicket generates ticket ID
   - Integration: Mock agent resolves order query by calling lookupOrder
   - All pass offline

## File Layout

```
02-customer-support-agent/
├── RESEARCH.md              # ✅ Concepts, approaches, libraries
├── PLAN.md                  # ✅ This file
├── README.md                # Usage, setup, example output
├── package.json             # Dependencies, scripts
├── tsconfig.json            # TypeScript config (ESM, strict)
├── vitest.config.ts         # Test configuration
├── .env.example             # OPENAI_API_KEY=your_key_here
├── .gitignore               # node_modules, .env, dist
│
├── src/
│   ├── types.ts             # Shared TypeScript types
│   ├── agent.ts             # Main agent loop
│   │
│   ├── tools/
│   │   ├── lookupOrder.ts   # Order lookup implementation
│   │   ├── searchFAQ.ts     # FAQ search implementation
│   │   └── createTicket.ts  # Ticket creation implementation
│   │
│   ├── planner/
│   │   ├── openaiPlanner.ts # Live mode with OpenAI function calling
│   │   └── mockPlanner.ts   # Offline keyword-based planner
│   │
│   └── data/
│       ├── orders.json      # 8-10 fake orders
│       └── faq.json         # 12-15 common Q&As
│
├── demo.ts                  # Demonstration script
└── tests/
    ├── tools.test.ts        # Unit tests for tools
    └── agent.test.ts        # Integration test for agent
```

## Demo/Test Commands

```bash
npm install              # Install dependencies
npm run demo             # Run demonstration queries
npm test                 # Run all tests with vitest
```

## Technical Decisions

### TypeScript Configuration
- **Module system**: ESM (`"type": "module"` in package.json)
- **Strict mode**: Enabled for learning best practices
- **Target**: ES2022 (modern Node.js 22)

### Tool Schema Format
Following OpenAI function calling schema:
```typescript
{
  name: "lookupOrder",
  description: "Look up order details by order ID",
  parameters: {
    type: "object",
    properties: {
      orderId: { type: "string", description: "The order ID (e.g., ORD-001)" }
    },
    required: ["orderId"]
  }
}
```

### Mock Planner Logic
```typescript
// Keyword-based tool selection
if (query.match(/order|status|ORD-\d+/i)) → lookupOrder
if (query.match(/refund|policy|shipping|return|faq|help/i)) → searchFAQ
if (query.match(/bug|issue|problem|broken|error/i)) → createTicket
// Can call multiple tools in one pass
```

### Error Handling
- Invalid tool calls: Log error, return error message to agent
- Missing order: Return "Order not found" message
- Empty FAQ results: Return "No matching articles found"
- Iteration limit: Warn and return best-effort response

## Success Criteria

1. ✅ `npm run demo` works offline (mock mode) with zero setup
2. ✅ `npm test` passes offline with zero setup
3. ✅ `OPENAI_API_KEY=sk-... npm run demo` works in live mode
4. ✅ Agent demonstrates tool calling loop (not just direct tool execution)
5. ✅ Code is well-commented for learning purposes
6. ✅ README includes pasted passing output

## Stretch Goals (NOT v1)

Document but don't implement:
- [ ] Multi-turn conversations with memory
- [ ] Vector embeddings for semantic FAQ search (@xenova/transformers)
- [ ] Streaming responses
- [ ] Real database (SQLite)
- [ ] Web UI (Express + simple HTML)
- [ ] More tools: track_shipment, update_order, cancel_order
- [ ] Chain-of-thought reasoning traces
- [ ] Sentiment analysis for ticket prioritization
