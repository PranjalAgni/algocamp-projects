/**
 * OpenAIClient - live implementation using the official OpenAI SDK.
 *
 * Requires OPENAI_API_KEY in environment.
 * Translates our LLMClient interface to OpenAI's API format.
 */

import OpenAI from 'openai';
import { LLMClient } from './llm-client.js';
import { Message, Tool, ToolCall, ChatOptions } from './types.js';

export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  /**
   * Basic chat completion.
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Streaming chat - yields chunks as they arrive.
   * Uses async iteration for clean syntax.
   */
  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Chat with tool calling enabled.
   * The model can decide to call one of the provided tools.
   */
  async chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall | string> {
    // Convert our Tool format to OpenAI's format
    const openaiTools: OpenAI.Chat.ChatCompletionTool[] = tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));

    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: openaiTools,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500
    });

    const message = response.choices[0]?.message;

    // Check if the model wants to call a tool
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      return {
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments)
      };
    }

    // Otherwise, return the text response
    return message?.content || '';
  }

  /**
   * JSON mode - forces the model to respond with valid JSON.
   * Use response_format to ensure JSON output.
   */
  async chatJSON<T>(
    messages: Message[],
    schema: object,
    options?: ChatOptions
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      response_format: { type: 'json_object' },
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
  }
}
