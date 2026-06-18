/**
 * Hybrid retrieval: combine dense and sparse retrieval using Reciprocal Rank Fusion (RRF)
 */

import type { RetrievalResult } from './types.js';

/**
 * Reciprocal Rank Fusion (RRF)
 * Combines multiple ranked lists by summing reciprocal ranks
 * RRF_score(doc) = sum over rankings of 1 / (k + rank(doc))
 *
 * k is a constant (typically 60) to reduce impact of high ranks
 * Lower ranks (better results) contribute more to the score
 *
 * Reference: "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods"
 * (Cormack et al., 2009)
 */
export function reciprocalRankFusion(
  rankedLists: RetrievalResult[][],
  k: number = 60
): RetrievalResult[] {
  const rrfScores = new Map<string, number>();
  const docMap = new Map<string, RetrievalResult>();

  // For each ranked list, compute RRF contribution
  for (const rankedList of rankedLists) {
    rankedList.forEach((result, rank) => {
      const docId = result.document.id;
      const rrfContribution = 1 / (k + rank + 1); // rank is 0-based, so +1

      // Accumulate RRF score
      rrfScores.set(docId, (rrfScores.get(docId) || 0) + rrfContribution);

      // Store the document (use first occurrence)
      if (!docMap.has(docId)) {
        docMap.set(docId, result);
      }
    });
  }

  // Convert to RetrievalResult array
  const fusedResults: RetrievalResult[] = Array.from(rrfScores.entries()).map(
    ([docId, score]) => ({
      document: docMap.get(docId)!.document,
      score,
      method: 'hybrid',
    })
  );

  // Sort by RRF score descending
  fusedResults.sort((a, b) => b.score - a.score);

  return fusedResults;
}
