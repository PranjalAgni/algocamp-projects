/**
 * Tests for tool implementations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  readFileTool,
  writeFileTool,
  listFilesTool,
  applyEditTool,
  runCommandTool,
} from '../src/tools.js';
import { ToolContext } from '../src/types.js';

describe('Tools', () => {
  let sandboxPath: string;
  let context: ToolContext;

  beforeEach(() => {
    sandboxPath = mkdtempSync(path.join(tmpdir(), 'test-sandbox-'));
    context = { sandboxPath };
  });

  afterEach(() => {
    rmSync(sandboxPath, { recursive: true, force: true });
  });

  describe('writeFile and readFile', () => {
    it('should write and read a file', async () => {
      const content = 'Hello, world!';
      const writeResult = await writeFileTool.execute(
        { path: 'test.txt', content },
        context
      );
      expect(writeResult).toContain('Successfully wrote');

      const readResult = await readFileTool.execute({ path: 'test.txt' }, context);
      expect(readResult).toBe(content);
    });

    it('should create parent directories', async () => {
      const content = 'nested file';
      await writeFileTool.execute(
        { path: 'subdir/nested/file.txt', content },
        context
      );

      const filePath = path.join(sandboxPath, 'subdir/nested/file.txt');
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should return error for non-existent file', async () => {
      const result = await readFileTool.execute({ path: 'nonexistent.txt' }, context);
      expect(result).toContain('Error reading file');
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      await writeFileTool.execute({ path: 'file1.txt', content: 'a' }, context);
      await writeFileTool.execute({ path: 'file2.txt', content: 'b' }, context);

      const result = await listFilesTool.execute({ path: '.' }, context);
      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.txt');
    });

    it('should return empty message for empty directory', async () => {
      const result = await listFilesTool.execute({}, context);
      expect(result).toContain('empty');
    });
  });

  describe('applyEdit', () => {
    it('should replace string in file', async () => {
      await writeFileTool.execute(
        { path: 'code.js', content: 'const x = 1;' },
        context
      );

      const result = await applyEditTool.execute(
        { path: 'code.js', oldString: '1', newString: '2' },
        context
      );
      expect(result).toContain('Successfully edited');

      const content = await readFileTool.execute({ path: 'code.js' }, context);
      expect(content).toBe('const x = 2;');
    });

    it('should return error if string not found', async () => {
      await writeFileTool.execute({ path: 'code.js', content: 'hello' }, context);

      const result = await applyEditTool.execute(
        { path: 'code.js', oldString: 'world', newString: 'universe' },
        context
      );
      expect(result).toContain('String not found');
    });
  });

  describe('runCommand', () => {
    it('should execute whitelisted commands', async () => {
      const result = await runCommandTool.execute({ command: 'echo test' }, context);
      expect(result).toBe('test');
    });

    it('should execute node commands', async () => {
      await writeFileTool.execute(
        { path: 'script.js', content: "console.log('hello');" },
        context
      );

      const result = await runCommandTool.execute(
        { command: 'node script.js' },
        context
      );
      expect(result).toBe('hello');
    });

    it('should reject non-whitelisted commands', async () => {
      const result = await runCommandTool.execute({ command: 'rm -rf /' }, context);
      expect(result).toContain('not whitelisted');
    });

    it('should return error for failed commands', async () => {
      const result = await runCommandTool.execute(
        { command: 'node nonexistent.js' },
        context
      );
      expect(result).toContain('Error executing command');
    });
  });
});
