# Voice-Based AI Agent - Plan

## v1 Scope

Build a TypeScript voice assistant that chains STT → LLM → TTS with swappable implementations for each stage. Default to fully offline mock mode.

## File Layout

```
09-voice-ai-agent/
├── RESEARCH.md          # Background research (done)
├── PLAN.md              # This file
├── README.md            # Usage instructions + example output
├── package.json         # Dependencies + scripts
├── tsconfig.json        # TypeScript config (ESM)
├── .env.example         # API key templates
├── .gitignore           # Ignore node_modules, .env, output/
├── vitest.config.ts     # Test configuration
├── src/
│   ├── interfaces.ts    # STT, LLM, TTS interfaces
│   ├── stt/
│   │   ├── mock.ts      # MockSTT: reads transcript from file
│   │   └── whisper.ts   # WhisperSTT: calls OpenAI API
│   ├── llm/
│   │   ├── mock.ts      # MockLLM: keyword-based rules
│   │   └── openai.ts    # OpenAILLM: calls GPT API
│   ├── tts/
│   │   ├── mock.ts      # MockTTS: writes text + generates WAV
│   │   └── openai.ts    # OpenAITTS: calls TTS API
│   ├── agent.ts         # VoiceAgent orchestrator
│   ├── wav-generator.ts # Helper to create WAV files
│   └── demo.ts          # CLI demo script
├── fixtures/
│   └── input-transcript.txt  # Bundled mock input
├── output/              # Generated audio files (gitignored)
└── tests/
    ├── agent.test.ts    # Integration test: full pipeline
    ├── mock-stt.test.ts # Unit test: mock STT
    └── mock-tts.test.ts # Unit test: mock TTS writes file
```

## Core Implementation Steps

### 1. Setup (package.json, tsconfig.json, .gitignore)
- TypeScript ESM setup with `"type": "module"`
- Dependencies: `openai`, `dotenv`, `tsx`, `vitest`
- Dev dependencies: `@types/node`, `typescript`

### 2. Interfaces (`src/interfaces.ts`)
```typescript
export interface STT {
  transcribe(audioPath: string): Promise<string>;
}

export interface LLM {
  generate(prompt: string): Promise<string>;
}

export interface TTS {
  synthesize(text: string, outputPath: string): Promise<void>;
}
```

### 3. Mock Implementations (Default)
- **MockSTT**: reads from `fixtures/input-transcript.txt`
- **MockLLM**: keyword matcher (weather, time, fallback)
- **MockTTS**: writes text to `output/response.txt` + generates simple WAV at `output/response.wav`

### 4. WAV Generator (`src/wav-generator.ts`)
Generate a minimal valid WAV file:
- 44-byte WAV header (RIFF format)
- 1 second of 440Hz sine wave, 16-bit PCM, 44.1kHz sample rate
- Proves audio artifact generation without external deps

### 5. Live Implementations (Optional, if keys present)
- **WhisperSTT**: Upload audio to OpenAI Whisper API
- **OpenAILLM**: Call gpt-4o-mini (default; pass another id to swap)
- **OpenAITTS**: Call OpenAI TTS with `alloy` voice

### 6. Orchestrator (`src/agent.ts`)
```typescript
export class VoiceAgent {
  constructor(
    private stt: STT,
    private llm: LLM,
    private tts: TTS
  ) {}

  async process(audioInputPath: string, audioOutputPath: string): Promise<string> {
    // 1. STT: audio → text
    const transcript = await this.stt.transcribe(audioInputPath);
    console.log(`[STT] Heard: ${transcript}`);

    // 2. LLM: text → response text
    const response = await this.llm.generate(transcript);
    console.log(`[LLM] Response: ${response}`);

    // 3. TTS: response text → audio
    await this.tts.synthesize(response, audioOutputPath);
    console.log(`[TTS] Audio saved to: ${audioOutputPath}`);

    return response;
  }
}
```

### 7. Demo Script (`src/demo.ts`)
- Load env vars from `.env`
- Detect if API keys are present
- Instantiate mock or live providers per stage
- Print `[MODE: MOCK]` or `[MODE: LIVE]` banners
- Run `agent.process()` with bundled input
- Print output paths

### 8. Tests (`tests/`)
- **agent.test.ts**: Full pipeline with mocks, verify output file exists
- **mock-stt.test.ts**: Verify mock STT reads fixture correctly
- **mock-tts.test.ts**: Verify mock TTS creates non-empty WAV file
- Use temp directories (`vitest` provides test context)

## Commands

- `npm install`: Install dependencies
- `npm run demo`: Run the demo (STT → LLM → TTS)
- `npm test`: Run vitest tests

## Mode Detection Logic

```typescript
const openaiKey = process.env.OPENAI_API_KEY;
const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

const stt: STT = openaiKey 
  ? new WhisperSTT(openaiKey) 
  : new MockSTT('fixtures/input-transcript.txt');

const llm: LLM = openaiKey
  ? new OpenAILLM(openaiKey)
  : new MockLLM();

const tts: TTS = openaiKey
  ? new OpenAITTS(openaiKey)
  : new MockTTS();

console.log(`[MODE: ${openaiKey ? 'LIVE' : 'MOCK'}]`);
```

## Example Mock Flow

**Input**: `fixtures/input-transcript.txt` contains "What is the weather today?"

**Output**:
```
[MODE: MOCK — no API key]
[STT] Heard: What is the weather today?
[LLM] Response: The weather is sunny and 72 degrees.
[TTS] Audio saved to: output/response.wav
```

**Files created**:
- `output/response.txt`: "The weather is sunny and 72 degrees."
- `output/response.wav`: 1-second 440Hz sine tone (demonstrates audio artifact)

## Stretch Goals (Not Implemented in v1)

- Streaming responses (TTS as LLM generates)
- Conversation history / multi-turn dialog
- Support for ElevenLabs TTS as alternative
- Local Whisper model (via transformers.js)
- Microphone input / speaker output (real-time)
- Voice activity detection (VAD)
- WebSocket API for browser clients

## Success Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run demo` runs successfully with no API keys
- [ ] Demo prints transcript, LLM response, and output path
- [ ] `output/response.wav` exists and is a valid WAV file
- [ ] `npm test` passes all tests offline
- [ ] README includes real passing output
