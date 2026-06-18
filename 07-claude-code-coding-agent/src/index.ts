/**
 * CLI entry point for the coding agent demo.
 * Demonstrates the agent completing a canned task.
 */

import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { runAgent } from './agent.js';
import { LLMBrain, MockBrain } from './brain.js';
import { DEFAULT_TOOLS } from './tools.js';
import { Message } from './types.js';

// Load environment variables
dotenv.config();

/**
 * Pretty print a step in the agent's execution
 */
function printStep(stepNum: number, messages: Message[]) {
  console.log(`\n--- Step ${stepNum} ---`);

  // Find the last assistant message
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  const lastAssistant = assistantMessages[assistantMessages.length - 1];

  if (lastAssistant && lastAssistant.role === 'assistant') {
    // Print any text
    const textBlocks = lastAssistant.content.filter((b) => b.type === 'text');
    if (textBlocks.length > 0 && 'text' in textBlocks[0]) {
      console.log(`Assistant: ${textBlocks[0].text}`);
    }

    // Print tool calls
    const toolCalls = lastAssistant.content.filter((b) => b.type === 'tool_use');
    for (const toolCall of toolCalls) {
      if ('name' in toolCall) {
        console.log(`Tool call: ${toolCall.name}`);
        console.log(`Arguments: ${JSON.stringify(toolCall.input)}`);
      }
    }
  }

  // Find the last tool result
  const userMessages = messages.filter(
    (m) => m.role === 'user' && typeof m.content !== 'string'
  );
  const lastToolResult = userMessages[userMessages.length - 1];

  if (lastToolResult && lastToolResult.role === 'user' && Array.isArray(lastToolResult.content)) {
    for (const result of lastToolResult.content) {
      if ('content' in result) {
        console.log(`Observation: ${result.content}`);
      }
    }
  }
}

/**
 * Main demo function
 */
async function main() {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const mode = apiKey ? 'LIVE' : 'MOCK — no API key';
  console.log(`[MODE: ${mode}]\n`);

  // Create temporary sandbox
  const sandboxPath = mkdtempSync(path.join(tmpdir(), 'sandbox-'));
  console.log('=== CODING AGENT DEMO ===');

  const task = "Create a file hello.js that prints 'Hello from the agent!' and then run it using node";
  console.log(`Task: ${task}`);
  console.log(`Sandbox: ${sandboxPath}`);

  try {
    // Create brain (LLM or Mock)
    const brain = apiKey ? new LLMBrain(apiKey) : new MockBrain();

    // Run agent
    const result = await runAgent(task, sandboxPath, brain, DEFAULT_TOOLS);

    // Print each step
    let stepNum = 0;
    for (let i = 1; i < result.messages.length; i += 2) {
      // Assistant message followed by tool result
      if (i + 1 < result.messages.length) {
        stepNum++;
        printStep(stepNum, result.messages.slice(0, i + 2));
      }
    }

    // Print final result
    console.log('\n=== RESULT ===');
    if (result.success) {
      console.log(result.finalResult || 'Task completed successfully');
    } else {
      console.log(`Failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
  } finally {
    // Clean up sandbox
    rmSync(sandboxPath, { recursive: true, force: true });
  }
}

main().catch(console.error);
