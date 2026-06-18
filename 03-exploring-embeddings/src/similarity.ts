/**
 * Vector similarity functions for semantic search.
 *
 * Core concepts:
 * - Cosine similarity: Measures the angle between two vectors (range: [-1, 1])
 * - Semantic search: Find documents most similar to a query
 * - Similarity matrix: Pairwise similarities between all items
 */

import type { Embedder } from './hash.js';

/**
 * Computes the cosine similarity between two vectors.
 *
 * Cosine similarity = (A · B) / (||A|| * ||B||)
 *
 * Result interpretation:
 *  1.0  = identical direction (very similar)
 *  0.0  = orthogonal (unrelated)
 * -1.0  = opposite direction (dissimilar, rare in embeddings)
 *
 * Note: If vectors are already normalized (unit length), this simplifies to
 * just the dot product. Most embedding models normalize by default.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  // Compute magnitudes
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  // Handle zero vectors
  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

/**
 * Result from semantic search.
 */
export interface SearchResult {
  text: string;
  score: number;
  index: number;
}

/**
 * Performs semantic search: finds documents most similar to a query.
 *
 * Algorithm:
 * 1. Embed the query and all corpus documents
 * 2. Compute cosine similarity between query and each document
 * 3. Sort by similarity (descending)
 * 4. Return top-k results
 *
 * @param embedder - The embedder to use
 * @param query - The search query text
 * @param corpus - Array of document texts to search through
 * @param topK - Number of results to return (default: 5)
 * @returns Array of search results, sorted by similarity (highest first)
 */
export async function semanticSearch(
  embedder: Embedder,
  query: string,
  corpus: string[],
  topK: number = 5
): Promise<SearchResult[]> {
  // Embed query and corpus
  const [queryEmbedding] = await embedder.embed([query]);
  const corpusEmbeddings = await embedder.embed(corpus);

  // Compute similarities
  const results: SearchResult[] = corpus.map((text, index) => ({
    text,
    score: cosineSimilarity(queryEmbedding, corpusEmbeddings[index]),
    index
  }));

  // Sort by score (descending) and return top-k
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Computes a similarity matrix for a list of texts.
 * Returns a 2D array where matrix[i][j] = similarity(texts[i], texts[j]).
 *
 * Useful for visualizing how all items relate to each other.
 */
export async function similarityMatrix(
  embedder: Embedder,
  texts: string[]
): Promise<number[][]> {
  const embeddings = await embedder.embed(texts);
  const n = texts.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
    }
  }

  return matrix;
}
