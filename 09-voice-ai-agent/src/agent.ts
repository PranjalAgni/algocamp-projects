import { STT, LLM, TTS } from './interfaces.js';

/**
 * Voice Agent Orchestrator
 *
 * Chains the three stages of voice processing:
 * 1. STT (Speech-to-Text): audio → transcript
 * 2. LLM (Language Model): transcript → response text
 * 3. TTS (Text-to-Speech): response text → audio
 *
 * Each stage is swappable via the interfaces.
 */
export class VoiceAgent {
  constructor(
    private stt: STT,
    private llm: LLM,
    private tts: TTS
  ) {}

  /**
   * Process a voice input through the full pipeline
   *
   * @param audioInputPath - Path to input audio (or transcript file in mock mode)
   * @param audioOutputPath - Path where output audio should be saved
   * @returns The text response from the LLM
   */
  async process(audioInputPath: string, audioOutputPath: string): Promise<string> {
    console.log('\n=== Voice Agent Pipeline ===\n');

    // Stage 1: Speech-to-Text
    console.log('Stage 1: Speech-to-Text');
    const transcript = await this.stt.transcribe(audioInputPath);
    console.log(`📝 Transcript: "${transcript}"\n`);

    // Stage 2: Language Model (Brain)
    console.log('Stage 2: Language Model');
    const response = await this.llm.generate(transcript);
    console.log(`🧠 Response: "${response}"\n`);

    // Stage 3: Text-to-Speech
    console.log('Stage 3: Text-to-Speech');
    await this.tts.synthesize(response, audioOutputPath);
    console.log(`🔊 Audio: ${audioOutputPath}\n`);

    console.log('=== Pipeline Complete ===\n');

    return response;
  }
}
