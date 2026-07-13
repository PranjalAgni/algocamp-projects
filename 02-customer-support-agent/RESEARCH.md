# Customer Support Agent — Research

## What is a Customer Support Agent?

A customer support agent is an AI system that can autonomously handle customer inquiries by:
1. Understanding the customer's intent
2. Calling appropriate tools/functions to retrieve data (orders, FAQs, etc.)
3. Using the retrieved information to formulate helpful responses
4. Escalating to human support when necessary (creating tickets)

This demonstrates a **tool-calling agent loop** — a core pattern in modern AI applications.

## Key Concepts

### 1. Tool/Function Calling
- The LLM is given a set of available tools with descriptions and JSON schemas
- The LLM outputs structured tool call requests (function name + arguments)
- The application executes the tool and feeds the result back to the LLM
- The LLM continues reasoning with the new information

### 2. Agent Loop
A typical agent loop:
```
User Input → LLM (decides tools) → Execute Tools → LLM (sees results) → ...
           ↓ (if no more tools needed)
        Final Response
```

Key considerations:
- **Iteration limit**: Prevent infinite loops (e.g., max 5 iterations)
- **Tool validation**: Ensure requested tools exist and arguments are valid
- **Error handling**: Handle tool failures gracefully
- **Context management**: Maintain conversation history for multi-turn interactions

### 3. Grounding in Knowledge
Rather than letting the LLM hallucinate, we ground answers in real data:
- **Order database**: Look up actual order status/details
- **FAQ database**: Search for relevant help articles
- **Ticketing system**: Create structured support tickets

## Approaches Considered

### Live Mode (with API key)
- **OpenAI API**: Use `openai` SDK with `gpt-4o-mini` model
- **Tool calling**: Use OpenAI's native function calling feature
- **Advantages**: Real AI reasoning, handles unexpected queries well
- **Requirements**: OPENAI_API_KEY environment variable

### Mock Mode (no API key)
For the learning goal, we need a fully functional offline mode:

**Option 1: Random/canned responses** (rejected)
- Too simplistic, doesn't demonstrate agent loop

**Option 2: Keyword/regex-based planner** (CHOSEN)
- Parse user query for keywords (order number, "refund", "bug", etc.)
- Deterministically select appropriate tools
- Execute tools and format response with results
- Still runs the full agent loop (tool selection → execution → response)
- Demonstrates the architecture without requiring an API

**Option 3: Local LLM (e.g., Llama via Ollama)** (rejected)
- Requires additional installation
- Slower, less reliable on learning machines
- Overkill for a learning project

### Data Storage
- **In-memory JSON files**: Simple, deterministic, perfect for learning
  - `orders.json`: ~5-10 fake orders with IDs, statuses, items
  - `faq.json`: ~10-15 common questions with answers
- **No real database**: Keeps setup zero-dependency

## Libraries

### Production Dependencies
1. **openai** (^4.x): Official OpenAI SDK for live mode
2. **dotenv** (^16.x): Load environment variables from .env

### Development Dependencies
1. **typescript** (^5.x): Type safety
2. **tsx** (^4.x): Run TypeScript directly
3. **vitest** (^1.x): Fast, modern testing
4. **@types/node**: TypeScript definitions for Node.js

## Practical Assumptions

1. **Fictional Product**: "CloudStore" — a SaaS e-commerce platform
2. **Tool Set**: Kept minimal (3 tools) to focus on the agent loop pattern
3. **Single-turn queries**: User asks one question, agent responds (no multi-turn chat persistence)
4. **Simple matching**: FAQ search uses basic string includes (no embeddings/vector search)
5. **No authentication**: All orders are public for demo purposes
6. **Deterministic mock**: Same query always produces same tool calls in mock mode

## Implementation Strategy

### File Structure
```
src/
  agent.ts          # Main agent loop orchestrator
  tools/            # Tool implementations
    lookupOrder.ts
    searchFAQ.ts
    createTicket.ts
  planner/          # Mode-specific planners
    openaiPlanner.ts   # Live mode using OpenAI
    mockPlanner.ts     # Offline mode with keyword matching
  data/             # Static data files
    orders.json
    faq.json
  types.ts          # Shared TypeScript types
demo.ts             # Demonstration script
```

### Testing Strategy
1. **Unit tests**: Each tool function (validate inputs, correct outputs)
2. **Integration test**: Mock agent resolves order-status query end-to-end
3. **Offline only**: All tests must pass without API keys

## References
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Agent patterns in LangChain docs](https://js.langchain.com/docs/modules/agents/)
- [ReAct: Reasoning and Acting in LLMs](https://arxiv.org/abs/2210.03629) - Foundational agent loop paper
