# 01 · Working with the OpenAI API

The five patterns you actually need to build anything with a chat LLM: **basic chat,
streaming, system prompts, tool calling, and structured JSON output**. Each one is
implemented twice - once against the real OpenAI SDK, once as an offline mock - behind a
single `LLMClient` interface, so you can study the shape of each call without an API key.

## Run it

```bash
npm install
npm run demo     # walks through all 5 patterns (offline, no key needed)
npm test         # vitest suite for the mock client
```

The demo prints `[MODE: MOCK — no API key found, using offline mock]` on the first line.
Set `OPENAI_API_KEY` (copy `.env.example` to `.env`) and it switches to
`[MODE: LIVE — using OpenAI API]` and hits the real API instead. No other change needed -
that's the point of the interface.

## The idea worth taking away

Every provider call in this project goes through one interface:

```ts
interface LLMClient {
  chat(messages, options?): Promise<string>;
  streamChat(messages, options?): AsyncIterable<string>;
  chatWithTools(messages, tools, options?): Promise<ToolCall | string>;
  chatJSON<T>(messages, schema, options?): Promise<T>;
}
```

`OpenAIClient` implements it with the SDK; `MockLLMClient` implements it with deterministic
canned responses. A factory picks one based on whether a key is present. Your application
code never knows which it got. This is the pattern that lets you test agents without paying
per token and without flaky network calls - and it's why every other project in this repo
can run offline.

## The five patterns

| # | Pattern | What it teaches |
|---|---------|-----------------|
| 1 | Basic chat | Request → single response. The baseline call. |
| 2 | Streaming | `AsyncIterable<string>` of chunks; how token-by-token output works. |
| 3 | System prompt | A `system` message steers behavior for the whole turn. |
| 4 | Tool calling | The model returns a *structured request to call a function*, not prose. |
| 5 | JSON output | `response_format: json_object` to get parseable data instead of text. |

The two calls people get wrong first are 4 and 5. **Tool calling doesn't run your
function** - the model returns a `ToolCall` (name + arguments) and hands control back to
you; you run it and feed the result back in a follow-up message. **JSON mode guarantees
valid JSON, not a valid schema** - you still validate the shape yourself. Look at
`openai-client.ts` to see exactly where each of these happens in a real request.

## What the mock can and can't do with a system prompt

Pattern 3 sets a `system` message ("respond like a pirate") to show that a system prompt
steers the whole turn. A real model reads that instruction and adapts. The mock can't
reason, so it recognizes the handful of personas the demo uses (`applyPersona` in
`mock-client.ts`) and rewrites its canned reply - enough to prove that the *same* user
message produces a different answer once a system prompt is present. Set an unfamiliar
persona and the mock says so explicitly rather than pretending to follow it; only `LIVE`
mode follows an arbitrary instruction. That gap is the honest edge of every offline mock in
this repo: it exercises the *shape* of the call, not the intelligence behind it.

## Files

```
src/
  types.ts          # Message, Tool, ToolCall, ChatOptions
  llm-client.ts     # the LLMClient interface both clients satisfy
  openai-client.ts  # live implementation (official SDK)
  mock-client.ts    # offline implementation (deterministic responses)
  factory.ts        # picks live vs mock from OPENAI_API_KEY
  demo.ts           # runs all five patterns end to end
tests/
  mock-client.test.ts
```

## Example output (mock mode, abridged)

```
[MODE: MOCK — no API key found, using offline mock]

  Pattern 4: Function/Tool Calling
[USER]: What is the weather in Tokyo?
[TOOL CALL]:
  Function: get_weather
  Arguments: { "location": "Tokyo", "unit": "celsius" }
[SIMULATED EXECUTION]:
  get_weather({"location":"Tokyo","unit":"celsius"}) =>
  { temperature: 22, conditions: "Sunny", humidity: 60 }
```

## Where to go next

- Swap the mock for the live client and diff the two files - the interface is identical,
  only the bodies differ.
- Add a second tool and make the demo loop: call the model, run the returned tool, feed the
  result back, call again. That loop is the whole idea behind the agent in project 02.
