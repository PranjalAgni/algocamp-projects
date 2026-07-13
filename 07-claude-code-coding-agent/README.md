# 07 · Coding Agent

Project 02 built an agent loop that answered questions by calling read-only tools. This one gives
the loop hands: tools that write files and run commands. That single change - tools with side
effects - is the whole distance between a chatbot and something like Claude Code, and it's why the
interesting part of this project isn't the loop, it's the sandbox that keeps the loop from wrecking
your machine.

The agent runs one task end to end: create `hello.js`, run it with Node, report the output. Small
on purpose, so the machinery is visible.

## Run it

```bash
npm install
npm run demo     # run the canned task in a throwaway sandbox
npm test         # vitest suite (25 tests, deterministic, offline)
```

No API key needed. Without one the demo uses a scripted `MockBrain`; with one it uses the real
Claude API (see [Live mode](#live-mode) below).

## The one idea

An agent is a loop, and every turn is the same three steps (`src/agent.ts`):

```
1. Ask the brain: given the conversation so far, what tool do you call?
2. Execute that tool, capture the result as an "observation".
3. Append the observation to the conversation and go back to step 1,
   until the brain calls `finish` or we hit maxSteps.
```

This is the ReAct pattern - reason, act, observe, repeat. The brain never touches the filesystem
itself; it only *names a tool and its arguments*, and the loop decides whether and how to run it.
That separation is the leverage point. Because every action funnels through `tool.execute`, one
place gets to say "no" - which is exactly where safety lives.

## Where safety actually lives

The agent can write files and run shell commands, so `src/sandbox.ts` is not decoration - it is the
only thing between the model and your home directory. Two checks, and both are more subtle than they
first look:

**Path jailing** (`isPathSafe`) resolves every requested path and confirms it stays under the
sandbox root. The obvious trap is `../../etc/passwd`, and that's caught. The non-obvious trap is the
prefix check itself: comparing `resolved.startsWith(root)` on the bare string lets
`/tmp/sandbox-evil` slip past a `/tmp/sandbox` jail, because one string genuinely is a prefix of the
other. The fix is to compare against `root + path.sep` (or the root exactly), so a sibling directory
that merely *shares a name prefix* is rejected. There's a regression test pinning this.

**Command whitelisting** (`isCommandSafe`) allows only `node`, `cat`, `echo`, `ls`. The trap here is
that `runCommand` hands the whole string to a shell, so checking only the first word isn't enough:
`node hello.js; whoami` starts with `node` but the shell would happily run `whoami` too. So the
check also rejects shell metacharacters (`;`, `&&`, `|`, backticks, `$(...)`, and friends) that
could chain a second command.

## The honest part

Both safety checks above shipped with the exact bugs described - the sibling-prefix escape and the
command-chaining bypass - and this project fixed them and added tests. That is the real lesson of
the section: **an allowlist is only as good as the boundary it actually measures.** A jail that
compares string prefixes isn't measuring "is this path inside the directory", and a whitelist that
reads one token isn't measuring "is this one command".

And even hardened, this is a speed bump, not a wall. `node` is on the whitelist, and
`node -e "<anything>"` runs arbitrary JavaScript - which can read files, open sockets, spawn
processes. A string-level whitelist cannot close that; the program it lets through is itself a
general-purpose interpreter. The only real boundary for an agent that runs code is OS-level
isolation: a container, a VM, seccomp. Treat the checks in `sandbox.ts` as a way to catch honest
mistakes and obvious escapes, not as something you'd expose to an adversary.

One more caveat worth stating plainly: **offline mode doesn't demonstrate reasoning.** The
`MockBrain` is a scripted sequence - it pattern-matches the task string and emits a fixed
writeFile → runCommand → finish script. It proves the loop and the sandbox work, nothing more. Only
live mode has a brain that actually decides what to do next based on what it observed.

## Live mode

```bash
cp .env.example .env
# add: ANTHROPIC_API_KEY=sk-ant-...
npm run demo
```

With a key present, `index.ts` swaps `MockBrain` for `LLMBrain`, which calls Claude
(`claude-3-5-haiku-20241022`) with the tool schemas and lets the model choose the tools. This is
where the loop earns its name - the model reads each observation and picks the next action, instead
of replaying a script. Try changing the task in `index.ts` to something the mock can't handle (the
mock only knows the hello.js and "list files + summary" tasks) and watch a real brain work it out.

## Files

```
src/
  types.ts     Tool / Message / Brain interfaces - the contract the loop is built on
  sandbox.ts   path jailing and command whitelisting (the safety boundary)
  tools.ts     the six tools: readFile, writeFile, listFiles, applyEdit, runCommand, finish
  brain.ts     LLMBrain (real Claude) and MockBrain (scripted, offline)
  agent.ts     the ReAct loop
  index.ts     CLI demo: makes a temp sandbox, runs one task, cleans up
test/
  sandbox.test.ts   safety checks, including the two escape regressions above
  tools.test.ts     each tool's behaviour
  agent.test.ts     the full loop end to end with MockBrain
```

`RESEARCH.md` and `PLAN.md` record why the design landed where it did.

## Where to go next

- Read `sandbox.test.ts` first, then try to break the jail yourself before reading the fix. Feeling
  the escape land is worth more than being told about it.
- Add a tool - say `deleteFile` or a grep-style search. You'll define its schema, its `execute`, and
  a safety check, which is the whole shape of extending an agent.
- Project 08 turns the agent outward: instead of writing code, it reviews a diff. Same loop, same
  tool discipline, pointed at a different job.
