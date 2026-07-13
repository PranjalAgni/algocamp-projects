# 08 · AI Code Reviewer

Project 07 pointed an agent at a diff to *write* code. This one points a reviewer at a diff to
*judge* it - roughly what CodeRabbit or a GitHub review bot does. The interesting design choice
here isn't the AI part. It's that the review comes from two sources stacked on top of each other:
a deterministic linter that always runs, and an LLM pass that runs only when it can. Understanding
why you'd want both - and where each one lies to you - is the whole point.

## Run it

```bash
npm install
npm run demo              # review samples/sample1-auth.diff
npm run demo -- sample2   # review the second sample
npm run demo -- --json    # same review, JSON instead of the pretty report
npm test                  # vitest suite (25 tests, deterministic, offline)
```

No API key needed. Without one the LLM pass runs in a mock mode described honestly below; with one
it calls a real model (see [Live mode](#live-mode)).

## The one idea

A good reviewer combines two kinds of judgement, and they have opposite failure modes:

- **Deterministic checks** (`src/linter.ts`) are regex rules over the added lines: hardcoded
  secrets, `==` instead of `===`, stray `console.log`, `TODO`, `.then()` without `await`. They
  never cost a token, never vary run to run, and never get tired. But they only see text - they
  have no idea what the code *means*.
- **Contextual review** (`src/llm-reviewer.ts`) is where a model reads the diff and reasons about
  logic, edge cases, and intent. It catches the things a regex can't, at the price of latency,
  money, and non-determinism.

Every finding carries a `source: 'linter' | 'llm'` tag, and the two lists are merged in
`src/index.ts`. That tag is the honest bit of the whole design: it tells you *which kind of trust*
a comment deserves. A `linter` finding is reproducible and cheap but literal; an `llm` finding is
insightful but might be confidently wrong. Layering them means the cheap-and-certain layer covers
the common cases so the expensive-and-fuzzy layer can spend its attention on the rest.

## The pipeline

```
diff text
  │  parser.ts   → { files: [{ path, hunks: [{ lines: [...] }] }] }   (unified-diff → structured)
  │  linter.ts   → deterministic ReviewComments   (source: 'linter')
  │  llm-reviewer.ts → contextual ReviewComments   (source: 'llm')
  ▼  formatter.ts → pretty terminal report or JSON
```

The parser is worth reading on its own (`src/parser.ts`): it walks the unified diff line by line,
tracking two independent line counters (old file, new file) so that every added line gets its real
line number in the new file. That number is what lets a comment point at `Line 8` instead of "somewhere
in this hunk". Only added lines are linted - you don't want to flag a `console.log` someone is
*deleting*.

## The honest part

Two things the pretty output does not make obvious, both verified by running the tool:

**1. In mock mode the "LLM" isn't reviewing anything - it's matching filenames.** `reviewWithMock`
only produces comments for paths containing `auth.ts` or `user-handler.js`, and the comments are
pre-written to fit exactly what's in those two sample diffs. Run the tool on any other file and the
`llm` source vanishes entirely:

```bash
$ npm run demo -- --file your-own.diff
# every comment says "Source: linter" - not one "Source: llm"
```

So the `Source: llm` lines you see in the sample output are staged. They exist to show what a real
model's contribution *would look like* alongside the linter, not to demonstrate any analysis. Only
[live mode](#live-mode) produces genuine LLM findings on arbitrary input. This is the same pattern
as the earlier projects: the mock proves the *shape* of the pipeline, not the intelligence in it.

**2. The linter reads text, not code - so it has no idea what a string or a comment is.** The rules
are raw regexes with no lexer, which means they fire inside places that aren't code at all:

```
const note = "we used to write a == b";   // flagged: loose equality  (it's in a string)
// TODO: don't use == here                 // flagged twice: TODO *and* loose equality
log("check the console.log docs");         // flagged: console statement (it's in a string)
if x == 5:                                 # flagged as JS loose-equality (it's valid Python)
```

Every one of those is a false positive, and they're not bugs to fix so much as the *inherent ceiling*
of regex linting: without parsing the language you cannot tell code from a string that looks like
code. Real linters (ESLint, Ruff) build an AST first for exactly this reason. The lesson to take to
the next project: **a check is only as trustworthy as the structure it understands.** This one
understands lines of text, so it's honest about roughly that much.

## Live mode

```bash
cp .env.example .env
# add ONE of:
#   OPENAI_API_KEY=sk-...       → uses gpt-4o-mini
#   ANTHROPIC_API_KEY=sk-ant-... → uses claude-3-5-haiku
npm run demo
```

`detectProvider()` picks OpenAI if its key is set, else Anthropic, else mock - so with a key present
the `llm` comments become real, per-diff analysis instead of the canned matches. Both providers get
the same prompt (`llm-reviewer.ts`): review the diff, return a JSON array of `{ file, line, severity,
message, suggestion }`. Note the OpenAI path uses JSON mode and then digs the array out of the
wrapper object - a reminder from project 01 that "JSON mode" guarantees valid JSON, not the *shape*
you asked for, so the code defends against both `[...]` and `{ findings: [...] }`.

## Files

```
src/
  types.ts        ReviewComment / ParsedDiff / Hunk - the shared shapes
  parser.ts       unified diff → structured data, with real new-file line numbers
  linter.ts       the five regex rules (deterministic, source: 'linter')
  llm-reviewer.ts OpenAI / Anthropic / mock, all returning source: 'llm'
  formatter.ts    pretty terminal report and JSON
  index.ts        CLI: load diff → parse → lint → LLM → merge → format
samples/
  sample1-auth.diff   hardcoded key, missing await, console.log, loose equality
  sample2-user.diff   unused variable, loose equality, null check
tests/
  parser.test.ts, linter.test.ts, formatter.test.ts
```

`RESEARCH.md` and `PLAN.md` record the background and design decisions.

## Where to go next

- Run the tool on a real diff from one of your own repos (`git diff > x.diff; npm run demo -- --file x.diff`)
  and count the linter's false positives. That gap between "flagged" and "actually wrong" is the case
  for AST-based tools.
- Add a rule to `linter.ts` - a regex plus a severity - and a test for it. Then try to write one that
  *doesn't* misfire on strings, and feel where regex runs out.
- With a key set, diff the two review sources on the same input: what does the model catch that the
  linter can't, and what does it hallucinate that the linter never would?
