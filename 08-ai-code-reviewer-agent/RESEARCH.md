# AI Code Reviewer Agent - Research

## Concept

An automated code reviewer that analyzes git diffs and produces structured feedback, similar to commercial tools like CodeRabbit, Danger.js, or GitHub Advanced Security. Combines deterministic static analysis with LLM-based contextual review.

## Core Components

### 1. Diff Parsing
Git unified diff format structure:
```
diff --git a/file.js b/file.js
index abc123..def456 100644
--- a/file.js
+++ b/file.js
@@ -10,7 +10,8 @@ function example() {
- removed line
+ added line
  context line
```

Key elements to extract:
- File paths (from `diff --git` and `+++`/`---` lines)
- Hunk headers (`@@` lines) with line number ranges
- Changed lines (prefixed with `+` or `-`)
- Context lines (prefixed with space)

**Libraries considered:**
- `diff-parser` (npm) - mature parser for unified diff format
- `parse-diff` (npm) - similar, lightweight
- **Custom parser** - Educational value for learning; diffs are text-based and parseable with regex

**Decision:** Custom parser for learning, with regex-based extraction of files, hunks, and line numbers.

### 2. Deterministic Static Analysis (Linter Rules)

Regex/heuristic-based checks that don't require LLM:
- **Hardcoded secrets:** Detect `password = "..."`, `API_KEY = "..."`, AWS keys pattern
- **Equality operators:** Flag `==` or `!=` in JS/TS (should use `===`/`!==`)
- **Unused imports/variables:** Common linting issue
- **Missing await:** `async` functions without `await` calls
- **Console statements:** `console.log`, `console.error` left in code
- **TODO/FIXME comments:** Flag for tracking

**Advantages:**
- Zero latency, no API cost
- Deterministic, consistent results
- Works offline without any dependencies
- Catches common mechanical issues reliably

### 3. LLM-Based Review

Uses natural language understanding to catch:
- Logic errors and edge cases
- Poor naming or unclear code
- Missing error handling
- Performance issues
- Architecture/design concerns

**API Options:**
- **OpenAI** (`openai` npm package) - gpt-4o-mini, structured output via JSON mode
- **Anthropic** (`@anthropic-ai/sdk`) - Claude, strong at code analysis
- **Local models** - Ollama, LM Studio (requires setup)

**Decision:** Support both OpenAI and Anthropic with MOCK fallback when no key present.

### 4. Mock Mode Strategy

To satisfy the "zero API keys" requirement, implement deterministic mock reviews:
- Match against bundled sample diffs by file path or content signature
- Return pre-written comments that align with planted issues
- Use simple hash/pattern matching to key canned responses
- Print `[MODE: MOCK — no API key]` banner

This allows the full pipeline (parse → lint → review → format → output) to run offline.

### 5. Output Format

**Structured JSON schema:**
```typescript
interface ReviewComment {
  file: string;           // Path to file
  line: number;           // Line number in new file
  severity: 'error' | 'warning' | 'info';
  message: string;        // What's wrong
  suggestion?: string;    // How to fix (optional)
  source: 'linter' | 'llm'; // Which reviewer caught it
}
```

**Pretty terminal report:**
- Group by file
- Color-coded severity (red=error, yellow=warning, blue=info)
- Show line numbers and excerpts
- Summary stats at the end

**Libraries considered:**
- `chalk` - Terminal colors
- `cli-table3` - Tables
- `boxen` - Bordered boxes
- **Custom formatting** - Use ANSI codes directly for learning

**Decision:** Use `chalk` for colors (very common), custom formatting for the rest.

## Sample Diffs Design

Create 2-3 bundled sample diffs with intentional issues:

**Sample 1: Authentication Service** (auth.ts)
- Hardcoded API key
- Missing `await` on async call
- `==` instead of `===`
- `console.log` left in production code

**Sample 2: User Handler** (user-handler.js)
- Unused variable
- Equality operator (`!=` vs `!==`)
- Missing error handling (try/catch)

These serve as:
1. Demo data for `npm run demo`
2. Test fixtures for parser and linter tests
3. Known inputs for mock LLM responses

## Learning Objectives

1. **Diff parsing:** Understanding git's unified diff format
2. **Static analysis:** Pattern matching for common code smells
3. **LLM integration:** Structured prompting for code review
4. **Mock patterns:** Building offline-capable tools with API fallbacks
5. **Output formatting:** Creating readable terminal reports

## Practical Assumptions

- Focus on JavaScript/TypeScript diffs (extensible to other languages)
- Single-file review scope (not cross-file analysis)
- Line-level comments (not character-level suggestions)
- English comments/messages only
- No fix application (review only, not auto-fix)

## References

- [Git Diff Format](https://git-scm.com/docs/diff-format)
- [CodeRabbit](https://coderabbit.ai) - Commercial AI code reviewer
- [Danger.js](https://danger.systems/js/) - Automated PR reviewer
- [ESLint](https://eslint.org) - Static analysis patterns
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
