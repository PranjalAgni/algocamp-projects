import { readFile } from 'fs/promises';
import { STT } from '../interfaces.js';

/**
 * Mock Speech-to-Text Implementation
 *
 * Simulates STT by reading a pre-written transcript file.
 * This allows the system to run without any API keys or network calls.
 */
export class MockSTT implements STT {
  constructor(private transcriptPath: string) {}

  async transcribe(audioPath: string): Promise<string> {
    // In mock mode, we ignore the audioPath and read from the bundled transcript
    // In a real implementation, audioPath would point to an actual audio file
    console.log(`[MockSTT] Reading transcript from: ${this.transcriptPath}`);

    try {
      const transcript = await readFile(this.transcriptPath, 'utf-8');
      return transcript.trim();
    } catch (error) {
      throw new Error(`Failed to read transcript file: ${this.transcriptPath}`);
    }
  }
}
