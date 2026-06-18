/**
 * Answer generation: generate final answer from retrieved context
 * LIVE mode: OpenAI API
 * MOCK mode: Extractive QA (return most relevant sentence)
 */

import OpenAI from 'openai';
import type { RetrievalResult } from './types.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Extract the most relevant sentence from the top document (mock mode)
 * Simple heuristic: find sentence with most query term matches
 */
function extractiveAnswer(query: string, topDoc: string): string {
  // Split into sentences (simple approach)
  const sentences = topDoc
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Filter out very short fragments

  if (sentences.length === 0) {
    return 'No relevant information found.';
  }

  // Score sentences by query term overlap
  const queryTerms = query.toLowerCase().split(/\s+/);
  const scored = sentences.map(sentence => {
    const sentLower = sentence.toLowerCase();
    const matches = queryTerms.filter(term => sentLower.includes(term)).length;
    return { sentence, score: matches };
  });

  // Return sentence with most matches
  scored.sort((a, b) => b.score - a.score);
  return scored[0].sentence;
}

/**
 * Generate answer from retrieved context
 */
export async function generateAnswer(
  query: string,
  results: RetrievalResult[]
): Promise<string> {
  if (results.length === 0) {
    return 'No relevant documents found.';
  }

  const topDoc = results[0].document;

  // MOCK mode: extractive answer
  if (!OPENAI_API_KEY) {
    return extractiveAnswer(query, topDoc.content);
  }

  // LIVE mode: OpenAI API
  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Build context from top 3 docs
    const context = results
      .slice(0, 3)
      .map(
        r =>
          `[${r.document.metadata.title}]\n${r.document.content.slice(0, 500)}`
      )
      .join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions based on the provided company documents. Keep answers concise and cite the source document.',
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0].message.content || 'Unable to generate answer.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return extractiveAnswer(query, topDoc.content);
  }
}
