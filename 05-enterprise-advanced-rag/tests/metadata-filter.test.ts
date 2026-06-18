/**
 * Tests for metadata filtering
 */

import { describe, it, expect } from 'vitest';
import { filterByMetadata } from '../src/metadata-filter.js';
import type { Document } from '../src/types.js';

describe('Metadata Filtering', () => {
  const testDocs: Document[] = [
    {
      id: 'doc1',
      content: 'HR policy content',
      metadata: { title: 'PTO Policy', department: 'HR', date: '2024-01-15', type: 'policy' },
    },
    {
      id: 'doc2',
      content: 'Engineering handbook content',
      metadata: { title: 'Security Guidelines', department: 'Engineering', date: '2024-04-01', type: 'handbook' },
    },
    {
      id: 'doc3',
      content: 'Finance policy content',
      metadata: { title: 'Expense Policy', department: 'Finance', date: '2024-02-20', type: 'policy' },
    },
    {
      id: 'doc4',
      content: 'HR handbook content',
      metadata: { title: 'Benefits Overview', department: 'HR', date: '2023-12-01', type: 'handbook' },
    },
  ];

  it('should filter by department', () => {
    const filtered = filterByMetadata(testDocs, { department: 'HR' });

    expect(filtered.length).toBe(2);
    expect(filtered.map(d => d.id)).toEqual(['doc1', 'doc4']);
  });

  it('should filter by type', () => {
    const filtered = filterByMetadata(testDocs, { type: 'policy' });

    expect(filtered.length).toBe(2);
    expect(filtered.map(d => d.id)).toEqual(['doc1', 'doc3']);
  });

  it('should filter by department AND type (AND logic)', () => {
    const filtered = filterByMetadata(testDocs, {
      department: 'HR',
      type: 'policy',
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('doc1');
  });

  it('should filter by date range (after)', () => {
    const filtered = filterByMetadata(testDocs, {
      dateAfter: '2024-02-01',
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(d => d.id)).toEqual(['doc2', 'doc3']);
  });

  it('should filter by date range (before)', () => {
    const filtered = filterByMetadata(testDocs, {
      dateBefore: '2024-02-01',
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(d => d.id)).toEqual(['doc1', 'doc4']);
  });

  it('should filter by date range (between)', () => {
    const filtered = filterByMetadata(testDocs, {
      dateAfter: '2024-01-01',
      dateBefore: '2024-03-01',
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(d => d.id)).toEqual(['doc1', 'doc3']);
  });

  it('should return all docs when no filter specified', () => {
    const filtered = filterByMetadata(testDocs, {});

    expect(filtered.length).toBe(4);
  });

  it('should return empty array when no matches', () => {
    const filtered = filterByMetadata(testDocs, {
      department: 'NonExistent',
    });

    expect(filtered.length).toBe(0);
  });
});
