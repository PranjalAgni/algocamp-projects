/**
 * Tests for query processing (expansion, tokenization)
 */

import { describe, it, expect } from 'vitest';
import { expandQuery, tokenize } from '../src/query-processing.js';

describe('Query Processing', () => {
  describe('Query Expansion', () => {
    it('should expand queries with known synonyms', () => {
      const expansion = expandQuery('How do I request PTO?');

      expect(expansion.original).toBe('How do I request PTO?');
      expect(expansion.expanded).toContain('PTO');
      expect(expansion.addedTerms.length).toBeGreaterThan(0);
      expect(expansion.addedTerms).toContain('vacation');
      expect(expansion.addedTerms).toContain('leave');
    });

    it('should handle multiple synonym matches', () => {
      const expansion = expandQuery('What is the remote work policy?');

      expect(expansion.addedTerms.length).toBeGreaterThan(0);
      // Should expand both "remote" and "policy"
      const allTerms = expansion.addedTerms.join(' ');
      expect(allTerms).toContain('wfh');
      expect(allTerms).toContain('guideline');
    });

    it('should preserve original query', () => {
      const expansion = expandQuery('some random query');

      expect(expansion.original).toBe('some random query');
      expect(expansion.expanded).toContain('some random query');
    });

    it('should return original if no synonyms found', () => {
      const expansion = expandQuery('nonexistent terms xyz');

      expect(expansion.addedTerms.length).toBe(0);
      expect(expansion.expanded).toBe('nonexistent terms xyz');
    });

    it('should be case-insensitive', () => {
      const expansion = expandQuery('REQUEST PTO');

      expect(expansion.addedTerms.length).toBeGreaterThan(0);
      expect(expansion.addedTerms).toContain('vacation');
    });
  });

  describe('Tokenization', () => {
    it('should tokenize basic text', () => {
      const tokens = tokenize('This is a test');

      expect(tokens).toEqual(['this', 'is', 'a', 'test']);
    });

    it('should handle punctuation', () => {
      const tokens = tokenize('Hello, world! How are you?');

      expect(tokens).toEqual(['hello', 'world', 'how', 'are', 'you']);
    });

    it('should be case-insensitive', () => {
      const tokens = tokenize('ABC abc AbC');

      expect(tokens).toEqual(['abc', 'abc', 'abc']);
    });

    it('should filter out empty tokens', () => {
      const tokens = tokenize('   multiple    spaces   ');

      expect(tokens).toEqual(['multiple', 'spaces']);
    });

    it('should handle empty string', () => {
      const tokens = tokenize('');

      expect(tokens).toEqual([]);
    });
  });
});
