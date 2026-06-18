/**
 * Main agent loop - the ReAct (Reasoning + Acting) pattern.
 * This is the core of the coding agent.
 */

import { Brain, Message, Tool, ToolContext } from './types.js';

export interface AgentResult {
  success: boolean;
  finalResult?: string;
  messages: Message[];
  error?: string;
}

/**
 * Run the agent loop.
 *
 * Learning point: This is the ReAct pattern in action:
 * 1. Give the agent a task + available tools
 * 2. Agent thinks and decides which tool to use
 * 3. Execute the tool and observe the result
 * 4. Feed observation back to agent
 * 5. Repeat until agent calls "finish" or max steps reached
 */
export async function runAgent(
  task: string,
  sandboxPath: string,
  brain: Brain,
  tools: Tool[],
  maxSteps = 10
): Promise<AgentResult> {
  const messages: Message[] = [];
  const context: ToolContext = { sandboxPath };

  // Create a tool map for quick lookup
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  // Initial user message with the task
  messages.push({
    role: 'user',
    content: task,
  });

  // Agent loop
  for (let step = 0; step < maxSteps; step++) {
    // Get response from brain (LLM or mock)
    const response = await brain.respond(messages, tools);

    // If no tool calls, something went wrong
    if (response.toolCalls.length === 0) {
      return {
        success: false,
        messages,
        error: 'No tool calls in response',
      };
    }

    // Build assistant message with tool calls
    const assistantMessage: Message = {
      role: 'assistant',
      content: [
        ...(response.text
          ? [{ type: 'text' as const, text: response.text }]
          : []),
        ...response.toolCalls.map((tc) => ({
          type: 'tool_use' as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      ],
    };
    messages.push(assistantMessage);

    // Execute each tool call
    const toolResults = [];
    let finishCalled = false;
    let finalResult: string | undefined;

    for (const toolCall of response.toolCalls) {
      const tool = toolMap.get(toolCall.name);

      if (!tool) {
        toolResults.push({
          tool_use_id: toolCall.id,
          content: `Error: Unknown tool ${toolCall.name}`,
          isError: true,
        });
        continue;
      }

      // Execute the tool
      try {
        const result = await tool.execute(toolCall.input, context);
        toolResults.push({
          tool_use_id: toolCall.id,
          content: result,
        });

        // Check if this was the finish tool
        if (toolCall.name === 'finish') {
          finishCalled = true;
          finalResult = toolCall.input.result as string;
        }
      } catch (error) {
        toolResults.push({
          tool_use_id: toolCall.id,
          content: `Error executing tool: ${(error as Error).message}`,
          isError: true,
        });
      }
    }

    // Add tool results as user message
    messages.push({
      role: 'user',
      content: toolResults.map((tr) => ({
        type: 'tool_result' as const,
        tool_use_id: tr.tool_use_id,
        content: tr.content,
        is_error: tr.isError,
      })),
    });

    // If finish was called, we're done
    if (finishCalled) {
      return {
        success: true,
        finalResult,
        messages,
      };
    }
  }

  // Max steps reached
  return {
    success: false,
    messages,
    error: `Max steps (${maxSteps}) reached without completion`,
  };
}
