/**
 * WAV File Generator
 *
 * Generates a simple WAV audio file with a sine wave tone.
 * This is used by the mock TTS to create a tangible audio artifact.
 *
 * WAV format: RIFF header + fmt chunk + data chunk with PCM samples
 */

/**
 * Generate a WAV file with a sine wave tone
 * @param outputPath - Where to save the WAV file
 * @param frequencyHz - Frequency of the tone (default 440Hz = A4 note)
 * @param durationSeconds - Duration of the tone (default 1 second)
 * @param sampleRate - Sample rate in Hz (default 44100 = CD quality)
 */
export function generateWav(
  outputPath: string,
  frequencyHz: number = 440,
  durationSeconds: number = 1,
  sampleRate: number = 44100
): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const fileSize = 44 + dataSize; // 44 bytes for header + data

  // Create buffer for entire WAV file
  const buffer = Buffer.alloc(fileSize);

  // Write RIFF header
  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(fileSize - 8, 4); // ChunkSize (file size - 8 bytes)
  buffer.write('WAVE', 8); // Format

  // Write fmt subchunk
  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * blockAlign, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // Write data subchunk header
  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataSize, 40); // Subchunk2Size

  // Generate sine wave samples
  const amplitude = 32767 * 0.5; // 50% volume to avoid clipping
  for (let i = 0; i < numSamples; i++) {
    // Calculate sine wave value
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;

    // Write 16-bit signed integer sample
    const offset = 44 + i * bytesPerSample;
    buffer.writeInt16LE(Math.round(value), offset);
  }

  return buffer;
}
