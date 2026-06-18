# Exploring Embeddings — Plan

## v1 Scope (Learning Goal)

Build a TypeScript project that demonstrates:
1. **Generating embeddings** from text using a local model.
2. **Computing cosine similarity** between vectors.
3. **Semantic search** over a small corpus (query → top-k results).
4. **Similarity matrix** visualization (show how sentences relate).
5. **(Stretch)** Vector arithmetic at sentence level ("king - man + woman" style).

**Key constraint**: Must run offline with no API key (fallback to hash-based embedder).

## File Layout

```
03-exploring-embeddings/
├── RESEARCH.md          # Background on embeddings (done)
├── PLAN.md             # This file
├── README.md           # Usage, examples, output
├── package.json        # Scripts: demo, test, dev
├── tsconfig.json       # TypeScript config (ESM, Node22)
├── .env.example        # OPENAI_API_KEY=your-key-here
├── .gitignore          # node_modules, .env, .cache
├── src/
│   ├── embedder.ts     # Embedder factory (auto-selects: Xenova, OpenAI, or hash)
│   ├── xenova.ts       # Xenova/transformers embedder
│   ├── openai.ts       # OpenAI embedder (if key present)
│   ├── hash.ts         # Hash-based fallback embedder
│   ├── similarity.ts   # Cosine similarity, semantic search
│   └── demo.ts         # Demo script (sample queries, similarity matrix)
└── tests/
    └── embeddings.test.ts  # Vitest tests (uses hash embedder for determinism)
```

## Core API

### `embedder.ts` — Factory
```typescript
export async function createEmbedder(): Promise<Embedder> {
  // Try Xenova → OpenAI (if key) → hash fallback
  // Returns { embed(texts: string[]): Promise<number[][]>, mode: string }
}
```

### `similarity.ts` — Math
```typescript
export function cosineSimilarity(a: number[], b: number[]): number;
export function semanticSearch(query: string, corpus: string[], topK: number): Promise<Result[]>;
```

### `demo.ts` — Showcase
- Embed ~12 sample sentences (mix of related/unrelated topics).
- Run 2-3 semantic search queries, print ranked results with scores.
- Compute and display a similarity matrix (console table).

## Demo Command

```bash
npm run demo
```

Expected output:
```
[MODE: LOCAL-MODEL]  # or HASH-FALLBACK or LIVE

=== Semantic Search ===
Query: "travel destinations"
1. [0.87] "I love visiting new countries and exploring different cultures."
2. [0.65] "The best vacation spots are usually by the beach."
3. [0.34] "Machine learning models require large datasets."

=== Similarity Matrix ===
        S1    S2    S3
S1   1.00  0.82  0.15
S2   0.82  1.00  0.09
S3   0.15  0.09  1.00
```

## Test Command

```bash
npm test
```

Tests (using hash embedder for determinism/offline):
1. **Cosine similarity correctness**:
   - Identical vectors → similarity = 1.0
   - Orthogonal vectors → similarity ≈ 0.0
2. **Semantic search ranking**:
   - Query + 3 sentences (2 related, 1 unrelated).
   - Verify related sentences rank higher (even with hash embedder, they should differ).

## Stretch Goals (v2)

1. **Vector arithmetic demo**: Compute "Paris - France + Italy" ≈ "Rome" at sentence level.
2. **Clustering**: k-means on embeddings, visualize with t-SNE/UMAP (requires additional libs).
3. **Persistent cache**: Save embeddings to JSON to avoid recomputing.
4. **Benchmark**: Compare Xenova vs OpenAI quality on a test set.

## Success Criteria

- [x] RESEARCH.md written.
- [x] PLAN.md written.
- [x] Implementation complete, well-commented.
- [x] `npm run demo` works offline (prints mode banner).
- [x] `npm test` passes offline (uses hash fallback).
- [x] README.md includes pasted passing output.
- [x] .env.example, .gitignore present.
