# Voice-Based AI Agent — Research

## Concept Overview
A voice-based AI agent is a conversational system that processes spoken input, reasons about it, and generates spoken responses. The architecture follows a three-stage pipeline:

1. **Speech-to-Text (STT)**: Converts audio input to text transcript
2. **Language Model (LLM / "Brain")**: Processes the text and generates a response
3. **Text-to-Speech (TTS)**: Converts the LLM's text response back to audio

Each stage can be swapped independently, making the system modular and testable.

## Key Approaches

### STT (Speech-to-Text) Options
- **OpenAI Whisper API**: Cloud-based, high-quality transcription. Requires OPENAI_API_KEY.
- **Local Whisper models**: Via `@huggingface/transformers` or `whisper.cpp` bindings (heavier deps, slower on CPU)
- **Mock**: For testing/learning, read from a pre-written transcript file

**Choice**: Whisper API for LIVE mode (small audio files), mock transcript file for default.

### LLM (Brain) Options
- **OpenAI GPT models**: gpt-4o-mini or gpt-3.5-turbo via API
- **Local models**: Ollama, llama.cpp (requires model downloads)
- **Mock/deterministic**: Simple keyword matcher for offline mode

**Choice**: OpenAI API for LIVE (fast, easy), deterministic rule-based responder for MOCK.

### TTS (Text-to-Speech) Options
- **OpenAI TTS API**: High-quality voices (alloy, echo, etc.). Requires OPENAI_API_KEY.
- **ElevenLabs API**: Very natural voices, requires ELEVENLABS_API_KEY
- **Local TTS**: `espeak`, `say` (macOS), or browser Web Speech API
- **Mock**: Write response text to file + generate a simple WAV artifact for demonstration

**Choice**: OpenAI TTS for LIVE mode, mock WAV generation for MOCK (demonstrates full pipeline without network).

## Mock Mode Strategy (Default, No Keys)

Since the #1 rule is zero-dependency offline execution:

1. **Mock STT**: Bundle a sample transcript file (e.g., `fixtures/input-transcript.txt` with "What is the weather today?")
2. **Mock LLM**: Simple keyword matching:
   - "weather" → "The weather is sunny and 72 degrees."
   - "time" → "The current time is 3:45 PM."
   - fallback → "I heard you say: [transcript]. I'm a mock assistant."
3. **Mock TTS**: Write response text to output file AND generate a minimal valid WAV file (e.g., 1 second of 440Hz sine tone) to prove the audio artifact exists.

This makes the system fully runnable offline with no external dependencies.

## Library Choices

### TypeScript/Node.js
- **openai**: Official SDK for Whisper, GPT, and TTS (when in LIVE mode)
- **dotenv**: Load .env for API keys
- **tsx**: Run TypeScript directly
- **vitest**: Testing framework

### WAV Generation (Mock Mode)
For mock TTS, we need to generate a real WAV file. Options:
- **Manual WAV header**: Write raw PCM data with a 44-byte RIFF/WAV header (simple, zero deps)
- **node-wav** or similar: Small library (adds dependency)

**Choice**: Manual WAV header generation (educational, zero extra deps). We'll write a simple 440Hz sine wave PCM buffer with proper WAV headers.

## Interface Design

```typescript
// STT interface
interface STT {
  transcribe(audioPath: string): Promise<string>;
}

// LLM interface
interface LLM {
  generate(prompt: string): Promise<string>;
}

// TTS interface
interface TTS {
  synthesize(text: string, outputPath: string): Promise<void>;
}

// Orchestrator
class VoiceAgent {
  constructor(stt: STT, llm: LLM, tts: TTS);
  async process(audioInputPath: string, audioOutputPath: string): Promise<string>;
}
```

## Practical Assumptions

1. **Audio format**: For real Whisper input, assume `.mp3` or `.wav`. Mock mode uses text files.
2. **Single-turn**: v1 handles one question → one answer (no conversation history).
3. **Synchronous**: Process stages sequentially (STT → LLM → TTS), not streamed.
4. **File-based I/O**: Input/output via files for simplicity (not microphone/speaker).
5. **Error handling**: Print clear errors if LIVE mode API calls fail.

## References

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [WAV File Format](http://soundfile.sapp.org/doc/WaveFormat/)
- [ElevenLabs API](https://docs.elevenlabs.io/api-reference/text-to-speech)

## Key Learning Outcomes

1. Understanding the voice assistant pipeline (STT → LLM → TTS)
2. Designing swappable interfaces for each stage
3. Implementing mock providers for offline testing
4. Generating binary audio artifacts (WAV format)
5. Building a fully testable conversational system without external dependencies
