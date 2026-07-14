/**
 * Demo script - demonstrates the customer support agent with scripted queries
 */

import { runAgent } from './agent.js';

const DEMO_QUERIES = [
  "What's the status of order ORD-001?",
  "What's your refund policy?",
  "I found a bug in the checkout process",
  "Can you help with order ORD-002 and explain shipping?",
];

/**
 * Run demo queries sequentially
 */
async function runDemo() {
  console.log('='.repeat(70));
  console.log('Customer Support Agent Demo');
  console.log('='.repeat(70));

  for (let i = 0; i < DEMO_QUERIES.length; i++) {
    const query = DEMO_QUERIES[i];

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Query ${i + 1}: "${query}"`);
    console.log('='.repeat(70));

    try {
      const response = await runAgent(query);

      console.log('\n[Final Answer]');
      console.log(response.answer);

      console.log(`\n[Summary] ${response.iterations.length} iteration(s), Mode: ${response.mode}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }

    // Add spacing between queries
    if (i < DEMO_QUERIES.length - 1) {
      console.log('\n');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Demo completed!');
  console.log('='.repeat(70));
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
