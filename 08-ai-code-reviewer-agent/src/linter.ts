/**
 * Linter - deterministic static analysis rules
 *
 * Runs regex-based checks on added lines to catch common issues:
 * - Hardcoded secrets
 * - Equality operator misuse (== vs ===)
 * - Console statements left in code
 * - TODO/FIXME comments
 * - Missing await (heuristic)
 */

import type { ParsedDiff, ReviewComment } from './types.js';
import { getAddedLines } from './parser.js';

/**
 * Linter rule definition
 */
interface LinterRule {
  name: string;
  pattern: RegExp;
  severity: 'error' | 'warning' | 'info';
  message: (match: RegExpMatchArray) => string;
  suggestion?: string;
}

/**
 * Built-in linter rules
 */
const LINTER_RULES: LinterRule[] = [
  // Hardcoded secrets (high severity)
  {
    name: 'hardcoded-secret',
    pattern: /(password|api_key|secret|token|apikey)\s*[:=]\s*["'][^"']+["']/i,
    severity: 'error',
    message: () => 'Hardcoded secret detected - credentials should be stored in environment variables',
    suggestion: 'Use environment variables (process.env) or a secure configuration management system'
  },

  // Equality operators (should use === in JS/TS)
  {
    name: 'loose-equality',
    pattern: /[^=!<>]==[^=]|[^!=]==[^=]|[^!]!=[^=]/,
    severity: 'warning',
    message: () => 'Using loose equality operator (== or !=) instead of strict (=== or !==)',
    suggestion: 'Replace == with === and != with !== to avoid type coercion bugs'
  },

  // Console statements (should be removed in production)
  {
    name: 'console-statement',
    pattern: /console\.(log|warn|error|debug|info|trace)/,
    severity: 'warning',
    message: (match) => `console.${match[1]}() statement found - remove before production`,
    suggestion: 'Use a proper logging library or remove debug statements'
  },

  // TODO/FIXME comments
  {
    name: 'todo-comment',
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
    severity: 'info',
    message: (match) => `${match[1]} comment found - consider addressing or creating a task`,
    suggestion: 'Create a tracking ticket for this item'
  },

  // Missing await (simple heuristic - line contains .then( without await)
  {
    name: 'missing-await',
    pattern: /^(?!.*await).*\.then\(/,
    severity: 'warning',
    message: () => 'Promise chain without await - consider using async/await syntax',
    suggestion: 'Use await instead of .then() for better readability'
  }
];

/**
 * Run all linter rules on a parsed diff
 */
export function runLinter(parsedDiff: ParsedDiff): ReviewComment[] {
  const comments: ReviewComment[] = [];
  const addedLines = getAddedLines(parsedDiff);

  for (const { file, line, content } of addedLines) {
    // Run each rule on this line
    for (const rule of LINTER_RULES) {
      const match = content.match(rule.pattern);
      if (match) {
        comments.push({
          file,
          line,
          severity: rule.severity,
          message: rule.message(match),
          suggestion: rule.suggestion,
          source: 'linter'
        });
      }
    }
  }

  return comments;
}

/**
 * Get list of available linter rules (for documentation/testing)
 */
export function getLinterRules(): Array<{ name: string; description: string }> {
  return LINTER_RULES.map(rule => ({
    name: rule.name,
    description: rule.message([])
  }));
}
