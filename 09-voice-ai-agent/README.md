# Voice-Based AI Agent

A learning project demonstrating the architecture of a voice assistant: **Speech-to-Text (STT) → Language Model (LLM) → Text-to-Speech (TTS)**.

## Overview

This project implements a modular voice assistant pipeline with swappable interfaces for each stage:

1. **STT (Speech-to-Text)**: Converts audio input to text transcript
2. **LLM (Language Model)**: Processes text and generates a response
3. **TTS (Text-to-Speech)**: Converts response text back to audio

Each stage can be run in **MOCK mode** (no API keys, fully offline) or **LIVE mode** (using OpenAI APIs).

## Key Learning Outcomes

- Understanding the voice assistant pipeline architecture
- Designing swappable interfaces for modularity
- Implementing mock providers for offline testing
- Generating binary audio artifacts (WAV format)
- Building a fully testable system without external dependencies

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Voice Agent                       │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │   STT    │ -> │   LLM    │ -> │   TTS    │    │
│  │ (audio   │    │ (brain)  │    │ (audio   │    │
│  │  -> text)│    │          │    │  output) │    │
│  └──────────┘    └──────────┘    └──────────┘    │
│                                                     │
│  Each stage implements a simple interface and      │
│  can be swapped between MOCK and LIVE modes        │
└─────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Running the Demo

### MOCK Mode (Default - No API Keys Required)

```bash
npm run demo
```

This runs the full pipeline using mock implementations:
- **Mock STT**: Reads from `fixtures/input-transcript.txt`
- **Mock LLM**: Keyword-based rule responder
- **Mock TTS**: Generates a real WAV file (440Hz sine tone) + text file

### LIVE Mode (Requires OpenAI API Key)

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Run the demo:
   ```bash
   npm run demo
   ```

In LIVE mode:
- **Whisper API**: Transcribes actual audio files
- **GPT API**: Generates intelligent responses
- **OpenAI TTS**: Produces natural-sounding speech

## Running Tests

```bash
npm test
```

All tests run offline using mock implementations.

## Example Output (MOCK Mode)

```
🎙️  Voice AI Agent Demo

[STT MODE: MOCK (file-based)]
[LLM MODE: MOCK (keyword-based)]
[TTS MODE: MOCK (WAV generation)]

🚀 [MODE: MOCK — no API key]


=== Voice Agent Pipeline ===

Stage 1: Speech-to-Text
[MockSTT] Reading transcript from: /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/fixtures/input-transcript.txt
📝 Transcript: "What is the weather today?"

Stage 2: Language Model
[MockLLM] Processing prompt (26 chars)
🧠 Response: "The weather is sunny and 72 degrees Fahrenheit."

Stage 3: Text-to-Speech
[MockTTS] Generating audio for: "The weather is sunny and 72 degrees Fahrenheit...."
[MockTTS] Wrote text to: /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/output/response.txt
[MockTTS] Generated WAV file: /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/output/response.wav
🔊 Audio: /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/output/response.wav

=== Pipeline Complete ===

✅ Demo completed successfully!

Generated files:
  - /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/output/response.wav
  - /Users/pranjal.agnihotri/coding/aiexperiments/algocamp-projects/09-voice-ai-agent/output/response.txt
```

## Test Output

```
 RUN  v2.1.9

 ✓ tests/agent.test.ts (2 tests) 40ms
 ✓ tests/mock-tts.test.ts (3 tests) 44ms
 ✓ tests/mock-llm.test.ts (4 tests) 76ms
 ✓ tests/mock-stt.test.ts (2 tests) 11ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  848ms
```

## Project Structure

```
09-voice-ai-agent/
├── RESEARCH.md          # Background research and design decisions
├── PLAN.md              # Implementation plan and scope
├── README.md            # This file
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Test configuration
├── .env.example         # Environment variable template
├── .gitignore           # Git ignore rules
├── src/
│   ├── interfaces.ts    # STT, LLM, TTS interfaces
│   ├── agent.ts         # VoiceAgent orchestrator
│   ├── wav-generator.ts # WAV file generation utility
│   ├── demo.ts          # Demo script
│   ├── stt/
│   │   ├── mock.ts      # Mock STT (reads transcript file)
│   │   └── whisper.ts   # OpenAI Whisper STT
│   ├── llm/
│   │   ├── mock.ts      # Mock LLM (keyword matcher)
│   │   └── openai.ts    # OpenAI GPT LLM
│   └── tts/
│       ├── mock.ts      # Mock TTS (generates WAV)
│       └── openai.ts    # OpenAI TTS
├── fixtures/
│   └── input-transcript.txt  # Sample input for mock mode
├── tests/
│   ├── agent.test.ts    # Full pipeline integration test
│   ├── mock-stt.test.ts # STT unit tests
│   ├── mock-llm.test.ts # LLM unit tests
│   └── mock-tts.test.ts # TTS unit tests
└── output/              # Generated audio files (gitignored)
```

## Implementation Details

### Mock STT
Reads a pre-written transcript from `fixtures/input-transcript.txt`. Simulates speech recognition without any audio processing.

### Mock LLM
Uses simple keyword matching:
- "weather" → Returns weather information
- "time" → Returns current time
- Default → Echoes the input with a mock response

### Mock TTS
Generates two files:
1. **response.txt**: The response text
2. **response.wav**: A valid WAV file with a 440Hz sine tone (1 second)

The WAV generation demonstrates binary audio file creation with proper RIFF/WAV headers.

### Live Implementations
When `OPENAI_API_KEY` is set:
- **WhisperSTT**: Uploads audio to OpenAI Whisper API
- **OpenAILLM**: Calls GPT-3.5-turbo with a system prompt
- **OpenAITTS**: Generates natural speech using the "alloy" voice

## Extending the Project

Ideas for v2 (not implemented):
- Multi-turn conversation with history
- Streaming responses
- Alternative TTS (ElevenLabs)
- Local Whisper models via transformers.js
- Microphone input / speaker output
- Voice activity detection (VAD)
- WebSocket API for browser clients

## Environment Variables

See `.env.example`:

```bash
# OpenAI API key for Whisper STT, GPT LLM, and TTS
OPENAI_API_KEY=

# Optional: ElevenLabs API key (not used in v1)
ELEVENLABS_API_KEY=
```

## License

MIT
