# Exploring Embeddings

A learning project to build intuition for text embeddings, semantic search, and vector similarity.

## What This Project Does

1. **Generates embeddings** from text using transformer-based models
2. **Computes cosine similarity** between vectors
3. **Performs semantic search** over a corpus (finds similar sentences)
4. **Visualizes similarity matrices** showing how all texts relate to each other

## Key Features

- **Offline-first**: Uses `@xenova/transformers` (all-MiniLM-L6-v2) for local embeddings
- **No API key required**: Works completely offline after first model download (~25MB)
- **Deterministic fallback**: Hash-based embedder ensures tests pass without network
- **Optional OpenAI support**: Can use `text-embedding-3-small` if API key is present

## Installation

```bash
npm install
```

## Usage

### Run the Demo

```bash
npm run demo
```

This will:
- Auto-select the best available embedder (Xenova → OpenAI → Hash fallback)
- Run semantic search queries on a sample corpus
- Display a similarity matrix showing relationships between sentences

### Run Tests

```bash
npm test
```

Tests use the hash-based fallback embedder for deterministic, offline execution.

### Watch Mode (for development)

```bash
npm run test:watch
```

## Mode Detection

The project automatically detects and uses the best available embedder:

- **`[MODE: LOCAL-MODEL]`** — Using Xenova/all-MiniLM-L6-v2 (best quality, offline)
- **`[MODE: LIVE]`** — Using OpenAI text-embedding-3-small (requires API key)
- **`[MODE: HASH-FALLBACK]`** — Using deterministic hash (no semantic meaning, for tests)

## Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Optional: Only needed if you want to compare with OpenAI embeddings
OPENAI_API_KEY=your-key-here
```

If no API key is set, the project uses the local Xenova model (recommended for learning).

## Example Output

```
═══════════════════════════════════════════════════════════════
                    SEMANTIC SEARCH DEMO
═══════════════════════════════════════════════════════════════

Loading Xenova model (first run may download ~25MB)...

[MODE: LOCAL-MODEL] Using Xenova/all-MiniLM-L6-v2


Query: "travel destinations and tourism"

Top 3 Results:
─────────────────────────────────────────────────────────────
1. [0.55] I love traveling to exotic destinations and exploring new cultures.
2. [0.52] The best vacation spots are usually near beaches or mountains.
3. [0.33] Summer vacations are a great time to relax and unwind.


Query: "machine learning and AI"

Top 3 Results:
─────────────────────────────────────────────────────────────
1. [0.50] Artificial intelligence is transforming many industries.
2. [0.50] Neural networks can learn complex patterns from examples.
3. [0.44] Machine learning models require large amounts of training data.


Query: "programming and software development"

Top 3 Results:
─────────────────────────────────────────────────────────────
1. [0.50] Software engineers use version control systems like Git.
2. [0.41] Python is a popular programming language for data science.
3. [0.31] Artificial intelligence is transforming many industries.


═══════════════════════════════════════════════════════════════
                  SIMILARITY MATRIX DEMO
═══════════════════════════════════════════════════════════════

Computing pairwise similarities for 5 sentences...

Sentences:
S1: I love traveling to exotic destinations and exploring new cu...
S2: The best vacation spots are usually near beaches or mountain...
S3: Machine learning models require large amounts of training da...
S4: Neural networks can learn complex patterns from examples.
S5: Paris is known as the city of lights and love.

Similarity Matrix (range: 0.00 to 1.00):
─────────────────────────────────────────────────────────────
        S1   S2   S3   S4   S5 
S1    1.00  0.44  0.02  0.02  0.18
S2    0.44  1.00  0.01  -0.02  0.17
S3    0.02  0.01  1.00  0.40  0.01
S4    0.02  -0.02  0.40  1.00  0.08
S5    0.18  0.17  0.01  0.08  1.00

Interpretation:
  • 1.00 = identical (diagonal)
  • 0.70-0.99 = very similar
  • 0.40-0.69 = somewhat similar
  • 0.00-0.39 = dissimilar

═══════════════════════════════════════════════════════════════
Demo complete! Try modifying CORPUS or QUERIES in src/demo.ts
═══════════════════════════════════════════════════════════════
```

## Project Structure

```
03-exploring-embeddings/
├── RESEARCH.md         # Background on embeddings and approaches
├── PLAN.md            # Implementation plan and design decisions
├── README.md          # This file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── .env.example       # Environment variable template
├── .gitignore         # Git ignore rules
├── src/
│   ├── embedder.ts    # Embedder factory (auto-selection logic)
│   ├── xenova.ts      # Xenova/transformers local embedder
│   ├── openai.ts      # OpenAI embedder (optional)
│   ├── hash.ts        # Hash-based fallback embedder
│   ├── similarity.ts  # Cosine similarity and semantic search
│   └── demo.ts        # Demo script
└── tests/
    └── embeddings.test.ts  # Tests (using hash embedder)
```

## Key Concepts Demonstrated

### 1. Text Embeddings

Embeddings convert text into dense numerical vectors that capture semantic meaning. Similar texts have similar vectors.

### 2. Cosine Similarity

Measures the angle between two vectors:
- `1.0` = identical direction (very similar)
- `0.0` = orthogonal (unrelated)
- `-1.0` = opposite direction

Formula: `cosine(A, B) = (A · B) / (||A|| * ||B||)`

### 3. Semantic Search

Given a query and a corpus:
1. Embed the query and all documents
2. Compute cosine similarity for each document
3. Return top-k most similar documents

This enables "find similar" functionality even when exact words don't match.

### 4. Similarity Matrix

A pairwise comparison showing how all items in a set relate to each other. Useful for clustering, visualization, and understanding relationships.

## Test Results

```
 ✓ tests/embeddings.test.ts (18 tests) 21ms

 Test Files  1 passed (1)
      Tests  18 passed (18)
   Start at  23:09:35
   Duration  744ms (transform 145ms, setup 0ms, collect 155ms, tests 21ms, environment 0ms, prepare 221ms)
```

All tests pass offline using the deterministic hash embedder.

## Learning Notes

- **First run**: Downloads the ~25MB Xenova model and caches it in `~/.cache/huggingface/`
- **Subsequent runs**: Uses cached model, works completely offline
- **Network unavailable**: Falls back to hash embedder (no semantic meaning, but allows testing)
- **API key present**: Can optionally use OpenAI for comparison

## Future Enhancements (v2)

- Vector arithmetic demo: "Paris - France + Italy ≈ Rome"
- Clustering with k-means
- t-SNE/UMAP visualization
- Persistent embedding cache
- Quality benchmarks comparing different models

## License

MIT
