/**
 * Tests for text chunking functionality
 */

import { describe, it, expect } from 'vitest';
import { chunkTranscript, formatTimestamp, type Transcript } from '../src/chunker.js';

describe('chunker', () => {
  const sampleTranscript: Transcript = {
    videoId: 'test-video',
    title: 'Test Video',
    transcript: [
      { text: 'Hello world. This is a test.', start: 0.0, duration: 2.0 },
      { text: 'We are testing the chunker.', start: 2.0, duration: 2.0 },
      { text: 'It should split text into overlapping chunks.', start: 4.0, duration: 3.0 },
      { text: 'Each chunk should preserve timestamp metadata.', start: 7.0, duration: 3.0 },
    ],
  };

  it('should produce chunks with expected size constraints', () => {
    const chunks = chunkTranscript(sampleTranscript, 50, 10);

    expect(chunks.length).toBeGreaterThan(0);

    // Each chunk should be roughly the target size (allow some variation for boundaries)
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(70); // 50 + some tolerance
    }
  });

  it('should create overlapping chunks', () => {
    const chunkSize = 50;
    const overlap = 20;
    const chunks = chunkTranscript(sampleTranscript, chunkSize, overlap);

    if (chunks.length > 1) {
      // Check that consecutive chunks share some text (overlap)
      for (let i = 0; i < chunks.length - 1; i++) {
        const current = chunks[i].text;
        const next = chunks[i + 1].text;

        // The end of current chunk should appear somewhere in next chunk
        const endOfCurrent = current.slice(-overlap);
        const hasOverlap = next.includes(endOfCurrent.trim().split(' ').slice(-2).join(' '));

        // This is a heuristic check; exact overlap may vary due to word boundaries
        expect(hasOverlap || overlap < 10).toBeTruthy();
      }
    }
  });

  it('should preserve metadata in chunks', () => {
    const chunks = chunkTranscript(sampleTranscript);

    for (const chunk of chunks) {
      expect(chunk.videoId).toBe('test-video');
      expect(chunk.title).toBe('Test Video');
      expect(chunk.timestamp).toBeGreaterThanOrEqual(0);
      expect(chunk.chunkIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.id).toContain('test-video');
    }
  });

  it('should assign sequential chunk indices', () => {
    const chunks = chunkTranscript(sampleTranscript);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i);
    }
  });

  it('should format timestamps correctly', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(125)).toBe('02:05');
    expect(formatTimestamp(3661)).toBe('61:01');
  });

  it('should handle empty transcript gracefully', () => {
    const emptyTranscript: Transcript = {
      videoId: 'empty',
      title: 'Empty',
      transcript: [],
    };

    const chunks = chunkTranscript(emptyTranscript);
    expect(chunks).toEqual([]);
  });

  it('should handle very short transcript', () => {
    const shortTranscript: Transcript = {
      videoId: 'short',
      title: 'Short',
      transcript: [{ text: 'Hi', start: 0, duration: 1 }],
    };

    const chunks = chunkTranscript(shortTranscript, 100, 20);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe('Hi');
  });
});
