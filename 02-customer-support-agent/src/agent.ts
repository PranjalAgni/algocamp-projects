/**
 * Main agent orchestrator - implements the tool-calling agent loop
 */

import { config } from 'dotenv';
import type { AgentResponse, AgentIteration, ToolCall, ToolResult, ToolDefinition } from './types.js';
import { lookupOrder, lookupOrderTool } from './tools/lookupOrder.js';
import { searchFAQ, searchFAQTool } from './tools/searchFAQ.js';
import { createTicket, createTicketTool } from './tools/createTicket.js';
import { mockPlanner, mockGenerateResponse } from './planner/mockPlanner.js';
import { openaiPlanner, openaiGenerateResponse } from './planner/openaiPlanner.js';

// Load environment variables
config();

// Maximum iterations to prevent infinite loops
const MAX_ITERATIONS = 5;

// Available tools
const TOOLS: ToolDefinition[] = [
  lookupOrderTool,
  searchFAQTool,
  createTicketTool,
];

// Tool executors
const TOOL_EXECUTORS: Record<string, (args: any) => any> = {
  lookupOrder: (args) => lookupOrder(args.orderId),
  searchFAQ: (args) => searchFAQ(args.query),
  createTicket: (args) => createTicket(args.issue, args.priority),
};

/**
 * Determine operational mode based on environment
 */
export function getMode(): 'live' | 'mock' {
  return process.env.OPENAI_API_KEY ? 'live' : 'mock';
}

/**
 * Execute a single tool call
 */
function executeTool(toolCall: ToolCall): ToolResult {
  const { name, arguments: args } = toolCall;

  // Validate tool exists
  if (!(name in TOOL_EXECUTORS)) {
    return {
      name,
      result: null,
      error: `Unknown tool: ${name}`,
    };
  }

  try {
    const result = TOOL_EXECUTORS[name](args);
    return {
      name,
      result,
    };
  } catch (error) {
    return {
      name,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main agent loop
 *
 * This implements the core agent pattern:
 * 1. User asks a question
 * 2. Planner decides which tools to call (if any)
 * 3. Execute the tools
 * 4. Feed results back to planner
 * 5. Repeat until planner says it's done (or hit max iterations)
 * 6. Generate final response using all gathered information
 */
export async function runAgent(query: string): Promise<AgentResponse> {
  const mode = getMode();
  const iterations: AgentIteration[] = [];

  // Print mode banner
  console.log(mode === 'live'
    ? '[MODE: LIVE]\n'
    : '[MODE: MOCK — no API key]\n'
  );

  // Agent loop
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Get next action from planner
    let iteration: AgentIteration;

    if (mode === 'live') {
      iteration = await openaiPlanner(query, iterations, TOOLS);
    } else {
      iteration = await mockPlanner(query, iterations);
    }

    // If no tools to call, we're done with the loop
    if (!iteration.shouldContinue || iteration.toolCalls.length === 0) {
      break;
    }

    // Execute tools
    console.log(`\n[Iteration ${i + 1}] Tool calls:`);
    for (const toolCall of iteration.toolCalls) {
      console.log(`  - ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);

      const result = executeTool(toolCall);
      iteration.toolResults.push(result);

      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }

    iterations.push(iteration);

    // Safety check: if planner wants to continue but produced no tools, stop
    if (iteration.toolCalls.length === 0) {
      break;
    }
  }

  // Generate final response
  console.log('\n[Generating response...]');
  let answer: string;

  if (mode === 'live') {
    answer = await openaiGenerateResponse(query, iterations);
  } else {
    answer = mockGenerateResponse(query, iterations);
  }

  return {
    answer,
    iterations,
    mode,
  };
}
