# AI Code Reviewer Agent

An automated code reviewer that analyzes git diffs and provides structured feedback, similar to tools like CodeRabbit. Combines deterministic static analysis (linter rules) with optional LLM-based contextual review.

## Learning Objectives

This project teaches:
- **Diff parsing**: Understanding git's unified diff format
- **Static analysis**: Pattern matching for common code smells
- **LLM integration**: Structured prompting for code review with fallback modes
- **Mock patterns**: Building offline-capable tools with API fallbacks
- **Output formatting**: Creating readable terminal reports

## Features

- **Dual Review Sources**:
  - Deterministic linter rules (regex-based, no API needed)
  - LLM-based contextual review (OpenAI/Anthropic with mock fallback)
- **Offline-Ready**: Works 100% offline with bundled sample diffs in MOCK mode
- **Multiple Output Formats**: Pretty terminal output or JSON
- **Structured Feedback**: File, line number, severity, message, and suggestions
- **Extensible Rules**: Easy to add new linter patterns

## Installation

```bash
npm install
```

## Usage

### Run Demo (Default: sample1)

```bash
npm run demo
```

### Review Specific Sample

```bash
npm run demo -- sample2
```

### Review Custom Diff File

```bash
npm run demo -- --file path/to/your.diff
```

### JSON Output

```bash
npm run demo -- --json
```

### Run Tests

```bash
npm test
```

## Switching from MOCK to LIVE Mode

The tool automatically detects available API keys and selects the appropriate mode:

1. **OpenAI (GPT-4)**: Set `OPENAI_API_KEY` in `.env`
2. **Anthropic (Claude)**: Set `ANTHROPIC_API_KEY` in `.env`
3. **Mock Mode**: No keys (default) — uses deterministic responses

Create a `.env` file (see `.env.example`):

```bash
cp .env.example .env
# Edit .env and add your API key
```

## Example Output

### Sample 1: Authentication Service (sample1-auth.diff)

```
[MODE: MOCK — no API key]

Code Review Results
==================================================

📁 src/auth.ts
  ℹ️  Line 3 [INFO] TODO comment found - consider addressing or creating a task
     Suggestion: Create a tracking ticket for this item
     Source: linter
  ⚠️  Line 3 [WARNING] No error handling for network request - fetch() can fail
     Suggestion: Wrap in try-catch block or add .catch() handler
     Source: llm
  ❌ Line 4 [ERROR] Hardcoded secret detected - credentials should be stored in environment variables
     Suggestion: Use environment variables (process.env) or a secure configuration management system
     Source: linter
  ⚠️  Line 7 [WARNING] console.log() statement found - remove before production
     Suggestion: Use a proper logging library or remove debug statements
     Source: linter
  ❌ Line 8 [ERROR] Missing await on fetch() call - will return a Promise instead of Response
     Suggestion: Add await keyword: const response = await fetch(...)
     Source: llm
  ⚠️  Line 13 [WARNING] Using loose equality operator (== or !=) instead of strict (=== or !==)
     Suggestion: Replace == with === and != with !== to avoid type coercion bugs
     Source: linter

Summary:
  Files reviewed: 1
  Errors: 2
  Warnings: 3
  Info: 1
```

### Sample 2: User Handler (sample2-user.diff)

```
[MODE: MOCK — no API key]

Code Review Results
==================================================

📁 lib/user-handler.js
  ⚠️  Line 8 [WARNING] Variable "timestamp" is declared but never used
     Suggestion: Remove unused variable or use it in the update operation
     Source: llm
  ⚠️  Line 11 [WARNING] Using loose equality operator (== or !=) instead of strict (=== or !==)
     Suggestion: Replace == with === and != with !== to avoid type coercion bugs
     Source: linter
  ℹ️  Line 11 [INFO] Consider more specific error handling for null/undefined cases
     Suggestion: Add else branch to handle null case or throw descriptive error
     Source: llm

Summary:
  Files reviewed: 1
  Warnings: 2
  Info: 1
```

## Architecture

### Components

1. **Parser** (`src/parser.ts`): Parses git unified diff format into structured data
2. **Linter** (`src/linter.ts`): Runs deterministic regex-based checks
3. **LLM Reviewer** (`src/llm-reviewer.ts`): AI-powered contextual review with provider detection
4. **Formatter** (`src/formatter.ts`): Converts results to JSON or pretty terminal output
5. **Main Entry** (`src/index.ts`): CLI interface and orchestration

### Linter Rules

The deterministic linter catches:
- Hardcoded secrets (API keys, passwords, tokens)
- Loose equality operators (`==` vs `===`)
- Console statements left in code
- TODO/FIXME comments
- Missing await on promises (heuristic)

### Sample Diffs

Two bundled sample diffs with intentional issues:
- `samples/sample1-auth.diff`: Authentication service (hardcoded key, missing await, console.log)
- `samples/sample2-user.diff`: User handler (unused variable, loose equality)

## Project Structure

```
08-ai-code-reviewer-agent/
├── RESEARCH.md              # Background research and concepts
├── PLAN.md                  # Implementation plan and design
├── README.md                # This file
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
├── src/
│   ├── index.ts             # Main entry point
│   ├── parser.ts            # Diff parser
│   ├── linter.ts            # Static analysis rules
│   ├── llm-reviewer.ts      # LLM integration
│   ├── formatter.ts         # Output formatting
│   └── types.ts             # TypeScript types
├── samples/
│   ├── sample1-auth.diff    # Authentication sample
│   └── sample2-user.diff    # User handler sample
└── tests/
    ├── parser.test.ts       # Parser tests (8 tests)
    ├── linter.test.ts       # Linter tests (8 tests)
    └── formatter.test.ts    # Formatter tests (9 tests)
```

## Test Results

All 25 tests pass offline with no API keys:

```
 ✓ tests/parser.test.ts  (8 tests)
 ✓ tests/linter.test.ts  (8 tests)
 ✓ tests/formatter.test.ts  (9 tests)

 Test Files  3 passed (3)
      Tests  25 passed (25)
```

## Future Enhancements (v2+)

- Auto-fix suggestions (apply patches)
- Multi-file cross-reference analysis
- GitHub PR API integration
- Custom rule configuration (YAML)
- Support for more languages (Python, Go, Rust)
- Web UI for review results
- CI/CD integration (exit non-zero on errors)

## Environment

- Node.js v22.17.0
- TypeScript 5.5+
- ESM modules
- Tested on macOS arm64

## License

MIT
