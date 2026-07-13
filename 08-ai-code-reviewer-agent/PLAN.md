# AI Code Reviewer Agent — Implementation Plan

## V1 Goals

Build a working code reviewer that:
1. Parses git unified diffs into structured data
2. Runs deterministic linter checks (no API needed)
3. Optionally runs LLM-based review (OpenAI/Anthropic if key present, mock otherwise)
4. Outputs structured JSON + pretty terminal report
5. Works 100% offline with bundled sample diffs

## File Layout

```
08-ai-code-reviewer-agent/
├── RESEARCH.md              # Completed
├── PLAN.md                  # This file
├── README.md                # Usage docs with example output
├── package.json             # Dependencies, scripts
├── tsconfig.json            # TypeScript config (ESM)
├── .env.example             # Template for API keys
├── .gitignore               # node_modules, .env, dist
├── vitest.config.ts         # Test configuration
├── src/
│   ├── index.ts             # Main entry point, CLI runner
│   ├── parser.ts            # Diff parser (unified diff → structured)
│   ├── linter.ts            # Deterministic static checks
│   ├── llm-reviewer.ts      # LLM integration (OpenAI/Anthropic/Mock)
│   ├── formatter.ts         # JSON + pretty terminal output
│   └── types.ts             # Shared TypeScript types
├── samples/                 # Bundled test diffs
│   ├── sample1-auth.diff    # Auth service with planted issues
│   └── sample2-user.diff    # User handler with issues
└── tests/
    ├── parser.test.ts       # Diff parsing tests
    ├── linter.test.ts       # Static analysis tests
    └── formatter.test.ts    # Output formatting tests
```

## Component Design

### 1. Types (`types.ts`)

```typescript
export interface ParsedDiff {
  files: FileChange[];
}

export interface FileChange {
  path: string;           // File path (new file)
  oldPath?: string;       // For renames
  hunks: Hunk[];
}

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  newLineNumber?: number; // Line in new file (for 'add' and 'context')
  oldLineNumber?: number; // Line in old file (for 'remove' and 'context')
}

export interface ReviewComment {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  source: 'linter' | 'llm';
}

export interface ReviewResult {
  comments: ReviewComment[];
  summary: {
    filesReviewed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}
```

### 2. Parser (`parser.ts`)

Functions:
- `parseDiff(diffText: string): ParsedDiff`
  - Split by file headers (`diff --git`)
  - Extract file paths from `+++` and `---` lines
  - Parse hunk headers (`@@ -x,y +a,b @@`)
  - Track line numbers for each diff line
  - Return structured representation

Algorithm:
1. Split input into file blocks
2. For each file, extract path and hunks
3. For each hunk, parse header and lines
4. Track cumulative line numbers (add/remove affect position)

### 3. Linter (`linter.ts`)

Functions:
- `runLinter(parsedDiff: ParsedDiff): ReviewComment[]`

Rules (regex-based, check added lines only):
1. **Hardcoded secrets** — `/(password|api_key|secret|token)\s*=\s*["'][^"']+["']/i`
2. **Equality operators** — `/[^=!]==[^=]|[^!]!=[^=]/` (JS/TS)
3. **Console statements** — `/console\.(log|warn|error|debug)/`
4. **Missing await** — Heuristic: line has `.then(` without `await`
5. **TODO/FIXME** — `/\/\/\s*(TODO|FIXME|HACK)/i`

Return ReviewComment array with source='linter'.

### 4. LLM Reviewer (`llm-reviewer.ts`)

Functions:
- `reviewWithLLM(parsedDiff: ParsedDiff): Promise<ReviewComment[]>`

Mode detection:
1. Check `OPENAI_API_KEY` env var → use OpenAI GPT-4
2. Else check `ANTHROPIC_API_KEY` → use Anthropic Claude
3. Else use MOCK mode

**Mock implementation:**
- Hash the diff content or match file paths
- Return canned comments for known sample diffs
- Example: If file contains "auth.ts" and "API_KEY", return comment about hardcoded secrets

**Live implementation:**
- Format diff into prompt:
  ```
  Review the following code changes. Focus on:
  - Logic errors and edge cases
  - Security concerns
  - Performance issues
  - Code clarity and maintainability
  
  Return JSON array of findings with: file, line, severity, message, suggestion.
  
  Diff:
  {formatted diff with file paths and line numbers}
  ```
- Parse structured JSON response
- Map to ReviewComment[] with source='llm'

### 5. Formatter (`formatter.ts`)

Functions:
- `formatJSON(result: ReviewResult): string` — JSON.stringify
- `formatPretty(result: ReviewResult): string` — Terminal report

Pretty format:
```
[MODE: MOCK — no API key] or [MODE: LIVE — OpenAI GPT-4]

Code Review Results
===================

📁 samples/auth.ts
  ❌ Line 12 [ERROR] Hardcoded API key detected
     Suggestion: Use environment variables
     Source: linter
  
  ⚠️  Line 18 [WARNING] Using == instead of ===
     Source: linter

📁 samples/user.js
  ℹ️  Line 5 [INFO] Consider adding error handling
     Source: llm

Summary:
  Files reviewed: 2
  Errors: 1
  Warnings: 1
  Info: 1
```

Use `chalk` for colors:
- Red (error), Yellow (warning), Blue (info)
- Dim for "Source:" line

### 6. Main Entry (`index.ts`)

CLI interface:
```bash
npm run demo                    # Review sample1-auth.diff
npm run demo -- sample2         # Review specific sample
npm run demo -- --file path.diff # Review custom diff file
npm run demo -- --json          # JSON output only
```

Flow:
1. Parse arguments or default to sample1
2. Read diff file
3. Parse diff → ParsedDiff
4. Run linter → ReviewComment[]
5. Run LLM reviewer → ReviewComment[]
6. Combine results
7. Generate summary stats
8. Format and print (pretty by default, JSON if --json)

## Sample Diffs Content

### `samples/sample1-auth.diff`

```diff
diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,10 +1,15 @@
 import { User } from './types';
 
+// TODO: Move this to config
+const API_KEY = "sk-1234567890abcdefghijklmnop";
+
 export async function authenticate(token: string): Promise<User | null> {
-  const response = await fetch('/api/auth', {
+  console.log('Authenticating user...');
+  const response = fetch('/api/auth', {
     headers: { Authorization: `Bearer ${token}` }
   });
   
-  if (response.status == 200) {
+  // Check if authentication succeeded
+  if (response.status == 200) {
     return response.json();
   }
```

Issues: hardcoded key, missing await, console.log, == operator, TODO

### `samples/sample2-user.diff`

```diff
diff --git a/lib/user-handler.js b/lib/user-handler.js
index aaa111..bbb222 100644
--- a/lib/user-handler.js
+++ b/lib/user-handler.js
@@ -5,8 +5,10 @@ function updateUser(userId, data) {
     throw new Error('Invalid user ID');
   }
   
-  const result = db.update('users', userId, data);
-  return result;
+  const timestamp = Date.now();
+  const result = db.update('users', userId, data);
+  
+  if (result != null) {
+    return result;
+  }
 }
```

Issues: unused variable (timestamp), != operator

## Demo Command

`npm run demo`:
1. Print mode banner
2. Review sample1-auth.diff
3. Run both linter and LLM reviewer
4. Print pretty report
5. Exit with code 0

## Test Suite (`vitest`)

### `tests/parser.test.ts`
- Parse simple diff with one file, one hunk
- Extract correct file path
- Track line numbers correctly (add/remove)
- Handle multiple files
- Handle empty diff

### `tests/linter.test.ts`
- Detect hardcoded secret pattern
- Flag == operator in JS
- Catch console.log statements
- Identify TODO comments
- Flag missing await (simple heuristic)
- Return correct file/line/severity

### `tests/formatter.test.ts`
- Format JSON output correctly
- Pretty output includes file name
- Severity labels present
- Summary stats correct

All tests must pass offline with no API keys.

## Dependencies

```json
{
  "dependencies": {
    "chalk": "^5.3.0",           // Terminal colors
    "dotenv": "^16.4.5",         // Load .env files
    "@anthropic-ai/sdk": "^0.24.0", // Claude API (optional)
    "openai": "^4.52.0"          // OpenAI API (optional)
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "tsx": "^4.15.7",            // Run TS directly
    "vitest": "^1.6.0",          // Testing
    "@types/node": "^20.14.9"
  }
}
```

## Stretch Goals (v2+)

Not implementing in v1, but noted for learning:
- Auto-fix suggestions (apply patches)
- Multi-file cross-reference analysis
- Integration with GitHub PR API
- Custom rule configuration (YAML)
- Support for other languages (Python, Go, Rust)
- Parallel review of multiple files
- Incremental review (only changed lines)
- Web UI for review results
- Metrics dashboard (issue trends over time)
- CI/CD integration (exit non-zero on errors)

## Success Criteria

✅ `npm install` succeeds  
✅ `npm run demo` runs and prints review report (offline, no keys)  
✅ `npm test` passes all tests  
✅ README.md shows a short, honest slice of real output (not a full pasted dump)  
✅ Both linter and LLM-mock return findings for sample diffs  
✅ Pretty output is readable and color-coded  
✅ JSON output is valid and matches schema  
✅ Works on macOS arm64 with Node v22  
