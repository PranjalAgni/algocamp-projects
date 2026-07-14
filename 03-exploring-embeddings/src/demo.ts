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
 * Formats a similarity score into a fixed-width cell for the matrix.
 * Cosine similarity ranges over [-1, 1], so a negative value ("-0.02") is
 * one character wider than a positive one ("0.02"). Right-padding every cell
 * to a common width keeps the columns aligned regardless of sign.
 */
const MATRIX_CELL_WIDTH = 5; // fits "-1.00"
function formatMatrixCell(score: number): string {
  return score.toFixed(2).padStart(MATRIX_CELL_WIDTH);
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

  console.log('\nSimilarity Matrix (cosine similarity, range: -1.00 to 1.00):');
  console.log('─────────────────────────────────────────────────────────────');

  // Each cell is right-aligned to a fixed width and separated by two spaces,
  // so header labels sit directly over their columns and negative values
  // (one char wider than positives) do not shift the grid.
  const rowLabelWidth = 4; // "S1" plus padding, matches the data-row prefix
  const gap = '  ';

  // Header row: blank row-label cell, then a right-aligned "Sn" per column.
  const header =
    ' '.repeat(rowLabelWidth) +
    subset.map((_, i) => `S${i + 1}`.padStart(MATRIX_CELL_WIDTH)).join(gap);
  console.log(header);

  // Data rows
  matrix.forEach((row, i) => {
    const rowStr = row.map(val => formatMatrixCell(val)).join(gap);
    console.log(`S${i + 1}`.padEnd(rowLabelWidth) + rowStr);
  });

  console.log();
  console.log('Interpretation:');
  console.log('  • 1.00 = identical (diagonal)');
  console.log('  • 0.70-0.99 = very similar');
  console.log('  • 0.40-0.69 = somewhat similar');
  console.log('  • 0.00-0.39 = dissimilar');
  console.log('  • below 0.00 = pointing apart (unrelated)');
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
