/**
 * Demo script showcasing embeddings, semantic search, and similarity.
 *
 * This demo:
 * 1. Creates an embedder (auto-selects best available)
 * 2. Embeds a small corpus of sentences on various topics
 * 3. Runs semantic search queries and displays ranked results
 * 4. Shows a similarity matrix visualizing how sentences relate
 */

import { createEmbedder } from './embedder.js';
import { semanticSearch, similarityMatrix } from './similarity.js';

// Sample corpus: mix of related and unrelated sentences
const CORPUS = [
  "I love traveling to exotic destinations and exploring new cultures.",
  "The best vacation spots are usually near beaches or mountains.",
  "Machine learning models require large amounts of training data.",
  "Neural networks can learn complex patterns from examples.",
  "Paris is known as the city of lights and love.",
  "The Eiffel Tower is one of the most iconic landmarks in the world.",
  "Python is a popular programming language for data science.",
  "Deep learning has revolutionized computer vision and natural language processing.",
  "Summer vacations are a great time to relax and unwind.",
  "Artificial intelligence is transforming many industries.",
  "The Mediterranean has some of the most beautiful coastlines.",
  "Software engineers use version control systems like Git."
];

// Semantic search queries
const QUERIES = [
  "travel destinations and tourism",
  "machine learning and AI",
  "programming and software development"
];

/**
 * Formats a similarity score for display (2 decimal places).
 */
function formatScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Displays semantic search results for a query.
 */
async function runSemanticSearchDemo(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    SEMANTIC SEARCH DEMO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const embedder = await createEmbedder();

  for (const query of QUERIES) {
    console.log(`\nQuery: "${query}"\n`);
    console.log('Top 3 Results:');
    console.log('─────────────────────────────────────────────────────────────');

    const results = await semanticSearch(embedder, query, CORPUS, 3);

    results.forEach((result, rank) => {
      console.log(`${rank + 1}. [${formatScore(result.score)}] ${result.text}`);
    });

    console.log();
  }
}

/**
 * Displays a similarity matrix for a subset of sentences.
 */
async function runSimilarityMatrixDemo(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                  SIMILARITY MATRIX DEMO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const embedder = await createEmbedder();

  // Use a smaller subset for readability
  const subset = [
    "I love traveling to exotic destinations and exploring new cultures.",
    "The best vacation spots are usually near beaches or mountains.",
    "Machine learning models require large amounts of training data.",
    "Neural networks can learn complex patterns from examples.",
    "Paris is known as the city of lights and love."
  ];

  console.log('Computing pairwise similarities for 5 sentences...\n');

  const matrix = await similarityMatrix(embedder, subset);

  // Display matrix with labels
  console.log('Sentences:');
  subset.forEach((text, i) => {
    console.log(`S${i + 1}: ${text.slice(0, 60)}${text.length > 60 ? '...' : ''}`);
  });

  console.log('\nSimilarity Matrix (range: 0.00 to 1.00):');
  console.log('─────────────────────────────────────────────────────────────');

  // Header row
  console.log('      ' + subset.map((_, i) => `  S${i + 1} `).join(''));

  // Data rows
  matrix.forEach((row, i) => {
    const rowStr = row.map(val => formatScore(val)).join('  ');
    console.log(`S${i + 1}    ${rowStr}`);
  });

  console.log();
  console.log('Interpretation:');
  console.log('  • 1.00 = identical (diagonal)');
  console.log('  • 0.70-0.99 = very similar');
  console.log('  • 0.40-0.69 = somewhat similar');
  console.log('  • 0.00-0.39 = dissimilar');
  console.log();
}

/**
 * Main demo function.
 */
async function main(): Promise<void> {
  try {
    await runSemanticSearchDemo();
    await runSimilarityMatrixDemo();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Demo complete! Try modifying CORPUS or QUERIES in src/demo.ts');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demo:', error);
    process.exit(1);
  }
}

main();
