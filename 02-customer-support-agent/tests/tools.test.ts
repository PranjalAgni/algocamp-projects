/**
 * Unit tests for tools
 */

import { describe, it, expect } from 'vitest';
import { lookupOrder } from '../src/tools/lookupOrder.js';
import { searchFAQ } from '../src/tools/searchFAQ.js';
import { createTicket } from '../src/tools/createTicket.js';

describe('lookupOrder', () => {
  it('should find a valid order', () => {
    const result = lookupOrder('ORD-001');

    expect(result).toHaveProperty('orderId', 'ORD-001');
    expect(result).toHaveProperty('customerName');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
  });

  it('should return error for non-existent order', () => {
    const result = lookupOrder('ORD-999');

    expect(result).toHaveProperty('error');
    expect((result as any).error).toContain('not found');
  });

  it('should validate input', () => {
    const result = lookupOrder('');

    expect(result).toHaveProperty('error');
    expect((result as any).error).toContain('Invalid');
  });
});

describe('searchFAQ', () => {
  it('should find relevant FAQs for refund query', () => {
    const result = searchFAQ('refund');

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBeGreaterThan(0);

    const firstResult = (result as any[])[0];
    expect(firstResult).toHaveProperty('question');
    expect(firstResult).toHaveProperty('answer');
    expect(firstResult).toHaveProperty('tags');
  });

  it('should find relevant FAQs for shipping query', () => {
    const result = searchFAQ('shipping');

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBeGreaterThan(0);
  });

  it('should return empty array for irrelevant query', () => {
    const result = searchFAQ('xyz123abc456');

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(0);
  });

  it('should validate input', () => {
    const result = searchFAQ('');

    expect(result).toHaveProperty('error');
  });
});

describe('createTicket', () => {
  it('should create a ticket with default priority', () => {
    const result = createTicket('Test issue');

    expect(result).toHaveProperty('ticketId');
    expect(result).toHaveProperty('status', 'created');
    expect((result as any).ticketId).toMatch(/^TICKET-/);
  });

  it('should create a ticket with specified priority', () => {
    const result = createTicket('Urgent issue', 'high');

    expect(result).toHaveProperty('ticketId');
    expect(result).toHaveProperty('status', 'created');
  });

  it('should validate input', () => {
    const result = createTicket('');

    expect(result).toHaveProperty('error');
  });
});
