/**
 * OpenAI embedder (optional, requires API key).
 *
 * Uses text-embedding-3-small:
 * - 1536-dimensional embeddings (vs 384 for the local Xenova model)
 * - Requires OPENAI_API_KEY environment variable
 * - Network + API costs required
 *
 * This is the "live" mode for comparison with local models.
 */

import OpenAI from 'openai';
import type { Embedder } from './hash.js';

export async function createOpenAIEmbedder(apiKey: string): Promise<Embedder> {
  const client = new OpenAI({ apiKey });

  return {
    async embed(texts: string[]): Promise<number[][]> {
      try {
        const response = await client.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts,
        });

        return response.data.map(item => item.embedding);
      } catch (error) {
        throw new Error(`OpenAI API error: ${error}`);
      }
    },
    mode: 'LIVE'
  };
}
