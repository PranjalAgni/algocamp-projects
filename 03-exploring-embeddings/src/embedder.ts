/**
 * Embedder factory — auto-selects the best available embedder.
 *
 * Priority order:
 * 1. Xenova (local model) — if model can be loaded
 * 2. OpenAI — if OPENAI_API_KEY is set
 * 3. Hash fallback — deterministic, works offline, no semantic meaning
 *
 * The factory tries each option in order and falls back gracefully.
 * A banner is printed showing which mode is active.
 */

import dotenv from 'dotenv';
import type { Embedder } from './hash.js';
import { createHashEmbedder } from './hash.js';
import { createXenovaEmbedder } from './xenova.js';
import { createOpenAIEmbedder } from './openai.js';

// Load environment variables
dotenv.config();

/**
 * Creates the best available embedder based on environment and network.
 * Prints a banner showing which mode is active.
 */
export async function createEmbedder(): Promise<Embedder> {
  // Try Xenova first (best offline option)
  try {
    const embedder = await createXenovaEmbedder();
    console.log(`\n[MODE: ${embedder.mode}] Using Xenova/all-MiniLM-L6-v2\n`);
    return embedder;
  } catch (error) {
    console.log('Xenova model unavailable, trying alternatives...');
  }

  // Try OpenAI if API key is present
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== 'your-key-here') {
    try {
      const embedder = await createOpenAIEmbedder(apiKey);
      console.log(`\n[MODE: ${embedder.mode}] Using OpenAI text-embedding-3-small\n`);
      return embedder;
    } catch (error) {
      console.log('OpenAI unavailable, falling back to hash embedder...');
    }
  }

  // Fall back to hash embedder (always works)
  const embedder = createHashEmbedder();
  console.log(`\n[MODE: ${embedder.mode}] Using deterministic hash-based embeddings (no semantic meaning)\n`);
  return embedder;
}

/**
 * Creates a hash embedder directly (useful for tests).
 */
export function createHashEmbedderForTests(): Embedder {
  return createHashEmbedder();
}
