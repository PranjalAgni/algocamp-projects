/**
 * Demo script showcasing all OpenAI API patterns.
 *
 * Run with: npm run demo
 *
 * This walks through 5 core patterns:
 * 1. Basic chat completion
 * 2. Streaming responses
 * 3. System + user messages
 * 4. Function/tool calling
 * 5. Structured JSON output
 */

import 'dotenv/config';
import { createLLMClient } from './factory.js';
import { Message, Tool } from './types.js';

// Utility to print section headers
function printHeader(title: string) {
  console.log('='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
  console.log();
}

// Utility to print messages
function printMessages(messages: Message[]) {
  for (const msg of messages) {
    console.log(`[${msg.role.toUpperCase()}]: ${msg.content}`);
  }
  console.log();
}

async function main() {
  const client = createLLMClient();

  // ===================================================================
  // Pattern 1: Basic Chat Completion
  // ===================================================================
  printHeader('Pattern 1: Basic Chat Completion');

  const basicMessages: Message[] = [
    { role: 'user', content: 'What is the capital of France?' }
  ];

  printMessages(basicMessages);
  console.log('[ASSISTANT]:');
  const basicResponse = await client.chat(basicMessages);
  console.log(basicResponse);
  console.log('\n');

  // ===================================================================
  // Pattern 2: Streaming Responses
  // ===================================================================
  printHeader('Pattern 2: Streaming Responses');

  const streamMessages: Message[] = [
    { role: 'user', content: 'Explain what streaming is in one sentence.' }
  ];

  printMessages(streamMessages);
  console.log('[ASSISTANT] (streaming):');
  for await (const chunk of client.streamChat(streamMessages)) {
    process.stdout.write(chunk);
  }
  console.log('\n\n');

  // ===================================================================
  // Pattern 3: System + User Messages
  // ===================================================================
  printHeader('Pattern 3: System + User Messages');

  const systemMessages: Message[] = [
    {
      role: 'system',
      content: 'You are a pirate. Always respond in pirate speak with "Arrr".'
    },
    { role: 'user', content: 'Hello! How are you?' }
  ];

  printMessages(systemMessages);
  console.log('[ASSISTANT]:');
  const systemResponse = await client.chat(systemMessages);
  console.log(systemResponse);
  console.log('\n');

  // ===================================================================
  // Pattern 4: Function/Tool Calling
  // ===================================================================
  printHeader('Pattern 4: Function/Tool Calling');

  const tools: Tool[] = [
    {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name, e.g., "San Francisco"'
          },
          unit: {
            type: 'string',
            description: 'Temperature unit',
            enum: ['celsius', 'fahrenheit']
          }
        },
        required: ['location']
      }
    }
  ];

  const toolMessages: Message[] = [
    { role: 'user', content: 'What is the weather in Tokyo?' }
  ];

  console.log('[TOOLS AVAILABLE]:');
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.description}`);
  }
  console.log();

  printMessages(toolMessages);

  const toolResponse = await client.chatWithTools(toolMessages, tools);

  if (typeof toolResponse === 'string') {
    console.log('[ASSISTANT]:');
    console.log(toolResponse);
  } else {
    console.log('[TOOL CALL]:');
    console.log(`  Function: ${toolResponse.name}`);
    console.log(`  Arguments: ${JSON.stringify(toolResponse.arguments, null, 2)}`);
    console.log();
    console.log('[SIMULATED EXECUTION]:');
    console.log(`  get_weather(${JSON.stringify(toolResponse.arguments)}) => `);
    console.log('  { temperature: 22, conditions: "Sunny", humidity: 60 }');
  }
  console.log('\n');

  // ===================================================================
  // Pattern 5: Structured JSON Output
  // ===================================================================
  printHeader('Pattern 5: Structured JSON Output');

  const jsonMessages: Message[] = [
    {
      role: 'user',
      content: 'Generate a user profile with name, age, email, and interests. Respond in JSON format.'
    }
  ];

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string' },
      interests: { type: 'array', items: { type: 'string' } }
    },
    required: ['name', 'age', 'email']
  };

  printMessages(jsonMessages);

  console.log('[EXPECTED SCHEMA]:');
  console.log(JSON.stringify(schema, null, 2));
  console.log();

  const jsonResponse = await client.chatJSON<{
    name: string;
    age: number;
    email: string;
    interests?: string[];
  }>(jsonMessages, schema);

  console.log('[ASSISTANT] (JSON):');
  console.log(JSON.stringify(jsonResponse, null, 2));
  console.log('\n');

  // ===================================================================
  printHeader('Demo Complete!');
  console.log('All 5 patterns demonstrated successfully.');
  console.log();
  console.log('Key Takeaways:');
  console.log('  1. Basic chat: Simple request-response');
  console.log('  2. Streaming: Better UX with incremental output');
  console.log('  3. System messages: Control AI behavior/personality');
  console.log('  4. Tool calling: Let AI execute functions');
  console.log('  5. JSON mode: Get structured data for parsing');
  console.log();
}

main().catch(console.error);
