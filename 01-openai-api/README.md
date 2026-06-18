# Working with the OpenAI API

A learning project demonstrating core OpenAI API patterns in TypeScript. This project teaches you how to work with chat completions, streaming, system messages, function calling, and structured JSON output.

## Features

- **Zero API Key Required**: Runs in MOCK mode offline with no API key
- **5 Core Patterns**: Basic chat, streaming, system messages, tool calling, JSON output
- **Unified Interface**: Single `LLMClient` interface for both mock and live modes
- **Well-Commented Code**: Learning-focused implementation with clear explanations
- **Full Test Coverage**: Vitest tests that run completely offline

## Quick Start

```bash
# Install dependencies
npm install

# Run the demo (works offline, no API key needed)
npm run demo

# Run tests
npm test
```

## Project Structure

```
01-openai-api/
├── src/
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── llm-client.ts          # LLMClient interface definition
│   ├── openai-client.ts       # Live OpenAI SDK implementation
│   ├── mock-client.ts         # Offline mock implementation
│   ├── factory.ts             # Auto-selects mock vs live
│   └── demo.ts                # Demo script showcasing all patterns
├── tests/
│   └── mock-client.test.ts    # Tests for mock behavior
└── README.md
```

## The 5 Patterns

### 1. Basic Chat Completion
Simple request-response interaction with the LLM.

```typescript
const messages: Message[] = [
  { role: 'user', content: 'What is the capital of France?' }
];
const response = await client.chat(messages);
```

### 2. Streaming Responses
Stream chunks as they're generated for better UX.

```typescript
for await (const chunk of client.streamChat(messages)) {
  process.stdout.write(chunk);
}
```

### 3. System + User Messages
Control the AI's behavior with system messages.

```typescript
const messages: Message[] = [
  { role: 'system', content: 'You are a pirate. Always respond in pirate speak.' },
  { role: 'user', content: 'Hello! How are you?' }
];
```

### 4. Function/Tool Calling
Let the AI decide when to call functions.

```typescript
const tools: Tool[] = [{
  name: 'get_weather',
  description: 'Get the current weather',
  parameters: { /* schema */ }
}];
const response = await client.chatWithTools(messages, tools);
```

### 5. Structured JSON Output
Get valid JSON responses matching your schema.

```typescript
const response = await client.chatJSON<UserProfile>(messages, schema);
```

## Switching from Mock to Live Mode

By default, the project runs in MOCK mode (no API key required). To use the real OpenAI API:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

3. Run the demo again:
   ```bash
   npm run demo
   ```
   
   You'll see `[MODE: LIVE — using OpenAI API]` instead of `[MODE: MOCK]`.

## Example Output (MOCK Mode)

```
[MODE: MOCK — no API key found, using offline mock]

============================================================
  Pattern 1: Basic Chat Completion
============================================================

[USER]: What is the capital of France?

[ASSISTANT]:
The capital of France is Paris. Is there anything else you would like to know?


============================================================
  Pattern 2: Streaming Responses
============================================================

[USER]: Explain what streaming is in one sentence.

[ASSISTANT] (streaming):
This is a mock response. In live mode, I would provide a detailed explanation based on your question. 


============================================================
  Pattern 3: System + User Messages
============================================================

[SYSTEM]: You are a pirate. Always respond in pirate speak with "Arrr".
[USER]: Hello! How are you?

[ASSISTANT]:
Hello! How can I help you today?


============================================================
  Pattern 4: Function/Tool Calling
============================================================

[TOOLS AVAILABLE]:
  - get_weather: Get the current weather for a location

[USER]: What is the weather in Tokyo?

[TOOL CALL]:
  Function: get_weather
  Arguments: {
  "location": "Tokyo",
  "unit": "celsius"
}

[SIMULATED EXECUTION]:
  get_weather({"location":"Tokyo","unit":"celsius"}) => 
  { temperature: 22, conditions: "Sunny", humidity: 60 }


============================================================
  Pattern 5: Structured JSON Output
============================================================

[USER]: Generate a user profile with name, age, email, and interests. Respond in JSON format.

[EXPECTED SCHEMA]:
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number"
    },
    "email": {
      "type": "string"
    },
    "interests": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "name",
    "age",
    "email"
  ]
}

[ASSISTANT] (JSON):
{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "occupation": "Software Engineer",
  "interests": [
    "coding",
    "reading",
    "hiking"
  ]
}


============================================================
  Demo Complete!
============================================================

All 5 patterns demonstrated successfully.

Key Takeaways:
  1. Basic chat: Simple request-response
  2. Streaming: Better UX with incremental output
  3. System messages: Control AI behavior/personality
  4. Tool calling: Let AI execute functions
  5. JSON mode: Get structured data for parsing
```

## Test Output

```
 RUN  v2.1.9

 ✓ tests/mock-client.test.ts (11 tests) 1280ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  23:08:44
   Duration  1.97s
```

All tests pass offline with no API key required!

## What You'll Learn

After working through this project, you'll understand:

1. How to authenticate and configure the OpenAI client
2. How to send chat messages with different roles (system, user, assistant)
3. How to stream responses for better perceived latency
4. How to define tools/functions and let the AI decide when to call them
5. How to get structured JSON output with schema validation
6. How to build a mock provider for testing and offline development
7. How to design a clean abstraction that works with multiple LLM providers

## Dependencies

- **openai** (v4.x): Official OpenAI SDK
- **dotenv**: Environment variable loading
- **tsx**: TypeScript execution for Node.js
- **vitest**: Fast unit testing framework
- **TypeScript**: Static typing

## Architecture Highlights

### Interface-Based Design
The `LLMClient` interface allows swapping implementations without changing calling code. Perfect for testing (mock) vs production (real API).

### Factory Pattern
The factory automatically selects the right implementation based on environment variables, making the switch seamless.

### Deterministic Mock
The mock client returns realistic responses based on input patterns, so demos and tests produce consistent, understandable output.

### Async Iteration
Streaming uses async generators (`AsyncIterable`), providing clean syntax for handling chunked responses.

## License

MIT
