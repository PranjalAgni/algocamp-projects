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
  const root = path.resolve(sandboxRoot);
  const resolved = path.resolve(root, requestedPath);

  // The root itself is inside the sandbox; anything below it must sit under
  // "root + separator". Comparing against the bare prefix would let a sibling
  // directory like "/tmp/sandbox-evil" escape a "/tmp/sandbox" jail, because
  // "/tmp/sandbox-evil".startsWith("/tmp/sandbox") is true.
  return resolved === root || resolved.startsWith(root + path.sep);
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
 * Shell metacharacters that let one command string invoke another.
 * Because runCommand hands the whole string to a shell, checking only the
 * first word is not enough: "node x.js; rm file" would pass the whitelist and
 * then run rm. Rejecting these characters closes that command-chaining hole.
 *
 * Learning point: this is defence in depth, not a real sandbox. "node" is on
 * the whitelist and `node -e "<code>"` still runs arbitrary JavaScript, so the
 * only real boundary is OS-level isolation (containers, seccomp). Treat the
 * whitelist as a speed bump, not a wall.
 */
const SHELL_METACHARACTERS = /[;&|`$(){}<>\n\\]/;

/**
 * Check if a command is safe to execute.
 * Requires a whitelisted program AND no shell metacharacters that could chain
 * a second command.
 */
export function isCommandSafe(command: string): boolean {
  if (SHELL_METACHARACTERS.test(command)) {
    return false;
  }
  const firstWord = command.trim().split(/\s+/)[0];
  return SAFE_COMMANDS.includes(firstWord);
}
