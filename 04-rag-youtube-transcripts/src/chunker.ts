/**
 * Text chunking with overlap for RAG
 *
 * Splits long transcripts into smaller, overlapping chunks to balance:
 * - Relevance: smaller chunks are more focused and retrieve better
 * - Context: chunks need enough text to be meaningful
 * - Coverage: overlap prevents losing information at chunk boundaries
 */

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface Transcript {
  videoId: string;
  title: string;
  transcript: TranscriptSegment[];
}

export interface Chunk {
  id: string;
  text: string;
  videoId: string;
  title: string;
  timestamp: number;  // Start time in seconds
  chunkIndex: number;
}

/**
 * Chunks a transcript into overlapping segments
 * @param transcript - The transcript to chunk
 * @param chunkSize - Target size in characters (default: 400)
 * @param overlap - Overlap between chunks in characters (default: 100)
 * @returns Array of chunks with metadata
 */
export function chunkTranscript(
  transcript: Transcript,
  chunkSize: number = 400,
  overlap: number = 100
): Chunk[] {
  const chunks: Chunk[] = [];

  // First, concatenate all transcript segments with timing info
  const fullText = transcript.transcript.map(seg => seg.text).join(' ');

  // Build a mapping from character position to timestamp
  const charToTimestamp: number[] = [];
  let currentPos = 0;

  for (const segment of transcript.transcript) {
    const segmentText = segment.text + ' '; // Add space between segments
    for (let i = 0; i < segmentText.length; i++) {
      charToTimestamp[currentPos + i] = segment.start;
    }
    currentPos += segmentText.length;
  }

  // Now chunk with overlap
  let start = 0;
  let chunkIndex = 0;

  while (start < fullText.length) {
    const end = Math.min(start + chunkSize, fullText.length);
    const chunkText = fullText.slice(start, end).trim();

    // Skip empty chunks
    if (chunkText.length === 0) {
      break;
    }

    // Get timestamp for this chunk (use the start position)
    const timestamp = charToTimestamp[start] || 0;

    chunks.push({
      id: `${transcript.videoId}-chunk-${chunkIndex}`,
      text: chunkText,
      videoId: transcript.videoId,
      title: transcript.title,
      timestamp,
      chunkIndex,
    });

    chunkIndex++;

    // Move forward by (chunkSize - overlap) to create overlap
    start += chunkSize - overlap;

    // If we're near the end and would create a tiny chunk, just finish
    if (start + overlap >= fullText.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Format a timestamp in seconds as MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
