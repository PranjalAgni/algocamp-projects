import { LLM } from '../interfaces.js';

/**
 * Mock Language Model Implementation
 *
 * Provides deterministic, keyword-based responses without API calls.
 * This demonstrates the LLM interface while being fully offline.
 */
export class MockLLM implements LLM {
  async generate(prompt: string): Promise<string> {
    console.log(`[MockLLM] Processing prompt (${prompt.length} chars)`);

    // Simple keyword matching for demo purposes
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('weather')) {
      return 'The weather is sunny and 72 degrees Fahrenheit.';
    }

    if (lowerPrompt.includes('time')) {
      // Return current time for a bit more realism
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `The current time is ${timeStr}.`;
    }

    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return 'Hello! I am a mock voice assistant. I can tell you about the weather or time.';
    }

    if (lowerPrompt.includes('help')) {
      return 'I am a mock assistant. Ask me about the weather or time to see keyword-based responses.';
    }

    // Fallback: echo what we heard
    return `I heard you say: "${prompt}". I'm a mock assistant running in offline mode.`;
  }
}
