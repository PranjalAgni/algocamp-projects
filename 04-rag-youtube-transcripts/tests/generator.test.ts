/**
 * Tests for answer generation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateAnswer, firstSentences } from '../src/generator.js';
import { setUseHashEmbedder } from '../src/embedder.js';
import type { SearchResult } from '../src/vectorStore.js';
import type { Chunk } from '../src/chunker.js';

describe('generator', () => {
  beforeAll(() => {
    // Force hash embedder for tests
    setUseHashEmbedder(true);
  });

  const mockChunks: SearchResult[] = [
    {
      chunk: {
        id: 'chunk-1',
        text: 'RAG stands for Retrieval-Augmented Generation. It combines information retrieval with language model generation.',
        videoId: 'video-1',
        title: 'Introduction to RAG',
        timestamp: 42,
        chunkIndex: 0,
      },
      score: 0.87,
    },
    {
      chunk: {
        id: 'chunk-2',
        text: 'The key idea behind RAG is to retrieve relevant documents before generating an answer.',
        videoId: 'video-1',
        title: 'Introduction to RAG',
        timestamp: 75,
        chunkIndex: 1,
      },
      score: 0.76,
    },
  ];

  it('should generate answer in MOCK mode without API key', async () => {
    // Ensure no API key is set for this test
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generateAnswer('What is RAG?', mockChunks);

    expect(result.mode).toBe('MOCK');
    expect(result.answer).toBeTruthy();
    expect(result.answer.length).toBeGreaterThan(0);

    // Restore original key
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it('should include citations in MOCK answer', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generateAnswer('What is RAG?', mockChunks);

    // Check for citation format [Title @ timestamp]
    expect(result.answer).toMatch(/\[.*@.*\]/);

    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it('should include retrieved chunks in result', async () => {
    const result = await generateAnswer('What is RAG?', mockChunks);

    expect(result.retrievedChunks).toEqual(mockChunks);
  });

  it('should handle empty results gracefully', async () => {
    const result = await generateAnswer('What is quantum computing?', []);

    expect(result.answer).toContain('No relevant information');
  });

  describe('firstSentences', () => {
    it('keeps question marks and exclamation points instead of rewriting them to periods', () => {
      const excerpt = firstSentences('Thanks for watching! Next time we explore vector databases. And more.', 2);
      expect(excerpt).toBe('Thanks for watching! Next time we explore vector databases.');
    });

    it('does not split a decimal into two sentences', () => {
      // A naive /[.!?]+/ split would treat "1" and "5 billion parameters" as
      // two sentences, dropping the real second sentence ("It runs fast.").
      const excerpt = firstSentences('The model has 1.5 billion parameters. It runs fast. Done.', 2);
      expect(excerpt).toBe('The model has 1.5 billion parameters. It runs fast.');
    });

    it('returns text unchanged when there is no sentence terminator', () => {
      expect(firstSentences('No terminator here at all', 2)).toBe('No terminator here at all');
    });
  });

  it('should extract content from chunks', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generateAnswer('What is RAG?', mockChunks);

    // Answer should contain some content from the chunks
    const hasContent =
      result.answer.toLowerCase().includes('retrieval') ||
      result.answer.toLowerCase().includes('generation') ||
      result.answer.toLowerCase().includes('rag');

    expect(hasContent).toBe(true);

    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });
});
