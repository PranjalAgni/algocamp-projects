# Enterprise Advanced RAG

A learning project demonstrating **advanced RAG (Retrieval-Augmented Generation) techniques** and how they improve over naive semantic search. Built with TypeScript, runs fully offline with mock mode.

## What This Demonstrates

This project shows the quality difference between **naive RAG** (simple semantic search) and **advanced RAG** techniques:

1. **Query Expansion**: Add synonyms to improve recall (e.g., "PTO" → "vacation, leave, time off")
2. **Hybrid Retrieval**: Combine semantic (embeddings) + keyword (BM25) search using Reciprocal Rank Fusion
3. **Reranking**: Re-score candidates with metadata and term overlap heuristics
4. **Metadata Filtering**: Pre-filter by department, document type, or date range

## Architecture

- **Corpus**: 10 fictional company documents (policies, handbooks) in `corpus/`
- **Embeddings**: `@xenova/transformers` (all-MiniLM-L6-v2) with hash fallback
- **Sparse Retrieval**: Custom TF-IDF/BM25 implementation
- **Hybrid Fusion**: Reciprocal Rank Fusion to merge rankings
- **Generation**: OpenAI API (live mode) or extractive QA (mock mode)

## Installation

```bash
npm install
```

## Running

### Demo (Mock Mode - No API Key Required)

```bash
npm run demo
```

**Actual Output:**

```
============================================================
MODE: MOCK — no OPENAI_API_KEY
============================================================

Loaded 10 documents from corpus

Query: "How do I request time off?"

━━━ NAIVE RETRIEVAL ━━━
(Pure semantic search, top 3)

1. PTO Policy (score: 0.409)
2. Remote Work Policy (score: 0.284)
3. Onboarding Guide (score: 0.276)


━━━ ADVANCED RETRIEVAL ━━━

Step 1: Query Expansion
Original: "How do I request time off?"
Expanded: "How do I request time off? pto vacation leave absence"
Added terms: pto, vacation, leave, absence

Step 2: Hybrid Retrieval (Dense + Sparse + RRF)
1. PTO Policy (RRF score: 0.033)
2. Benefits Overview (RRF score: 0.032)
3. Onboarding Guide (RRF score: 0.031)

Step 3: Reranking (Heuristic)
1. PTO Policy (rerank score: 0.133)
2. Benefits Overview (rerank score: 0.132)
3. Onboarding Guide (rerank score: 0.031)

Final Answer:
"25 days per month
- Maximum PTO balance cap is 30 days

## Requesting Time Off
Employees must submit PTO requests through the HR portal at least 2 weeks in advance for approval by their manager"


━━━ METADATA FILTERING DEMO ━━━

Query: "What are the security guidelines?"
Filter: department=Engineering

Filtered to 2 documents:
  - Engineering Handbook
  - Security Guidelines

Top result:
  Security Guidelines (score: 0.687)

============================================================
Demo complete!
============================================================
```

### Tests

```bash
npm test
```

**Test Output:**

```
 ✓ tests/hybrid-retrieval.test.ts (4 tests) 4ms
 ✓ tests/sparse-retrieval.test.ts (5 tests) 4ms
 ✓ tests/query-processing.test.ts (10 tests) 7ms
 ✓ tests/metadata-filter.test.ts (8 tests) 3ms

 Test Files  4 passed (4)
      Tests  27 passed (27)
```

All tests pass **offline** without any API keys or network calls.

## Live Mode (Optional)

To use OpenAI for answer generation:

1. Create a `.env` file: `cp .env.example .env`
2. Add your API key: `OPENAI_API_KEY=sk-...`
3. Run: `npm run demo`

The system will automatically switch to live mode and use GPT-3.5-turbo for generation.

## Key Learnings

### Naive RAG Problems
- Query phrasing mismatches document phrasing ("time off" vs "PTO")
- Pure semantic search misses exact keyword matches
- No consideration of metadata (department, date, source)
- Top-K results may include irrelevant chunks

### Advanced RAG Solutions
1. **Query Expansion**: Broadens recall by adding synonyms
   - "time off" → adds "PTO", "vacation", "leave"
   
2. **Hybrid Retrieval**: Best of both worlds
   - Dense (embeddings): Captures semantic meaning
   - Sparse (BM25): Catches exact keyword matches
   - RRF: Merges rankings without score calibration issues

3. **Reranking**: Second-stage refinement
   - Metadata signals (recency, department, title matches)
   - Query term overlap
   - Could use cross-encoder models for more power

4. **Metadata Filtering**: Pre-filter irrelevant docs
   - "Show me Engineering docs only"
   - "Only recent policies (2024+)"
   - Reduces search space and improves precision

## Project Structure

```
05-enterprise-advanced-rag/
├── corpus/              # 10 fictional company docs + metadata.json
├── src/
│   ├── types.ts         # TypeScript interfaces
│   ├── document-loader.ts
│   ├── embeddings.ts    # @xenova/transformers + hash fallback
│   ├── query-processing.ts  # Synonym expansion, tokenization
│   ├── dense-retrieval.ts   # Semantic search (cosine similarity)
│   ├── sparse-retrieval.ts  # BM25 keyword search
│   ├── hybrid-retrieval.ts  # Reciprocal Rank Fusion
│   ├── reranking.ts         # Heuristic reranker
│   ├── metadata-filter.ts   # Metadata filtering
│   ├── generator.ts         # OpenAI API / extractive QA
│   └── demo.ts              # Side-by-side comparison demo
├── tests/               # 27 passing tests (all offline)
├── RESEARCH.md          # Background on RAG techniques
├── PLAN.md              # Implementation plan + stretch goals
└── README.md            # This file
```

## Future Ideas (V2)

See `PLAN.md` for stretch goals:
- Multi-hop reasoning
- Parent-child chunking
- Self-query (LLM extracts metadata filters)
- Agentic RAG (LLM decides when to retrieve)
- Evaluation harness (NDCG/MRR metrics)
- Real vector database (hnswlib-node)
- Web UI

## References

- [RAG Paper (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
- [HyDE Paper (Gao et al.)](https://arxiv.org/abs/2212.10496)
- [RRF Paper (Cormack et al., 2009)](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [Pinecone RAG Guide](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## License

MIT
