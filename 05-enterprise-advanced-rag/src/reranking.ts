/**
 * Reranking: reorder retrieval results using a more sophisticated model
 * Uses heuristic reranking (metadata + term overlap)
 * Cross-encoder could be added but adds complexity for this learning project
 */

import { tokenize } from './query-processing.js';
import type { RetrievalResult } from './types.js';

/**
 * Heuristic reranker based on:
 * 1. Query term overlap in document
 * 2. Document recency (newer is better)
 * 3. Title match bonus
 */
export function heuristicRerank(
  query: string,
  results: RetrievalResult[]
): RetrievalResult[] {
  const queryTokens = new Set(tokenize(query));
  const now = new Date();

  const reranked = results.map(result => {
    let score = result.score; // Start with retrieval score

    // 1. Term overlap bonus (percentage of query terms in doc)
    const docTokens = new Set(tokenize(result.document.content));
    const titleTokens = new Set(tokenize(result.document.metadata.title));

    let matchingTerms = 0;
    for (const term of queryTokens) {
      if (docTokens.has(term)) matchingTerms++;
    }
    const termOverlap = queryTokens.size > 0 ? matchingTerms / queryTokens.size : 0;
    score += termOverlap * 0.3; // 30% weight for term overlap

    // 2. Recency bonus (docs from last year get boost)
    const docDate = new Date(result.document.metadata.date);
    const ageInDays = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 365) {
      score += 0.1; // 10% boost for recent docs
    }

    // 3. Title match bonus
    let titleMatches = 0;
    for (const term of queryTokens) {
      if (titleTokens.has(term)) titleMatches++;
    }
    const titleOverlap = queryTokens.size > 0 ? titleMatches / queryTokens.size : 0;
    score += titleOverlap * 0.2; // 20% weight for title match

    return {
      ...result,
      score,
      method: 'reranked',
    };
  });

  // Re-sort by new scores
  reranked.sort((a, b) => b.score - a.score);

  return reranked;
}
