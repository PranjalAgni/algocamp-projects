# Exploring Embeddings — Research

## What are Text Embeddings?

**Text embeddings** are dense vector representations of text (words, sentences, or documents) in a high-dimensional space. The key insight: semantically similar texts should have vectors that are close together (high cosine similarity), while unrelated texts should be far apart.

Unlike sparse representations (e.g., one-hot encoding or TF-IDF), embeddings capture semantic meaning. For example, "king" - "man" + "woman" ≈ "queen" in word embeddings.

## Why This Matters

- **Semantic Search**: Find documents similar to a query, even when exact words don't match.
- **Clustering**: Group similar texts together (e.g., topic modeling, customer feedback categorization).
- **Recommendation**: Find similar products, articles, or user profiles.
- **Transfer Learning**: Pre-trained embeddings capture language understanding from massive corpora.

## Key Concepts

### 1. Cosine Similarity
Measures the cosine of the angle between two vectors. Range: [-1, 1], where:
- 1 = identical direction (very similar)
- 0 = orthogonal (unrelated)
- -1 = opposite direction (rare in embeddings, typically all-positive)

Formula: `cosine(A, B) = (A · B) / (||A|| * ||B||)`

### 2. Semantic Search
Given a query and a corpus of documents:
1. Embed the query and all documents.
2. Compute cosine similarity between query and each document.
3. Return top-k most similar documents.

### 3. Vector Arithmetic
Embeddings support algebraic operations:
- "France" - "Paris" + "London" ≈ "England" (capital relationships)
- "King" - "Man" + "Woman" ≈ "Queen" (gender relationships)

At the sentence level, this can demonstrate semantic composition.

## Library Options

### Primary: @xenova/transformers (chosen)
- **Pros**: Runs locally, no API key needed, good quality (transformer-based models).
- **Model**: `Xenova/all-MiniLM-L6-v2` — 384-dim embeddings, ~25MB, fast inference.
- **First-run**: Downloads model and caches in `~/.cache/huggingface/`. Works fully offline after that.
- **Network unavailable**: Falls back to hash-based deterministic embedder (for tests/offline).

### Optional: OpenAI text-embedding-3-small
- **Pros**: 1536 dimensions (4x the local model), no local model download.
- **Cons**: Requires API key, network, costs money.
- **Use case**: If `OPENAI_API_KEY` is present, allow live comparison.

### Fallback: Hash-based Embedder
- **Purpose**: Tests must pass fully offline (no network, no cached model).
- **Implementation**: Deterministic hash of input text → fixed-size vector (384-dim to match).
- **Trade-off**: No semantic meaning, but ensures tests run anywhere.

## Practical Assumptions

1. **Learning goal**: Build intuition, not production system. Small corpus (~12 sentences) is sufficient.
2. **Offline-first**: Hash fallback ensures tests/demo work even on a plane.
3. **Quality hierarchy**: Xenova > OpenAI (if key present) > Hash fallback.
4. **Auto-detect mode**: Print banner `[MODE: LOCAL-MODEL]` / `[MODE: LIVE]` / `[MODE: HASH-FALLBACK]`.

## References

- [Sentence Transformers](https://www.sbert.net/) — Original research on sentence embeddings.
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) — Xenova docs.
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
