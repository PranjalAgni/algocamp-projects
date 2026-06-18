/**
 * In-memory vector store with cosine similarity search
 *
 * Simple but effective for learning. Stores chunk text + embeddings,
 * searches by computing cosine similarity with all vectors.
 * For production with >10k chunks, use a real vector DB (Pinecone, Weaviate, pgvector).
 */

import type { Chunk } from './chunker.js';

export interface StoredChunk {
  chunk: Chunk;
  embedding: number[];
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}

/**
 * Compute cosine similarity between two vectors
 * Returns a value between -1 and 1 (1 = identical direction, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

export class VectorStore {
  private storage: StoredChunk[] = [];

  /**
   * Add a chunk with its embedding to the store
   */
  addChunk(chunk: Chunk, embedding: number[]): void {
    this.storage.push({ chunk, embedding });
  }

  /**
   * Add multiple chunks with their embeddings
   */
  addChunks(chunks: Chunk[], embeddings: number[][]): void {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings length mismatch');
    }

    for (let i = 0; i < chunks.length; i++) {
      this.addChunk(chunks[i], embeddings[i]);
    }
  }

  /**
   * Search for the most similar chunks to a query embedding
   * @param queryEmbedding - The query vector
   * @param topK - Number of results to return (default: 3)
   * @returns Array of {chunk, score} sorted by descending similarity
   */
  search(queryEmbedding: number[], topK: number = 3): SearchResult[] {
    if (this.storage.length === 0) {
      return [];
    }

    // Compute similarity for all chunks
    const results: SearchResult[] = this.storage.map(stored => ({
      chunk: stored.chunk,
      score: cosineSimilarity(queryEmbedding, stored.embedding),
    }));

    // Sort by score descending and take top-k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Get the total number of chunks stored
   */
  size(): number {
    return this.storage.length;
  }

  /**
   * Clear all stored chunks
   */
  clear(): void {
    this.storage = [];
  }

  /**
   * Get all stored chunks (for debugging/inspection)
   */
  getAllChunks(): Chunk[] {
    return this.storage.map(s => s.chunk);
  }
}
