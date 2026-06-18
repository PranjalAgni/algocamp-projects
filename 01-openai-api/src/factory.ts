/**
 * Factory to create the appropriate LLM client based on environment.
 *
 * Automatically selects:
 * - OpenAIClient if OPENAI_API_KEY is present (LIVE mode)
 * - MockLLMClient if no key (MOCK mode)
 *
 * Prints a clear banner so users know which mode they're running.
 */

import { LLMClient } from './llm-client.js';
import { OpenAIClient } from './openai-client.js';
import { MockLLMClient } from './mock-client.js';

/**
 * Create an LLM client based on available environment variables.
 * Returns mock client if no API key is found.
 */
export function createLLMClient(defaultModel = 'gpt-4o-mini'): LLMClient {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    console.log('[MODE: LIVE — using OpenAI API]\n');
    return new OpenAIClient(apiKey, defaultModel);
  } else {
    console.log('[MODE: MOCK — no API key found, using offline mock]\n');
    return new MockLLMClient(`mock-${defaultModel}`);
  }
}
