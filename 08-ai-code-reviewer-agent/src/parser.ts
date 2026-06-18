/**
 * Diff Parser - converts git unified diff format into structured data
 *
 * Unified diff format structure:
 * - File headers: diff --git a/path b/path
 * - File markers: --- a/path, +++ b/path
 * - Hunk headers: @@ -oldStart,oldLines +newStart,newLines @@
 * - Lines: prefixed with ' ' (context), '-' (removed), '+' (added)
 */

import type { ParsedDiff, FileChange, Hunk, DiffLine } from './types.js';

/**
 * Parse a unified diff string into structured data
 */
export function parseDiff(diffText: string): ParsedDiff {
  const lines = diffText.split('\n');
  const files: FileChange[] = [];

  let currentFile: FileChange | null = null;
  let currentHunk: Hunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header: diff --git a/path b/path
    if (line.startsWith('diff --git ')) {
      // Save previous hunk to current file
      if (currentHunk && currentFile) {
        currentFile.hunks.push(currentHunk);
        currentHunk = null;
      }

      // Save previous file if exists
      if (currentFile && currentFile.hunks.length > 0) {
        files.push(currentFile);
      }

      // Start new file (path will be extracted from +++ line)
      currentFile = { path: '', hunks: [] };
      currentHunk = null;
      continue;
    }

    // New file path marker: +++ b/path
    if (line.startsWith('+++ ')) {
      if (currentFile) {
        // Extract path after "b/" prefix
        const match = line.match(/^\+\+\+ b\/(.+)$/);
        currentFile.path = match ? match[1] : line.substring(4);
      }
      continue;
    }

    // Old file path marker: --- a/path
    if (line.startsWith('--- ')) {
      if (currentFile) {
        const match = line.match(/^--- a\/(.+)$/);
        currentFile.oldPath = match ? match[1] : line.substring(4);
      }
      continue;
    }

    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match && currentFile) {
        // Save previous hunk if exists
        if (currentHunk) {
          currentFile.hunks.push(currentHunk);
        }

        // Parse hunk header
        const oldStart = parseInt(match[1], 10);
        const oldLines = match[2] ? parseInt(match[2], 10) : 1;
        const newStart = parseInt(match[3], 10);
        const newLines = match[4] ? parseInt(match[4], 10) : 1;

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          lines: []
        };

        // Initialize line counters for this hunk
        oldLineNum = oldStart;
        newLineNum = newStart;
      }
      continue;
    }

    // Diff line content (must have a current hunk)
    if (currentHunk && currentFile) {
      // Added line: starts with '+'
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.substring(1), // Remove '+' prefix
          newLineNumber: newLineNum
        });
        newLineNum++;
      }
      // Removed line: starts with '-'
      else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'remove',
          content: line.substring(1), // Remove '-' prefix
          oldLineNumber: oldLineNum
        });
        oldLineNum++;
      }
      // Context line: starts with ' ' (or empty for context)
      else if (line.startsWith(' ') || (line === '' && currentHunk.lines.length > 0)) {
        currentHunk.lines.push({
          type: 'context',
          content: line.substring(1), // Remove ' ' prefix
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum
        });
        oldLineNum++;
        newLineNum++;
      }
    }
  }

  // Save final hunk and file
  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile && currentFile.hunks.length > 0) {
    files.push(currentFile);
  }

  return { files };
}

/**
 * Extract all added lines from a parsed diff (useful for linting)
 * Returns array of { file, line, content }
 */
export function getAddedLines(parsedDiff: ParsedDiff): Array<{ file: string; line: number; content: string }> {
  const addedLines: Array<{ file: string; line: number; content: string }> = [];

  for (const file of parsedDiff.files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add' && line.newLineNumber !== undefined) {
          addedLines.push({
            file: file.path,
            line: line.newLineNumber,
            content: line.content
          });
        }
      }
    }
  }

  return addedLines;
}
