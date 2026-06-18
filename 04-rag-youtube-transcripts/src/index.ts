/**
 * Main RAG pipeline
 *
 * Orchestrates the full flow:
 * 1. Load transcripts
 * 2. Chunk text with overlap
 * 3. Embed chunks
 * 4. Store in vector DB
 * 5. Query: embed → retrieve → generate
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chunkTranscript, type Transcript, type Chunk } from './chunker.js';
import { embed, embedBatch } from './embedder.js';
import { VectorStore, type SearchResult } from './vectorStore.js';
import { generateAnswer, type GeneratedAnswer } from './generator.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * RAG pipeline manager
 */
export class RAGPipeline {
  private vectorStore: VectorStore;
  private indexed: boolean = false;

  constructor() {
    this.vectorStore = new VectorStore();
  }

  /**
   * Load a transcript from a JSON file
   */
  async loadTranscript(filepath: string): Promise<Transcript> {
    const content = await readFile(filepath, 'utf-8');
    return JSON.parse(content) as Transcript;
  }

  /**
   * Load bundled sample transcripts
   */
  async loadSampleTranscripts(): Promise<Transcript[]> {
    const dataDir = join(__dirname, 'data');
    const sample1 = await this.loadTranscript(join(dataDir, 'sample1.json'));
    const sample2 = await this.loadTranscript(join(dataDir, 'sample2.json'));
    return [sample1, sample2];
  }

  /**
   * Index a single transcript: chunk → embed → store
   */
  async indexTranscript(transcript: Transcript): Promise<number> {
    // Chunk the transcript
    const chunks = chunkTranscript(transcript);

    // Embed all chunks
    const texts = chunks.map(c => c.text);
    const embeddings = await embedBatch(texts);

    // Store in vector database
    this.vectorStore.addChunks(chunks, embeddings);

    return chunks.length;
  }

  /**
   * Index multiple transcripts
   */
  async indexTranscripts(transcripts: Transcript[]): Promise<void> {
    for (const transcript of transcripts) {
      await this.indexTranscript(transcript);
    }
    this.indexed = true;
  }

  /**
   * Ask a question and get a grounded answer with citations
   */
  async askQuestion(query: string, topK: number = 3): Promise<GeneratedAnswer> {
    if (!this.indexed) {
      throw new Error('No transcripts indexed. Call indexTranscripts() first.');
    }

    // Embed the query
    const queryEmbedding = await embed(query);

    // Retrieve top-k relevant chunks
    const results = this.vectorStore.search(queryEmbedding, topK);

    // Generate answer from retrieved chunks
    const answer = await generateAnswer(query, results);

    return answer;
  }

  /**
   * Get statistics about the indexed data
   */
  getStats(): { totalChunks: number } {
    return {
      totalChunks: this.vectorStore.size(),
    };
  }

  /**
   * Clear all indexed data
   */
  clear(): void {
    this.vectorStore.clear();
    this.indexed = false;
  }
}
