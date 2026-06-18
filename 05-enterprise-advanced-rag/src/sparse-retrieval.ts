/**
 * Sparse retrieval: keyword-based search using TF-IDF and BM25-like scoring
 */

import { tokenize } from './query-processing.js';
import type { Document, RetrievalResult } from './types.js';

/**
 * Compute term frequency (TF) for a document
 */
function computeTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

/**
 * Compute inverse document frequency (IDF) across corpus
 * IDF(term) = log(N / df(term)) where N = total docs, df = docs containing term
 */
function computeIDF(documents: Document[]): Map<string, number> {
  const docCount = documents.length;
  const docFrequency = new Map<string, number>();

  // Count docs containing each term
  for (const doc of documents) {
    const tokens = new Set(tokenize(doc.content));
    for (const token of tokens) {
      docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
    }
  }

  // Compute IDF
  const idf = new Map<string, number>();
  for (const [term, df] of docFrequency) {
    idf.set(term, Math.log(docCount / df));
  }

  return idf;
}

/**
 * BM25 scoring (simplified version)
 * BM25 = IDF * (TF * (k1 + 1)) / (TF + k1 * (1 - b + b * docLength / avgDocLength))
 *
 * k1 controls term frequency saturation (typical: 1.2-2.0)
 * b controls document length normalization (typical: 0.75)
 */
function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  idf: Map<string, number>,
  avgDocLength: number,
  k1: number = 1.5,
  b: number = 0.75
): number {
  const docLength = docTokens.length;
  const tf = computeTermFrequency(docTokens);

  let score = 0;

  for (const queryToken of queryTokens) {
    const termFreq = tf.get(queryToken) || 0;
    if (termFreq === 0) continue;

    const idfScore = idf.get(queryToken) || 0;
    const lengthNorm = 1 - b + b * (docLength / avgDocLength);
    const tfComponent = (termFreq * (k1 + 1)) / (termFreq + k1 * lengthNorm);

    score += idfScore * tfComponent;
  }

  return score;
}

/**
 * Sparse retrieval: keyword-based search with BM25 scoring
 */
export function sparseRetrieval(
  query: string,
  documents: Document[],
  topK: number = 5
): RetrievalResult[] {
  const queryTokens = tokenize(query);
  const idf = computeIDF(documents);

  // Compute average document length
  const totalLength = documents.reduce((sum, doc) => sum + tokenize(doc.content).length, 0);
  const avgDocLength = totalLength / documents.length;

  // Score each document
  const results: RetrievalResult[] = documents.map(doc => {
    const docTokens = tokenize(doc.content);
    const score = bm25Score(queryTokens, docTokens, idf, avgDocLength);

    return {
      document: doc,
      score,
      method: 'sparse',
    };
  });

  // Sort by score descending and return top K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
