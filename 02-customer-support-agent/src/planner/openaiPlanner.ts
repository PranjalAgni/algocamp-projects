/**
 * OpenAI planner - uses GPT for intelligent tool selection and response generation
 * Only active when OPENAI_API_KEY is set
 */

import OpenAI from 'openai';
import type { ToolDefinition, ToolCall, ToolResult, AgentIteration } from '../types.js';

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client (lazy)
 */
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Convert our tool definitions to OpenAI function format
 */
function toOpenAIFunction(tool: ToolDefinition): OpenAI.Chat.ChatCompletionCreateParams.Function {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}

/**
 * OpenAI-based planner using function calling
 */
export async function openaiPlanner(
  query: string,
  previousIterations: AgentIteration[],
  availableTools: ToolDefinition[]
): Promise<AgentIteration> {
  const openai = getOpenAI();

  // Build conversation history
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful customer support agent for CloudStore, a SaaS e-commerce platform.
Your job is to help customers by using available tools to look up information and resolve issues.

Available tools:
- lookupOrder: Get order details by order ID
- searchFAQ: Search the knowledge base for help articles
- createTicket: Create a support ticket for complex issues

Be concise and helpful. Use tools to gather information before responding.`,
    },
    {
      role: 'user',
      content: query,
    },
  ];

  // Add previous iterations to context
  for (const iteration of previousIterations) {
    if (iteration.toolResults.length > 0) {
      // Add assistant's tool calls
      messages.push({
        role: 'assistant',
        content: null,
        function_call: undefined, // Let OpenAI infer
      });

      // Add tool results
      for (const toolResult of iteration.toolResults) {
        messages.push({
          role: 'function',
          name: toolResult.name,
          content: JSON.stringify(toolResult.result),
        });
      }
    }
  }

  // Call OpenAI with function calling
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    functions: availableTools.map(toOpenAIFunction),
    function_call: 'auto',
    temperature: 0.7,
  });

  const choice = response.choices[0];
  const toolCalls: ToolCall[] = [];

  // Check if OpenAI wants to call a function
  if (choice.message.function_call) {
    const functionCall = choice.message.function_call;
    toolCalls.push({
      name: functionCall.name,
      arguments: JSON.parse(functionCall.arguments),
    });
  }

  return {
    toolCalls,
    toolResults: [],
    shouldContinue: toolCalls.length > 0,
  };
}

/**
 * Generate final response using OpenAI
 */
export async function openaiGenerateResponse(
  query: string,
  iterations: AgentIteration[]
): Promise<string> {
  const openai = getOpenAI();

  // Build conversation with all tool results
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful customer support agent for CloudStore.
Use the information from the tools to provide a clear, concise, and helpful response to the customer.`,
    },
    {
      role: 'user',
      content: query,
    },
  ];

  // Add all tool calls and results
  for (const iteration of iterations) {
    for (const toolResult of iteration.toolResults) {
      messages.push({
        role: 'function',
        name: toolResult.name,
        content: JSON.stringify(toolResult.result),
      });
    }
  }

  // Get final response
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'I was unable to process your request.';
}
