# RAG Chatbot over YouTube Transcripts - Research

## What is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that combines information retrieval with language model generation to produce grounded, factual answers.

### The Pipeline

1. **Ingest**: Load documents (YouTube transcripts in our case)
2. **Chunk**: Split long documents into overlapping segments for better retrieval
3. **Embed**: Convert text chunks into dense vector representations
4. **Store**: Keep vectors in a searchable index (in-memory for learning)
5. **Retrieve**: Find top-k most similar chunks to a query using cosine similarity
6. **Generate**: Use retrieved context to produce a grounded answer with citations

## Why RAG?

- LLMs have knowledge cutoffs and hallucinate when uncertain
- RAG grounds answers in retrieved facts from a specific corpus
- Enables Q&A over private/domain-specific documents
- More cost-effective than fine-tuning for many use cases

## Key Technical Decisions

### Transcript Source

**youtube-transcript** library: 
- Pros: Easy to fetch transcripts programmatically, includes timestamps
- Cons: Requires network, can fail if video lacks captions
- **Our approach**: Bundle 1-2 sample transcripts as local JSON files for offline demo

### Text Chunking

**Strategy**: Fixed-size chunks with overlap
- Chunk size: ~400 characters (balance context vs. precision)
- Overlap: 100 characters (prevents information loss at boundaries)
- Preserve timestamps for citation

We count in characters, not tokens, to keep chunking dependency-free (no tokenizer). As a rough guide ~4 characters ≈ 1 token, so a 400-char chunk is roughly 100 tokens.

### Embeddings

**@xenova/transformers** (Transformers.js):
- Runs BERT-based models entirely in Node.js (WASM/native)
- Model: `Xenova/all-MiniLM-L6-v2` (384-dim, fast, good for semantic similarity)
- No API key, no network after model download
- **Fallback for tests**: Deterministic hash-based embedder (word frequency vectors)

### Vector Store

**In-memory cosine similarity**:
- Simple array of `{id, text, embedding, metadata}` objects
- Search: compute cosine similarity between query embedding and all stored embeddings
- Sort by score, return top-k
- Good enough for learning (100s-1000s of chunks)
- Production would use Pinecone, Weaviate, or pgvector

### Answer Generation

**Two modes**:

1. **LIVE (with OPENAI_API_KEY)**:
   - Use `openai` SDK with gpt-4o-mini
   - Prompt: "Answer the question using only the context below. Include citations."
   - Context: top-3 retrieved chunks with timestamps

2. **MOCK (no API key)**:
   - Extractive answer: quote relevant sentences from top chunks
   - Add citations: "[Source: video_title at 01:23]"
   - Demonstrates the retrieval works without needing an LLM

## Libraries Chosen

- **youtube-transcript**: Fetch transcripts (optional, for LIVE path)
- **@xenova/transformers**: Local embeddings
- **openai**: GPT-4o-mini generation (optional, with key)
- **tsx**: Run TypeScript directly
- **vitest**: Testing framework
- **dotenv**: Load .env file

## Practical Assumptions

1. **Bundled transcripts**: Ship 2 sample transcripts (educational videos, ~5-10 min each) as JSON with:
   ```json
   {
     "videoId": "abc123",
     "title": "Introduction to RAG",
     "transcript": [
       {"text": "Hello everyone...", "start": 0.0, "duration": 3.2},
       ...
     ]
   }
   ```

2. **Offline-first**: Demo and tests run without network by default

3. **Citation format**: `[Video Title @ 01:23]` or `[Video Title, chunk 2/10]`

4. **Chunk metadata**: Store source video, timestamp, chunk index

5. **Query types**: Factual questions answerable from transcript content

## Testing Strategy

- **Chunker test**: Verify overlap, size constraints
- **Embedder test**: Hash embedder produces consistent vectors
- **Retriever test**: Finds the correct chunk for a known query
- **Mock answer test**: Includes a citation

## Stretch Goals (not v1)

- Web UI for interactive Q&A
- Persist vector store to disk (JSON or SQLite)
- Support multiple video indexing from URLs
- Re-ranking with cross-encoder
- Hybrid search (BM25 + semantic)
- Stream answers token-by-token

## References

- [LangChain RAG Tutorial](https://js.langchain.com/docs/use_cases/question_answering/)
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [RAG Paper (Lewis et al.)](https://arxiv.org/abs/2005.11401)
