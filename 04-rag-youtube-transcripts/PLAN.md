# RAG Chatbot over YouTube Transcripts — Implementation Plan

## Goal

Build a working RAG pipeline that:
1. Indexes YouTube transcript chunks with embeddings
2. Retrieves relevant chunks for a query
3. Generates grounded answers with citations
4. Runs fully offline by default (bundled transcripts, local embeddings, mock generation)

## v1 Scope

### Core Components

1. **Data Layer** (`src/data/`)
   - `transcripts/sample1.json`, `sample2.json` — bundled YouTube transcripts with timestamps
   - Schema: `{videoId, title, transcript: [{text, start, duration}]}`

2. **Chunker** (`src/chunker.ts`)
   - Split transcript into overlapping chunks (~400 chars, 100-char overlap)
   - Preserve timestamp metadata for each chunk
   - Return: `Chunk[] = {id, text, videoId, title, timestamp, chunkIndex}`

3. **Embedder** (`src/embedder.ts`)
   - Primary: `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2`
   - Fallback: Hash-based deterministic embedder (word frequency vectors)
   - Export: `embed(text: string): Promise<number[]>`

4. **Vector Store** (`src/vectorStore.ts`)
   - In-memory store: `{chunks: Chunk[], embeddings: number[][]}`
   - `addChunk(chunk, embedding)` — store a chunk
   - `search(queryEmbedding, topK)` — cosine similarity search
   - Return: `{chunk, score}[]`

5. **Generator** (`src/generator.ts`)
   - LIVE mode: OpenAI gpt-4o-mini with retrieved context
   - MOCK mode: Extractive answer from top chunks with citations
   - Input: `query, retrievedChunks[]`
   - Output: `{answer: string, mode: 'LIVE' | 'MOCK'}`

6. **Main Pipeline** (`src/index.ts`)
   - Load bundled transcripts
   - Chunk → embed → store
   - Export: `indexTranscripts()`, `askQuestion(query)`

7. **Demo** (`src/demo.ts`)
   - Load 2 sample transcripts
   - Index them
   - Ask 3 questions
   - Print retrieved chunks (with scores) and final answer
   - Run via `npm run demo`

### Tests (`tests/`)

- `chunker.test.ts` — verify chunk size, overlap
- `embedder.test.ts` — hash embedder consistency
- `vectorStore.test.ts` — retrieval returns expected chunk
- `generator.test.ts` — mock answer includes citation

### Config Files

- `package.json` — scripts: `demo`, `test`, `dev`
- `tsconfig.json` — ESM, strict mode
- `.env.example` — `OPENAI_API_KEY=your_key_here`
- `.gitignore` — standard Node.js + .env
- `vitest.config.ts` — vitest setup

## File Layout

```
04-rag-youtube-transcripts/
├── RESEARCH.md
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── src/
│   ├── data/
│   │   ├── sample1.json        # Bundled transcript 1
│   │   └── sample2.json        # Bundled transcript 2
│   ├── chunker.ts              # Text chunking with overlap
│   ├── embedder.ts             # Embeddings (transformers.js + hash fallback)
│   ├── vectorStore.ts          # In-memory cosine search
│   ├── generator.ts            # Answer generation (LIVE/MOCK)
│   ├── index.ts                # Main RAG pipeline
│   └── demo.ts                 # Demo script
└── tests/
    ├── chunker.test.ts
    ├── embedder.test.ts
    ├── vectorStore.test.ts
    └── generator.test.ts
```

## Demo Flow

```bash
npm install
npm run demo
```

Expected output:
```
[MODE: MOCK — no OPENAI_API_KEY]

Indexing 2 transcripts...
✓ sample1.json: 15 chunks
✓ sample2.json: 12 chunks
Total: 27 chunks indexed

Question 1: What is RAG?
Retrieved chunks (top 3):
  [1] Score: 0.87 | sample1.json @ 00:42
      "RAG stands for Retrieval-Augmented Generation..."
  [2] Score: 0.76 | sample1.json @ 01:15
      "The key idea is to retrieve relevant documents..."
  [3] Score: 0.68 | sample2.json @ 00:23
      "RAG combines search with language models..."

Answer:
RAG stands for Retrieval-Augmented Generation, a technique that combines 
retrieval with language models. [sample1.json @ 00:42] The key idea is to 
retrieve relevant documents before generating an answer. [sample1.json @ 01:15]

---
(2 more questions)
```

## Test Commands

```bash
npm test                    # Run all tests
npm test -- chunker        # Run specific test
```

All tests pass offline (no network, no API key).

## Mode Switching

Set `OPENAI_API_KEY` in `.env` to enable LIVE mode:
```bash
cp .env.example .env
# Edit .env and add your key
npm run demo  # Now uses GPT-4o-mini
```

## Stretch Goals (not v1)

- **Fetch live transcripts**: Add `npm run index <youtube-url>` to download and index
- **Persistence**: Save vector store to disk, load on startup
- **Web UI**: Simple Express + React frontend
- **Better chunking**: Sentence-aware splitting, semantic chunking
- **Hybrid search**: Combine BM25 (keyword) with semantic search
- **Streaming**: Stream GPT response token-by-token
- **Multi-video**: Index 10+ videos, filter by source in UI
- **Evaluation**: Build a test set, measure retrieval precision/recall

## Implementation Order

1. Set up project structure, package.json, tsconfig
2. Create sample transcript JSON files (manually curated)
3. Implement chunker (tests first)
4. Implement hash embedder for testing
5. Implement vector store with cosine similarity
6. Implement mock generator
7. Wire up demo script
8. Run and verify offline
9. Add transformers.js embedder (may require model download on first run)
10. Add OpenAI generator for LIVE mode
11. Write README with a short, honest slice of real output (not a full pasted dump)
