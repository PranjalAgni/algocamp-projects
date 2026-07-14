/**
 * Tests for the offline (mock) extractive answer
 */

import { describe, it, expect } from 'vitest';
import { extractiveAnswer } from '../src/generator.js';

describe('extractiveAnswer', () => {
  it('does not split a decimal number across sentences', () => {
    // The PTO doc contains "1.25 days per month". A naive /[.!?]+/ splitter
    // breaks that at the period and returns a fragment starting "25 days per
    // month" - a wrong figure. The decimal-safe splitter must keep it whole.
    const doc =
      'PTO accrues monthly at a rate of 1.25 days per month. ' +
      'Maximum PTO balance cap is 30 days.';

    const answer = extractiveAnswer('how do I accrue PTO per month', doc);

    expect(answer).toContain('1.25 days per month');
    expect(answer.startsWith('25 days per month')).toBe(false);
  });

  it('returns the sentence with the most query-term overlap', () => {
    const doc =
      'The office is open on weekdays. ' +
      'Employees request time off through the HR portal.';

    const answer = extractiveAnswer('how do I request time off', doc);

    expect(answer).toContain('request time off');
  });
});
