/**
 * Tests for embedding functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { embed, setUseHashEmbedder } from '../src/embedder.js';

describe('embedder', () => {
  // Force hash embedder for deterministic tests
  beforeAll(() => {
    setUseHashEmbedder(true);
  });

  it('should produce consistent embeddings for same input', async () => {
    const text = 'This is a test sentence about RAG and embeddings.';

    const embedding1 = await embed(text);
    const embedding2 = await embed(text);

    expect(embedding1).toEqual(embedding2);
  });

  it('should produce different embeddings for different inputs', async () => {
    const text1 = 'Retrieval-Augmented Generation is a powerful technique.';
    const text2 = 'Embeddings convert text into vectors.';

    const embedding1 = await embed(text1);
    const embedding2 = await embed(text2);

    expect(embedding1).not.toEqual(embedding2);
  });

  it('should produce vectors of consistent dimension', async () => {
    const texts = [
      'Short text.',
      'A much longer text with many words and various concepts about machine learning and natural language processing.',
      'Medium length text about embeddings.',
    ];

    const embeddings = await Promise.all(texts.map(embed));

    const firstDim = embeddings[0].length;
    for (const emb of embeddings) {
      expect(emb.length).toBe(firstDim);
    }
  });

  it('should produce normalized vectors', async () => {
    const text = 'Test normalization of embedding vectors.';
    const embedding = await embed(text);

    // Calculate magnitude
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    // Should be approximately 1 (unit vector)
    expect(magnitude).toBeGreaterThan(0.99);
    expect(magnitude).toBeLessThan(1.01);
  });

  it('should handle empty string', async () => {
    const embedding = await embed('');

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  it('should produce similar embeddings for similar texts', async () => {
    const text1 = 'cats and dogs are pets';
    const text2 = 'dogs and cats are animals';
    const text3 = 'quantum physics and relativity';

    const emb1 = await embed(text1);
    const emb2 = await embed(text2);
    const emb3 = await embed(text3);

    // Simple cosine similarity check
    const similarity12 = dotProduct(emb1, emb2);
    const similarity13 = dotProduct(emb1, emb3);

    // text1 and text2 should be more similar than text1 and text3
    expect(similarity12).toBeGreaterThan(similarity13);
  });
});

// Helper function for similarity comparison
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}
