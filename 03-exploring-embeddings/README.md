# 03 · Exploring Embeddings

Project 02's FAQ lookup matched on keywords, so "reverse the charge" found nothing - it
shares no word with the "What is your refund policy?" entry, even though that's exactly
what it's asking for. This project fixes that. An **embedding** turns a piece of text into
a vector of numbers positioned so that texts with similar *meaning* land close together -
and once text is a vector, "find similar" becomes plain geometry. That's the foundation
every RAG project after this one is built on.

## Run it

```bash
npm install
npm run demo     # semantic search over a 12-sentence corpus, plus a similarity matrix
npm test         # vitest suite (18 tests, deterministic hash embedder, offline)
```

The first `npm run demo` downloads the ~25MB `all-MiniLM-L6-v2` model and caches it under
`~/.cache/huggingface/`; every run after that is offline. The demo prints which embedder it
picked on its first line - see the modes below.

## The idea worth taking away

Every embedder here satisfies the same one-method interface:

```ts
interface Embedder {
  embed(texts: string[]): Promise<number[][]>;  // one vector per input text
  mode: string;
}
```

Give it text, get back vectors. The whole project is then two functions over those vectors:

- `cosineSimilarity(a, b)` - one number in `[-1, 1]` for how aligned two vectors are.
  `1.0` means same direction (same meaning), `0.0` means unrelated.
- `semanticSearch(embedder, query, corpus, k)` - embed the query and every document,
  score each with cosine similarity, return the top `k`. That's the entire retrieval step
  of a search engine, in about ten lines (`src/similarity.ts`).

Cosine, not Euclidean distance, because it compares *direction* and ignores magnitude - so
a long document and a short one about the same topic still score as similar.

## The three modes

The factory (`src/embedder.ts`) tries embedders in order and prints a banner for the one it
lands on:

| Banner | Embedder | Semantic meaning? |
|--------|----------|-------------------|
| `[MODE: LOCAL-MODEL]` | Xenova `all-MiniLM-L6-v2`, 384-dim, runs locally | Yes - the real thing |
| `[MODE: LIVE]` | OpenAI `text-embedding-3-small`, 1536-dim, needs a key | Yes |
| `[MODE: HASH-FALLBACK]` | SHA-256 of the text, 384-dim, always works | **No** |

Only `OPENAI_API_KEY` (copy `.env.example` to `.env`) unlocks live mode; everything else is
automatic.

## Two gotchas learners trip on

**The hash fallback has no meaning.** It exists so the test suite is deterministic and runs
with no network and no model. It hashes the text into a unit vector, so identical strings
score `1.0` and everything else scores near `0` - but "dog" and "puppy" are as unrelated as
"dog" and "taxes". If the demo falls back to `HASH-FALLBACK` (model download failed), the
search results are noise. That's expected; it's testing plumbing, not meaning. Real
retrieval needs `LOCAL-MODEL` or `LIVE`.

**Vectors from different models can't be compared.** Xenova returns 384 numbers, OpenAI
returns 1536. `cosineSimilarity` throws on a dimension mismatch, and even when dimensions
happen to match, two different models place text in different coordinate systems. A corpus
must be embedded and queried with the *same* embedder - a real bug people hit when they swap
models but forget to re-embed their stored vectors.

## Files

```
src/
  hash.ts         # Embedder interface + deterministic hash fallback
  xenova.ts       # local transformer model (all-MiniLM-L6-v2)
  openai.ts       # live embedder (text-embedding-3-small)
  embedder.ts     # factory: picks local → live → hash and prints the banner
  similarity.ts   # cosineSimilarity, semanticSearch, similarityMatrix
  demo.ts         # runs search + matrix over a sample corpus
tests/
  embeddings.test.ts
```

## Where to go next

- Run the demo, then change a query in `src/demo.ts` to something that shares no words with
  any sentence (e.g. "coding in a language named after a snake") and watch it still find the
  Python line. That miss-turned-hit is the whole point of embeddings over keyword search.
- Project 04 takes this exact retrieval step and puts it in front of an LLM: chunk a
  document, embed the chunks, retrieve the ones closest to a question, and let the model
  answer from them. That's RAG.
