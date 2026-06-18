/**
 * Core type definitions for the code reviewer
 */

/**
 * A single line in a diff hunk
 */
export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  newLineNumber?: number; // Line number in new file (for 'add' and 'context')
  oldLineNumber?: number; // Line number in old file (for 'remove' and 'context')
}

/**
 * A hunk represents a contiguous block of changes within a file
 * Format: @@ -oldStart,oldLines +newStart,newLines @@
 */
export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

/**
 * A file change in the diff (one file being modified)
 */
export interface FileChange {
  path: string;           // File path in new version
  oldPath?: string;       // For renames (usually same as path)
  hunks: Hunk[];
}

/**
 * Complete parsed diff structure
 */
export interface ParsedDiff {
  files: FileChange[];
}

/**
 * Severity levels for review comments
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Source of the review comment (which reviewer generated it)
 */
export type Source = 'linter' | 'llm';

/**
 * A single review comment on a specific line
 */
export interface ReviewComment {
  file: string;           // File path
  line: number;           // Line number in new file
  severity: Severity;
  message: string;        // Description of the issue
  suggestion?: string;    // Optional fix suggestion
  source: Source;         // Which reviewer found this
}

/**
 * Complete review result with comments and summary statistics
 */
export interface ReviewResult {
  comments: ReviewComment[];
  summary: {
    filesReviewed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}
