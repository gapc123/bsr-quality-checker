import prisma from '../db/client.js';
import { Evidence } from '../schemas/llm-output.js';

/**
 * Evidence Verification Service
 *
 * Verifies that AI-generated evidence quotes actually exist in source documents
 * Helps prevent hallucination by checking citations against actual document content
 */

/**
 * Calculate similarity between two strings using simple approach
 * Returns value between 0 (no match) and 1 (perfect match)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/\s+/g, ' ').trim();
  const s2 = str2.toLowerCase().replace(/\s+/g, ' ').trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // Check if quote is contained in source
  if (s2.includes(s1)) return 0.95;
  if (s1.includes(s2)) return 0.90;

  // Calculate overlap percentage
  const words1 = s1.split(' ');
  const words2 = new Set(s2.split(' '));
  const matchingWords = words1.filter(word => words2.has(word)).length;

  return matchingWords / Math.max(words1.length, 1);
}

/**
 * Verify a single evidence quote against document chunks
 */
export async function verifyEvidence(
  evidence: Evidence,
  packVersionId: string
): Promise<{
  verified: boolean;
  confidence: number;
  matchedChunkId: string | null;
  reason: string;
}> {
  try {
    // Find the document by name
    const document = await prisma.document.findFirst({
      where: {
        packVersionId,
        filename: {
          contains: evidence.docName,
        },
      },
      include: {
        chunks: true,
      },
    });

    if (!document) {
      return {
        verified: false,
        confidence: 0,
        matchedChunkId: null,
        reason: `Document "${evidence.docName}" not found in pack`,
      };
    }

    // If page is specified, filter chunks to that page
    let chunks = document.chunks;
    if (evidence.page !== null) {
      chunks = chunks.filter(
        (chunk) => chunk.pageRef === evidence.page
      );

      if (chunks.length === 0) {
        return {
          verified: false,
          confidence: 0,
          matchedChunkId: null,
          reason: `Page ${evidence.page} not found in document`,
        };
      }
    }

    // Find best matching chunk
    let bestMatch = { chunkId: '', similarity: 0 };

    for (const chunk of chunks) {
      const similarity = calculateSimilarity(evidence.quote, chunk.text);

      if (similarity > bestMatch.similarity) {
        bestMatch = { chunkId: chunk.id, similarity };
      }
    }

    // Threshold for verification
    const VERIFICATION_THRESHOLD = 0.7;

    if (bestMatch.similarity >= VERIFICATION_THRESHOLD) {
      return {
        verified: true,
        confidence: bestMatch.similarity,
        matchedChunkId: bestMatch.chunkId,
        reason: `Quote verified with ${(bestMatch.similarity * 100).toFixed(1)}% confidence`,
      };
    }

    return {
      verified: false,
      confidence: bestMatch.similarity,
      matchedChunkId: null,
      reason: `Quote similarity too low (${(bestMatch.similarity * 100).toFixed(1)}%)`,
    };
  } catch (error) {
    console.error('Evidence verification error:', error);
    return {
      verified: false,
      confidence: 0,
      matchedChunkId: null,
      reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify all evidence items for an issue
 */
export async function verifyIssueEvidence(
  evidence: Evidence[],
  packVersionId: string
): Promise<{
  allVerified: boolean;
  verifiedCount: number;
  totalCount: number;
  results: Array<{ evidence: Evidence; verification: Awaited<ReturnType<typeof verifyEvidence>> }>;
}> {
  const results = await Promise.all(
    evidence.map(async (ev) => ({
      evidence: ev,
      verification: await verifyEvidence(ev, packVersionId),
    }))
  );

  const verifiedCount = results.filter((r) => r.verification.verified).length;

  return {
    allVerified: verifiedCount === evidence.length,
    verifiedCount,
    totalCount: evidence.length,
    results,
  };
}

/**
 * Verify citation page number exists in document
 */
export async function verifyCitation(
  docName: string,
  page: number | null,
  packVersionId: string
): Promise<{ valid: boolean; reason: string }> {
  try {
    const document = await prisma.document.findFirst({
      where: {
        packVersionId,
        filename: {
          contains: docName,
        },
      },
      include: {
        chunks: {
          select: { pageRef: true },
        },
      },
    });

    if (!document) {
      return {
        valid: false,
        reason: `Document "${docName}" not found`,
      };
    }

    if (page === null) {
      return {
        valid: true,
        reason: 'No specific page cited',
      };
    }

    const hasPage = document.chunks.some((chunk) => chunk.pageRef === page);

    if (!hasPage) {
      const maxPage = Math.max(
        ...document.chunks.map((c) => c.pageRef || 0)
      );
      return {
        valid: false,
        reason: `Page ${page} not found (document has ${maxPage} pages)`,
      };
    }

    return {
      valid: true,
      reason: `Page ${page} exists in document`,
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}
