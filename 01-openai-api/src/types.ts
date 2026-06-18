/**
 * Core types for the LLM client interface.
 * These types abstract over different providers (OpenAI, Mock, etc.)
 */

/**
 * A message in a conversation.
 * - system: Sets the AI's behavior/personality
 * - user: The user's input
 * - assistant: The AI's previous responses (for context)
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * A tool/function the LLM can call.
 * The LLM decides when to call it based on the conversation.
 */
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * A tool call returned by the LLM.
 * Your code should execute the function and send results back.
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Options for chat completion requests.
 */
export interface ChatOptions {
  temperature?: number;  // 0-2, higher = more creative
  maxTokens?: number;    // Max response length
  model?: string;        // Override default model
}
