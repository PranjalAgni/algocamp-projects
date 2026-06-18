/**
 * Core types for the coding agent
 */

/**
 * A tool that the agent can use
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

/**
 * Context provided to tool execution (sandbox path, etc.)
 */
export interface ToolContext {
  sandboxPath: string;
}

/**
 * A tool call made by the agent
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Result of executing a tool
 */
export interface ToolResult {
  tool_use_id: string;
  content: string;
  isError?: boolean;
}

/**
 * Message in the conversation
 */
export type Message =
  | {
      role: 'user';
      content: string;
    }
  | {
      role: 'assistant';
      content: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }>;
    }
  | {
      role: 'user';
      content: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }>;
    };

/**
 * Response from the brain (LLM or mock)
 */
export interface BrainResponse {
  text?: string;
  toolCalls: ToolCall[];
}

/**
 * Interface for the agent's brain (LLM or mock)
 */
export interface Brain {
  respond(messages: Message[], tools: Tool[]): Promise<BrainResponse>;
}
