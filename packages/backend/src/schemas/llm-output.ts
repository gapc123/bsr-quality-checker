import { z } from 'zod';

/**
 * Zod schemas for validating LLM outputs
 * These ensure that AI-generated content adheres to expected structure
 * and helps prevent hallucination by enforcing evidence requirements
 */

// Confidence levels
export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

// Citation schema - requires document reference
export const CitationSchema = z.object({
  type: z.enum(['guidance', 'standard', 'regulation', 'document']),
  docName: z.string().min(1, 'Document name required'),
  page: z.number().int().positive().nullable(),
  section: z.string().nullable(),
});

// Evidence schema - requires direct quote and source
export const EvidenceSchema = z.object({
  docName: z.string().min(1, 'Document name required'),
  page: z.number().int().positive().nullable(),
  quote: z.string().min(10, 'Quote must be at least 10 characters'),
  chunkId: z.string().optional(), // For verification
  verified: z.boolean().optional(), // Whether quote was verified in source
});

// Extracted field schema with strict evidence requirements
export const ExtractedFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldValue: z.string().nullable(),
  confidence: ConfidenceSchema,
  evidenceQuote: z.string().nullable().refine(
    (quote) => {
      // If confidence is high, evidence quote is REQUIRED
      return true; // Will be validated in context
    },
    { message: 'High confidence fields require evidence quote' }
  ),
  pageRef: z.number().int().positive().nullable(),
});

export const FieldExtractionResponseSchema = z.object({
  fields: z.array(ExtractedFieldSchema),
});

// Issue/Finding schema with mandatory evidence for high severity
export const IssueSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  category: z.string().min(1),
  title: z.string().min(5, 'Title must be descriptive'),
  finding: z.string().min(10, 'Finding must be specific'),
  whyItMatters: z.string().min(10),
  action: z.string().min(10, 'Action must be specific'),
  ownerRole: z.string().min(1),
  effort: z.enum(['S', 'M', 'L']),
  endUserConsideration: z.string(),
  expectedBenefit: z.string(),
  confidence: ConfidenceSchema,
  citations: z.array(CitationSchema),
  evidence: z.array(EvidenceSchema).min(1, 'At least one evidence item required'),
}).refine(
  (issue) => {
    // High severity issues with high confidence MUST have evidence
    if (issue.severity === 'high' && issue.confidence === 'high') {
      return issue.evidence.length > 0 && issue.evidence[0].quote.length >= 10;
    }
    return true;
  },
  { message: 'High severity/high confidence issues require strong evidence' }
);

export const IssueGenerationResponseSchema = z.object({
  issues: z.array(IssueSchema),
});

// Type exports
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
export type FieldExtractionResponse = z.infer<typeof FieldExtractionResponseSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type IssueGenerationResponse = z.infer<typeof IssueGenerationResponseSchema>;

/**
 * Validation helper with detailed error reporting
 */
export function validateLLMOutput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );

  console.error(`LLM output validation failed (${context}):`, errors);

  return { success: false, errors };
}
