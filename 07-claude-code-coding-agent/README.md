# Coding Agent

A minimal coding agent that uses tools to complete programming tasks — a tiny Claude Code. This project demonstrates the **ReAct** (Reasoning + Acting) pattern and teaches how LLMs use tools to accomplish goals.

## What It Does

The agent can:
- **Read and write files** in a sandboxed workspace
- **List directories** to explore the environment
- **Edit files** using string replacement
- **Run shell commands** (whitelisted for safety)
- **Complete tasks** autonomously by chaining tool calls

Key learning concepts:
- **Tool use**: How to define tool schemas for LLMs
- **Agent loop**: The ReAct pattern (thought → action → observation → repeat)
- **Safety**: Path jailing and command whitelisting to prevent escapes
- **Mock mode**: Running without API keys for offline demos

## Architecture

```
Agent Loop (ReAct Pattern)
┌─────────────────────────────────┐
│ 1. User gives task              │
│ 2. Brain decides tool to call   │  ← LLM or Mock
│ 3. Tool executes in sandbox     │
│ 4. Observation fed back         │
│ 5. Repeat until task complete   │
└─────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Usage

### Run Demo (works offline, no API key needed)

```bash
npm run demo
```

This runs a canned task: create `hello.js` and execute it using Node.

**Example Output:**

```
[MODE: MOCK — no API key]

=== CODING AGENT DEMO ===
Task: Create a file hello.js that prints 'Hello from the agent!' and then run it using node
Sandbox: /var/folders/.../sandbox-bckRrj

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
Assistant: Task complete
Tool call: finish
Arguments: {"result":"Created hello.js and executed it successfully. Output: Hello from the agent!"}
Observation: Task complete: Created hello.js and executed it successfully. Output: Hello from the agent!

=== RESULT ===
Created hello.js and executed it successfully. Output: Hello from the agent!
```

### Run Tests

```bash
npm test
```

All tests pass offline:

```
 ✓ test/sandbox.test.ts (9 tests) 9ms
 ✓ test/tools.test.ts (11 tests) 208ms
 ✓ test/agent.test.ts (3 tests) 191ms

 Test Files  3 passed (3)
      Tests  23 passed (23)
```

Tests cover:
- **Path jailing**: Rejecting `../` escapes and absolute paths outside sandbox
- **Tool execution**: File I/O, command execution, string editing
- **End-to-end agent**: Completing the hello.js task with MockBrain

## LIVE Mode (Optional)

To use the real Claude API instead of mock mode:

1. Copy `.env.example` to `.env`
2. Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Run `npm run demo`

The agent will automatically detect the key and use Claude (`claude-3-5-haiku-latest`) instead of the mock brain.

## Project Structure

```
src/
├── types.ts       # TypeScript types for tools, messages, brain
├── sandbox.ts     # Path jailing and command whitelisting
├── tools.ts       # Tool definitions (readFile, writeFile, etc.)
├── brain.ts       # LLMBrain (Anthropic) and MockBrain
├── agent.ts       # Main ReAct loop
└── index.ts       # CLI demo entry point

test/
├── sandbox.test.ts  # Safety tests
├── tools.test.ts    # Tool execution tests
└── agent.test.ts    # End-to-end agent tests
```

## Available Tools

1. **readFile**: Read file contents from sandbox
2. **writeFile**: Write content to a file (creates directories if needed)
3. **listFiles**: List files in a directory
4. **applyEdit**: Replace a string in a file
5. **runCommand**: Execute whitelisted commands (`node`, `cat`, `echo`, `ls`)
6. **finish**: Signal task completion

## Safety Features

### Path Jailing
All file paths are validated to prevent escaping the sandbox:
- Rejects `../` traversal attacks
- Rejects absolute paths outside the sandbox
- Resolves and normalizes paths before access

### Command Whitelisting
Only safe commands are allowed:
- `node` (run JavaScript)
- `cat` (read files)
- `echo` (print text)
- `ls` (list directory)

Dangerous commands like `rm -rf /` or `curl` are blocked.

### Resource Limits
- Command execution: 2 second timeout
- Agent loop: Maximum 10 steps to prevent infinite loops

## Learning Highlights

This project teaches:

1. **Tool Schemas**: How to define tools (name, description, parameters) for LLMs
2. **ReAct Pattern**: The thought → action → observation loop
3. **Message Format**: How to structure tool calls and results for Claude API
4. **Safety**: Critical techniques to sandbox agent actions
5. **Mock Fallbacks**: Making projects runnable without external dependencies

## Mock Mode Details

The `MockBrain` is a deterministic "scripted brain" that emits hardcoded tool call sequences for specific tasks:

**Supported tasks:**
- "create hello.js and run it" → writeFile → runCommand → finish
- "list files and create summary" → listFiles → writeFile → finish

For any other task, it immediately calls `finish` with a message explaining it only supports canned tasks.

## Future Enhancements

Ideas for v2 (not implemented):
- More tools: grep/search, git commands
- Web UI: visualize agent thinking in real-time
- Streaming: show LLM responses as they arrive
- Retry logic: if tool fails, let agent try again
- Better planning: system prompt engineering
- Multi-file edits: batch operations

## License

MIT
