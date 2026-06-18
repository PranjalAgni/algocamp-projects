import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { MockTTS } from '../src/tts/mock.js';

describe('MockTTS', () => {
  let tempDir: string;

  afterEach(async () => {
    // Clean up temp directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should create a WAV file', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'voice-ai-test-'));
    const outputPath = join(tempDir, 'output.wav');

    const tts = new MockTTS();
    await tts.synthesize('Test message', outputPath);

    // Check that file exists
    const stats = await stat(outputPath);
    expect(stats.isFile()).toBe(true);

    // Check that file is non-empty (should have WAV header + data)
    expect(stats.size).toBeGreaterThan(44); // WAV header is 44 bytes
  });

  it('should create a companion text file', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'voice-ai-test-'));
    const outputPath = join(tempDir, 'output.wav');
    const textPath = join(tempDir, 'output.txt');

    const tts = new MockTTS();
    const testText = 'This is a test message';
    await tts.synthesize(testText, outputPath);

    // Check text file exists and contains correct content
    const textContent = await readFile(textPath, 'utf-8');
    expect(textContent).toBe(testText);
  });

  it('should create valid WAV header', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'voice-ai-test-'));
    const outputPath = join(tempDir, 'output.wav');

    const tts = new MockTTS();
    await tts.synthesize('Test', outputPath);

    // Read first 12 bytes to check WAV/RIFF header
    const buffer = await readFile(outputPath);
    const header = buffer.toString('ascii', 0, 4);
    const format = buffer.toString('ascii', 8, 12);

    expect(header).toBe('RIFF');
    expect(format).toBe('WAVE');
  });
});
