/**
 * Embedding engine: generates vector embeddings for text
 * Uses @xenova/transformers with hash-based fallback for deterministic tests
 */

import { pipeline, env } from '@xenova/transformers';

// Disable remote model loading progress bars in tests
env.allowLocalModels = true;
env.allowRemoteModels = true;

let embeddingPipeline: any = null;
let useHashFallback = false;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;

  try {
    // Try to load the real model
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    return embeddingPipeline;
  } catch (error) {
    console.warn('Failed to load embedding model, using hash fallback:', error);
    useHashFallback = true;
    return null;
  }
}

/**
 * Simple hash-based embedding (deterministic fallback for tests)
 * Creates a 384-dim vector based on character codes
 */
function hashEmbedding(text: string): number[] {
  const dim = 384; // Same as all-MiniLM-L6-v2
  const embedding = new Array(dim).fill(0);

  // Normalize text
  const normalized = text.toLowerCase().trim();

  // Hash each character into the embedding space
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = charCode % dim;
    embedding[idx] += 1;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

/**
 * Generate embedding for a text string
 */
export async function embed(text: string): Promise<number[]> {
  // Use hash fallback if model failed to load
  if (useHashFallback) {
    return hashEmbedding(text);
  }

  const model = await getEmbeddingPipeline();

  if (!model) {
    return hashEmbedding(text);
  }

  try {
    const result = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch (error) {
    console.warn('Embedding failed, using hash fallback:', error);
    return hashEmbedding(text);
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
