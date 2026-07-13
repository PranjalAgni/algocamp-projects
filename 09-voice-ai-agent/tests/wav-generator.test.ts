import { describe, it, expect } from 'vitest';
import { generateWav } from '../src/wav-generator.js';

describe('generateWav', () => {
  it('returns a buffer, not a file path (writing is the caller job)', () => {
    const buffer = generateWav(440, 1.0, 44100);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('produces a valid RIFF/WAVE header', () => {
    const buffer = generateWav(440, 1.0, 44100);
    expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
  });

  it('sizes the buffer to header + 16-bit mono PCM samples', () => {
    const sampleRate = 8000;
    const seconds = 0.5;
    const buffer = generateWav(440, seconds, sampleRate);
    // 44-byte header + numSamples * 2 bytes (16-bit mono)
    const expected = 44 + Math.floor(sampleRate * seconds) * 2;
    expect(buffer.length).toBe(expected);
  });
});
