/**
 * Vector Embeddings Service
 *
 * Generates embeddings using OpenAI text-embedding-3-small
 * Includes caching to avoid recomputation and rate limit handling
 *
 * TASK #19: Week 2 - Vector Embeddings
 */

import OpenAI from 'openai';
import type { DocumentChunk } from './document-chunker.js';

export interface ChunkEmbedding {
  chunk_id: string;
  embedding: number[]; // 1536-dimensional vector for text-embedding-3-small
  text: string;
  page_number: number;
  document_name: string;
  doc_type: string | null;
  section_context: string | null;
}

// In-memory cache for embeddings (will be replaced with DB later)
const embeddingCache = new Map<string, number[]>();

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required for vector embeddings. ' +
      'Please set it in your .env file.'
    );
  }

  return new OpenAI({ apiKey });
}

/**
 * Generate embedding for a single text chunk
 * Uses text-embedding-3-small (1536 dimensions, cost-effective)
 */
async function generateEmbedding(
  text: string,
  client: OpenAI,
  retries = 3
): Promise<number[]> {
  // Check cache first
  const cacheKey = text.substring(0, 100); // Use first 100 chars as key
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      const embedding = response.data[0].embedding;

      // Cache the result
      embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error: any) {
      // Handle rate limits with exponential backoff
      if (error?.status === 429 && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`  ⚠️  Rate limited, waiting ${waitTime}ms before retry ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle other errors
      console.error(`Error generating embedding (attempt ${attempt}/${retries}):`, error);

      if (attempt === retries) {
        throw new Error(`Failed to generate embedding after ${retries} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('Failed to generate embedding');
}

/**
 * Generate embeddings for multiple chunks in batches
 * Batch size: 100 chunks at a time (OpenAI limit is 2048)
 */
export async function generateEmbeddings(
  chunks: DocumentChunk[]
): Promise<ChunkEmbedding[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[VECTOR EMBEDDINGS] Generating embeddings for ${chunks.length} chunks`);
  console.log(`${'='.repeat(60)}\n`);

  const client = getOpenAIClient();
  const BATCH_SIZE = 100; // Process 100 chunks at a time
  const embeddings: ChunkEmbedding[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

    console.log(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    // Generate embeddings for batch (in parallel)
    const batchEmbeddings = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk.text, client);
        return {
          chunk_id: chunk.chunk_id,
          embedding,
          text: chunk.text,
          page_number: chunk.page_number,
          document_name: chunk.document_name,
          doc_type: chunk.doc_type,
          section_context: chunk.section_context
        };
      })
    );

    embeddings.push(...batchEmbeddings);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[EMBEDDINGS COMPLETE]`);
  console.log(`  Total embeddings: ${embeddings.length}`);
  console.log(`  Vector dimensions: ${embeddings[0]?.embedding.length || 0}`);
  console.log(`  Cache size: ${embeddingCache.size}`);
  console.log(`${'='.repeat(60)}\n`);

  return embeddings;
}

/**
 * Generate embedding for a single query string
 * Used for semantic search
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const client = getOpenAIClient();
  return generateEmbedding(query, client);
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (higher = more similar)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Clear embedding cache (for testing or memory management)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
  console.log('✓ Embedding cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: embeddingCache.size,
    keys: Array.from(embeddingCache.keys())
  };
}
