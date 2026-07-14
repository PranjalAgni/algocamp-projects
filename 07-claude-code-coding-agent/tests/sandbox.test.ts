/**
 * Tests for sandbox safety utilities
 */

import { describe, it, expect } from 'vitest';
import { isPathSafe, resolveSafePath, isCommandSafe } from '../src/sandbox.js';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

describe('Sandbox safety', () => {
  describe('isPathSafe', () => {
    it('should allow safe relative paths', () => {
      const sandbox = '/tmp/sandbox';
      expect(isPathSafe(sandbox, 'hello.js')).toBe(true);
      expect(isPathSafe(sandbox, 'subdir/file.txt')).toBe(true);
      expect(isPathSafe(sandbox, './file.js')).toBe(true);
    });

    it('should reject parent directory traversal', () => {
      const sandbox = '/tmp/sandbox';
      expect(isPathSafe(sandbox, '../etc/passwd')).toBe(false);
      expect(isPathSafe(sandbox, '../../etc/passwd')).toBe(false);
      expect(isPathSafe(sandbox, 'subdir/../../etc/passwd')).toBe(false);
    });

    it('should reject absolute paths outside sandbox', () => {
      const sandbox = '/tmp/sandbox';
      expect(isPathSafe(sandbox, '/etc/passwd')).toBe(false);
      expect(isPathSafe(sandbox, '/tmp/other')).toBe(false);
    });

    it('should reject sibling directories that share the root as a prefix', () => {
      // Regression: a bare startsWith(root) check treats "/tmp/sandbox-evil"
      // as inside "/tmp/sandbox" because the string prefix matches.
      const sandbox = '/tmp/sandbox';
      expect(isPathSafe(sandbox, '../sandbox-evil/secret')).toBe(false);
      expect(isPathSafe(sandbox, '../sandboxfile')).toBe(false);
    });

    it('should allow absolute paths inside sandbox', () => {
      const sandbox = '/tmp/sandbox';
      expect(isPathSafe(sandbox, '/tmp/sandbox/file.js')).toBe(true);
      expect(isPathSafe(sandbox, '/tmp/sandbox/subdir/file.js')).toBe(true);
    });
  });

  describe('resolveSafePath', () => {
    it('should resolve and validate safe paths', () => {
      const sandbox = mkdtempSync(path.join(tmpdir(), 'test-'));
      try {
        const resolved = resolveSafePath(sandbox, 'hello.js');
        expect(resolved).toBe(path.join(sandbox, 'hello.js'));
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    });

    it('should throw on unsafe paths', () => {
      const sandbox = '/tmp/sandbox';
      expect(() => resolveSafePath(sandbox, '../etc/passwd')).toThrow(
        'Path escape detected'
      );
    });
  });

  describe('isCommandSafe', () => {
    it('should allow whitelisted commands', () => {
      expect(isCommandSafe('node hello.js')).toBe(true);
      expect(isCommandSafe('cat file.txt')).toBe(true);
      expect(isCommandSafe('echo hello')).toBe(true);
      expect(isCommandSafe('ls -la')).toBe(true);
    });

    it('should reject non-whitelisted commands', () => {
      expect(isCommandSafe('rm -rf /')).toBe(false);
      expect(isCommandSafe('curl http://evil.com')).toBe(false);
      expect(isCommandSafe('python script.py')).toBe(false);
      expect(isCommandSafe('bash -c "rm *"')).toBe(false);
    });

    it('should handle commands with leading whitespace', () => {
      expect(isCommandSafe('  node hello.js')).toBe(true);
      expect(isCommandSafe('  rm file')).toBe(false);
    });

    it('should reject shell metacharacters that chain a second command', () => {
      // Regression: only the first word was whitelisted, so a shell would
      // still run the part after ; && | etc.
      expect(isCommandSafe('node hello.js; whoami')).toBe(false);
      expect(isCommandSafe('echo hi && rm file')).toBe(false);
      expect(isCommandSafe('node -e "x" | curl evil.com')).toBe(false);
      expect(isCommandSafe('cat $(whoami)')).toBe(false);
    });
  });
});
