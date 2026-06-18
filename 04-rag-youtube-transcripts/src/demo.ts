/**
 * Demo script for RAG chatbot
 *
 * Demonstrates the full pipeline:
 * - Load bundled sample transcripts
 * - Index them (chunk + embed + store)
 * - Ask 3 questions
 * - Show retrieved chunks and generated answers
 */

import 'dotenv/config';
import { RAGPipeline } from './index.js';
import { formatTimestamp } from './chunker.js';
import { setUseHashEmbedder } from './embedder.js';

async function main() {
  console.log('='.repeat(70));
  console.log('RAG Chatbot over YouTube Transcripts - Demo');
  console.log('='.repeat(70));

  // Print mode banner
  const hasKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0;
  const mode = hasKey ? 'LIVE' : 'MOCK';
  console.log(`\n[MODE: ${mode}${mode === 'MOCK' ? ' — no OPENAI_API_KEY' : ''}]\n`);

  // Force hash embedder for faster demo (comment out to use transformers.js)
  setUseHashEmbedder(true);

  // Initialize pipeline
  const rag = new RAGPipeline();

  // Load and index sample transcripts
  console.log('Loading sample transcripts...');
  const transcripts = await rag.loadSampleTranscripts();
  console.log(`Loaded ${transcripts.length} transcripts:`);
  for (const t of transcripts) {
    console.log(`  - ${t.title} (${t.videoId})`);
  }

  console.log('\nIndexing transcripts (chunk → embed → store)...');
  await rag.indexTranscripts(transcripts);

  const stats = rag.getStats();
  console.log(`✓ Indexed ${stats.totalChunks} chunks\n`);

  // Questions to ask
  const questions = [
    'What is RAG?',
    'How do embeddings work?',
    'What is cosine similarity?',
  ];

  // Ask each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log('='.repeat(70));
    console.log(`Question ${i + 1}: ${question}`);
    console.log('='.repeat(70));

    const result = await rag.askQuestion(question, 3);

    // Show retrieved chunks
    console.log('\nRetrieved chunks (top 3):');
    for (let j = 0; j < result.retrievedChunks.length; j++) {
      const r = result.retrievedChunks[j];
      const timestamp = formatTimestamp(r.chunk.timestamp);
      console.log(`\n  [${j + 1}] Score: ${r.score.toFixed(3)} | ${r.chunk.title} @ ${timestamp}`);
      console.log(`      "${r.chunk.text.slice(0, 150)}${r.chunk.text.length > 150 ? '...' : ''}"`);
    }

    // Show generated answer
    console.log('\nAnswer:');
    console.log(`${result.answer}\n`);
  }

  console.log('='.repeat(70));
  console.log('Demo complete!');
  console.log('='.repeat(70));
}

main().catch(console.error);
