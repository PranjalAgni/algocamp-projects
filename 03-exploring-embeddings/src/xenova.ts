/**
 * Xenova (Hugging Face Transformers.js) embedder.
 *
 * Uses the all-MiniLM-L6-v2 model:
 * - 384-dimensional sentence embeddings
 * - ~25MB model size
 * - Downloads and caches on first run (~/.cache/huggingface/)
 * - Runs fully offline after initial download
 *
 * This is a transformer-based model that captures semantic meaning,
 * so "dog" and "puppy" will have similar embeddings.
 */

import { pipeline, env } from '@xenova/transformers';
import type { Embedder } from './hash.js';

// Disable local model checks to avoid unnecessary warnings
env.allowLocalModels = false;

// Cache the pipeline to avoid reloading
let pipelineCache: Awaited<ReturnType<typeof pipeline>> | null = null;

export async function createXenovaEmbedder(): Promise<Embedder> {
  try {
    // Initialize the feature-extraction pipeline with all-MiniLM-L6-v2
    if (!pipelineCache) {
      console.log('Loading Xenova model (first run may download ~25MB)...');
      pipelineCache = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }

    return {
      async embed(texts: string[]): Promise<number[][]> {
        if (!pipelineCache) {
          throw new Error('Pipeline not initialized');
        }

        const embeddings: number[][] = [];

        // Process each text individually
        for (const text of texts) {
          const output = await pipelineCache(text, {
            pooling: 'mean',  // Mean pooling across tokens
            normalize: true   // L2 normalization for cosine similarity
          });

          // Extract the embedding array from the model output
          // The output is a Tensor, we need to convert it to a regular array
          const embedding = Array.from(output.data) as number[];
          embeddings.push(embedding);
        }

        return embeddings;
      },
      mode: 'LOCAL-MODEL'
    };
  } catch (error) {
    // If model loading fails (no network, no cache), return null
    // The factory will fall back to hash embedder
    throw new Error(`Failed to load Xenova model: ${error}`);
  }
}
