/**
 * Hash-based fallback embedder for offline/deterministic operation.
 *
 * This embedder doesn't capture semantic meaning but ensures:
 * - Tests pass without network access
 * - Deterministic output for the same input
 * - Same dimensionality as Xenova model (384)
 *
 * Implementation: Uses a simple hash function to generate a fixed-size vector
 * from the input text. Different texts will have different vectors, but
 * semantic similarity is NOT preserved.
 */

import { createHash } from 'crypto';

const EMBEDDING_DIM = 384; // Match Xenova all-MiniLM-L6-v2

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
  mode: string;
}

/**
 * Creates a deterministic vector from text using hash functions.
 * Uses multiple hash functions to generate enough values for the embedding dimension.
 */
function hashToVector(text: string, dim: number): number[] {
  const vector: number[] = [];

  // Normalize text for consistency
  const normalized = text.toLowerCase().trim();

  // Generate multiple hashes to fill the vector
  let hashCount = 0;
  while (vector.length < dim) {
    // Create a hash with a seed based on the count
    const hash = createHash('sha256')
      .update(normalized + hashCount.toString())
      .digest();

    // Convert hash bytes to normalized floats in [-1, 1]
    for (let i = 0; i < hash.length && vector.length < dim; i++) {
      // Map byte value [0, 255] to [-1, 1]
      vector.push((hash[i] / 127.5) - 1);
    }

    hashCount++;
  }

  // Normalize the vector to unit length (important for cosine similarity)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

export function createHashEmbedder(): Embedder {
  return {
    async embed(texts: string[]): Promise<number[][]> {
      return texts.map(text => hashToVector(text, EMBEDDING_DIM));
    },
    mode: 'HASH-FALLBACK'
  };
}
