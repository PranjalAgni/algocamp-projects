/**
 * Answer generation with LIVE (OpenAI) and MOCK (extractive) modes
 *
 * LIVE: Uses GPT-4o-mini with retrieved context to generate grounded answers
 * MOCK: Extracts relevant sentences from retrieved chunks, adds citations
 */

import OpenAI from 'openai';
import type { SearchResult } from './vectorStore.js';
import { formatTimestamp } from './chunker.js';

export interface GeneratedAnswer {
  answer: string;
  mode: 'LIVE' | 'MOCK';
  retrievedChunks: SearchResult[];
}

/**
 * Check if OpenAI API key is available
 */
function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0;
}

/**
 * Generate answer using OpenAI GPT-4o-mini
 */
async function generateLive(query: string, results: SearchResult[]): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Build context from retrieved chunks
  const context = results
    .map((r, idx) => {
      const timestamp = formatTimestamp(r.chunk.timestamp);
      return `[Context ${idx + 1}] From "${r.chunk.title}" at ${timestamp}:\n${r.chunk.text}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a helpful assistant that answers questions based solely on the provided context.
Include citations in your answer by referencing the video title and timestamp (e.g., "[Introduction to RAG @ 01:23]").
If the context doesn't contain enough information to answer the question, say so.`;

  const userPrompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || 'No response generated.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Take the first `count` sentences from a chunk of text, keeping each
 * sentence's original terminator.
 *
 * Splits on whitespace that FOLLOWS a .!? terminator, so a decimal like
 * "1.5 billion" is never broken at the period (no space follows the point)
 * and a "?"/"!" is not silently rewritten to a "." on rejoin - both of which
 * a naive `.split(/[.!?]+/).join('.')` does, mangling the extractive answer.
 */
export function firstSentences(text: string, count: number): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.slice(0, count).join(' ');
}

/**
 * Generate extractive answer from retrieved chunks (MOCK mode)
 * Quotes relevant sentences and adds citations
 */
function generateMock(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant information found in the transcripts.';
  }

  // Extract key sentences from top chunks
  const sentences: string[] = [];

  for (const result of results) {
    const timestamp = formatTimestamp(result.chunk.timestamp);
    const citation = `[${result.chunk.title} @ ${timestamp}]`;

    // Take the first 1-2 sentences from the chunk (verbatim, terminators kept)
    const excerpt = firstSentences(result.chunk.text, 2);

    sentences.push(`${excerpt} ${citation}`);
  }

  // Combine into a coherent answer
  const answer = sentences.join(' ');

  return answer;
}

/**
 * Generate an answer to a query using retrieved chunks
 * Auto-selects between LIVE and MOCK mode based on API key availability
 */
export async function generateAnswer(
  query: string,
  results: SearchResult[]
): Promise<GeneratedAnswer> {
  const mode = hasOpenAIKey() ? 'LIVE' : 'MOCK';

  let answer: string;

  if (mode === 'LIVE') {
    try {
      answer = await generateLive(query, results);
    } catch (error) {
      console.warn('LIVE mode failed, falling back to MOCK:', error);
      answer = generateMock(query, results);
    }
  } else {
    answer = generateMock(query, results);
  }

  return {
    answer,
    mode,
    retrievedChunks: results,
  };
}
