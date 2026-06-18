import OpenAI from 'openai';
import { LLM } from '../interfaces.js';

/**
 * OpenAI GPT Language Model Implementation
 *
 * Uses OpenAI's GPT models (gpt-3.5-turbo or gpt-4o-mini) as the brain.
 * Requires OPENAI_API_KEY to be set.
 */
export class OpenAILLM implements LLM {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    console.log(`[OpenAILLM] Generating response using ${this.model}`);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful voice assistant. Provide concise, natural spoken responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new Error('No response from OpenAI');
      }

      return text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OpenAI API error: ${message}`);
    }
  }
}
