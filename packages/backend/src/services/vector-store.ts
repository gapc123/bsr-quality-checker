/**
 * In-Memory Vector Store
 *
 * Simple vector database for semantic search using cosine similarity.
 * Start simple, migrate to pg_vector or Pinecone later for production.
 *
 * TASK #20: Week 2 - Vector Store
 */

import type { ChunkEmbedding } from './vector-embeddings.js';
import { cosineSimilarity, generateQueryEmbedding } from './vector-embeddings.js';

export interface SearchResult {
  chunk_id: string;
  text: string;
  page_number: number;
  document_name: string;
  doc_type: string | null;
  section_context: string | null;
  similarity_score: number; // 0-1, higher = more relevant
}

export interface SearchOptions {
  top_k?: number;              // Number of results to return (default: 5)
  min_similarity?: number;     // Minimum similarity threshold (default: 0.7)
  filter_documents?: string[]; // Only search in these documents
  filter_doc_types?: string[]; // Only search in these doc types
}

/**
 * In-memory vector store
 */
export class VectorStore {
  private embeddings: ChunkEmbedding[] = [];
  private indexedAt: Date | null = null;

  /**
   * Index document chunks with their embeddings
   */
  async index(embeddings: ChunkEmbedding[]): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[VECTOR STORE] Indexing ${embeddings.length} chunks`);
    console.log(`${'='.repeat(60)}\n`);

    this.embeddings = embeddings;
    this.indexedAt = new Date();

    // Group by document for stats
    const docCounts = new Map<string, number>();
    for (const emb of embeddings) {
      docCounts.set(
        emb.document_name,
        (docCounts.get(emb.document_name) || 0) + 1
      );
    }

    console.log(`  ✓ Indexed ${embeddings.length} chunks from ${docCounts.size} documents`);
    for (const [doc, count] of docCounts.entries()) {
      console.log(`    - ${doc}: ${count} chunks`);
    }

    console.log(`  ✓ Vector dimensions: ${embeddings[0]?.embedding.length || 0}`);
    console.log(`  ✓ Index created at: ${this.indexedAt.toISOString()}\n`);
  }

  /**
   * Semantic search for relevant chunks
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      top_k = 5,
      min_similarity = 0.7,
      filter_documents,
      filter_doc_types
    } = options;

    if (this.embeddings.length === 0) {
      throw new Error('Vector store is empty. Call index() first.');
    }

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Calculate similarities for all chunks
    const results: SearchResult[] = [];

    for (const chunk of this.embeddings) {
      // Apply filters
      if (filter_documents && !filter_documents.includes(chunk.document_name)) {
        continue;
      }

      if (filter_doc_types && chunk.doc_type && !filter_doc_types.includes(chunk.doc_type)) {
        continue;
      }

      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      // Apply minimum threshold
      if (similarity >= min_similarity) {
        results.push({
          chunk_id: chunk.chunk_id,
          text: chunk.text,
          page_number: chunk.page_number,
          document_name: chunk.document_name,
          doc_type: chunk.doc_type,
          section_context: chunk.section_context,
          similarity_score: similarity
        });
      }
    }

    // Sort by similarity (descending) and return top-k
    results.sort((a, b) => b.similarity_score - a.similarity_score);

    return results.slice(0, top_k);
  }

  /**
   * Multi-query search (useful for complex requirements)
   * Searches with multiple queries and deduplicates results
   */
  async multiSearch(
    queries: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const seenChunks = new Set<string>();

    for (const query of queries) {
      const results = await this.search(query, options);

      for (const result of results) {
        if (!seenChunks.has(result.chunk_id)) {
          seenChunks.add(result.chunk_id);
          allResults.push(result);
        }
      }
    }

    // Sort by similarity and return top-k
    allResults.sort((a, b) => b.similarity_score - a.similarity_score);
    return allResults.slice(0, options.top_k || 5);
  }

  /**
   * Get all chunks for a specific document
   */
  getDocumentChunks(documentName: string): ChunkEmbedding[] {
    return this.embeddings.filter(e => e.document_name === documentName);
  }

  /**
   * Get chunks by page number
   */
  getPageChunks(documentName: string, pageNumber: number): ChunkEmbedding[] {
    return this.embeddings.filter(
      e => e.document_name === documentName && e.page_number === pageNumber
    );
  }

  /**
   * Get store statistics
   */
  getStats(): {
    total_chunks: number;
    total_documents: number;
    documents: { name: string; chunks: number; pages: Set<number> }[];
    indexed_at: Date | null;
  } {
    const docMap = new Map<string, { chunks: number; pages: Set<number> }>();

    for (const emb of this.embeddings) {
      if (!docMap.has(emb.document_name)) {
        docMap.set(emb.document_name, { chunks: 0, pages: new Set() });
      }

      const doc = docMap.get(emb.document_name)!;
      doc.chunks++;
      doc.pages.add(emb.page_number);
    }

    const documents = Array.from(docMap.entries()).map(([name, data]) => ({
      name,
      chunks: data.chunks,
      pages: data.pages
    }));

    return {
      total_chunks: this.embeddings.length,
      total_documents: docMap.size,
      documents,
      indexed_at: this.indexedAt
    };
  }

  /**
   * Clear the store
   */
  clear(): void {
    this.embeddings = [];
    this.indexedAt = null;
    console.log('✓ Vector store cleared');
  }

  /**
   * Check if store is ready
   */
  isReady(): boolean {
    return this.embeddings.length > 0;
  }
}

// Singleton instance (will be replaced with proper DB later)
export const vectorStore = new VectorStore();
