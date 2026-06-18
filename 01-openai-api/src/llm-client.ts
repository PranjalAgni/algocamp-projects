/**
 * LLMClient interface - abstracts over OpenAI, mock providers, etc.
 *
 * This interface allows us to swap implementations without changing calling code.
 * Perfect for testing (use mock) vs production (use real API).
 */

import { Message, Tool, ToolCall, ChatOptions } from './types.js';

export interface LLMClient {
  /**
   * Send messages and get a text response.
   * Basic chat completion - the most common pattern.
   */
  chat(messages: Message[], options?: ChatOptions): Promise<string>;

  /**
   * Stream messages and get chunks as they're generated.
   * Better UX - user sees response appear word-by-word.
   */
  streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<string>;

  /**
   * Chat with tool/function calling enabled.
   * The LLM can decide to call a function instead of responding with text.
   * Returns either a ToolCall or a string response.
   */
  chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall | string>;

  /**
   * Get structured JSON output matching a schema.
   * Useful for data extraction, structured responses, etc.
   */
  chatJSON<T>(
    messages: Message[],
    schema: object,
    options?: ChatOptions
  ): Promise<T>;
}
