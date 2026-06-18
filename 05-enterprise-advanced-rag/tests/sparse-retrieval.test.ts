/**
 * Tests for sparse retrieval (TF-IDF/BM25)
 */

import { describe, it, expect } from 'vitest';
import { sparseRetrieval } from '../src/sparse-retrieval.js';
import type { Document } from '../src/types.js';

describe('Sparse Retrieval', () => {
  const testDocs: Document[] = [
    {
      id: 'doc1',
      content: 'The PTO policy allows employees to take vacation time off.',
      metadata: { title: 'PTO Policy', department: 'HR', date: '2024-01-01', type: 'policy' },
    },
    {
      id: 'doc2',
      content: 'Remote work policy describes working from home guidelines.',
      metadata: { title: 'Remote Work', department: 'HR', date: '2024-01-01', type: 'policy' },
    },
    {
      id: 'doc3',
      content: 'Security guidelines include password requirements and data protection.',
      metadata: { title: 'Security', department: 'Engineering', date: '2024-01-01', type: 'handbook' },
    },
  ];

  it('should rank docs with query terms higher', () => {
    const results = sparseRetrieval('PTO vacation', testDocs, 3);

    // Doc1 should be top (contains both "PTO" and "vacation")
    expect(results[0].document.id).toBe('doc1');
    expect(results[0].score).toBeGreaterThan(0);

    // Other docs should have zero or minimal score
    expect(results[1].score).toBeLessThan(results[0].score);
  });

  it('should handle exact keyword matches', () => {
    const results = sparseRetrieval('security password', testDocs, 3);

    // Doc3 should be top (contains both terms)
    expect(results[0].document.id).toBe('doc3');
  });

  it('should return empty results for no matches', () => {
    const results = sparseRetrieval('nonexistent keyword', testDocs, 3);

    // All scores should be 0
    results.forEach(result => {
      expect(result.score).toBe(0);
    });
  });

  it('should respect topK parameter', () => {
    const results = sparseRetrieval('policy', testDocs, 2);

    expect(results.length).toBe(2);
  });

  it('should prefer shorter docs with more term occurrences (BM25 behavior)', () => {
    const docs: Document[] = [
      {
        id: 'short',
        content: 'PTO PTO PTO',
        metadata: { title: 'Short', department: 'HR', date: '2024-01-01', type: 'policy' },
      },
      {
        id: 'long',
        content: 'PTO and lots of other words that make this document longer and dilute the term frequency of the query term PTO in this longer document',
        metadata: { title: 'Long', department: 'HR', date: '2024-01-01', type: 'policy' },
      },
    ];

    const results = sparseRetrieval('PTO', docs, 2);

    // Short doc with higher term density should rank higher
    expect(results[0].document.id).toBe('short');
  });
});
