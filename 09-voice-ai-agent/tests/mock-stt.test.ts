import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MockSTT } from '../src/stt/mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesPath = resolve(__dirname, '..', 'fixtures', 'input-transcript.txt');

describe('MockSTT', () => {
  it('should read transcript from fixture file', async () => {
    const stt = new MockSTT(fixturesPath);
    const result = await stt.transcribe('dummy-path');

    expect(result).toBe('What is the weather today?');
  });

  it('should throw error if file does not exist', async () => {
    const stt = new MockSTT('/nonexistent/path.txt');

    await expect(stt.transcribe('dummy-path')).rejects.toThrow();
  });
});
