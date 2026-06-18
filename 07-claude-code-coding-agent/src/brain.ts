/**
 * Brain implementations: LLM (Anthropic) and Mock (hardcoded responses).
 * The brain decides which tools to call given the current conversation state.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Brain, BrainResponse, Message, Tool } from './types.js';

/**
 * LLM Brain - uses the real Claude API
 * Learning point: This is how you integrate tool use with Claude.
 */
export class LLMBrain implements Brain {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-5-haiku-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async respond(messages: Message[], tools: Tool[]): Promise<BrainResponse> {
    // Convert our tool definitions to Anthropic's format
    const anthropicTools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    // Call Claude with tool definitions
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      tools: anthropicTools,
      messages: messages as Anthropic.MessageParam[],
    });

    // Extract text and tool calls from response
    const toolCalls = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map((block) => ({
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      }));

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const text = textBlocks.length > 0 ? textBlocks[0].text : undefined;

    return { text, toolCalls };
  }
}

/**
 * Mock Brain - deterministic scripted responses for demo without API key.
 * Learning point: Always provide a fallback so your project runs offline!
 *
 * Supports two canned tasks:
 * 1. "create hello.js and run it"
 * 2. "list files and create summary"
 */
export class MockBrain implements Brain {
  private stepCount = 0;
  private task = '';

  async respond(messages: Message[]): Promise<BrainResponse> {
    // Extract the original task from the first user message
    if (this.stepCount === 0) {
      const firstUserMessage = messages.find((m) => m.role === 'user');
      if (firstUserMessage && typeof firstUserMessage.content === 'string') {
        this.task = firstUserMessage.content.toLowerCase();
      }
    }

    this.stepCount++;

    // Pattern match on task and emit the right sequence
    if (this.task.includes('hello.js') || this.task.includes('hello from the agent')) {
      return this.handleHelloJsTask();
    } else if (this.task.includes('list files') && this.task.includes('summary')) {
      return this.handleListFilesTask();
    } else {
      // Default: don't know how to handle
      return {
        text: "I don't know how to handle this task in mock mode",
        toolCalls: [
          {
            id: 'mock-finish',
            name: 'finish',
            input: { result: 'Mock mode only supports specific canned tasks' },
          },
        ],
      };
    }
  }

  /**
   * Canned task 1: Create hello.js and run it
   * Step 1: writeFile
   * Step 2: runCommand
   * Step 3: finish
   */
  private handleHelloJsTask(): BrainResponse {
    if (this.stepCount === 1) {
      return {
        text: "I'll create the hello.js file",
        toolCalls: [
          {
            id: 'mock-write-1',
            name: 'writeFile',
            input: {
              path: 'hello.js',
              content: "console.log('Hello from the agent!');",
            },
          },
        ],
      };
    } else if (this.stepCount === 2) {
      return {
        text: "Now I'll run it",
        toolCalls: [
          {
            id: 'mock-run-1',
            name: 'runCommand',
            input: { command: 'node hello.js' },
          },
        ],
      };
    } else {
      return {
        text: 'Task complete',
        toolCalls: [
          {
            id: 'mock-finish-1',
            name: 'finish',
            input: { result: 'Created hello.js and executed it successfully. Output: Hello from the agent!' },
          },
        ],
      };
    }
  }

  /**
   * Canned task 2: List files and create summary
   * Step 1: listFiles
   * Step 2: writeFile (summary)
   * Step 3: finish
   */
  private handleListFilesTask(): BrainResponse {
    if (this.stepCount === 1) {
      return {
        text: "I'll list the files",
        toolCalls: [
          {
            id: 'mock-list-1',
            name: 'listFiles',
            input: { path: '.' },
          },
        ],
      };
    } else if (this.stepCount === 2) {
      return {
        text: "Now I'll create a summary",
        toolCalls: [
          {
            id: 'mock-write-2',
            name: 'writeFile',
            input: {
              path: 'summary.txt',
              content: 'File listing completed.',
            },
          },
        ],
      };
    } else {
      return {
        text: 'Task complete',
        toolCalls: [
          {
            id: 'mock-finish-2',
            name: 'finish',
            input: { result: 'Listed files and created summary.txt' },
          },
        ],
      };
    }
  }
}
