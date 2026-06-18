/**
 * Document loader: reads corpus files and metadata
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Document, DocumentMetadata } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CORPUS_DIR = join(__dirname, '../corpus');

/**
 * Load all documents from the corpus directory
 */
export function loadDocuments(): Document[] {
  // Read metadata
  const metadataPath = join(CORPUS_DIR, 'metadata.json');
  const metadataMap = JSON.parse(readFileSync(metadataPath, 'utf-8')) as Record<string, DocumentMetadata>;

  // Read all .md files
  const files = readdirSync(CORPUS_DIR).filter(f => f.endsWith('.md'));

  const documents: Document[] = files.map(filename => {
    const content = readFileSync(join(CORPUS_DIR, filename), 'utf-8');
    const metadata = metadataMap[filename];

    if (!metadata) {
      throw new Error(`Missing metadata for ${filename}`);
    }

    return {
      id: filename.replace('.md', ''),
      content,
      metadata,
    };
  });

  return documents;
}
