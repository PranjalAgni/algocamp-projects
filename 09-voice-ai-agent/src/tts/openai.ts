import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { TTS } from '../interfaces.js';

/**
 * OpenAI Text-to-Speech Implementation
 *
 * Uses OpenAI's TTS API to generate natural-sounding speech.
 * Requires OPENAI_API_KEY to be set.
 */
export class OpenAITTS implements TTS {
  private client: OpenAI;
  private voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  private model: 'tts-1' | 'tts-1-hd';

  constructor(
    apiKey: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
    model: 'tts-1' | 'tts-1-hd' = 'tts-1'
  ) {
    this.client = new OpenAI({ apiKey });
    this.voice = voice;
    this.model = model;
  }

  async synthesize(text: string, outputPath: string): Promise<void> {
    console.log(`[OpenAITTS] Synthesizing speech with voice: ${this.voice}`);

    try {
      // Ensure output directory exists
      const dir = dirname(outputPath);
      await mkdir(dir, { recursive: true });

      // Call OpenAI TTS API
      const mp3Response = await this.client.audio.speech.create({
        model: this.model,
        voice: this.voice,
        input: text,
      });

      // Convert response to buffer and save
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      await writeFile(outputPath, buffer);

      console.log(`[OpenAITTS] Audio saved to: ${outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OpenAI TTS error: ${message}`);
    }
  }
}
