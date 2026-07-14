# AlgoCamp Projects - Shared Standards

These are **learning-focused** projects. Goal: understand the concepts by building small,
correct, runnable things. NOT production apps. Keep scope tight (v1), favor clarity over cleverness.

## Environment facts (verified)
- macOS arm64 (Apple Silicon)
- Node v22.17.0, npm 10.9.2
- Python 3.9.6 (system). Homebrew available at /opt/homebrew/bin/brew.
- **No API keys are set in the environment.** (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. are all empty.)

## The #1 rule: every project MUST run with zero API keys
A reviewer will `cd` into your project and run the documented "smoke test" / demo command.
It must succeed **without any API key**. Therefore:

- Read keys from `process.env` (Node) or `os.environ` (Python), loaded from a local `.env`.
- If the relevant key is **missing**, fall back to a **mock/offline mode** that returns
  realistic canned data so the full pipeline still executes end-to-end.
- If the key **is** present, use the real provider.
- Print a clear banner at startup: `[MODE: MOCK — no API key]` or `[MODE: LIVE]`.
- Never hardcode secrets. Provide a `.env.example`.

## Language
- Default **TypeScript** (Node, ESM, `tsx` for running, `vitest` for tests).
- Use **Python** only where it is clearly the right tool (deep-learning model training:
  MNIST autoencoder, multi-input OCR). Use a local `venv`. If a heavy dependency
  (e.g. TensorFlow) fails to install on Python 3.9/arm64, fall back to a working
  alternative (`@tensorflow/tfjs-node` in TS, or a small NumPy implementation) - the
  project MUST end up runnable. Document what you chose and why.

## Offline-friendly library choices (prefer these - no keys, no network at runtime)
- Embeddings: `@xenova/transformers` (a.k.a. `@huggingface/transformers`) - runs locally.
- Local LLM-free fallbacks: deterministic canned responses keyed off the input.
- Vector search: in-memory cosine similarity is fine for learning; `hnswlib-node` optional.
- ML in TS: `@tensorflow/tfjs-node`.
- OCR in TS: `tesseract.js` (bundles wasm, offline).

## Required deliverables in EVERY project folder
1. `RESEARCH.md` - what the concept is, key approaches, libraries considered, the practical
   assumptions you made, and links/notes. Written so a future agent/human can understand the
   space. (This is explicitly requested by the user - do it first.)
2. `PLAN.md` - what v1 builds, file layout, the demo/test commands, and stretch ideas.
3. The actual implementation (well-commented, since learning is the goal).
4. `README.md` - what it is, how to install, how to run the demo, how to run tests,
   how to switch from MOCK to LIVE (which env var). Include example output.
5. `.env.example` - every env var the project reads.
6. Tests that pass offline (`vitest` or `pytest`), plus a one-command demo/smoke script.
7. A `.gitignore` (node_modules, .env, venv, __pycache__, data caches, model artifacts).

## Feedback loop (mandatory)
Implement → install deps → run demo → run tests → if anything fails, debug and fix →
repeat until the demo and tests pass offline. Do not report success unless you actually
ran it and saw it pass. In the README, show a short, honest slice of real output to
illustrate the idea - not a pasted full test-run dump with timestamps (that reads as slop
and goes stale the moment the code changes).

## Keep it small
v1 should be a focused, correct core. Note stretch goals in PLAN.md instead of building them.
Comment generously - explain the *why* of each concept for a learner.
