/**
 * Dense retrieval: semantic search using embeddings
 */

import { embed, cosineSimilarity } from './embeddings.js';
import type { Document, RetrievalResult } from './types.js';

/**
 * Embed all documents (or use cached embeddings)
 */
export async function embedDocuments(documents: Document[]): Promise<void> {
  for (const doc of documents) {
    if (!doc.embedding) {
      // Embed the full content (in production, you'd chunk large docs)
      doc.embedding = await embed(doc.content);
    }
  }
}

/**
 * Dense retrieval: find documents most semantically similar to the query
 */
export async function denseRetrieval(
  query: string,
  documents: Document[],
  topK: number = 5
): Promise<RetrievalResult[]> {
  // Ensure all documents have embeddings
  await embedDocuments(documents);

  // Embed the query
  const queryEmbedding = await embed(query);

  // Compute similarity scores
  const results: RetrievalResult[] = documents.map(doc => ({
    document: doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding!),
    method: 'dense',
  }));

  // Sort by score descending and return top K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
