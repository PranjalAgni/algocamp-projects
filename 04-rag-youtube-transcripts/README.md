# 04 · RAG over YouTube Transcripts

Project 03 turned text into vectors and found the closest ones to a query. That's retrieval.
This project puts that retrieval step in front of a language model: chunk a transcript, embed
the chunks, fetch the ones nearest a question, and hand only those to the model to answer from.
That's **Retrieval-Augmented Generation (RAG)** - the pattern behind almost every "chat with
your documents" product. The payoff is a grounded answer that cites where it came from, instead
of the model guessing from memory.

## Run it

```bash
npm install
npm run demo     # index 2 sample transcripts, ask 3 questions, show chunks + answers
npm test         # vitest suite (30 tests, deterministic, offline)
```

The demo is fully offline and needs no key. See the honesty note below for what that means for
the quality of the results.

## The pipeline

RAG is five steps, and each one is a small file you can read end to end:

1. **Chunk** (`src/chunker.ts`) - split each transcript into ~400-character pieces with
   100-character overlap, keeping the source video and timestamp on every piece. Overlap exists
   so a sentence split across a boundary still lives whole in one chunk.
2. **Embed** (`src/embedder.ts`) - turn each chunk into a vector (same idea as project 03).
3. **Store** (`src/vectorStore.ts`) - keep the vectors in memory with their chunk metadata.
4. **Retrieve** (`vectorStore.search`) - embed the question, score it against every stored
   vector with cosine similarity, return the top `k`. This is project 03's `semanticSearch`.
5. **Generate** (`src/generator.ts`) - send *only* those `k` chunks to the model as context and
   ask it to answer with citations.

The idea worth taking away: the model in step 5 never sees the full corpus, only the handful of
chunks retrieval picked. Retrieval quality is the ceiling on answer quality - if step 4 pulls
the wrong chunks, no model can recover. RAG is a retrieval problem wearing a generation costume.

## The honest part: what the offline demo actually does

The demo is offline, and that comes at a cost worth being explicit about. `src/demo.ts`
hard-codes `setUseHashEmbedder(true)`, and with no `OPENAI_API_KEY` set, generation falls back
to MOCK. So the default demo runs the *two weakest* substitutes at both ends:

- **Retrieval** uses the hash embedder - a 128-dim word-frequency vector, not a neural
  embedding. It matches on shared words, not meaning. That's why "What is RAG?" scores 0.469 on
  the chunk that literally repeats "RAG" and why "How do embeddings work?" retrieves a
  RAG-intro chunk over a better one. It's keyword search again, exactly the thing project 03
  set out to beat.
- **Generation** (MOCK) doesn't generate. It stitches together the first two sentences of each
  retrieved chunk and staples a citation on. Read the "Answer" in the demo output: it's quoted
  fragments, not prose. That is deliberate - it keeps the demo deterministic and free - but it
  is not what the model would produce.

So the demo teaches the *shape* of the pipeline (chunk → embed → store → retrieve → generate)
with real citations flowing through, while being honest that the intelligence at both ends is
stubbed. To see real RAG, turn on the two real components below.

## Turning on the real pipeline

Two independent switches, and they're worth understanding separately:

**Real retrieval** - edit `src/demo.ts` and remove (or set to `false`) the
`setUseHashEmbedder(true)` line. The embedder then loads Xenova `all-MiniLM-L6-v2` (a ~25MB
download on first run, cached after) and retrieval becomes genuinely semantic - it can match a
question to a chunk that shares no words with it.

**Real generation** - copy `.env.example` to `.env` and add `OPENAI_API_KEY=sk-...`. Generation
switches to `[MODE: LIVE]`, sending the retrieved chunks to GPT-4o-mini with instructions to
answer only from that context and cite the video and timestamp. If the API call fails, it falls
back to MOCK rather than crashing.

The two are orthogonal: you can run neural retrieval with mock generation, or hash retrieval
with live generation. For the real thing, turn on both.

## Files

```
src/
  data/
    sample1.json    # transcript: Introduction to RAG
    sample2.json    # transcript: Understanding Embeddings
  chunker.ts        # split transcripts into overlapping, timestamped chunks
  embedder.ts       # neural (Xenova) embedder with hash fallback
  vectorStore.ts    # in-memory vectors + cosine top-k search
  generator.ts      # LIVE (GPT-4o-mini) and MOCK (extractive) answers
  index.ts          # RAGPipeline: ties the five steps together
  demo.ts           # loads samples, asks 3 questions
tests/
  chunker.test.ts  vectorStore.test.ts  embedder.test.ts  generator.test.ts
```

## Where to go next

- Turn on real retrieval (above) and re-run. Watch the scores and the retrieved chunks change,
  then ask a question phrased with none of the transcript's words and see semantic retrieval
  earn its keep.
- This corpus is tiny (2 transcripts, 13 chunks) and lives in memory. The interesting failure
  modes - chunk size vs. precision, retrieving the wrong section of a long document, re-ranking
  the top results - only show up at scale. Project 05 takes RAG there.
