# 09 · Voice AI Agent

A voice assistant is not one model. It's three stages chained end to end: speech becomes text
(STT), text becomes an answer (LLM), the answer becomes speech (TTS). This project builds that
`STT → LLM → TTS` pipeline behind three tiny interfaces, so you can swap any stage between a real
OpenAI implementation and an offline mock without the orchestrator noticing. The point isn't the
voice tech - it's the interface seam that makes a multi-stage system testable.

## Run it

```bash
npm install
npm run demo    # runs the full pipeline, mock mode, writes output/response.{wav,txt}
npm test        # vitest suite (14 tests, deterministic, offline)
```

No API key needed. Without one every stage runs a mock described honestly below; with one the
demo switches to Whisper, GPT, and OpenAI TTS (see [Live mode](#live-mode)).

## The one idea

Each stage is a one-method interface (`src/interfaces.ts`):

```ts
interface STT { transcribe(audioPath: string): Promise<string> }
interface LLM { generate(prompt: string): Promise<string> }
interface TTS { synthesize(text: string, outputPath: string): Promise<void> }
```

`VoiceAgent` (`src/agent.ts`) takes one of each in its constructor and does nothing but chain them:
`transcribe` → `generate` → `synthesize`. It has no idea whether it's holding a mock or a live
client. That's the whole design: the orchestrator depends on the *shape* of each stage, not the
implementation, so the demo can wire up mocks and the production path can wire up OpenAI clients
using the exact same twelve lines of pipeline code. This is dependency injection doing real work -
it's what makes the pipeline testable offline (every test in `tests/` constructs the agent with
mocks) and what lets you replace TTS with ElevenLabs later by writing one new class.

## The pipeline

```
audio (or transcript)
  │  stt.transcribe()   → text        MockSTT reads a file · WhisperSTT calls the API
  │  llm.generate()     → text        MockLLM keyword-matches · OpenAILLM calls GPT
  ▼  tts.synthesize()   → audio file  MockTTS writes a WAV tone · OpenAITTS calls the TTS API
```

`src/demo.ts` builds the three stages by checking `OPENAI_API_KEY` once per stage, prints a
`[... MODE: ...]` banner for each, then hands them to `VoiceAgent`.

## The honest part

The mock pipeline runs end to end and produces a real, playable `.wav` file - but three things it
does are simulations, not the real capability, and it's worth knowing exactly where the seams are:

**1. Mock STT does no speech recognition - it reads a text file.** `MockSTT` ignores the audio path
entirely and returns the contents of `fixtures/input-transcript.txt`. So "transcription" in mock
mode is `readFile`. That's deliberate (it lets the pipeline run with zero audio processing), but it
means the offline demo never exercises any STT logic - only the interface.

**2. Mock LLM is four keyword rules, not a model.** `MockLLM.generate` lowercases the prompt and
branches on `weather` / `time` / `hello` / `help`, falling back to echoing the input. The bundled
fixture asks about weather, so the demo always prints the canned weather line. Ask it anything the
keywords don't cover and it just repeats you back - the same "mock proves the pipeline shape, not
the intelligence" pattern as the earlier projects.

**3. Mock TTS synthesizes a 440Hz sine tone, not speech.** `MockTTS` writes the response text to a
`.txt` file and generates a one-second A4 beep as a genuine 16-bit PCM WAV (`src/wav-generator.ts`
builds the RIFF header and samples by hand - worth reading to see how a WAV is laid out). The
`.wav` is a real, valid audio file you can play; it just contains a tone, not the words. It proves
the pipeline can emit a binary audio artifact, which is the part that's easy to get wrong.

The takeaway: **mock mode verifies the wiring, live mode verifies the intelligence.** Every stage's
mock is honest about being a stand-in for the interface, not the capability.

## Live mode

```bash
cp .env.example .env
# set:
#   OPENAI_API_KEY=sk-...                     → Whisper + GPT + OpenAI TTS
#   AUDIO_INPUT_PATH=/path/to/recording.wav   → a REAL audio file for Whisper
npm run demo
```

Two things that bite people going live, both now handled in code:

- **Whisper needs audio, not the text fixture.** The bundled `input-transcript.txt` is text, so in
  live mode the demo refuses to run without `AUDIO_INPUT_PATH` pointing at a real `.wav`/`.mp3`/`.m4a`
  file. Handing Whisper a text file would just fail at the API.
- **OpenAI TTS defaults to MP3.** The pipeline writes to `response.wav`, so `OpenAITTS` requests
  `response_format: 'wav'` explicitly - otherwise the bytes would be MP3 while the extension claims
  WAV, and the file would be subtly broken. A small lesson: an audio file's extension is a promise
  about its bytes, and it's on you to keep it.

`OpenAILLM` uses `gpt-4o-mini` with a short "concise spoken responses" system prompt;
`OpenAITTS` uses the `alloy` voice on `tts-1`.

## Files

```
src/
  interfaces.ts    STT / LLM / TTS - the three one-method contracts
  agent.ts         VoiceAgent: chains the three stages, implementation-blind
  wav-generator.ts hand-built RIFF/WAV buffer of a sine tone (mock TTS uses it)
  demo.ts          picks mock vs live per stage, runs the pipeline
  stt/  mock.ts (reads a file) · whisper.ts (Whisper API)
  llm/  mock.ts (keyword rules) · openai.ts (GPT)
  tts/  mock.ts (WAV tone) · openai.ts (OpenAI TTS)
fixtures/
  input-transcript.txt   the "transcript" mock STT returns
tests/
  agent, mock-stt, mock-llm, mock-tts, wav-generator
output/                  generated audio (gitignored)
```

`RESEARCH.md` and `PLAN.md` record the background and design decisions.

## Where to go next

- Add a fourth stage without touching `VoiceAgent`: write a class implementing a new interface (say,
  a translation step between STT and LLM) and see how far the swappable-interface design carries you.
- Swap the keyword-rule `MockLLM` for a smarter brain: a new `LLM` class that pipes the prompt through
  project 02's agent loop, or a local model. Note that the pipeline code doesn't change - only the
  constructor wiring in `demo.ts` does.
- Go live with your own voice: record a `.wav`, set `AUDIO_INPUT_PATH`, and hear the full
  Whisper → GPT → TTS round trip. Compare the sine-tone `.wav` from mock mode to the real speech.
