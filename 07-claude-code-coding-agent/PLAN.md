# Plan: Minimal Coding Agent (v1)

## Goal
Build a tiny Claude Code: an agent that uses tools to complete coding tasks in a sandboxed workspace.

## File Layout

```
07-claude-code-coding-agent/
├── src/
│   ├── types.ts              # TypeScript types for tools, messages, etc.
│   ├── tools.ts              # Tool definitions (schemas + implementations)
│   ├── sandbox.ts            # Path jailing + safety checks
│   ├── brain.ts              # LLM brain (Anthropic) + Mock brain
│   ├── agent.ts              # Main agent loop (ReAct)
│   └── index.ts              # CLI entry point for demo
├── tests/
│   ├── sandbox.test.ts       # Path jailing tests
│   ├── tools.test.ts         # Tool execution tests
│   └── agent.test.ts         # End-to-end agent tests with mock
├── RESEARCH.md               # Conceptual background
├── PLAN.md                   # This file
├── README.md                 # How to use
├── package.json              # Scripts: demo, test
├── tsconfig.json             # TypeScript config (ESM)
├── vitest.config.ts          # Vitest config
├── .env.example              # ANTHROPIC_API_KEY
└── .gitignore                # node_modules, .env, etc.
```

## Implementation Steps

### 1. Setup (package.json, tsconfig.json, configs)
- Dependencies: `@anthropic-ai/sdk`, `dotenv`
- Dev dependencies: `@types/node`, `tsx`, `vitest`, `typescript`
- Scripts:
  - `npm run demo` → `tsx src/index.ts`
  - `npm test` → `vitest run`

### 2. Types (`src/types.ts`)
Define:
- `Tool` interface (name, description, input schema, execute function)
- `ToolCall` (tool name, arguments)
- `ToolResult` (tool name, result content)
- `Message` type (user/assistant, content, tool calls/results)

### 3. Sandbox (`src/sandbox.ts`)
Core safety functions:
- `isPathSafe(sandboxRoot, requestedPath)` → reject `..`, absolute paths outside sandbox
- `resolveSafePath(sandboxRoot, relativePath)` → resolve + validate
- `isCommandSafe(command)` → whitelist check (node, cat, echo, ls)

### 4. Tools (`src/tools.ts`)
Implement the tool set:

**readFile**
- Params: `{ path: string }`
- Action: read file from sandbox, return content
- Observation: file content or error

**writeFile**
- Params: `{ path: string, content: string }`
- Action: write file to sandbox (create dirs if needed)
- Observation: success message

**listFiles**
- Params: `{ path?: string }` (default ".")
- Action: list files/dirs in path
- Observation: array of names

**applyEdit**
- Params: `{ path: string, oldString: string, newString: string }`
- Action: read file, replace first occurrence, write back
- Observation: success or "string not found"

**runCommand**
- Params: `{ command: string }`
- Action: exec command in sandbox dir, capture stdout/stderr (2s timeout)
- Observation: combined output or error

**finish**
- Params: `{ result: string }`
- Action: signal task complete
- Observation: echoes result (triggers loop exit)

Each tool returns a `ToolResult` object.

### 5. Brain (`src/brain.ts`)
Two implementations:

**LLMBrain** (Anthropic):
- Takes messages + tool schemas
- Calls Claude API with tool definitions
- Returns assistant message (text + tool calls)

**MockBrain**:
- Hardcoded responses for canned tasks
- Pattern match on task string:
  - "create hello.js" → sequence of writeFile, runCommand, finish
  - "list files" → listFiles, writeFile (summary), finish
  - Default → finish with "I don't know how to do that in mock mode"
- Tracks step count to emit the right tool call

Common interface: `Brain.respond(messages, tools) → AssistantMessage`

### 6. Agent Loop (`src/agent.ts`)
`runAgent(task, sandboxPath, brain, tools, maxSteps)`:
1. Initialize messages with system prompt + user task
2. Loop (max `maxSteps` iterations):
   - Call `brain.respond(messages, tools)`
   - Parse tool calls from response
   - For each tool call:
     - Validate tool exists
     - Execute tool (with sandbox context)
     - Collect observation
   - Append assistant message + tool results to messages
   - If `finish` was called, break
3. Return conversation history + final result

### 7. CLI Entry Point (`src/index.ts`)
- Load `.env` (dotenv)
- Check `ANTHROPIC_API_KEY`
- Print `[MODE: LIVE]` or `[MODE: MOCK — no API key]`
- Create temp sandbox directory
- Define a demo task: "Create a file hello.js that prints 'Hello from the agent!' and then run it using node"
- Instantiate brain (LLM or Mock)
- Run agent
- Print each step (thought, tool call, observation)
- Print final result
- Clean up sandbox

### 8. Tests (`tests/*.test.ts`)

**sandbox.test.ts**:
- Path jailing: reject `../etc/passwd`, `/etc/passwd`
- Accept valid paths: `hello.js`, `subdir/file.txt`
- Command whitelisting: allow `node hello.js`, reject `rm -rf /`

**tools.test.ts**:
- Create temp sandbox
- Test writeFile → readFile round-trip
- Test listFiles returns file names
- Test applyEdit replaces string
- Test runCommand executes `echo test` and returns output

**agent.test.ts**:
- End-to-end with MockBrain
- Task: "create hello.js and run it"
- Assert: sandbox contains `hello.js`, final result includes "Hello"

All tests use temp directories and clean up after.

## Demo Flow

When you run `npm run demo`:

```
[MODE: MOCK — no API key]

=== CODING AGENT DEMO ===
Task: Create a file hello.js that prints 'Hello from the agent!' and then run it using node
Sandbox: /var/folders/.../sandbox-xyz

--- Step 1 ---
Assistant: I'll create the hello.js file
Tool call: writeFile
Arguments: {"path":"hello.js","content":"console.log('Hello from the agent!');"}
Observation: Successfully wrote to hello.js

--- Step 2 ---
Assistant: Now I'll run it
Tool call: runCommand
Arguments: {"command":"node hello.js"}
Observation: Hello from the agent!

--- Step 3 ---
Tool call: finish
Arguments: {"result":"Created hello.js and executed it successfully"}
Observation: Task complete

=== RESULT ===
Created hello.js and executed it successfully
```

## Test Pass Criteria
All tests must pass with `npm test`:
- Sandbox path jailing blocks escapes
- Tools execute correctly in sandbox
- Mock agent completes canned task
- All tests clean up temp directories

## Stretch Ideas (NOT v1)
- Web UI: show agent thinking in real-time
- More tools: search files (grep), git commands
- Retry logic: if tool fails, let agent try again
- Streaming: show LLM responses as they arrive
- Multiple canned tasks in mock mode
- Prompt engineering: better system prompt for planning
