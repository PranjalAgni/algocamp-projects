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

    // Take first 1-2 sentences from the chunk
    const chunkSentences = result.chunk.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const excerpt = chunkSentences.slice(0, 2).join('.') + '.';

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
