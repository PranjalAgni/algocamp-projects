/**
 * Demo: side-by-side comparison of naive vs advanced RAG
 */

import 'dotenv/config';
import { loadDocuments } from './document-loader.js';
import { denseRetrieval } from './dense-retrieval.js';
import { sparseRetrieval } from './sparse-retrieval.js';
import { reciprocalRankFusion } from './hybrid-retrieval.js';
import { expandQuery } from './query-processing.js';
import { heuristicRerank } from './reranking.js';
import { generateAnswer } from './generator.js';
import { filterByMetadata } from './metadata-filter.js';

// Print mode banner
const mode = process.env.OPENAI_API_KEY ? 'LIVE' : 'MOCK — no OPENAI_API_KEY';
console.log(`\n${'='.repeat(60)}`);
console.log(`MODE: ${mode}`);
console.log(`${'='.repeat(60)}\n`);

async function main() {
  // Load corpus
  const documents = loadDocuments();
  console.log(`Loaded ${documents.length} documents from corpus\n`);

  // Demo Query
  const query = 'How do I request time off?';
  console.log(`Query: "${query}"\n`);

  // ━━━ NAIVE RETRIEVAL ━━━
  console.log('━━━ NAIVE RETRIEVAL ━━━');
  console.log('(Pure semantic search, top 3)\n');

  const naiveResults = await denseRetrieval(query, documents, 3);
  naiveResults.forEach((result, i) => {
    console.log(
      `${i + 1}. ${result.document.metadata.title} (score: ${result.score.toFixed(3)})`
    );
  });

  console.log('\n');

  // ━━━ ADVANCED RETRIEVAL ━━━
  console.log('━━━ ADVANCED RETRIEVAL ━━━\n');

  // Step 1: Query Expansion
  console.log('Step 1: Query Expansion');
  const expansion = expandQuery(query);
  console.log(`Original: "${expansion.original}"`);
  console.log(`Expanded: "${expansion.expanded}"`);
  if (expansion.addedTerms.length > 0) {
    console.log(`Added terms: ${expansion.addedTerms.join(', ')}`);
  }
  console.log('');

  // Step 2: Hybrid Retrieval
  console.log('Step 2: Hybrid Retrieval (Dense + Sparse + RRF)');
  const denseResults = await denseRetrieval(expansion.expanded, documents, 10);
  const sparseResults = sparseRetrieval(expansion.expanded, documents, 10);
  const hybridResults = reciprocalRankFusion([denseResults, sparseResults]).slice(0, 3);

  hybridResults.forEach((result, i) => {
    console.log(
      `${i + 1}. ${result.document.metadata.title} (RRF score: ${result.score.toFixed(3)})`
    );
  });
  console.log('');

  // Step 3: Reranking
  console.log('Step 3: Reranking (Heuristic)');
  const rerankedResults = heuristicRerank(query, hybridResults).slice(0, 3);

  rerankedResults.forEach((result, i) => {
    console.log(
      `${i + 1}. ${result.document.metadata.title} (rerank score: ${result.score.toFixed(3)})`
    );
  });
  console.log('');

  // Step 4: Generate Answer
  console.log('Final Answer:');
  const answer = await generateAnswer(query, rerankedResults);
  console.log(`"${answer}"`);
  console.log('\n');

  // ━━━ METADATA FILTERING DEMO ━━━
  console.log('━━━ METADATA FILTERING DEMO ━━━\n');

  const filterQuery = 'What are the security guidelines?';
  console.log(`Query: "${filterQuery}"`);
  console.log('Filter: department=Engineering\n');

  const filteredDocs = filterByMetadata(documents, { department: 'Engineering' });
  console.log(`Filtered to ${filteredDocs.length} documents:`);
  filteredDocs.forEach(doc => {
    console.log(`  - ${doc.metadata.title}`);
  });

  const filteredResults = await denseRetrieval(filterQuery, filteredDocs, 3);
  console.log('\nTop result:');
  console.log(
    `  ${filteredResults[0].document.metadata.title} (score: ${filteredResults[0].score.toFixed(3)})`
  );

  console.log('\n' + '='.repeat(60));
  console.log('Demo complete!');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
