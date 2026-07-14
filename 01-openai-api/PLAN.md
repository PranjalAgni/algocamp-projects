# Plan: OpenAI API Learning Project

## v1 Scope (What we'll build)

A TypeScript library + CLI demo that teaches the 5 core OpenAI API patterns:
1. Basic chat completion
2. Streaming responses
3. System + user messages
4. Function/tool calling
5. Structured JSON output

**Key constraint**: Must run completely offline with MOCK mode when no API key present.

## File Layout

```
01-openai-api/
├── src/
│   ├── types.ts              # Shared interfaces (Message, Tool, etc.)
│   ├── llm-client.ts          # LLMClient interface
│   ├── openai-client.ts       # Live OpenAI implementation
│   ├── mock-client.ts         # Mock implementation (no API key)
│   ├── factory.ts             # Auto-select mock vs live
│   └── demo.ts                # Demo script showcasing all patterns
├── tests/
│   └── mock-client.test.ts    # Tests for mock behavior
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── RESEARCH.md               (done)
├── PLAN.md                   (this file)
└── README.md                 (write after implementation passes)
```

## Implementation Steps

### 1. Setup
- Initialize package.json with dependencies: `openai`, `tsx`, `vitest`, `dotenv`
- Configure TypeScript for ESM + strict mode
- Create .env.example and .gitignore

### 2. Core Types (types.ts)
- Message interface (role, content)
- Tool interface (name, description, parameters)
- ToolCall interface (id, name, arguments)
- ChatOptions interface (temperature, maxTokens, etc.)

### 3. LLMClient Interface (llm-client.ts)
```typescript
interface LLMClient {
  chat(messages: Message[], options?: ChatOptions): Promise<string>
  streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<string>
  chatWithTools(messages: Message[], tools: Tool[], options?: ChatOptions): Promise<ToolCall | string>
  chatJSON<T>(messages: Message[], schema: object, options?: ChatOptions): Promise<T>
}
```

### 4. OpenAI Client (openai-client.ts)
- Instantiate official `openai` SDK
- Implement each method using real API calls
- Handle streaming with async iterators
- Parse tool calls from response
- Use `response_format: { type: "json_object" }` for JSON mode

### 5. Mock Client (mock-client.ts)
- Implement same interface
- Deterministic responses based on message content
- Simulate streaming by yielding chunks with small delays
- Return canned tool calls (e.g., always call `get_weather` if message mentions weather)
- Return valid JSON for JSON mode

### 6. Factory (factory.ts)
- Check `process.env.OPENAI_API_KEY`
- Return `OpenAIClient` if present, else `MockClient`
- Print `[MODE: MOCK]` or `[MODE: LIVE]` banner

### 7. Demo Script (demo.ts)
```
Pattern 1: Basic Chat
Pattern 2: Streaming Chat
Pattern 3: System + User Messages
Pattern 4: Function/Tool Calling
Pattern 5: Structured JSON Output
```
Each pattern prints labeled output showing request and response.

### 8. Tests (mock-client.test.ts)
- Test mock chat returns string
- Test streaming yields multiple chunks
- Test tool call parsed correctly
- Test JSON output is valid and matches schema
- All tests run offline (no API key needed)

## Demo Command
```bash
npm install
npm run demo
```

## Test Command
```bash
npm test
```

## Switching from Mock to Live
1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY=sk-...`
3. Run `npm run demo` again - banner shows `[MODE: LIVE]`

## Stretch Goals (v2+, NOT implementing now)
- Image input (vision models)
- Multi-turn conversation state management
- Token counting and cost estimation
- Retry logic with exponential backoff
- Prompt templates and variable substitution
- Comparison mode (run same prompt on mock vs live)
- Batch API support
- Fine-tuning data preparation helpers
