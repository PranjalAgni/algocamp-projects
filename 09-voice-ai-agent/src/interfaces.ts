/**
 * Voice AI Agent Interfaces
 *
 * These interfaces define the contract for each stage of the voice pipeline.
 * Each stage can be swapped with different implementations (mock, OpenAI, etc.)
 */

/**
 * Speech-to-Text interface
 * Converts audio input to text transcript
 */
export interface STT {
  /**
   * Transcribe audio to text
   * @param audioPath - Path to audio file (or mock input file)
   * @returns Transcribed text
   */
  transcribe(audioPath: string): Promise<string>;
}

/**
 * Language Model interface (the "brain")
 * Processes text input and generates a response
 */
export interface LLM {
  /**
   * Generate a response to the input text
   * @param prompt - User's input text
   * @returns AI-generated response text
   */
  generate(prompt: string): Promise<string>;
}

/**
 * Text-to-Speech interface
 * Converts text to audio output
 */
export interface TTS {
  /**
   * Synthesize speech from text
   * @param text - Text to speak
   * @param outputPath - Path where audio file should be saved
   */
  synthesize(text: string, outputPath: string): Promise<void>;
}
