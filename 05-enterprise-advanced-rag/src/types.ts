/**
 * Core types for the Enterprise Advanced RAG system
 */

export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[]; // Cached embedding vector
}

export interface DocumentMetadata {
  title: string;
  department: string;
  date: string; // ISO date string
  type: string; // policy, handbook, guide, etc.
}

export interface RetrievalResult {
  document: Document;
  score: number;
  method?: string; // dense, sparse, hybrid, reranked
}

export interface MetadataFilter {
  department?: string;
  type?: string;
  dateAfter?: string;
  dateBefore?: string;
}

export interface QueryExpansion {
  original: string;
  expanded: string;
  addedTerms: string[];
}
