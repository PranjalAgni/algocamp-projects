/**
 * FAQ search tool - searches the knowledge base for relevant help articles
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FAQ, ToolDefinition } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load FAQ data
const faqPath = join(__dirname, '../data/faq.json');
const faqs: FAQ[] = JSON.parse(readFileSync(faqPath, 'utf-8'));

/**
 * Tool definition for OpenAI function calling
 */
export const searchFAQTool: ToolDefinition = {
  name: 'searchFAQ',
  description: 'Search the FAQ knowledge base for relevant help articles. Returns matching questions and answers.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or topic to find help articles about',
      },
    },
    required: ['query'],
  },
};

/**
 * Execute FAQ search using simple keyword matching
 * In a production system, this would use embeddings/vector search
 */
export function searchFAQ(query: string): FAQ[] | { error: string } {
  // Validate input
  if (!query || typeof query !== 'string') {
    return { error: 'Invalid query: must be a non-empty string' };
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/);

  // Score each FAQ by relevance (simple keyword matching)
  const scored = faqs.map(faq => {
    let score = 0;

    // Check question match
    if (faq.question.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Check answer match
    if (faq.answer.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Check tag matches
    for (const keyword of keywords) {
      if (faq.tags.some(tag => tag.includes(keyword))) {
        score += 3;
      }
    }

    return { faq, score };
  });

  // Filter and sort by score
  const results = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Return top 3 results
    .map(item => item.faq);

  return results;
}
