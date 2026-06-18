#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VoiceAgent } from './agent.js';
import { MockSTT } from './stt/mock.js';
import { WhisperSTT } from './stt/whisper.js';
import { MockLLM } from './llm/mock.js';
import { OpenAILLM } from './llm/openai.js';
import { MockTTS } from './tts/mock.js';
import { OpenAITTS } from './tts/openai.js';

// Load environment variables
config();

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * Voice AI Agent Demo
 *
 * Runs the full STT → LLM → TTS pipeline.
 * Automatically detects if API keys are present and uses LIVE or MOCK mode.
 */
async function main() {
  console.log('🎙️  Voice AI Agent Demo\n');

  const openaiKey = process.env.OPENAI_API_KEY;

  // Input: in mock mode, use bundled transcript; in live mode, would use audio file
  const inputPath = resolve(projectRoot, 'fixtures', 'input-transcript.txt');

  // Output: save generated audio in output directory
  const outputPath = resolve(projectRoot, 'output', 'response.wav');

  // Stage 1: STT (Speech-to-Text)
  let sttMode: string;
  let stt;
  if (openaiKey) {
    stt = new WhisperSTT(openaiKey);
    sttMode = 'LIVE (Whisper API)';
  } else {
    stt = new MockSTT(inputPath);
    sttMode = 'MOCK (file-based)';
  }
  console.log(`[STT MODE: ${sttMode}]`);

  // Stage 2: LLM (Language Model / Brain)
  let llmMode: string;
  let llm;
  if (openaiKey) {
    llm = new OpenAILLM(openaiKey);
    llmMode = 'LIVE (GPT API)';
  } else {
    llm = new MockLLM();
    llmMode = 'MOCK (keyword-based)';
  }
  console.log(`[LLM MODE: ${llmMode}]`);

  // Stage 3: TTS (Text-to-Speech)
  let ttsMode: string;
  let tts;
  if (openaiKey) {
    tts = new OpenAITTS(openaiKey);
    ttsMode = 'LIVE (OpenAI TTS)';
  } else {
    tts = new MockTTS();
    ttsMode = 'MOCK (WAV generation)';
  }
  console.log(`[TTS MODE: ${ttsMode}]`);

  // Print overall mode banner
  const overallMode = openaiKey ? 'LIVE' : 'MOCK — no API key';
  console.log(`\n🚀 [MODE: ${overallMode}]\n`);

  // Create and run the agent
  const agent = new VoiceAgent(stt, llm, tts);

  try {
    await agent.process(inputPath, outputPath);

    console.log('✅ Demo completed successfully!');
    console.log(`\nGenerated files:`);
    console.log(`  - ${outputPath}`);
    if (!openaiKey) {
      console.log(`  - ${outputPath.replace('.wav', '.txt')}`);
    }
  } catch (error) {
    console.error('❌ Error during demo:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
