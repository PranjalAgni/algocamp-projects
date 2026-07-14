# Enterprise Advanced RAG - Implementation Plan

## V1 Goals
Build a learning project that demonstrates the quality difference between naive and advanced RAG retrieval techniques using a small fictional company knowledge base.

## Architecture

### Components
1. **Document Corpus** (`/corpus`)
   - 10-15 .md files (company policies, handbooks, FAQs)
   - `metadata.json` with: title, department, date, type
   
2. **Embedding Engine** (`src/embeddings.ts`)
   - Primary: @xenova/transformers (all-MiniLM-L6-v2)
   - Fallback: Hash-based embeddings (deterministic for tests)

3. **Retrieval Engines**
   - **Dense retrieval** (`src/dense-retrieval.ts`): Cosine similarity on embeddings
   - **Sparse retrieval** (`src/sparse-retrieval.ts`): TF-IDF + BM25-like scoring
   - **Hybrid retrieval** (`src/hybrid-retrieval.ts`): Reciprocal Rank Fusion

4. **Query Processor** (`src/query-processing.ts`)
   - Synonym expansion
   - Query normalization

5. **Reranker** (`src/reranking.ts`)
   - Cross-encoder via @xenova/transformers (if model loads)
   - Fallback: Heuristic (metadata recency + term overlap)

6. **Metadata Filter** (`src/metadata-filter.ts`)
   - Pre-filter documents by department, date, type

7. **Generator** (`src/generator.ts`)
   - Live: OpenAI API (OPENAI_API_KEY)
   - Mock: Extractive answer (return most relevant sentence)

8. **Demo** (`src/demo.ts`)
   - Run query through naive pipeline
   - Run query through advanced pipeline
   - Show side-by-side comparison
   - Demonstrate metadata filtering

## File Layout
```
05-enterprise-advanced-rag/
├── RESEARCH.md
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── corpus/
│   ├── metadata.json
│   ├── pto-policy.md
│   ├── remote-work-policy.md
│   ├── code-of-conduct.md
│   ├── benefits-overview.md
│   ├── expense-reimbursement.md
│   ├── onboarding-guide.md
│   ├── security-guidelines.md
│   ├── travel-policy.md
│   ├── performance-review-process.md
│   └── engineering-handbook.md
├── src/
│   ├── embeddings.ts
│   ├── dense-retrieval.ts
│   ├── sparse-retrieval.ts
│   ├── hybrid-retrieval.ts
│   ├── query-processing.ts
│   ├── reranking.ts
│   ├── metadata-filter.ts
│   ├── generator.ts
│   ├── document-loader.ts
│   ├── types.ts
│   └── demo.ts
└── tests/
    ├── sparse-retrieval.test.ts
    ├── hybrid-retrieval.test.ts
    ├── metadata-filter.test.ts
    └── query-processing.test.ts
```

## Demo Flow
```
$ npm run demo

[MODE: MOCK — no OPENAI_API_KEY]

Query: "How do I request time off?"

━━━ NAIVE RETRIEVAL ━━━
(Pure semantic search, top 3)
1. Remote Work Policy (score: 0.72)
2. PTO Policy (score: 0.68)
3. Benefits Overview (score: 0.61)

━━━ ADVANCED RETRIEVAL ━━━

Step 1: Query Expansion
Original: "How do I request time off?"
Expanded: "How do I request time off? vacation leave PTO absence"

Step 2: Hybrid Retrieval (Dense + Sparse + RRF)
1. PTO Policy (RRF score: 0.089)  ← keyword match boosted it
2. Benefits Overview (RRF score: 0.067)
3. Remote Work Policy (RRF score: 0.056)

Step 3: Reranking (Cross-encoder)
1. PTO Policy (rerank score: 0.92)  ← most relevant
2. Benefits Overview (rerank score: 0.71)
3. Remote Work Policy (rerank score: 0.54)

Final Answer (mock): "Employees must submit PTO requests through the HR portal at least 2 weeks in advance for approval by their manager."

━━━ METADATA FILTERING DEMO ━━━
Query: "What are the security guidelines?" (filter: department=Engineering)
Result: Engineering Handbook, Security Guidelines (2 docs)
```

## Test Coverage
1. **Sparse retrieval correctness**
   - TF-IDF ranks docs with query terms higher
   - BM25 scoring prefers shorter docs with more term occurrences
   
2. **Hybrid fusion**
   - RRF correctly merges two ranked lists
   - Higher-ranked items get better RRF scores
   
3. **Metadata filtering**
   - Filtering by department excludes non-matching docs
   - Date filtering returns only docs in range
   
4. **Query expansion**
   - Synonym expansion adds related terms
   - Preserves original query

All tests must pass **offline** (no network calls).

## Commands
- `npm install` - install dependencies
- `npm run demo` - run the side-by-side demo
- `npm test` - run vitest tests
- Switch to live mode: Set `OPENAI_API_KEY=sk-...` in `.env`

## V2 Stretch Ideas (NOT implemented in V1)
- Multi-hop reasoning (retrieve, generate sub-query, retrieve again)
- Parent-child chunking (retrieve small chunk, provide larger context)
- Self-query (LLM extracts metadata filters from natural language)
- Agentic RAG (LLM decides to retrieve more or stop)
- Evaluation harness (compare retrieval quality with NDCG/MRR)
- Real vector database (hnswlib-node or Chroma)
- Document chunking strategies (semantic, sliding window)
- Cache embeddings to disk
- Web UI for interactive querying
