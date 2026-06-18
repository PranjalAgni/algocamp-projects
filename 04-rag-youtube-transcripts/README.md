# RAG Chatbot over YouTube Transcripts

A learning project demonstrating the full **Retrieval-Augmented Generation (RAG)** pipeline for question answering over YouTube transcripts.

## What This Teaches

The RAG architecture for grounded question answering:

1. **Ingest**: Load YouTube transcripts with timestamps
2. **Chunk**: Split long text into overlapping segments
3. **Embed**: Convert chunks to dense vectors (semantic representations)
4. **Store**: Build an in-memory vector database
5. **Retrieve**: Find top-k most relevant chunks using cosine similarity
6. **Generate**: Produce grounded answers with citations

## Features

- **Offline-first**: Runs without network or API keys using bundled sample transcripts
- **Two modes**:
  - **MOCK** (no API key): Extractive answers with citations from retrieved chunks
  - **LIVE** (with OPENAI_API_KEY): GPT-4o-mini generates answers from context
- **Hash embedder fallback**: Tests run deterministically without model downloads
- **Optional transformers.js**: Use local neural embeddings (all-MiniLM-L6-v2)
- **Citation tracking**: Every answer includes source video and timestamp

## Installation

```bash
npm install
```

## Running the Demo

```bash
npm run demo
```

This will:
- Load 2 bundled sample transcripts (~2 minutes each)
- Index them into the vector store (chunk → embed → store)
- Ask 3 questions and show retrieved chunks + generated answers

### Example Output

```
======================================================================
RAG Chatbot over YouTube Transcripts - Demo
======================================================================

[MODE: MOCK — no OPENAI_API_KEY]

Loading sample transcripts...
Loaded 2 transcripts:
  - Introduction to RAG (rag-intro-101)
  - Understanding Embeddings (embeddings-explained)

Indexing transcripts (chunk → embed → store)...
✓ Indexed 13 chunks

======================================================================
Question 1: What is RAG?
======================================================================

Retrieved chunks (top 3):

  [1] Score: 0.469 | Introduction to RAG @ 00:00
      "Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retriev..."

  [2] Score: 0.278 | Introduction to RAG @ 01:19
      "documents the information came from. This transparency helps users verify the information and builds trust in the system. RAG is particularly useful f..."

  [3] Score: 0.164 | Introduction to RAG @ 00:13
      "ful, can sometimes hallucinate or make up information. By first retrieving relevant documents from a knowledge base, we can provide the model with fac..."

Answer:
Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retrieval with language model generation to produce more accurate and grounded answers. [Introduction to RAG @ 00:00] documents the information came from. This transparency helps users verify the information and builds trust in the system. [Introduction to RAG @ 01:19] ful, can sometimes hallucinate or make up information. By first retrieving relevant documents from a knowledge base, we can provide the model with factual context to ground its responses. [Introduction to RAG @ 00:13]

======================================================================
Question 2: How do embeddings work?
======================================================================

Retrieved chunks (top 3):

  [1] Score: 0.135 | Introduction to RAG @ 00:00
      "Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retriev..."

  [2] Score: 0.116 | Introduction to RAG @ 00:43
      "he semantic meaning of the text. The embeddings are stored in a vector database, which allows us to efficiently search for similar chunks using cosine..."

  [3] Score: 0.110 | Understanding Embeddings @ 01:19
      "even though the words don't match exactly. When building a RAG system, choosing the right embedding model is important. You need to balance between mo..."

Answer:
Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retrieval with language model generation to produce more accurate and grounded answers. [Introduction to RAG @ 00:00] he semantic meaning of the text. The embeddings are stored in a vector database, which allows us to efficiently search for similar chunks using cosine similarity or other distance metrics. [Introduction to RAG @ 00:43] even though the words don't match exactly. When building a RAG system, choosing the right embedding model is important. [Understanding Embeddings @ 01:19]

======================================================================
Question 3: What is cosine similarity?
======================================================================

Retrieved chunks (top 3):

  [1] Score: 0.358 | Understanding Embeddings @ 00:29
      "ed in the famous 'Attention is All You Need' paper. Popular embedding models include BERT, Sentence-BERT, and more recently, models like all-MiniLM wh..."

  [2] Score: 0.316 | Introduction to RAG @ 00:00
      "Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retriev..."

  [3] Score: 0.289 | Introduction to RAG @ 01:19
      "documents the information came from. This transparency helps users verify the information and builds trust in the system. RAG is particularly useful f..."

Answer:
ed in the famous 'Attention is All You Need' paper. Popular embedding models include BERT, Sentence-BERT, and more recently, models like all-MiniLM which are optimized for speed and efficiency. [Understanding Embeddings @ 00:29] Hello everyone, welcome to this introduction to Retrieval-Augmented Generation, or RAG for short. RAG is a technique that combines information retrieval with language model generation to produce more accurate and grounded answers. [Introduction to RAG @ 00:00] documents the information came from. This transparency helps users verify the information and builds trust in the system. [Introduction to RAG @ 01:19]

======================================================================
Demo complete!
======================================================================
```

## Running Tests

All tests pass offline without network or API keys:

```bash
npm test
```

Output:
```
 ✓ tests/chunker.test.ts (7 tests) 67ms
 ✓ tests/vectorStore.test.ts (12 tests) 10ms
 ✓ tests/embedder.test.ts (6 tests) 17ms
 ✓ tests/generator.test.ts (5 tests) 7ms

 Test Files  4 passed (4)
      Tests  30 passed (30)
```

## Switching to LIVE Mode

To use GPT-4o-mini for answer generation:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```

3. Run the demo again:
   ```bash
   npm run demo
   ```

You'll see `[MODE: LIVE]` and get GPT-generated answers with better coherence.

## Project Structure

```
04-rag-youtube-transcripts/
├── src/
│   ├── data/
│   │   ├── sample1.json        # Bundled transcript: Introduction to RAG
│   │   └── sample2.json        # Bundled transcript: Understanding Embeddings
│   ├── chunker.ts              # Text chunking with overlap
│   ├── embedder.ts             # Embeddings (hash + transformers.js)
│   ├── vectorStore.ts          # In-memory vector DB with cosine search
│   ├── generator.ts            # Answer generation (LIVE/MOCK)
│   ├── index.ts                # Main RAG pipeline
│   └── demo.ts                 # Demo script
├── tests/
│   ├── chunker.test.ts         # Chunking tests
│   ├── embedder.test.ts        # Embedding tests
│   ├── vectorStore.test.ts     # Retrieval tests
│   └── generator.test.ts       # Generation tests
├── RESEARCH.md                 # Background on RAG and design decisions
├── PLAN.md                     # Implementation plan
└── README.md                   # This file
```

## How It Works

### 1. Chunking

Splits long transcripts into ~400 character chunks with 100-character overlap. Overlap prevents information loss at boundaries. Each chunk preserves its source video and timestamp.

```typescript
const chunks = chunkTranscript(transcript, 400, 100);
// Result: [{id, text, videoId, title, timestamp, chunkIndex}, ...]
```

### 2. Embedding

Converts text to dense vectors (128-dim hash vectors for tests, 384-dim neural embeddings with transformers.js for production).

```typescript
const embedding = await embed("What is RAG?");
// Result: [0.23, -0.15, 0.42, ...] (normalized to unit length)
```

### 3. Vector Store

In-memory store with cosine similarity search. Compares query embedding with all stored chunk embeddings, returns top-k matches.

```typescript
const results = vectorStore.search(queryEmbedding, 3);
// Result: [{chunk, score}, ...] sorted by similarity descending
```

### 4. Generation

**MOCK mode** (no API key): Extracts sentences from top chunks, adds citations:
```
"RAG combines retrieval with generation. [Video @ 01:23]"
```

**LIVE mode** (with OPENAI_API_KEY): Sends retrieved chunks as context to GPT-4o-mini with a prompt to generate grounded answers with citations.

## Key Concepts Demonstrated

- **Semantic search**: Finding relevant text by meaning, not just keywords
- **Chunking strategies**: Balancing context size vs. retrieval precision
- **Vector embeddings**: Dense numerical representations of text
- **Cosine similarity**: Measuring angle between vectors to find similar chunks
- **Grounding**: Using retrieved facts to reduce hallucination
- **Citation tracking**: Maintaining provenance for transparency

## Limitations (v1)

- Small corpus (2 transcripts, ~13 chunks)
- Simple chunking (fixed-size, not sentence-aware)
- In-memory storage (doesn't persist)
- Hash embedder is weak (better than nothing, but neural is preferred)
- No re-ranking or hybrid search

## Next Steps (Stretch Goals)

- Add `youtube-transcript` integration to fetch live videos
- Implement sentence-aware chunking
- Persist vector store to disk (JSON or SQLite)
- Add a simple web UI (Express + React)
- Hybrid search: combine BM25 (keyword) with semantic search
- Re-rank results with a cross-encoder
- Build an evaluation dataset to measure retrieval quality

## Technologies

- **TypeScript**: Type-safe implementation
- **@xenova/transformers**: Local neural embeddings (optional)
- **OpenAI API**: GPT-4o-mini for generation (optional)
- **vitest**: Fast, ESM-native testing
- **tsx**: Run TypeScript directly

## License

MIT
