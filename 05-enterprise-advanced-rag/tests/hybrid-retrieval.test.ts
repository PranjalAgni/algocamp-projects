/**
 * Tests for hybrid retrieval (Reciprocal Rank Fusion)
 */

import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion } from '../src/hybrid-retrieval.js';
import type { Document, RetrievalResult } from '../src/types.js';

describe('Reciprocal Rank Fusion', () => {
  const doc1: Document = {
    id: 'doc1',
    content: 'Test content 1',
    metadata: { title: 'Doc 1', department: 'HR', date: '2024-01-01', type: 'policy' },
  };

  const doc2: Document = {
    id: 'doc2',
    content: 'Test content 2',
    metadata: { title: 'Doc 2', department: 'HR', date: '2024-01-01', type: 'policy' },
  };

  const doc3: Document = {
    id: 'doc3',
    content: 'Test content 3',
    metadata: { title: 'Doc 3', department: 'Engineering', date: '2024-01-01', type: 'handbook' },
  };

  it('should merge two ranked lists correctly', () => {
    const list1: RetrievalResult[] = [
      { document: doc1, score: 0.9, method: 'dense' },
      { document: doc2, score: 0.7, method: 'dense' },
      { document: doc3, score: 0.5, method: 'dense' },
    ];

    const list2: RetrievalResult[] = [
      { document: doc2, score: 0.8, method: 'sparse' },
      { document: doc1, score: 0.6, method: 'sparse' },
      { document: doc3, score: 0.4, method: 'sparse' },
    ];

    const fused = reciprocalRankFusion([list1, list2]);

    // Doc1 ranks #1 in list1, #2 in list2 → RRF = 1/61 + 1/62
    // Doc2 ranks #2 in list1, #1 in list2 → RRF = 1/62 + 1/61
    // Both should have same RRF score, but order may vary
    expect(fused.length).toBe(3);
    expect(fused[0].method).toBe('hybrid');

    // Doc1 and Doc2 should be top 2 (order may vary due to equal scores)
    const topIds = [fused[0].document.id, fused[1].document.id];
    expect(topIds).toContain('doc1');
    expect(topIds).toContain('doc2');
  });

  it('should boost documents that appear in multiple lists', () => {
    const list1: RetrievalResult[] = [
      { document: doc1, score: 0.9, method: 'dense' },
    ];

    const list2: RetrievalResult[] = [
      { document: doc2, score: 0.8, method: 'sparse' },
    ];

    const list3: RetrievalResult[] = [
      { document: doc1, score: 0.7, method: 'other' }, // doc1 appears in 2 lists
    ];

    const fused = reciprocalRankFusion([list1, list2, list3]);

    // Doc1 should rank higher (appears in list1 and list3)
    expect(fused[0].document.id).toBe('doc1');
  });

  it('should handle empty lists', () => {
    const fused = reciprocalRankFusion([]);
    expect(fused.length).toBe(0);
  });

  it('should compute RRF scores correctly', () => {
    const list1: RetrievalResult[] = [
      { document: doc1, score: 1.0, method: 'dense' },
    ];

    const fused = reciprocalRankFusion([list1], 60);

    // RRF score for rank 0 with k=60: 1/(60+0+1) = 1/61 ≈ 0.0164
    expect(fused[0].score).toBeCloseTo(1 / 61, 4);
  });
});
