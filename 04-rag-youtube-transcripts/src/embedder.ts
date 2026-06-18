/**
 * Text embedding with local models and hash fallback
 *
 * Primary: @xenova/transformers with all-MiniLM-L6-v2 (384-dim, fast)
 * Fallback: Deterministic hash-based embedder for offline tests
 */

// Global flag to force hash embedder (useful for tests)
let useHashEmbedder = false;

/**
 * Set whether to use the hash embedder
 * @param useHash - true to force hash embedder, false for auto-detection
 */
export function setUseHashEmbedder(useHash: boolean): void {
  useHashEmbedder = useHash;
}

/**
 * Deterministic hash-based embedder for testing
 * Creates a simple word frequency vector (not as good as neural embeddings,
 * but deterministic and works offline without model downloads)
 */
function hashEmbed(text: string): number[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = new Map<string, number>();

  // Count word frequencies
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Create a fixed-size vector (128 dimensions for speed)
  const dim = 128;
  const vector = new Array(dim).fill(0);

  // Hash each word to a dimension and accumulate frequencies
  for (const [word, freq] of wordFreq.entries()) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += freq;
  }

  // Normalize to unit length for cosine similarity
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  }

  return vector;
}

let transformersCache: any = null;

/**
 * Neural embedding using @xenova/transformers
 * Downloads model on first use (cached locally)
 */
async function transformersEmbed(text: string): Promise<number[]> {
  try {
    // Lazy load transformers to avoid loading in tests
    if (!transformersCache) {
      const { pipeline } = await import('@xenova/transformers');
      transformersCache = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    // Generate embedding
    const output = await transformersCache(text, { pooling: 'mean', normalize: true });

    // Convert to regular array
    return Array.from(output.data);
  } catch (error) {
    console.warn('Transformers.js failed, falling back to hash embedder:', error);
    return hashEmbed(text);
  }
}

/**
 * Main embedding function
 * Auto-selects between transformers.js and hash embedder
 * @param text - Text to embed
 * @returns Embedding vector
 */
export async function embed(text: string): Promise<number[]> {
  if (useHashEmbedder) {
    return hashEmbed(text);
  }

  // Try transformers, fall back to hash on error
  try {
    return await transformersEmbed(text);
  } catch (error) {
    console.warn('Using hash embedder due to error:', error);
    return hashEmbed(text);
  }
}

/**
 * Batch embed multiple texts (more efficient for large datasets)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  // For simplicity, just map over embed()
  // In production, you'd want true batching for transformers
  return Promise.all(texts.map(text => embed(text)));
}
