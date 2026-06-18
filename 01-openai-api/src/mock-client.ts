/**
 * MockLLMClient - offline implementation that works without an API key.
 *
 * Returns deterministic canned responses so demos/tests can run anywhere.
 * This is crucial for learning projects and CI environments.
 */

import { LLMClient } from './llm-client.js';
import { Message, Tool, ToolCall, ChatOptions } from './types.js';

export class MockLLMClient implements LLMClient {
  private model: string;

  constructor(model = 'mock-gpt-4o-mini') {
    this.model = model;
  }

  /**
   * Basic chat - returns a deterministic response based on input.
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();

    // Simple pattern matching for realistic responses
    if (userContent.includes('hello') || userContent.includes('hi')) {
      return 'Hello! How can I help you today?';
    } else if (userContent.includes('weather')) {
      return "I'd be happy to help with weather information. Which location would you like to know about?";
    } else if (userContent.includes('explain')) {
      return 'This is a mock response. In live mode, I would provide a detailed explanation based on your question.';
    } else if (userContent.includes('capital')) {
      return 'The capital of France is Paris. Is there anything else you would like to know?';
    } else {
      return `Mock response to: "${lastMessage.content.substring(0, 50)}..." (using ${this.model})`;
    }
  }

  /**
   * Streaming chat - breaks response into chunks and yields them.
   * Simulates the streaming experience with small delays.
   */
  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const fullResponse = await this.chat(messages, options);
    const words = fullResponse.split(' ');

    // Yield words one at a time to simulate streaming
    for (const word of words) {
      yield word + ' ';
      // Small delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Chat with tools - simulates tool calling based on message content.
   * If the message mentions weather, we return a tool call for get_weather.
   * Otherwise, we return a text response.
   */
  async chatWithTools(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ToolCall | string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();

    // Check if the message is asking about weather
    if (userContent.includes('weather') && tools.some(t => t.name === 'get_weather')) {
      // Extract location if possible, default to "San Francisco"
      let location = 'San Francisco';
      if (userContent.includes('in ')) {
        const parts = userContent.split('in ');
        if (parts[1]) {
          location = parts[1].split(/[\s,?.!]/)[0];
          location = location.charAt(0).toUpperCase() + location.slice(1);
        }
      }

      return {
        id: 'mock_tool_call_123',
        name: 'get_weather',
        arguments: {
          location,
          unit: 'celsius'
        }
      };
    }

    // Otherwise, return a regular text response
    return await this.chat(messages, options);
  }

  /**
   * JSON mode - returns valid JSON matching expected structure.
   * For demo purposes, we return a canned but realistic JSON response.
   */
  async chatJSON<T>(
    messages: Message[],
    schema: object,
    options?: ChatOptions
  ): Promise<T> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();

    // Return realistic JSON based on the request
    if (userContent.includes('user') || userContent.includes('person')) {
      return {
        name: 'John Doe',
        age: 30,
        email: 'john.doe@example.com',
        occupation: 'Software Engineer',
        interests: ['coding', 'reading', 'hiking']
      } as T;
    } else if (userContent.includes('weather')) {
      return {
        location: 'San Francisco',
        temperature: 18,
        conditions: 'Partly cloudy',
        humidity: 65,
        windSpeed: 12
      } as T;
    } else {
      return {
        message: 'Mock JSON response',
        timestamp: new Date().toISOString(),
        data: { key: 'value' }
      } as T;
    }
  }
}
