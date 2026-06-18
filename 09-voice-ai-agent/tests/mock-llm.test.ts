import { describe, it, expect } from 'vitest';
import { MockLLM } from '../src/llm/mock.js';

describe('MockLLM', () => {
  const llm = new MockLLM();

  it('should respond to weather queries', async () => {
    const response = await llm.generate('What is the weather today?');
    expect(response).toContain('weather');
    expect(response).toContain('sunny');
  });

  it('should respond to time queries', async () => {
    const response = await llm.generate('What time is it?');
    expect(response).toContain('time');
  });

  it('should respond to greetings', async () => {
    const response = await llm.generate('Hello');
    expect(response).toContain('Hello');
  });

  it('should echo unknown queries', async () => {
    const prompt = 'Tell me about quantum physics';
    const response = await llm.generate(prompt);
    expect(response).toContain('I heard you say');
    expect(response).toContain(prompt);
  });
});
