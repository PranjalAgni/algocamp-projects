/**
 * Tool definitions and implementations.
 * Each tool has a schema (for the LLM) and an execute function.
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Tool } from './types.js';
import { resolveSafePath, isCommandSafe } from './sandbox.js';

const execAsync = promisify(exec);

/**
 * Tool: readFile
 * Reads a file from the sandbox and returns its contents.
 */
export const readFileTool: Tool = {
  name: 'readFile',
  description: 'Read the contents of a file in the sandbox',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read (relative to sandbox root)',
      },
    },
    required: ['path'],
  },
  async execute(args, context) {
    const filePath = resolveSafePath(context.sandboxPath, args.path as string);
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      return `Error reading file: ${(error as Error).message}`;
    }
  },
};

/**
 * Tool: writeFile
 * Writes content to a file in the sandbox (creates parent dirs if needed).
 */
export const writeFileTool: Tool = {
  name: 'writeFile',
  description: 'Write content to a file in the sandbox (creates directories if needed)',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to write (relative to sandbox root)',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  async execute(args, context) {
    const filePath = resolveSafePath(context.sandboxPath, args.path as string);
    try {
      // Ensure parent directory exists
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });

      await writeFile(filePath, args.content as string, 'utf-8');
      return `Successfully wrote to ${args.path}`;
    } catch (error) {
      return `Error writing file: ${(error as Error).message}`;
    }
  },
};

/**
 * Tool: listFiles
 * Lists files and directories in a path within the sandbox.
 */
export const listFilesTool: Tool = {
  name: 'listFiles',
  description: 'List files and directories in the sandbox',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to list (relative to sandbox root, defaults to root)',
      },
    },
  },
  async execute(args, context) {
    const dirPath = resolveSafePath(context.sandboxPath, (args.path as string) || '.');
    try {
      const entries = await readdir(dirPath);
      return entries.length > 0 ? entries.join('\n') : '(empty directory)';
    } catch (error) {
      return `Error listing files: ${(error as Error).message}`;
    }
  },
};

/**
 * Tool: applyEdit
 * Applies a string replacement edit to a file.
 * Learning point: This is a simple version - real editors use diff algorithms.
 */
export const applyEditTool: Tool = {
  name: 'applyEdit',
  description: 'Apply a string replacement edit to a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to edit',
      },
      oldString: {
        type: 'string',
        description: 'String to find and replace',
      },
      newString: {
        type: 'string',
        description: 'String to replace with',
      },
    },
    required: ['path', 'oldString', 'newString'],
  },
  async execute(args, context) {
    const filePath = resolveSafePath(context.sandboxPath, args.path as string);
    try {
      const content = await readFile(filePath, 'utf-8');
      if (!content.includes(args.oldString as string)) {
        return `Error: String not found in file`;
      }
      const newContent = content.replace(args.oldString as string, args.newString as string);
      await writeFile(filePath, newContent, 'utf-8');
      return `Successfully edited ${args.path}`;
    } catch (error) {
      return `Error editing file: ${(error as Error).message}`;
    }
  },
};

/**
 * Tool: runCommand
 * Executes a whitelisted shell command in the sandbox directory.
 * Learning point: Always whitelist commands to prevent dangerous operations!
 */
export const runCommandTool: Tool = {
  name: 'runCommand',
  description: 'Run a safe shell command in the sandbox (whitelisted: node, cat, echo, ls)',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute',
      },
    },
    required: ['command'],
  },
  async execute(args, context) {
    const command = args.command as string;

    if (!isCommandSafe(command)) {
      return `Error: Command not whitelisted. Only node, cat, echo, ls are allowed.`;
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: context.sandboxPath,
        timeout: 2000, // 2 second timeout
      });
      return (stdout + stderr).trim() || '(no output)';
    } catch (error) {
      return `Error executing command: ${(error as Error).message}`;
    }
  },
};

/**
 * Tool: finish
 * Signals that the task is complete.
 * Learning point: Agents need a way to signal "I'm done!"
 */
export const finishTool: Tool = {
  name: 'finish',
  description: 'Signal that the task is complete and provide the final result',
  inputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: 'Description of what was accomplished',
      },
    },
    required: ['result'],
  },
  async execute(args) {
    return `Task complete: ${args.result}`;
  },
};

/**
 * Default tool set for the coding agent
 */
export const DEFAULT_TOOLS: Tool[] = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  applyEditTool,
  runCommandTool,
  finishTool,
];
