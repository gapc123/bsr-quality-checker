import prisma from '../db/client.js';
import { extractValidatedJSON } from './claude.js';
import { searchChunks } from './ingestion.js';
import {
  FIELD_EXTRACTION_SYSTEM_PROMPT,
  FIELD_EXTRACTION_USER_PROMPT,
} from '../prompts/extractFields.js';
import {
  ISSUE_GENERATION_SYSTEM_PROMPT,
  ISSUE_GENERATION_USER_PROMPT,
} from '../prompts/generateReport.js';
import {
  assessPackAgainstMatrix,
  determinePackContext,
  FullAssessment,
} from './matrix-assessment.js';
import {
  FieldExtractionResponseSchema,
  IssueGenerationResponseSchema,
  FieldExtractionResponse,
  IssueGenerationResponse,
} from '../schemas/llm-output.js';
import { verifyIssueEvidence } from './evidence-verifier.js';

type Confidence = 'high' | 'medium' | 'low';

// Extract fields from a single document
async function extractFieldsFromDocument(
  documentId: string
): Promise<FieldExtractionResponse> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: true },
  });

  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // Combine chunks into document content (limit to first ~50k chars for API)
  const content = document.chunks
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((c) => c.text)
    .join('\n')
    .slice(0, 50000);

  // Use validated extraction with schema
  const response = await extractValidatedJSON(
    FIELD_EXTRACTION_SYSTEM_PROMPT,
    FIELD_EXTRACTION_USER_PROMPT(content, document.filename),
    FieldExtractionResponseSchema
  );

  // Additional validation: high confidence requires evidence
  for (const field of response.fields) {
    if (field.confidence === 'high' && !field.evidenceQuote) {
      console.warn(
        `Field ${field.fieldName} has high confidence but no evidence quote - downgrading to medium`
      );
      field.confidence = 'medium';
    }
  }

  return response;
}

// Run full analysis on a pack version
export async function analyzePackVersion(packVersionId: string): Promise<void> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      documents: {
        include: { chunks: true },
      },
    },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  // Clear existing analysis data
  await prisma.extractedField.deleteMany({
    where: { packVersionId },
  });
  await prisma.issueAction.deleteMany({
    where: { packVersionId },
  });

  // Step 1: Extract fields from each document
  const allExtractedFields: Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: Confidence;
    evidenceDocumentId: string;
    evidencePageRef: number | null;
    evidenceQuote: string | null;
  }> = [];

  for (const document of packVersion.documents) {
    if (document.chunks.length === 0) continue; // Skip scanned docs

    try {
      const extraction = await extractFieldsFromDocument(document.id);

      for (const field of extraction.fields) {
        if (field.fieldValue) {
          allExtractedFields.push({
            fieldName: field.fieldName,
            fieldValue: field.fieldValue,
            confidence: field.confidence,
            evidenceDocumentId: document.id,
            evidencePageRef: field.pageRef,
            evidenceQuote: field.evidenceQuote,
          });
        }
      }
    } catch (error) {
      console.error(
        `Error extracting fields from ${document.filename}:`,
        error
      );
    }
  }

  // Store extracted fields
  for (const field of allExtractedFields) {
    await prisma.extractedField.create({
      data: {
        packVersionId,
        ...field,
      },
    });
  }

  // Step 2: Check consistency across documents
  const consistencyIssues = checkFieldConsistency(allExtractedFields);

  // Step 3: Get reference context from baseline/butler docs
  const referenceContext = await getReferencContext(allExtractedFields);

  // Step 4: Generate issues using Claude
  const issues = await generateIssues(
    packVersion,
    allExtractedFields,
    referenceContext
  );

  // Merge consistency issues
  const allIssues = [...consistencyIssues, ...issues];

  // Store issues
  for (const issue of allIssues) {
    await prisma.issueAction.create({
      data: {
        packVersionId,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        finding: issue.finding,
        whyItMatters: issue.whyItMatters,
        action: issue.action,
        ownerRole: issue.ownerRole,
        effort: issue.effort,
        endUserConsideration: issue.endUserConsideration,
        expectedBenefit: issue.expectedBenefit,
        confidence: issue.confidence,
        citations: JSON.stringify(issue.citations),
        evidence: JSON.stringify(issue.evidence),
      },
    });
  }
}

// Check for inconsistencies in extracted fields across documents
function checkFieldConsistency(
  fields: Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: Confidence;
    evidenceDocumentId: string;
    evidencePageRef: number | null;
    evidenceQuote: string | null;
  }>
): Array<{
  severity: string;
  category: string;
  title: string;
  finding: string;
  whyItMatters: string;
  action: string;
  ownerRole: string;
  effort: string;
  endUserConsideration: string;
  expectedBenefit: string;
  confidence: string;
  citations: Array<{ type: string; docName: string; page: number | null; section: string | null }>;
  evidence: Array<{ docName: string; page: number | null; quote: string }>;
}> {
  const issues: Array<{
    severity: string;
    category: string;
    title: string;
    finding: string;
    whyItMatters: string;
    action: string;
    ownerRole: string;
    effort: string;
    endUserConsideration: string;
    expectedBenefit: string;
    confidence: string;
    citations: Array<{ type: string; docName: string; page: number | null; section: string | null }>;
    evidence: Array<{ docName: string; page: number | null; quote: string }>;
  }> = [];

  // Group fields by name
  const fieldGroups = new Map<string, typeof fields>();
  for (const field of fields) {
    const existing = fieldGroups.get(field.fieldName) || [];
    existing.push(field);
    fieldGroups.set(field.fieldName, existing);
  }

  // Check each group for inconsistencies
  for (const [fieldName, groupFields] of fieldGroups) {
    if (groupFields.length <= 1) continue;

    const uniqueValues = new Set(
      groupFields.map((f) => f.fieldValue?.toLowerCase().trim())
    );

    if (uniqueValues.size > 1) {
      const values = groupFields
        .map((f) => f.fieldValue)
        .filter((v) => v)
        .join(', ');

      issues.push({
        severity: 'high',
        category: 'Consistency',
        title: `Inconsistent ${fieldName.replace(/_/g, ' ')}`,
        finding: `Multiple values found for ${fieldName.replace(/_/g, ' ')}: ${values}`,
        whyItMatters:
          'Inconsistent information across documents creates confusion and may delay review.',
        action: `Verify the correct ${fieldName.replace(/_/g, ' ')} and update all documents to reflect the same value.`,
        ownerRole: 'Principal Designer',
        effort: 'S',
        endUserConsideration:
          'Accurate building information is essential for safety planning.',
        expectedBenefit:
          'Clear, consistent documentation speeds up review and reduces queries.',
        confidence: 'high',
        citations: [],
        evidence: groupFields.map((f) => ({
          docName: f.evidenceDocumentId,
          page: f.evidencePageRef,
          quote: f.evidenceQuote || '',
        })),
      });
    }
  }

  return issues;
}

// Get relevant context from reference documents
async function getReferencContext(
  extractedFields: Array<{ fieldName: string; fieldValue: string | null }>
): Promise<string> {
  // Build keywords from extracted fields
  const keywords: string[] = [];

  for (const field of extractedFields) {
    if (field.fieldValue) {
      keywords.push(field.fieldValue);
    }
    // Add field-specific keywords
    switch (field.fieldName) {
      case 'evacuation_strategy':
        keywords.push('evacuation', 'escape', 'egress');
        break;
      case 'smoke_control':
        keywords.push('smoke', 'ventilation', 'extraction');
        break;
      case 'sprinkler_system':
        keywords.push('sprinkler', 'suppression');
        break;
      case 'external_wall_system':
        keywords.push('facade', 'cladding', 'external wall');
        break;
    }
  }

  // Search baseline and butler library docs
  const results = await searchChunks(keywords, ['baseline', 'butler']);

  // Format results as context
  return results
    .slice(0, 20) // Limit to 20 most relevant chunks
    .map((r) => `[${r.filename} p.${r.pageRef}]: ${r.text}`)
    .join('\n\n');
}

// Generate issues using Claude with validation and verification
async function generateIssues(
  packVersion: { id: string; documents: Array<{ filename: string; docType: string | null }> },
  extractedFields: Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: Confidence;
    evidenceDocumentId: string;
  }>,
  referenceContext: string
): Promise<IssueGenerationResponse['issues']> {
  const fieldsJson = JSON.stringify(
    extractedFields.map((f) => ({
      fieldName: f.fieldName,
      value: f.fieldValue,
      confidence: f.confidence,
    })),
    null,
    2
  );

  const docSummaries = packVersion.documents
    .map((d) => `- ${d.filename} (${d.docType || 'unclassified'})`)
    .join('\n');

  try {
    // Use validated extraction with schema
    const response = await extractValidatedJSON(
      ISSUE_GENERATION_SYSTEM_PROMPT,
      ISSUE_GENERATION_USER_PROMPT(
        fieldsJson,
        docSummaries,
        referenceContext || 'No reference documents available.'
      ),
      IssueGenerationResponseSchema,
      8192
    );

    // Verify evidence for all issues
    const verifiedIssues = [];

    for (const issue of response.issues) {
      // Verify evidence quotes exist in documents
      const verification = await verifyIssueEvidence(
        issue.evidence,
        packVersion.id
      );

      // Log verification results
      if (!verification.allVerified) {
        console.warn(
          `Issue "${issue.title}" has unverified evidence (${verification.verifiedCount}/${verification.totalCount} verified)`
        );

        // For high severity issues with low verification, downgrade or skip
        if (issue.severity === 'high' && verification.verifiedCount === 0) {
          console.warn(
            `Skipping high severity issue with no verified evidence: ${issue.title}`
          );
          continue;
        }

        // Downgrade confidence if evidence is weak
        if (issue.confidence === 'high' && verification.verifiedCount < verification.totalCount / 2) {
          issue.confidence = 'medium';
        }
      }

      verifiedIssues.push(issue);
    }

    console.log(
      `Generated ${verifiedIssues.length} issues (${response.issues.length - verifiedIssues.length} filtered for poor evidence)`
    );

    return verifiedIssues;
  } catch (error) {
    console.error('Error generating issues:', error);
    return [];
  }
}

/**
 * Run matrix-based assessment on a pack version
 */
export async function runMatrixAssessment(packVersionId: string): Promise<FullAssessment> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      documents: {
        include: { chunks: true },
        orderBy: { filename: 'asc' }, // Consistent ordering for deterministic results
      },
    },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  // Prepare pack documents for assessment (sorted alphabetically for determinism)
  const packDocs = packVersion.documents
    .map(doc => ({
      filename: doc.filename,
      docType: doc.docType,
      extractedText: doc.chunks
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map(c => c.text)
        .join('\n')
        .slice(0, 30000) // Limit per document
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename)); // Double-ensure sorting

  // Determine pack context from version metadata
  const context = determinePackContext(
    packVersion.borough,
    packVersion.buildingType,
    packVersion.height,
    packVersion.storeys
  );

  console.log(`[Matrix Assessment] Starting assessment for pack version ${packVersionId}`);
  console.log(`[Matrix Assessment] Context: London=${context.isLondon}, HRB=${context.isHRB}`);

  // Run the matrix assessment
  const assessment = await assessPackAgainstMatrix(packDocs, context);

  // Store assessment results in database
  await prisma.packVersion.update({
    where: { id: packVersionId },
    data: {
      matrixAssessment: JSON.stringify(assessment),
    },
  });

  return assessment;
}

export default {
  analyzePackVersion,
  runMatrixAssessment,
};
