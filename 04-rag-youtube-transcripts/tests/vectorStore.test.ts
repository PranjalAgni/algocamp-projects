/**
 * Tests for vector store and retrieval
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorStore, cosineSimilarity } from '../src/vectorStore.js';
import { setUseHashEmbedder, embed } from '../src/embedder.js';
import type { Chunk } from '../src/chunker.js';

describe('vectorStore', () => {
  beforeEach(() => {
    // Use hash embedder for deterministic tests
    setUseHashEmbedder(true);
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3, 4];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0.0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1.0, 5);
    });

    it('should handle zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
    });

    it('should throw on dimension mismatch', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];
      expect(() => cosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe('VectorStore', () => {
    let store: VectorStore;

    beforeEach(() => {
      store = new VectorStore();
    });

    it('should start empty', () => {
      expect(store.size()).toBe(0);
    });

    it('should add chunks', async () => {
      const chunk: Chunk = {
        id: 'test-1',
        text: 'Test chunk',
        videoId: 'video-1',
        title: 'Test Video',
        timestamp: 10,
        chunkIndex: 0,
      };
      const embedding = await embed(chunk.text);

      store.addChunk(chunk, embedding);

      expect(store.size()).toBe(1);
    });

    it('should retrieve relevant chunks', async () => {
      // Add chunks about different topics
      const chunks: Chunk[] = [
        {
          id: 'chunk-1',
          text: 'RAG combines retrieval with generation for better answers.',
          videoId: 'video-1',
          title: 'Video 1',
          timestamp: 0,
          chunkIndex: 0,
        },
        {
          id: 'chunk-2',
          text: 'Embeddings convert text into numerical vectors.',
          videoId: 'video-1',
          title: 'Video 1',
          timestamp: 10,
          chunkIndex: 1,
        },
        {
          id: 'chunk-3',
          text: 'Python is a popular programming language.',
          videoId: 'video-2',
          title: 'Video 2',
          timestamp: 0,
          chunkIndex: 0,
        },
      ];

      // Embed and add all chunks
      for (const chunk of chunks) {
        const embedding = await embed(chunk.text);
        store.addChunk(chunk, embedding);
      }

      // Query about RAG
      const queryEmbedding = await embed('What is retrieval augmented generation?');
      const results = store.search(queryEmbedding, 2);

      expect(results.length).toBe(2);
      // First result should be the RAG chunk
      expect(results[0].chunk.id).toBe('chunk-1');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should return results sorted by score', async () => {
      const chunks: Chunk[] = [
        {
          id: 'chunk-1',
          text: 'Apples and oranges are fruits.',
          videoId: 'v1',
          title: 'V1',
          timestamp: 0,
          chunkIndex: 0,
        },
        {
          id: 'chunk-2',
          text: 'Cars and trucks are vehicles.',
          videoId: 'v1',
          title: 'V1',
          timestamp: 10,
          chunkIndex: 1,
        },
        {
          id: 'chunk-3',
          text: 'Bananas and strawberries are delicious fruits.',
          videoId: 'v1',
          title: 'V1',
          timestamp: 20,
          chunkIndex: 2,
        },
      ];

      for (const chunk of chunks) {
        const embedding = await embed(chunk.text);
        store.addChunk(chunk, embedding);
      }

      const queryEmbedding = await embed('Tell me about fruits');
      const results = store.search(queryEmbedding, 3);

      // Scores should be descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should respect topK parameter', async () => {
      const chunks: Chunk[] = Array.from({ length: 10 }, (_, i) => ({
        id: `chunk-${i}`,
        text: `This is test chunk number ${i}.`,
        videoId: 'video-1',
        title: 'Test Video',
        timestamp: i * 10,
        chunkIndex: i,
      }));

      for (const chunk of chunks) {
        const embedding = await embed(chunk.text);
        store.addChunk(chunk, embedding);
      }

      const queryEmbedding = await embed('test');
      const results = store.search(queryEmbedding, 5);

      expect(results.length).toBe(5);
    });

    it('should handle empty store gracefully', async () => {
      const queryEmbedding = await embed('test query');
      const results = store.search(queryEmbedding, 3);

      expect(results).toEqual([]);
    });

    it('should clear store', async () => {
      const chunk: Chunk = {
        id: 'test-1',
        text: 'Test',
        videoId: 'v1',
        title: 'V1',
        timestamp: 0,
        chunkIndex: 0,
      };
      const embedding = await embed(chunk.text);

      store.addChunk(chunk, embedding);
      expect(store.size()).toBe(1);

      store.clear();
      expect(store.size()).toBe(0);
    });
  });
});
