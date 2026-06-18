/**
 * Integration tests for agent
 */

import { describe, it, expect } from 'vitest';
import { runAgent, getMode } from '../src/agent.js';

describe('Agent Integration', () => {
  it('should determine correct mode based on environment', () => {
    const mode = getMode();
    // Since we're running tests without API key, should be mock
    expect(mode).toBe('mock');
  });

  it('should resolve order status query by calling lookupOrder', async () => {
    const query = "What's the status of order ORD-001?";
    const response = await runAgent(query);

    // Check response structure
    expect(response).toHaveProperty('answer');
    expect(response).toHaveProperty('iterations');
    expect(response).toHaveProperty('mode');

    // Should have at least one iteration
    expect(response.iterations.length).toBeGreaterThan(0);

    // First iteration should have called lookupOrder
    const firstIteration = response.iterations[0];
    expect(firstIteration.toolCalls.length).toBeGreaterThan(0);

    const lookupCall = firstIteration.toolCalls.find(call => call.name === 'lookupOrder');
    expect(lookupCall).toBeDefined();
    expect(lookupCall?.arguments).toHaveProperty('orderId');

    // Should have tool results
    expect(firstIteration.toolResults.length).toBeGreaterThan(0);

    // Answer should mention the order
    expect(response.answer).toMatch(/ORD-001/i);
  });

  it('should resolve FAQ query by calling searchFAQ', async () => {
    const query = "What's your refund policy?";
    const response = await runAgent(query);

    // Should have at least one iteration
    expect(response.iterations.length).toBeGreaterThan(0);

    // Should have called searchFAQ
    const firstIteration = response.iterations[0];
    const faqCall = firstIteration.toolCalls.find(call => call.name === 'searchFAQ');
    expect(faqCall).toBeDefined();

    // Answer should mention refund
    expect(response.answer.toLowerCase()).toMatch(/refund|money-back/i);
  });

  it('should create ticket for bug reports', async () => {
    const query = "I found a bug in the checkout process";
    const response = await runAgent(query);

    // Should have at least one iteration
    expect(response.iterations.length).toBeGreaterThan(0);

    // Should have called createTicket
    const firstIteration = response.iterations[0];
    const ticketCall = firstIteration.toolCalls.find(call => call.name === 'createTicket');
    expect(ticketCall).toBeDefined();

    // Answer should mention ticket
    expect(response.answer.toLowerCase()).toMatch(/ticket/i);
  });

  it('should handle multiple tool calls in one query', async () => {
    const query = "Can you help with order ORD-002 and explain shipping?";
    const response = await runAgent(query);

    // Should have at least one iteration
    expect(response.iterations.length).toBeGreaterThan(0);

    // Should have called multiple tools
    const firstIteration = response.iterations[0];
    expect(firstIteration.toolCalls.length).toBeGreaterThanOrEqual(2);

    // Should have both lookupOrder and searchFAQ
    const hasLookup = firstIteration.toolCalls.some(call => call.name === 'lookupOrder');
    const hasSearch = firstIteration.toolCalls.some(call => call.name === 'searchFAQ');

    expect(hasLookup).toBe(true);
    expect(hasSearch).toBe(true);
  });
});
