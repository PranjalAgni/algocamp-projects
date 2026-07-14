# AlgoCamp Projects - 12 Hands-On AI Learning Builds

A swarm-built collection of small, **runnable, well-commented** AI/ML projects. The goal is
**learning** the concepts, not shipping production apps. Every project is independent and lives
in its own folder.

## The golden rule: everything runs with ZERO API keys

No API keys are required. Each project that would normally call an LLM/API ships a deterministic
**MOCK / offline mode** that runs the full pipeline end-to-end, and prints a `[MODE: MOCK]` or
`[MODE: LIVE]` banner at startup. Add a real key (see each project's `.env.example`) to flip to
the live provider. The two pure-ML projects need no keys at all.

## Stack

- **TypeScript** (ESM, run with `tsx`, tested with `vitest`) for 10 of 12 projects.
- **TensorFlow.js** (`@tensorflow/tfjs-node`) for the deep-learning projects (verified working on
  this Apple-Silicon machine - avoids Python 3.9/arm64 TensorFlow install pain).
- Local/offline embeddings via `@xenova/transformers`, with a deterministic hash-embedder
  fallback so tests pass with no network.

## Run any project

```bash
cd <project-folder>
npm install
npm run demo     # runnable demonstration (offline)
npm test         # vitest suite (offline)
```

## The 12 projects (all tests passing ✓)

| # | Project | Concept | Stack | Tests |
|---|---------|---------|-------|-------|
| 01 | [Working with the OpenAI API](01-openai-api) | Chat, streaming, system prompts, tool calling, JSON output behind one `LLMClient` interface | TS | 11 ✓ |
| 02 | [Customer Support Agent](02-customer-support-agent) | Tool-calling agent loop over FAQ + order lookup + ticket creation | TS | 15 ✓ |
| 03 | [Exploring Embeddings](03-exploring-embeddings) | Embeddings, cosine similarity, semantic search, similarity matrix | TS + xenova | 18 ✓ |
| 04 | [RAG over YouTube Transcripts](04-rag-youtube-transcripts) | Full RAG: chunk → embed → retrieve → grounded answer w/ citations | TS + xenova | 30 ✓ |
| 05 | [Enterprise Advanced RAG](05-enterprise-advanced-rag) | Query expansion, hybrid retrieval (BM25 + dense + RRF), reranking, metadata filtering | TS + xenova | 27 ✓ |
| 06 | [Simple Neural Network](06-simple-neural-network-tensorflow) | Feed-forward NN: layers, loss, optimizer, training loop (two-moons) | TS + tfjs | 14 ✓ |
| 07 | [Claude Code-like Coding Agent](07-claude-code-coding-agent) | Agentic tool-use loop with a sandboxed (path-jailed) file/command toolset | TS | 25 ✓ |
| 08 | [AI Code Reviewer Agent](08-ai-code-reviewer-agent) | Diff parsing + deterministic linter + LLM reviewer → structured review | TS | 25 ✓ |
| 09 | [Voice-based AI Agent](09-voice-ai-agent) | STT → LLM → TTS pipeline with swappable stages; generates a real WAV | TS | 14 ✓ |
| 10 | [AI Trading Agent](10-ai-trading-agent) | Indicators (SMA/EMA/RSI) + strategy + backtester (simulation only, not advice) | TS | 27 ✓ |
| 11 | [Multi-Input OCR Model](11-multi-input-ocr) | Multi-input NN: image branch + aux-feature branch concatenated into a head | TS + tfjs | 22 ✓ |
| 12 | [MNIST Autoencoder](12-mnist-autoencoder) | Encoder → bottleneck → decoder; reconstruction loss; latent space; ASCII viz | TS + tfjs | 22 ✓ |

**Total: 250 tests passing, all offline.**

## The slide decks

Two RevealJS decks explain the ideas behind the builds. Both run locally with Python's
built-in server (no install), or open them in a browser directly.

```bash
npm run slides    # deck 1 → http://localhost:8000
npm run hub       # deck 2 → http://localhost:8001/learning-hub.html
```

- **`slides/index.html` - The Concepts Behind 12 AI Builds.** One section per project:
  a plain-English idea, an analogy, an "aha", then the real code that makes it concrete.
  Press **S** for presenter notes (the honest caveats about what each project's offline
  mode actually exercises).
- **`learning-hub.html` - AI Learning Hub.** A deeper concept-first tour (78 concept cards
  across the 12 projects) with analogies and cited sources, generated from `hub-content.js`.
  It must be served from the repo root so it can load `hub-content.js` (that's what
  `npm run hub` does).

Only `slides/` is published to GitHub Pages.

## How it was built

One autonomous agent per project, each running its own research → plan → build → test feedback
loop. Every project folder contains `RESEARCH.md` (the concept space + assumptions) and `PLAN.md`
(what v1 builds) written before the code. See [SHARED_STANDARDS.md](SHARED_STANDARDS.md) for the
conventions all projects follow.

> ⚠️ Project 10 (trading) is a **learning simulation only** - synthetic data, no live markets,
> not financial advice.
