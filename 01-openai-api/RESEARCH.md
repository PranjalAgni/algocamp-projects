# Research: Working with the OpenAI API

## What is the OpenAI API?

The OpenAI API provides programmatic access to large language models like GPT-4 and GPT-3.5. It enables developers to integrate AI capabilities into their applications through HTTP REST endpoints.

## Core Concepts

### 1. Chat Completions
The primary interface for conversational AI. Send messages (system, user, assistant) and receive model-generated responses.

### 2. Messages
- **System**: Sets the behavior/personality of the assistant
- **User**: The user's input/question
- **Assistant**: The model's previous responses (for context)

### 3. Streaming
Instead of waiting for the complete response, the API can stream partial results as they're generated, improving perceived latency.

### 4. Function/Tool Calling
The model can decide to call functions/tools you define. It returns structured data indicating which function to call with what parameters. Your code executes the function and sends results back.

### 5. JSON Mode
`response_format: { type: 'json_object' }` guarantees the reply is syntactically valid JSON - not that it matches any particular schema. This project uses JSON mode (see `chatJSON` in openai-client.ts); the `schema` argument is passed in for you to validate against yourself, but is never sent to the API. OpenAI's stronger Structured Outputs feature (`type: 'json_schema'`, strict mode) is what actually enforces required keys and types.

## Libraries Considered

### Official `openai` npm SDK (CHOSEN)
- **Pros**: Official, well-maintained, TypeScript support, streaming helpers
- **Cons**: Tied to one provider's request/response shape, so the project wraps it behind an `LLMClient` interface to keep the rest of the code provider-agnostic
- **Version**: Latest (v4.x)

### Alternatives
- **LangChain**: Too heavy for a focused learning project
- **Direct fetch()**: Requires manual streaming/error handling
- **openai-edge**: Optimized for edge runtimes, unnecessary here

## Mock Strategy

For offline/no-key operation:
1. Detect missing `OPENAI_API_KEY` at runtime
2. Provide a `MockLLMClient` implementing the same interface
3. Return deterministic canned responses:
   - Chat: Simple text based on user message
   - Streaming: Split response into chunks with delays
   - Tool calling: Return a predefined tool call structure
   - JSON mode: Return valid JSON matching expected schema

## Practical Assumptions

1. **Model**: Default to `gpt-4o-mini` (cost-effective, fast)
2. **Error handling**: Basic try-catch, log errors
3. **TypeScript**: Strict mode, ESM modules
4. **Testing**: Focus on mock behavior (can't test live API without key)
5. **Temperature**: 0.7 default (balanced creativity)
6. **Max tokens**: 500 default (reasonable for demos)

## Key References

- OpenAI API Documentation: https://platform.openai.com/docs/api-reference
- OpenAI Node SDK: https://github.com/openai/openai-node
- Chat Completions Guide: https://platform.openai.com/docs/guides/chat-completions
- Function Calling Guide: https://platform.openai.com/docs/guides/function-calling
- JSON Mode: https://platform.openai.com/docs/guides/structured-outputs

## Learning Goals

After working through this project, a developer should understand:
1. How to authenticate and configure the OpenAI client
2. How to send chat messages with system/user roles
3. How to stream responses for better UX
4. How to define and handle tool/function calls
5. How to get structured JSON output
6. How to build a mock provider for testing/offline work
