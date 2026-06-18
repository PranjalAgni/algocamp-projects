#!/usr/bin/env node
/**
 * AI Code Reviewer Agent - Main Entry Point
 *
 * Reviews git diffs and provides structured feedback combining:
 * - Deterministic linter rules (no API needed)
 * - LLM-based contextual review (OpenAI/Anthropic/Mock)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { parseDiff } from './parser.js';
import { runLinter } from './linter.js';
import { reviewWithLLM, getProviderName } from './llm-reviewer.js';
import { formatJSON, formatPretty, calculateSummary } from './formatter.js';
import type { ReviewResult } from './types.js';

// Load environment variables from .env file
dotenv.config();

// Get current directory (ESM workaround for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

/**
 * Parse command line arguments
 */
interface CliArgs {
  sampleName?: string;
  filePath?: string;
  jsonOutput: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    jsonOutput: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--json') {
      result.jsonOutput = true;
    } else if (arg === '--file') {
      result.filePath = args[++i];
    } else if (!arg.startsWith('-')) {
      result.sampleName = arg;
    }
  }

  return result;
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
AI Code Reviewer Agent

Usage:
  npm run demo                    Review sample1-auth.diff
  npm run demo -- sample2         Review sample2-user.diff
  npm run demo -- --file path.diff Review custom diff file
  npm run demo -- --json          Output JSON format only
  npm run demo -- --help          Show this help

Environment Variables:
  OPENAI_API_KEY      OpenAI API key (optional)
  ANTHROPIC_API_KEY   Anthropic API key (optional)

If no API keys are set, runs in MOCK mode with deterministic responses.
`);
}

/**
 * Load diff file content
 */
function loadDiffFile(args: CliArgs): string {
  let diffPath: string;

  if (args.filePath) {
    // Custom file path
    diffPath = args.filePath;
  } else {
    // Sample diff (default: sample1)
    const sampleName = args.sampleName || 'sample1';

    // If it already ends with .diff, use as-is
    if (sampleName.endsWith('.diff')) {
      diffPath = join(PROJECT_ROOT, 'samples', sampleName);
    } else {
      // Map sample names to full filenames
      const sampleMap: Record<string, string> = {
        'sample1': 'sample1-auth.diff',
        'sample2': 'sample2-user.diff'
      };

      const sampleFile = sampleMap[sampleName] || `${sampleName}.diff`;
      diffPath = join(PROJECT_ROOT, 'samples', sampleFile);
    }
  }

  try {
    return readFileSync(diffPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading diff file: ${diffPath}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Main review function
 */
async function reviewDiff(diffContent: string): Promise<ReviewResult> {
  // Step 1: Parse diff
  const parsedDiff = parseDiff(diffContent);

  if (parsedDiff.files.length === 0) {
    console.warn('Warning: No files found in diff');
  }

  // Step 2: Run linter (deterministic, always runs)
  const linterComments = runLinter(parsedDiff);

  // Step 3: Run LLM reviewer (may be mock)
  const llmComments = await reviewWithLLM(parsedDiff);

  // Step 4: Combine results
  const allComments = [...linterComments, ...llmComments];

  // Step 5: Calculate summary
  const summary = calculateSummary(allComments, parsedDiff.files.length);

  return {
    comments: allComments,
    summary
  };
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  // Load diff file
  const diffContent = loadDiffFile(args);

  // Run review
  const result = await reviewDiff(diffContent);

  // Get provider name for mode banner
  const providerName = getProviderName();

  // Output results
  if (args.jsonOutput) {
    console.log(formatJSON(result));
  } else {
    console.log(formatPretty(result, providerName));
  }

  // Exit with error code if there are errors
  if (result.summary.errors > 0) {
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
