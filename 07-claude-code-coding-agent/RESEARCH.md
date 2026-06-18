# Research: Coding Agent

## Concept

A **coding agent** is an autonomous system that can complete programming tasks by:
1. Understanding a natural language goal
2. Planning a sequence of actions (tool calls)
3. Executing those actions in an environment
4. Observing the results
5. Iterating until the goal is achieved

This is the core loop behind tools like Claude Code, Devin, and GitHub Copilot Workspace.

## Key Components

### 1. Tool System
The agent needs a defined set of tools it can use:
- **File operations**: read, write, edit, list
- **Execution**: run shell commands (sandboxed)
- **Control flow**: finish (signal completion)

Each tool has a **JSON schema** defining its parameters. The LLM learns to call these tools by seeing:
- Tool name
- Description of what it does
- Parameter schema
- Example usage (optional, often via system prompt)

### 2. Agent Loop (ReAct pattern)
The classic **ReAct** (Reasoning + Acting) loop:

```
1. Thought: "I need to create a file"
2. Action: call writeFile(path="hello.js", content="...")
3. Observation: "File created successfully" or "Error: permission denied"
4. [repeat] Thought: "Now I need to run it"
   Action: runCommand(command="node hello.js")
   Observation: "Hello, World!"
5. Finish: "Task complete"
```

This is implemented as:
- **User message** with the task
- **Assistant message** with tool call(s)
- **User message** with tool results (observations)
- Repeat until the assistant calls the `finish` tool or hits max iterations

### 3. Sandbox Safety
A critical lesson: the agent must **not** escape its workspace. Key techniques:
- **Path jailing**: reject any path containing `..` or absolute paths outside the sandbox
- **Command whitelisting**: only allow safe commands (no `rm -rf /`, no `curl` to arbitrary URLs)
- **Resource limits**: timeout on command execution, file size limits

This is both a security measure and a pedagogical point — agents need guardrails.

### 4. Mock vs Live Mode
For learning purposes, we support two modes:

**LIVE mode** (when ANTHROPIC_API_KEY is set):
- Use the real Claude API
- Model: `claude-3-5-haiku-latest` (fast, cheap, capable)
- The model receives tool schemas and learns to call them

**MOCK mode** (no API key):
- A deterministic "scripted brain" that hardcodes responses for canned tasks
- Example: task "create hello.js and run it" → emit the exact sequence of tool calls
- Still exercises the full loop: tool execution, observation, iteration

## Libraries Considered

### LLM SDK
- **@anthropic-ai/sdk** (chosen) — official Anthropic TypeScript SDK
  - Native support for tool use
  - Streaming support
  - Good TypeScript types
- Alternatives: OpenAI SDK, LangChain (overkill for this simple loop)

### Tool Execution
- **Node built-ins** (chosen):
  - `fs/promises` for file operations
  - `child_process.exec` for command execution
  - Path validation with `path.resolve` + checks
- Alternatives: isolated VMs (vm2), Docker (too heavy for a learning project)

### Testing
- **vitest** (chosen) — fast, ESM-native, good TypeScript support
- **temp directories** — `fs.mkdtempSync` for isolated test sandboxes

## Practical Assumptions

1. **Canned tasks for MOCK mode**: We'll hardcode responses for two simple tasks:
   - "create hello.js that prints Hello and run it"
   - "list files and create a summary.txt"
   
2. **Whitelisted commands**: Only allow `node`, `cat`, `echo`, `ls` — safe subset

3. **Max iterations**: 10 steps to prevent infinite loops

4. **Simple string-replace editing**: The `applyEdit` tool does exact string replacement, not LLM-powered diffing

5. **No streaming**: For simplicity, we wait for full completions

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Agent Runner                      │
│  - Manages the ReAct loop                           │
│  - Constructs messages                              │
│  - Calls brain (LLM or mock)                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │     Brain      │
         │  (LLM/Mock)    │
         └───────┬────────┘
                 │
                 ▼
    Returns tool call JSON
                 │
                 ▼
         ┌───────────────┐
         │  Tool Executor │
         │  - Validates   │
         │  - Executes    │
         │  - Returns obs │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │   Sandbox      │
         │  (workspace)   │
         └───────────────┘
```

## Learning Objectives

By building this, you learn:
1. **Tool use schemas** — how to define tools for an LLM
2. **Agent loops** — the ReAct pattern
3. **Safety** — path jailing, command whitelisting
4. **Mock fallbacks** — making projects runnable without API keys
5. **Observability** — printing each step so you can see the agent think

## References

- [Anthropic tool use docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [ReAct paper](https://arxiv.org/abs/2210.03629) (Yao et al., 2022)
- Claude Code CLI (the real thing we're miniaturizing)
