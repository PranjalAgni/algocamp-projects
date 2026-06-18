/**
 * Linter tests - verify static analysis rules
 */

import { describe, it, expect } from 'vitest';
import { runLinter } from '../src/linter.js';
import { parseDiff } from '../src/parser.js';

describe('runLinter', () => {
  it('should detect hardcoded secrets', () => {
    const diff = `diff --git a/config.js b/config.js
index abc..def 100644
--- a/config.js
+++ b/config.js
@@ -1,1 +1,2 @@
 export default {
+  api_key: "sk-1234567890",
 };`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const secretComment = comments.find(c => c.message.includes('secret'));
    expect(secretComment).toBeDefined();
    expect(secretComment?.severity).toBe('error');
    expect(secretComment?.file).toBe('config.js');
    expect(secretComment?.source).toBe('linter');
  });

  it('should flag loose equality operators', () => {
    const diff = `diff --git a/check.js b/check.js
index abc..def 100644
--- a/check.js
+++ b/check.js
@@ -1,2 +1,3 @@
 function check(x) {
+  if (x == 5) return true;
   return false;`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const equalityComment = comments.find(c => c.message.includes('equality'));
    expect(equalityComment).toBeDefined();
    expect(equalityComment?.severity).toBe('warning');
    expect(equalityComment?.line).toBe(2);
  });

  it('should detect console statements', () => {
    const diff = `diff --git a/debug.js b/debug.js
index abc..def 100644
--- a/debug.js
+++ b/debug.js
@@ -1,2 +1,3 @@
 function process(data) {
+  console.log('Processing:', data);
   return data * 2;`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const consoleComment = comments.find(c => c.message.includes('console'));
    expect(consoleComment).toBeDefined();
    expect(consoleComment?.severity).toBe('warning');
  });

  it('should flag TODO comments', () => {
    const diff = `diff --git a/todo.js b/todo.js
index abc..def 100644
--- a/todo.js
+++ b/todo.js
@@ -1,2 +1,3 @@
 function implement() {
+  // TODO: Finish implementation
   return null;`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const todoComment = comments.find(c => c.message.includes('TODO'));
    expect(todoComment).toBeDefined();
    expect(todoComment?.severity).toBe('info');
  });

  it('should detect missing await with .then()', () => {
    const diff = `diff --git a/async.js b/async.js
index abc..def 100644
--- a/async.js
+++ b/async.js
@@ -1,3 +1,4 @@
 async function getData() {
+  fetch('/api').then(r => r.json());
   return data;
 }`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const awaitComment = comments.find(c => c.message.includes('await'));
    expect(awaitComment).toBeDefined();
    expect(awaitComment?.severity).toBe('warning');
  });

  it('should not flag lines with await + .then()', () => {
    const diff = `diff --git a/async.js b/async.js
index abc..def 100644
--- a/async.js
+++ b/async.js
@@ -1,3 +1,4 @@
 async function getData() {
+  const data = await fetch('/api').then(r => r.json());
   return data;
 }`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    const awaitComment = comments.find(c => c.message.includes('await'));
    expect(awaitComment).toBeUndefined();
  });

  it('should return multiple comments for multiple issues', () => {
    const diff = `diff --git a/bad.js b/bad.js
index abc..def 100644
--- a/bad.js
+++ b/bad.js
@@ -1,3 +1,6 @@
+const password = "secret123";
 function check(x) {
+  console.log(x);
+  if (x == 5) return true;
   return false;
 }`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    expect(comments.length).toBeGreaterThanOrEqual(3);
    expect(comments.some(c => c.message.includes('secret'))).toBe(true);
    expect(comments.some(c => c.message.includes('console'))).toBe(true);
    expect(comments.some(c => c.message.includes('equality'))).toBe(true);
  });

  it('should only check added lines, not removed or context', () => {
    const diff = `diff --git a/test.js b/test.js
index abc..def 100644
--- a/test.js
+++ b/test.js
@@ -1,3 +1,3 @@
-console.log('old');
+// comment
 const x = 1;`;

    const parsed = parseDiff(diff);
    const comments = runLinter(parsed);

    // Should not flag the removed console.log
    expect(comments.length).toBe(0);
  });
});
