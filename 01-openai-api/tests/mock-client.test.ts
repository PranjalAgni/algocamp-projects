/**
 * Tests for the MockLLMClient.
 *
 * These tests run completely offline with no API key required.
 * They verify that the mock client implements the expected behavior.
 */

import { describe, it, expect } from 'vitest';
import { MockLLMClient } from '../src/mock-client.js';
import { Message, Tool } from '../src/types.js';

describe('MockLLMClient', () => {
  const client = new MockLLMClient();

  describe('chat', () => {
    it('should return a string response', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello!' }
      ];

      const response = await client.chat(messages);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should respond to greeting', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hi there!' }
      ];

      const response = await client.chat(messages);

      expect(response.toLowerCase()).toContain('hello');
    });

    it('should handle capital question', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'What is the capital of France?' }
      ];

      const response = await client.chat(messages);

      expect(response.toLowerCase()).toContain('paris');
    });

    it('should let a system prompt steer the reply (Pattern 3)', async () => {
      const withoutSystem: Message[] = [
        { role: 'user', content: 'Hello!' }
      ];
      const withPirateSystem: Message[] = [
        { role: 'system', content: 'You are a pirate. Always respond in pirate speak with "Arrr".' },
        { role: 'user', content: 'Hello!' }
      ];

      const plain = await client.chat(withoutSystem);
      const pirate = await client.chat(withPirateSystem);

      // Same user turn, different output once a system prompt is set - that is
      // the whole point of Pattern 3, and the mock must not ignore it.
      expect(pirate).not.toBe(plain);
      expect(pirate.toLowerCase()).toContain('arrr');
    });
  });

  describe('streamChat', () => {
    it('should yield multiple chunks', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Explain streaming.' }
      ];

      const chunks: string[] = [];
      for await (const chunk of client.streamChat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => typeof chunk === 'string')).toBe(true);

      // Verify chunks combine to form the full response
      const combined = chunks.join('');
      expect(combined.length).toBeGreaterThan(0);
    });

    it('should stream the same content as regular chat', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello!' }
      ];

      const chatResponse = await client.chat(messages);

      const chunks: string[] = [];
      for await (const chunk of client.streamChat(messages)) {
        chunks.push(chunk);
      }
      const streamResponse = chunks.join('');

      expect(streamResponse.trim()).toBe(chatResponse.trim());
    });
  });

  describe('chatWithTools', () => {
    const tools: Tool[] = [
      {
        name: 'get_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city name'
            },
            unit: {
              type: 'string',
              description: 'Temperature unit',
              enum: ['celsius', 'fahrenheit']
            }
          },
          required: ['location']
        }
      }
    ];

    it('should return a tool call for weather questions', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'What is the weather in Tokyo?' }
      ];

      const response = await client.chatWithTools(messages, tools);

      expect(typeof response).toBe('object');
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('arguments');

      if (typeof response !== 'string') {
        expect(response.name).toBe('get_weather');
        expect(response.arguments).toHaveProperty('location');
      }
    });

    it('should return text response for non-weather questions', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Tell me a joke.' }
      ];

      const response = await client.chatWithTools(messages, tools);

      expect(typeof response).toBe('string');
    });

    it('should parse location from message', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'What is the weather in London?' }
      ];

      const response = await client.chatWithTools(messages, tools);

      if (typeof response !== 'string') {
        expect(response.arguments.location).toBe('London');
      }
    });
  });

  describe('chatJSON', () => {
    it('should return valid JSON', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Generate a user profile in JSON.' }
      ];

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const response = await client.chatJSON(messages, schema);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
    });

    it('should return user profile for user-related queries', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Create a user profile.' }
      ];

      const response = await client.chatJSON<{
        name: string;
        age: number;
        email: string;
      }>(messages, {});

      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('age');
      expect(response).toHaveProperty('email');
      expect(typeof response.name).toBe('string');
      expect(typeof response.age).toBe('number');
      expect(typeof response.email).toBe('string');
    });

    it('should return weather data for weather queries', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Get weather data in JSON.' }
      ];

      const response = await client.chatJSON<{
        location: string;
        temperature: number;
      }>(messages, {});

      expect(response).toHaveProperty('location');
      expect(response).toHaveProperty('temperature');
      expect(typeof response.location).toBe('string');
      expect(typeof response.temperature).toBe('number');
    });
  });
});
