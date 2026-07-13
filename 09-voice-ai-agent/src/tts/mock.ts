import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { TTS } from '../interfaces.js';
import { generateWav } from '../wav-generator.js';

/**
 * Mock Text-to-Speech Implementation
 *
 * Simulates TTS by:
 * 1. Writing the response text to a .txt file
 * 2. Generating a simple WAV audio file (sine wave tone)
 *
 * This demonstrates the full pipeline without requiring API keys.
 */
export class MockTTS implements TTS {
  async synthesize(text: string, outputPath: string): Promise<void> {
    console.log(`[MockTTS] Generating audio for: "${text.substring(0, 50)}..."`);

    // Ensure output directory exists
    const dir = dirname(outputPath);
    await mkdir(dir, { recursive: true });

    // Write text to a companion .txt file
    const textPath = outputPath.replace(/\.(wav|mp3)$/, '.txt');
    await writeFile(textPath, text, 'utf-8');
    console.log(`[MockTTS] Wrote text to: ${textPath}`);

    // Generate a simple WAV file (440Hz tone for 1 second)
    // This proves we created a real audio artifact
    const wavBuffer = generateWav(440, 1.0, 44100);
    await writeFile(outputPath, wavBuffer);
    console.log(`[MockTTS] Generated WAV file: ${outputPath}`);
  }
}
