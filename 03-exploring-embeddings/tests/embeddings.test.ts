/**
 * Tests for embeddings and similarity functions.
 *
 * These tests use the hash-based embedder for:
 * - Deterministic results (same input → same output)
 * - Fully offline operation (no network, no model download)
 * - Fast execution
 *
 * Note: Hash embedder doesn't capture semantic meaning, but we can still
 * test the mathematical properties of cosine similarity and search ranking.
 */

import { describe, it, expect } from 'vitest';
import { createHashEmbedder } from '../src/hash.js';
import { cosineSimilarity, semanticSearch, similarityMatrix } from '../src/similarity.js';

describe('Embeddings and Similarity', () => {
  describe('Cosine Similarity', () => {
    it('should return 1.0 for identical vectors', () => {
      const v1 = [1, 2, 3, 4];
      const v2 = [1, 2, 3, 4];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return ~0.0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0, 0];
      const v2 = [0, 1, 0, 0];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1.0 for opposite vectors', () => {
      const v1 = [1, 2, 3, 4];
      const v2 = [-1, -2, -3, -4];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should be symmetric: sim(A, B) = sim(B, A)', () => {
      const v1 = [1, 2, 3, 4];
      const v2 = [5, 6, 7, 8];
      const sim1 = cosineSimilarity(v1, v2);
      const sim2 = cosineSimilarity(v2, v1);
      expect(sim1).toBeCloseTo(sim2, 5);
    });

    it('should handle zero vectors gracefully', () => {
      const v1 = [0, 0, 0, 0];
      const v2 = [1, 2, 3, 4];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBe(0);
    });

    it('should throw error for mismatched dimensions', () => {
      const v1 = [1, 2, 3];
      const v2 = [1, 2, 3, 4];
      expect(() => cosineSimilarity(v1, v2)).toThrow('dimension mismatch');
    });
  });

  describe('Hash Embedder', () => {
    it('should produce consistent embeddings for the same text', async () => {
      const embedder = createHashEmbedder();
      const text = "The quick brown fox jumps over the lazy dog.";

      const [embedding1] = await embedder.embed([text]);
      const [embedding2] = await embedder.embed([text]);

      expect(embedding1).toEqual(embedding2);
    });

    it('should produce different embeddings for different texts', async () => {
      const embedder = createHashEmbedder();
      const text1 = "Hello world";
      const text2 = "Goodbye world";

      const [embedding1] = await embedder.embed([text1]);
      const [embedding2] = await embedder.embed([text2]);

      // Should be different
      expect(embedding1).not.toEqual(embedding2);

      // Should have low similarity (probably, not guaranteed with hash)
      const similarity = cosineSimilarity(embedding1, embedding2);
      expect(similarity).toBeLessThan(0.5);
    });

    it('should produce normalized vectors (unit length)', async () => {
      const embedder = createHashEmbedder();
      const [embedding] = await embedder.embed(["Test text"]);

      // Compute magnitude
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );

      // Should be very close to 1.0 (normalized)
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('should produce embeddings of correct dimension', async () => {
      const embedder = createHashEmbedder();
      const [embedding] = await embedder.embed(["Test"]);
      expect(embedding.length).toBe(384); // Match Xenova dimension
    });
  });

  describe('Semantic Search', () => {
    it('should rank identical text as most similar', async () => {
      const embedder = createHashEmbedder();
      const query = "Machine learning is fascinating";
      const corpus = [
        "The weather is nice today",
        "Machine learning is fascinating", // Exact match
        "I like pizza and pasta"
      ];

      const results = await semanticSearch(embedder, query, corpus, 3);

      // The exact match should be first
      expect(results[0].text).toBe("Machine learning is fascinating");
      expect(results[0].score).toBeCloseTo(1.0, 5);
    });

    it('should respect topK parameter', async () => {
      const embedder = createHashEmbedder();
      const query = "test query";
      const corpus = Array(10).fill(0).map((_, i) => `Document ${i}`);

      const results = await semanticSearch(embedder, query, corpus, 3);
      expect(results).toHaveLength(3);
    });

    it('should return results in descending order of similarity', async () => {
      const embedder = createHashEmbedder();
      const query = "test";
      const corpus = ["alpha", "beta", "gamma", "delta"];

      const results = await semanticSearch(embedder, query, corpus, 4);

      // Verify descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should include original text and index in results', async () => {
      const embedder = createHashEmbedder();
      const query = "test";
      const corpus = ["first", "second", "third"];

      const results = await semanticSearch(embedder, query, corpus, 3);

      results.forEach((result, i) => {
        expect(result.text).toBeDefined();
        expect(result.score).toBeDefined();
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(corpus.length);
      });
    });
  });

  describe('Similarity Matrix', () => {
    it('should have 1.0 on the diagonal (self-similarity)', async () => {
      const embedder = createHashEmbedder();
      const texts = ["alpha", "beta", "gamma"];

      const matrix = await similarityMatrix(embedder, texts);

      // Diagonal should be 1.0
      for (let i = 0; i < texts.length; i++) {
        expect(matrix[i][i]).toBeCloseTo(1.0, 5);
      }
    });

    it('should be symmetric: matrix[i][j] = matrix[j][i]', async () => {
      const embedder = createHashEmbedder();
      const texts = ["alpha", "beta", "gamma"];

      const matrix = await similarityMatrix(embedder, texts);

      // Check symmetry
      for (let i = 0; i < texts.length; i++) {
        for (let j = 0; j < texts.length; j++) {
          expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 5);
        }
      }
    });

    it('should produce correct dimensions', async () => {
      const embedder = createHashEmbedder();
      const texts = ["one", "two", "three", "four"];

      const matrix = await similarityMatrix(embedder, texts);

      expect(matrix.length).toBe(4);
      matrix.forEach(row => {
        expect(row.length).toBe(4);
      });
    });

    it('should have all values in range [-1, 1]', async () => {
      const embedder = createHashEmbedder();
      const texts = ["alpha", "beta", "gamma", "delta"];

      const matrix = await similarityMatrix(embedder, texts);

      matrix.forEach(row => {
        row.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(-1.001); // Allow small floating-point error
          expect(value).toBeLessThanOrEqual(1.001);
        });
      });
    });
  });
});
