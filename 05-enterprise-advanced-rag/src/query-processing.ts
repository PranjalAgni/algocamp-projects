/**
 * Query processing: expand and rewrite queries to improve retrieval
 */

import type { QueryExpansion } from './types.js';

/**
 * Simple synonym expansion for common enterprise terms
 * In production, this would use WordNet, a fine-tuned LLM, or learned synonyms
 */
const SYNONYM_MAP: Record<string, string[]> = {
  'pto': ['vacation', 'leave', 'time off', 'paid time off'],
  'time off': ['pto', 'vacation', 'leave', 'absence'],
  'vacation': ['pto', 'time off', 'leave'],
  'remote': ['work from home', 'wfh', 'telework', 'distributed'],
  'work from home': ['remote', 'wfh', 'telework'],
  'wfh': ['remote', 'work from home', 'telework'],
  'security': ['cybersecurity', 'infosec', 'data protection'],
  'policy': ['guideline', 'rule', 'procedure'],
  'expense': ['reimbursement', 'cost', 'spending'],
  'travel': ['trip', 'business travel', 'flight'],
  'benefits': ['perks', 'compensation', 'health insurance'],
  'review': ['performance review', 'evaluation', 'assessment'],
  'onboarding': ['new hire', 'orientation', 'getting started'],
};

/**
 * Expand a query with synonyms
 * Returns the original query plus related terms
 */
export function expandQuery(query: string): QueryExpansion {
  const normalized = query.toLowerCase();
  const addedTerms = new Set<string>();

  // Find matching terms and add their synonyms
  for (const [term, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (normalized.includes(term)) {
      synonyms.forEach(syn => addedTerms.add(syn));
    }
  }

  const addedArray = Array.from(addedTerms);
  const expanded = addedArray.length > 0
    ? `${query} ${addedArray.join(' ')}`
    : query;

  return {
    original: query,
    expanded,
    addedTerms: addedArray,
  };
}

/**
 * Tokenize text into words (simple whitespace + lowercase)
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(token => token.length > 0);
}
