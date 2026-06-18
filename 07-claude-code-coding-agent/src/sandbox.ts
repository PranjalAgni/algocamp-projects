/**
 * Sandbox safety utilities - critical for preventing path traversal attacks
 * and restricting command execution to safe operations only.
 */

import path from 'path';

/**
 * Check if a resolved path is within the sandbox.
 * This prevents "../" attacks and absolute path escapes.
 *
 * Learning point: Always validate user-provided paths before file operations!
 */
export function isPathSafe(sandboxRoot: string, requestedPath: string): boolean {
  const resolved = path.resolve(sandboxRoot, requestedPath);
  const normalized = path.normalize(resolved);

  // Check if the normalized path starts with the sandbox root
  // This catches both ".." traversal and absolute paths outside sandbox
  return normalized.startsWith(sandboxRoot);
}

/**
 * Resolve a path relative to the sandbox and validate it's safe.
 * Throws an error if the path escapes the sandbox.
 */
export function resolveSafePath(sandboxRoot: string, requestedPath: string): string {
  const resolved = path.resolve(sandboxRoot, requestedPath);

  if (!isPathSafe(sandboxRoot, requestedPath)) {
    throw new Error(`Path escape detected: ${requestedPath} attempts to leave sandbox`);
  }

  return resolved;
}

/**
 * Whitelist of safe commands the agent can run.
 * Learning point: Never let an agent run arbitrary commands!
 * Only allow commands needed for the learning demo.
 */
const SAFE_COMMANDS = [
  'node',   // Run JS files
  'cat',    // Read files
  'echo',   // Print text
  'ls',     // List directory
];

/**
 * Check if a command is safe to execute.
 * Only allows whitelisted commands to prevent dangerous operations.
 */
export function isCommandSafe(command: string): boolean {
  const firstWord = command.trim().split(/\s+/)[0];
  return SAFE_COMMANDS.includes(firstWord);
}
