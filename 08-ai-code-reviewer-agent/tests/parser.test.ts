/**
 * Parser tests - verify diff parsing logic
 */

import { describe, it, expect } from 'vitest';
import { parseDiff, getAddedLines } from '../src/parser.js';

describe('parseDiff', () => {
  it('should parse a simple single-file diff', () => {
    const diff = `diff --git a/test.js b/test.js
index abc123..def456 100644
--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 function hello() {
+  console.log('world');
   return 'hello';
 }`;

    const result = parseDiff(diff);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('test.js');
    expect(result.files[0].hunks).toHaveLength(1);
  });

  it('should extract correct file paths', () => {
    const diff = `diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,2 +1,3 @@
 import { User } from './types';
+const API_KEY = "secret";`;

    const result = parseDiff(diff);

    expect(result.files[0].path).toBe('src/auth.ts');
    expect(result.files[0].oldPath).toBe('src/auth.ts');
  });

  it('should track line numbers correctly for added lines', () => {
    const diff = `diff --git a/test.js b/test.js
index abc..def 100644
--- a/test.js
+++ b/test.js
@@ -10,5 +10,7 @@ function example() {
   const x = 1;
+  const y = 2;
   const z = 3;
+  const w = 4;
 }`;

    const result = parseDiff(diff);
    const hunk = result.files[0].hunks[0];

    // Find added lines
    const addedLines = hunk.lines.filter(l => l.type === 'add');

    expect(addedLines).toHaveLength(2);
    expect(addedLines[0].newLineNumber).toBe(11); // After line 10
    expect(addedLines[1].newLineNumber).toBe(13); // After line 12 (context)
  });

  it('should handle multiple files in one diff', () => {
    const diff = `diff --git a/file1.js b/file1.js
index aaa..bbb 100644
--- a/file1.js
+++ b/file1.js
@@ -1,1 +1,2 @@
 const a = 1;
+const b = 2;
diff --git a/file2.js b/file2.js
index ccc..ddd 100644
--- a/file2.js
+++ b/file2.js
@@ -1,1 +1,2 @@
 const x = 1;
+const y = 2;`;

    const result = parseDiff(diff);

    expect(result.files).toHaveLength(2);
    expect(result.files[0].path).toBe('file1.js');
    expect(result.files[1].path).toBe('file2.js');
  });

  it('should handle empty diff', () => {
    const result = parseDiff('');

    expect(result.files).toHaveLength(0);
  });

  it('should parse removed lines correctly', () => {
    const diff = `diff --git a/test.js b/test.js
index abc..def 100644
--- a/test.js
+++ b/test.js
@@ -5,3 +5,2 @@ function test() {
   const x = 1;
-  const y = 2;
   return x;`;

    const result = parseDiff(diff);
    const hunk = result.files[0].hunks[0];
    const removedLines = hunk.lines.filter(l => l.type === 'remove');

    expect(removedLines).toHaveLength(1);
    expect(removedLines[0].content).toBe('  const y = 2;');
    expect(removedLines[0].oldLineNumber).toBe(6);
  });
});

describe('getAddedLines', () => {
  it('should extract only added lines with correct line numbers', () => {
    const diff = `diff --git a/test.js b/test.js
index abc..def 100644
--- a/test.js
+++ b/test.js
@@ -1,3 +1,5 @@
 function hello() {
+  console.log('debug');
   return 'hello';
+  // comment
 }`;

    const parsed = parseDiff(diff);
    const added = getAddedLines(parsed);

    expect(added).toHaveLength(2);
    expect(added[0].file).toBe('test.js');
    expect(added[0].line).toBe(2);
    expect(added[0].content).toBe('  console.log(\'debug\');');
    expect(added[1].line).toBe(4);
  });

  it('should return empty array for diff with no additions', () => {
    const diff = `diff --git a/test.js b/test.js
index abc..def 100644
--- a/test.js
+++ b/test.js
@@ -1,3 +1,2 @@
 function hello() {
-  console.log('remove');
   return 'hello';`;

    const parsed = parseDiff(diff);
    const added = getAddedLines(parsed);

    expect(added).toHaveLength(0);
  });
});
