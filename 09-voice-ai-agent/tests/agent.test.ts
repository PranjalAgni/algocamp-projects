import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VoiceAgent } from '../src/agent.js';
import { MockSTT } from '../src/stt/mock.js';
import { MockLLM } from '../src/llm/mock.js';
import { MockTTS } from '../src/tts/mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesPath = resolve(__dirname, '..', 'fixtures', 'input-transcript.txt');

describe('VoiceAgent', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should process full pipeline: STT → LLM → TTS', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'voice-ai-test-'));
    const outputPath = join(tempDir, 'response.wav');

    // Create agent with mock implementations
    const stt = new MockSTT(fixturesPath);
    const llm = new MockLLM();
    const tts = new MockTTS();
    const agent = new VoiceAgent(stt, llm, tts);

    // Run the pipeline
    const response = await agent.process(fixturesPath, outputPath);

    // Check that we got a response
    expect(response).toBeTruthy();
    expect(response).toContain('weather');

    // Check that output file was created
    const stats = await stat(outputPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should pass transcript from STT to LLM', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'voice-ai-test-'));
    const outputPath = join(tempDir, 'response.wav');

    const stt = new MockSTT(fixturesPath);
    const llm = new MockLLM();
    const tts = new MockTTS();
    const agent = new VoiceAgent(stt, llm, tts);

    const response = await agent.process(fixturesPath, outputPath);

    // The fixture asks about weather, so mock LLM should respond with weather info
    expect(response).toContain('weather');
    expect(response).toContain('sunny');
  });
});
