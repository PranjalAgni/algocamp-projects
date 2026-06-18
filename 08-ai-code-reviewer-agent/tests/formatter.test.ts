/**
 * Formatter tests - verify output formatting
 */

import { describe, it, expect } from 'vitest';
import { formatJSON, formatPretty, calculateSummary } from '../src/formatter.js';
import type { ReviewResult, ReviewComment } from '../src/types.js';

describe('formatJSON', () => {
  it('should produce valid JSON', () => {
    const result: ReviewResult = {
      comments: [
        {
          file: 'test.js',
          line: 5,
          severity: 'error',
          message: 'Test error',
          source: 'linter'
        }
      ],
      summary: {
        filesReviewed: 1,
        errors: 1,
        warnings: 0,
        infos: 0
      }
    };

    const json = formatJSON(result);
    const parsed = JSON.parse(json);

    expect(parsed.comments).toHaveLength(1);
    expect(parsed.comments[0].message).toBe('Test error');
    expect(parsed.summary.errors).toBe(1);
  });
});

describe('formatPretty', () => {
  it('should include mode banner', () => {
    const result: ReviewResult = {
      comments: [],
      summary: {
        filesReviewed: 1,
        errors: 0,
        warnings: 0,
        infos: 0
      }
    };

    const output = formatPretty(result, 'MOCK — no API key');

    expect(output).toContain('[MODE: MOCK — no API key]');
  });

  it('should display file name', () => {
    const result: ReviewResult = {
      comments: [
        {
          file: 'src/auth.ts',
          line: 10,
          severity: 'error',
          message: 'Test issue',
          source: 'linter'
        }
      ],
      summary: {
        filesReviewed: 1,
        errors: 1,
        warnings: 0,
        infos: 0
      }
    };

    const output = formatPretty(result, 'MOCK');

    expect(output).toContain('src/auth.ts');
  });

  it('should display line numbers and severity', () => {
    const result: ReviewResult = {
      comments: [
        {
          file: 'test.js',
          line: 42,
          severity: 'warning',
          message: 'Test warning',
          source: 'llm'
        }
      ],
      summary: {
        filesReviewed: 1,
        errors: 0,
        warnings: 1,
        infos: 0
      }
    };

    const output = formatPretty(result, 'MOCK');

    expect(output).toContain('Line 42');
    expect(output).toContain('WARNING');
  });

  it('should include suggestions when present', () => {
    const result: ReviewResult = {
      comments: [
        {
          file: 'test.js',
          line: 5,
          severity: 'error',
          message: 'Test error',
          suggestion: 'Fix it like this',
          source: 'linter'
        }
      ],
      summary: {
        filesReviewed: 1,
        errors: 1,
        warnings: 0,
        infos: 0
      }
    };

    const output = formatPretty(result, 'MOCK');

    expect(output).toContain('Suggestion:');
    expect(output).toContain('Fix it like this');
  });

  it('should display summary statistics', () => {
    const result: ReviewResult = {
      comments: [
        {
          file: 'test.js',
          line: 1,
          severity: 'error',
          message: 'Error 1',
          source: 'linter'
        },
        {
          file: 'test.js',
          line: 2,
          severity: 'warning',
          message: 'Warning 1',
          source: 'linter'
        },
        {
          file: 'test.js',
          line: 3,
          severity: 'info',
          message: 'Info 1',
          source: 'llm'
        }
      ],
      summary: {
        filesReviewed: 2,
        errors: 1,
        warnings: 1,
        infos: 1
      }
    };

    const output = formatPretty(result, 'MOCK');

    expect(output).toContain('Files reviewed: 2');
    expect(output).toContain('Errors: 1');
    expect(output).toContain('Warnings: 1');
    expect(output).toContain('Info: 1');
  });

  it('should show success message when no issues found', () => {
    const result: ReviewResult = {
      comments: [],
      summary: {
        filesReviewed: 1,
        errors: 0,
        warnings: 0,
        infos: 0
      }
    };

    const output = formatPretty(result, 'MOCK');

    expect(output).toContain('No issues found');
  });
});

describe('calculateSummary', () => {
  it('should count errors, warnings, and infos correctly', () => {
    const comments: ReviewComment[] = [
      { file: 'a.js', line: 1, severity: 'error', message: 'E1', source: 'linter' },
      { file: 'a.js', line: 2, severity: 'error', message: 'E2', source: 'linter' },
      { file: 'a.js', line: 3, severity: 'warning', message: 'W1', source: 'linter' },
      { file: 'a.js', line: 4, severity: 'info', message: 'I1', source: 'llm' }
    ];

    const summary = calculateSummary(comments, 2);

    expect(summary.filesReviewed).toBe(2);
    expect(summary.errors).toBe(2);
    expect(summary.warnings).toBe(1);
    expect(summary.infos).toBe(1);
  });

  it('should handle empty comments', () => {
    const summary = calculateSummary([], 3);

    expect(summary.filesReviewed).toBe(3);
    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
    expect(summary.infos).toBe(0);
  });
});
