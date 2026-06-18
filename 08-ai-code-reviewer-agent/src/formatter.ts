/**
 * Formatter - converts review results to JSON or pretty terminal output
 */

import chalk from 'chalk';
import type { ReviewResult, ReviewComment, Severity } from './types.js';

/**
 * Format review result as JSON string
 */
export function formatJSON(result: ReviewResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Get emoji/icon for severity
 */
function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️ ';
    case 'info':
      return 'ℹ️ ';
  }
}

/**
 * Get color function for severity
 */
function getSeverityColor(severity: Severity): (text: string) => string {
  switch (severity) {
    case 'error':
      return chalk.red;
    case 'warning':
      return chalk.yellow;
    case 'info':
      return chalk.blue;
  }
}

/**
 * Format a single review comment for pretty output
 */
function formatComment(comment: ReviewComment, indent: string = '  '): string {
  const icon = getSeverityIcon(comment.severity);
  const color = getSeverityColor(comment.severity);
  const severityLabel = comment.severity.toUpperCase();

  let output = '';
  output += `${indent}${icon} ${color(`Line ${comment.line}`)} ${chalk.dim(`[${severityLabel}]`)} ${comment.message}\n`;

  if (comment.suggestion) {
    output += `${indent}   ${chalk.dim('Suggestion:')} ${chalk.italic(comment.suggestion)}\n`;
  }

  output += `${indent}   ${chalk.dim(`Source: ${comment.source}`)}\n`;

  return output;
}

/**
 * Format review result as pretty terminal output
 */
export function formatPretty(result: ReviewResult, mode: string): string {
  let output = '';

  // Header with mode banner
  const banner = mode.includes('MOCK')
    ? chalk.yellow.bold(`[MODE: ${mode}]`)
    : chalk.green.bold(`[MODE: ${mode}]`);

  output += '\n' + banner + '\n\n';
  output += chalk.bold.underline('Code Review Results') + '\n';
  output += '='.repeat(50) + '\n\n';

  if (result.comments.length === 0) {
    output += chalk.green('✅ No issues found!\n\n');
  } else {
    // Group comments by file
    const commentsByFile = new Map<string, ReviewComment[]>();
    for (const comment of result.comments) {
      const existing = commentsByFile.get(comment.file) || [];
      existing.push(comment);
      commentsByFile.set(comment.file, existing);
    }

    // Sort files for consistent output
    const sortedFiles = Array.from(commentsByFile.keys()).sort();

    for (const file of sortedFiles) {
      const comments = commentsByFile.get(file)!;

      // File header
      output += chalk.cyan(`📁 ${file}`) + '\n';

      // Sort comments by line number
      const sortedComments = comments.sort((a, b) => a.line - b.line);

      for (const comment of sortedComments) {
        output += formatComment(comment);
      }

      output += '\n';
    }
  }

  // Summary section
  output += chalk.bold('Summary:') + '\n';
  output += `  Files reviewed: ${chalk.cyan(result.summary.filesReviewed.toString())}\n`;

  const { errors, warnings, infos } = result.summary;
  if (errors > 0) {
    output += `  Errors: ${chalk.red(errors.toString())}\n`;
  }
  if (warnings > 0) {
    output += `  Warnings: ${chalk.yellow(warnings.toString())}\n`;
  }
  if (infos > 0) {
    output += `  Info: ${chalk.blue(infos.toString())}\n`;
  }

  output += '\n';

  return output;
}

/**
 * Calculate summary statistics from comments
 */
export function calculateSummary(comments: ReviewComment[], filesReviewed: number) {
  const summary = {
    filesReviewed,
    errors: 0,
    warnings: 0,
    infos: 0
  };

  for (const comment of comments) {
    switch (comment.severity) {
      case 'error':
        summary.errors++;
        break;
      case 'warning':
        summary.warnings++;
        break;
      case 'info':
        summary.infos++;
        break;
    }
  }

  return summary;
}
