import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { STT } from '../interfaces.js';

/**
 * OpenAI Whisper Speech-to-Text Implementation
 *
 * Uses the OpenAI Whisper API to transcribe audio files.
 * Requires OPENAI_API_KEY to be set.
 */
export class WhisperSTT implements STT {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audioPath: string): Promise<string> {
    console.log(`[WhisperSTT] Transcribing audio: ${audioPath}`);

    try {
      // Upload audio file to Whisper API
      const response = await this.client.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: 'whisper-1',
      });

      return response.text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Whisper API error: ${message}`);
    }
  }
}
