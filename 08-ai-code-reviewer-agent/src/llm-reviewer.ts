/**
 * LLM Reviewer - the contextual half of the review (the linter is the other half)
 *
 * Supports multiple providers with automatic fallback:
 * 1. OpenAI (gpt-4o-mini) if OPENAI_API_KEY is set
 * 2. Anthropic (claude-3-5-haiku) if ANTHROPIC_API_KEY is set
 * 3. Mock mode (deterministic canned responses) if no keys
 */

import type { ParsedDiff, ReviewComment } from './types.js';
import { getAddedLines } from './parser.js';

/**
 * LLM provider types
 */
type LLMProvider = 'openai' | 'anthropic' | 'mock';

/**
 * Detect which LLM provider to use based on environment variables
 */
export function detectProvider(): LLMProvider {
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  return 'mock';
}

/**
 * Format diff content for LLM prompt
 */
function formatDiffForPrompt(parsedDiff: ParsedDiff): string {
  let formatted = '';

  for (const file of parsedDiff.files) {
    formatted += `\nFile: ${file.path}\n`;
    formatted += '─'.repeat(50) + '\n';

    for (const hunk of file.hunks) {
      formatted += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;

      for (const line of hunk.lines) {
        const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
        const lineNum = line.newLineNumber ?? line.oldLineNumber ?? '?';
        formatted += `${prefix} L${lineNum}: ${line.content}\n`;
      }
    }
  }

  return formatted;
}

/**
 * Review using OpenAI gpt-4o-mini
 */
async function reviewWithOpenAI(parsedDiff: ParsedDiff): Promise<ReviewComment[]> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const diffContent = formatDiffForPrompt(parsedDiff);

  const prompt = `You are a code reviewer. Analyze the following code changes and identify issues.

Focus on:
- Logic errors and edge cases
- Security vulnerabilities
- Performance problems
- Code clarity and maintainability
- Potential bugs

Return a JSON array of findings. Each finding should have:
- file: string (file path)
- line: number (line number in new file)
- severity: "error" | "warning" | "info"
- message: string (what's wrong)
- suggestion: string (how to fix, optional)

Diff:
${diffContent}

Return ONLY valid JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Parse response - OpenAI JSON mode wraps array in object
    const parsed = JSON.parse(content);
    const findings = Array.isArray(parsed) ? parsed : (parsed.findings || []);

    return findings.map((finding: any) => ({
      file: finding.file || '',
      line: finding.line || 0,
      severity: finding.severity || 'info',
      message: finding.message || '',
      suggestion: finding.suggestion,
      source: 'llm' as const
    }));
  } catch (error) {
    console.error('OpenAI API error:', error);
    return [];
  }
}

/**
 * Review using Anthropic Claude
 */
async function reviewWithAnthropic(parsedDiff: ParsedDiff): Promise<ReviewComment[]> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const diffContent = formatDiffForPrompt(parsedDiff);

  const prompt = `You are a code reviewer. Analyze the following code changes and identify issues.

Focus on:
- Logic errors and edge cases
- Security vulnerabilities
- Performance problems
- Code clarity and maintainability
- Potential bugs

Return a JSON array of findings. Each finding should have:
- file: string (file path)
- line: number (line number in new file)
- severity: "error" | "warning" | "info"
- message: string (what's wrong)
- suggestion: string (how to fix, optional)

Diff:
${diffContent}

Return ONLY valid JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return [];
    }

    // Parse response
    const findings = JSON.parse(content.text);

    return (Array.isArray(findings) ? findings : []).map((finding: any) => ({
      file: finding.file || '',
      line: finding.line || 0,
      severity: finding.severity || 'info',
      message: finding.message || '',
      suggestion: finding.suggestion,
      source: 'llm' as const
    }));
  } catch (error) {
    console.error('Anthropic API error:', error);
    return [];
  }
}

/**
 * Mock reviewer - returns deterministic canned responses for sample diffs
 */
function reviewWithMock(parsedDiff: ParsedDiff): ReviewComment[] {
  const comments: ReviewComment[] = [];

  // Match against known sample diffs and return pre-written comments
  for (const file of parsedDiff.files) {
    const addedLines = getAddedLines({ files: [file] });

    // Sample 1: auth.ts - Missing await and error handling
    if (file.path.includes('auth.ts')) {
      const fetchLine = addedLines.find(l => l.content.includes('fetch('));
      if (fetchLine && !fetchLine.content.includes('await')) {
        comments.push({
          file: file.path,
          line: fetchLine.line,
          severity: 'error',
          message: 'Missing await on fetch() call - will return a Promise instead of Response',
          suggestion: 'Add await keyword: const response = await fetch(...)',
          source: 'llm'
        });
      }

      // Check for error handling
      const hasErrorHandling = addedLines.some(l =>
        l.content.includes('try') || l.content.includes('catch') || l.content.includes('throw')
      );
      if (!hasErrorHandling) {
        comments.push({
          file: file.path,
          line: addedLines[0]?.line || 1,
          severity: 'warning',
          message: 'No error handling for network request - fetch() can fail',
          suggestion: 'Wrap in try-catch block or add .catch() handler',
          source: 'llm'
        });
      }
    }

    // Sample 2: user-handler.js - Unused variable
    if (file.path.includes('user-handler.js')) {
      const timestampLine = addedLines.find(l => l.content.includes('timestamp') && l.content.includes('Date.now'));
      if (timestampLine) {
        // Check if timestamp is used elsewhere
        const timestampUsed = addedLines.some(l =>
          l.line !== timestampLine.line && l.content.includes('timestamp')
        );
        if (!timestampUsed) {
          comments.push({
            file: file.path,
            line: timestampLine.line,
            severity: 'warning',
            message: 'Variable "timestamp" is declared but never used',
            suggestion: 'Remove unused variable or use it in the update operation',
            source: 'llm'
          });
        }
      }

      // Check for null/undefined handling
      const hasNullCheck = addedLines.some(l => l.content.includes('!= null'));
      if (hasNullCheck) {
        comments.push({
          file: file.path,
          line: addedLines.find(l => l.content.includes('!= null'))?.line || 1,
          severity: 'info',
          message: 'Consider more specific error handling for null/undefined cases',
          suggestion: 'Add else branch to handle null case or throw descriptive error',
          source: 'llm'
        });
      }
    }
  }

  return comments;
}

/**
 * Main entry point - review a diff using the appropriate provider
 */
export async function reviewWithLLM(parsedDiff: ParsedDiff): Promise<ReviewComment[]> {
  const provider = detectProvider();

  switch (provider) {
    case 'openai':
      return reviewWithOpenAI(parsedDiff);
    case 'anthropic':
      return reviewWithAnthropic(parsedDiff);
    case 'mock':
      return reviewWithMock(parsedDiff);
  }
}

/**
 * Get current provider name for display
 */
export function getProviderName(): string {
  const provider = detectProvider();
  switch (provider) {
    case 'openai':
      return 'OpenAI gpt-4o-mini';
    case 'anthropic':
      return 'Anthropic claude-3-5-haiku';
    case 'mock':
      return 'MOCK — no API key';
  }
}
