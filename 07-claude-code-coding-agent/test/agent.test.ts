/**
 * End-to-end tests for the agent
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { runAgent } from '../src/agent.js';
import { MockBrain } from '../src/brain.js';
import { DEFAULT_TOOLS } from '../src/tools.js';

describe('Agent', () => {
  let sandboxPath: string;

  beforeEach(() => {
    sandboxPath = mkdtempSync(path.join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(sandboxPath, { recursive: true, force: true });
  });

  it('should complete the hello.js task', async () => {
    const task = "Create a file hello.js that prints 'Hello from the agent!' and then run it using node";
    const brain = new MockBrain();

    const result = await runAgent(task, sandboxPath, brain, DEFAULT_TOOLS);

    expect(result.success).toBe(true);
    expect(result.finalResult).toContain('hello.js');

    // Verify the file was created
    const filePath = path.join(sandboxPath, 'hello.js');
    expect(existsSync(filePath)).toBe(true);

    // Verify content
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Hello from the agent!');
    expect(content).toContain('console.log');
  });

  it('should handle max steps limit', async () => {
    // Create a brain that never calls finish
    const infiniteLoopBrain = {
      async respond() {
        return {
          text: 'Listing files forever',
          toolCalls: [
            {
              id: 'loop-1',
              name: 'listFiles',
              input: { path: '.' },
            },
          ],
        };
      },
    };

    const task = 'List files';
    const result = await runAgent(task, sandboxPath, infiniteLoopBrain, DEFAULT_TOOLS, 3);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Max steps');
  });

  it('should execute multiple steps in sequence', async () => {
    const task = "Create a file hello.js that prints 'Hello from the agent!' and then run it using node";
    const brain = new MockBrain();

    const result = await runAgent(task, sandboxPath, brain, DEFAULT_TOOLS);

    // Should have multiple message exchanges (user task, assistant+tools, user results, ...)
    expect(result.messages.length).toBeGreaterThan(3);

    // Find tool calls in the conversation
    const assistantMessages = result.messages.filter((m) => m.role === 'assistant');
    const toolCalls = assistantMessages.flatMap((m) => {
      if (m.role === 'assistant') {
        return m.content.filter((c) => c.type === 'tool_use');
      }
      return [];
    });

    // Should have called writeFile, runCommand, and finish
    const toolNames = toolCalls.map((tc) => ('name' in tc ? tc.name : ''));
    expect(toolNames).toContain('writeFile');
    expect(toolNames).toContain('runCommand');
    expect(toolNames).toContain('finish');
  });
});
