# Enterprise Advanced RAG - Research

## What is RAG?
Retrieval-Augmented Generation (RAG) is a technique that enhances LLM responses by retrieving relevant context from a knowledge base before generation. Instead of relying solely on the model's training data, RAG fetches pertinent documents to ground the answer.

## Naive RAG vs. Advanced RAG
**Naive RAG** typically:
1. Embeds the query
2. Finds nearest neighbors in a vector database
3. Returns top-K chunks directly to the LLM

**Problems:**
- Query phrasing mismatches document phrasing
- Pure semantic search misses exact keyword matches
- No consideration of document metadata (date, source, department)
- Top-K may include poor-quality or irrelevant chunks

**Advanced RAG** addresses these with:

### 1. Query Rewriting / Expansion
- **HyDE (Hypothetical Document Embeddings)**: Generate a hypothetical answer, embed it, search for similar docs
- **Query decomposition**: Break complex queries into sub-queries
- **Synonym expansion**: Add related terms to improve recall
- **Implementation choice**: We'll use synonym expansion (deterministic, no LLM needed)

### 2. Hybrid Retrieval
Combine multiple retrieval methods:
- **Dense retrieval**: Embedding-based semantic similarity (captures meaning)
- **Sparse retrieval**: Keyword-based (BM25/TF-IDF) (captures exact matches)
- **Score fusion**: Reciprocal Rank Fusion (RRF) to merge rankings

**Why hybrid?** Query "What is the PTO policy?" benefits from keyword match on "PTO", while "How do I take time off?" needs semantic understanding.

### 3. Reranking
After retrieving candidates (10-20 docs), rerank with a more powerful model:
- **Cross-encoders**: Jointly encode query+doc, produce relevance score (more accurate than bi-encoders)
- **Heuristic rerankers**: Metadata-based (recency, source authority)
- **Implementation choice**: Try @xenova/transformers cross-encoder (e.g., ms-marco-MiniLM-L-6), fallback to heuristic

### 4. Metadata Filtering
Pre-filter or post-filter by:
- Document type (policy, wiki, ticket)
- Department (HR, Engineering, Sales)
- Date range (recent docs only)
- Access permissions (in real enterprise)

## Libraries Considered

### Embeddings
- **@xenova/transformers** (chosen): Runs locally, all-MiniLM-L6-v2 ~80MB, no API key
- Fallback: hash-based embeddings for deterministic tests

### Sparse Retrieval
- **BM25 libraries**: natural (outdated), wink-bm25 (limited)
- **Choice**: Implement simple TF-IDF + BM25-like scoring from scratch (educational)

### Reranking
- **@xenova/transformers**: Can load cross-encoder models (e.g., cross-encoder/ms-marco-MiniLM-L-6-v2)
- **Fallback**: Heuristic reranker based on metadata + query term overlap

### Vector Storage
- **In-memory arrays**: Sufficient for learning (10-20 docs)
- Production would use: Pinecone, Weaviate, Qdrant, or pgvector

### Generation
- **OpenAI API** (live mode with OPENAI_API_KEY)
- **Mock mode**: Extractive QA (return most relevant sentence from top doc)

## Practical Assumptions
1. **Small corpus**: 10-15 fictional company documents (policies, handbooks, FAQs)
2. **Bundled docs**: Stored as .md/.txt in `/corpus` with JSON metadata
3. **Offline-first**: All retrieval works without network; only generation needs API key
4. **Focus on contrast**: Demo shows naive vs. advanced side-by-side
5. **Educational code**: Comments explain each technique's purpose

## Key References
- "Precise Zero-Shot Dense Retrieval without Relevance Labels" (HyDE paper, Gao et al.)
- "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al., 2020)
- "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods" (Cormack et al., 2009)
- Pinecone's RAG guides: https://www.pinecone.io/learn/retrieval-augmented-generation/
- LangChain retrieval docs: https://python.langchain.com/docs/concepts/retrieval/

## Success Metrics for This Project
- Naive retrieval returns semantically close but not best docs
- Query expansion improves recall
- Hybrid retrieval catches both keyword + semantic matches
- Reranking moves most relevant doc to #1
- Metadata filtering correctly excludes non-matching docs
- Tests pass offline
- Demo runs without API key (mock mode)
