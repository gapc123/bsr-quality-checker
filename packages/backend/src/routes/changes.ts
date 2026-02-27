import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../db/client.js';
import { generateEditableDocx } from '../services/report.js';
import { generateAmendedDocuments } from '../services/document-amendment.js';

const router = Router();

// POST /api/packs/:packId/versions/:versionId/apply-changes
// Apply AI-actionable changes and generate updated report
router.post('/:packId/versions/:versionId/apply-changes', async (req: Request, res: Response) => {
  try {
    const versionId = String(req.params.versionId);
    const { selectedChangeIds } = req.body;

    if (!Array.isArray(selectedChangeIds)) {
      res.status(400).json({ error: 'selectedChangeIds must be an array' });
      return;
    }

    // Get current version with assessment
    const version = await (prisma.packVersion.findUnique as any)({
      where: { id: versionId },
      include: { documents: true }
    });

    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    // Parse existing assessment
    let assessment = version.matrixAssessment ? JSON.parse(version.matrixAssessment) : null;

    if (!assessment) {
      res.status(400).json({ error: 'No assessment found to update' });
      return;
    }

    // Apply selected changes to the assessment
    // This modifies the report output based on the selected mechanical changes
    const appliedChanges: string[] = [];

    if (selectedChangeIds.includes('add_toc')) {
      assessment.appliedEnhancements = assessment.appliedEnhancements || [];
      assessment.appliedEnhancements.push('Table of contents added');
      appliedChanges.push('add_toc');
    }

    if (selectedChangeIds.includes('standardise_headings')) {
      assessment.appliedEnhancements = assessment.appliedEnhancements || [];
      assessment.appliedEnhancements.push('Headings standardised');
      appliedChanges.push('standardise_headings');
    }

    if (selectedChangeIds.includes('add_cross_refs')) {
      assessment.appliedEnhancements = assessment.appliedEnhancements || [];
      assessment.appliedEnhancements.push('Cross-references added');
      appliedChanges.push('add_cross_refs');
    }

    if (selectedChangeIds.includes('format_citations')) {
      assessment.appliedEnhancements = assessment.appliedEnhancements || [];
      assessment.appliedEnhancements.push('Citation formatting improved');
      appliedChanges.push('format_citations');
    }

    if (selectedChangeIds.includes('add_page_numbers')) {
      assessment.appliedEnhancements = assessment.appliedEnhancements || [];
      assessment.appliedEnhancements.push('Page number references added');
      appliedChanges.push('add_page_numbers');
    }

    // Mark that changes have been applied
    assessment.changesApplied = true;
    assessment.appliedChangeIds = appliedChanges;
    assessment.appliedAt = new Date().toISOString();

    // Save updated assessment
    await (prisma.packVersion.update as any)({
      where: { id: versionId },
      data: { matrixAssessment: JSON.stringify(assessment) }
    });

    res.json({
      success: true,
      appliedChanges,
      message: `${appliedChanges.length} changes applied successfully`
    });
  } catch (error) {
    console.error('Error applying changes:', error);
    res.status(500).json({ error: 'Failed to apply changes' });
  }
});

// GET /api/packs/:packId/versions/:versionId/actionable-changes
// Get list of AI-actionable and human-judgement changes
router.get('/:packId/versions/:versionId/actionable-changes', async (req: Request, res: Response) => {
  try {
    const versionId = String(req.params.versionId);

    const version = await (prisma.packVersion.findUnique as any)({
      where: { id: versionId },
      include: {
        documents: true
      }
    });

    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    // Generate AI-actionable changes (mechanical, low-risk)
    const aiChanges = [
      {
        id: 'add_toc',
        title: 'Add table of contents',
        description: 'Generate a navigable table of contents for the report with links to each section',
        why: 'BSR reviewers navigate large documents frequently; a TOC reduces their review time significantly.',
        riskLevel: 'mechanical',
        appliesTo: 'Report structure',
        category: 'navigation'
      },
      {
        id: 'standardise_headings',
        title: 'Standardise heading formats',
        description: 'Ensure consistent capitalisation and formatting across all section headings',
        why: 'Inconsistent formatting can signal lack of attention to detail, which raises concerns during review.',
        riskLevel: 'mechanical',
        appliesTo: 'All sections',
        category: 'formatting'
      },
      {
        id: 'add_cross_refs',
        title: 'Add document cross-references',
        description: 'Link findings to specific documents and page numbers in your submission',
        why: 'Cross-references allow reviewers to verify claims quickly, improving trust in your submission.',
        riskLevel: 'low',
        appliesTo: 'Evidence citations',
        category: 'cross-reference'
      },
      {
        id: 'format_citations',
        title: 'Improve citation formatting',
        description: 'Standardise the format of regulatory references and document citations',
        why: 'Clear, consistent citations demonstrate professional rigour and make audit trails easier to follow.',
        riskLevel: 'mechanical',
        appliesTo: 'All citations',
        category: 'formatting'
      },
      {
        id: 'add_page_numbers',
        title: 'Add page number references',
        description: 'Include specific page numbers when referencing source documents',
        why: 'Page-level references enable reviewers to locate evidence instantly rather than searching entire documents.',
        riskLevel: 'low',
        appliesTo: 'Document references',
        category: 'cross-reference'
      }
    ];

    // Generate human-judgement changes from issues in the assessment
    const assessment = version.matrixAssessment ? JSON.parse(version.matrixAssessment) : null;
    const issues = assessment?.issues || [];

    const humanChanges = issues
      .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
      .slice(0, 10)
      .map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        description: issue.finding,
        suggestedOwner: issue.ownerRole,
        severity: issue.severity as 'high' | 'medium' | 'low'
      }));

    res.json({
      aiChanges,
      humanChanges,
      hasAppliedChanges: version.matrixAssessment?.includes('"changesApplied":true') || false
    });
  } catch (error) {
    console.error('Error getting actionable changes:', error);
    res.status(500).json({ error: 'Failed to get actionable changes' });
  }
});

// POST /api/packs/:packId/versions/:versionId/generate-editable
// Generate editable DOCX with AI changes highlighted
router.post('/:packId/versions/:versionId/generate-editable', async (req: Request, res: Response) => {
  try {
    const versionId = String(req.params.versionId);
    const { appliedActions } = req.body;

    if (!Array.isArray(appliedActions)) {
      res.status(400).json({ error: 'appliedActions must be an array' });
      return;
    }

    // Generate the editable DOCX
    const filepath = await generateEditableDocx(versionId, appliedActions);

    // Send the file
    const filename = path.basename(filepath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error generating editable document:', error);
    res.status(500).json({ error: 'Failed to generate editable document' });
  }
});

// POST /api/packs/:packId/versions/:versionId/generate-amended-documents
// Generate amended documents based on carousel decisions
router.post('/:packId/versions/:versionId/generate-amended-documents', async (req: Request, res: Response) => {
  try {
    const versionId = String(req.params.versionId);
    const { acceptedChanges, skippedCriteriaIds } = req.body;

    if (!Array.isArray(acceptedChanges)) {
      res.status(400).json({ error: 'acceptedChanges must be an array' });
      return;
    }

    if (!Array.isArray(skippedCriteriaIds)) {
      res.status(400).json({ error: 'skippedCriteriaIds must be an array' });
      return;
    }

    // Generate all documents
    const result = await generateAmendedDocuments({
      packVersionId: versionId,
      acceptedChanges,
      skippedCriteriaIds,
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating amended documents:', error);
    res.status(500).json({ error: 'Failed to generate amended documents' });
  }
});

// GET /api/packs/:packId/versions/:versionId/download-amended/:type
// Download amended documents
router.get('/:packId/versions/:versionId/download-amended/:type', async (req: Request, res: Response) => {
  try {
    const versionId = String(req.params.versionId);
    const docType = String(req.params.type);

    // Get the latest artifact of this type
    const artifactType = docType === 'docx' ? 'amended-docx' :
                         docType === 'pdf' ? 'amended-pdf' :
                         docType === 'issues' ? 'outstanding-issues' : null;

    if (!artifactType) {
      res.status(400).json({ error: 'Invalid document type. Use: docx, pdf, or issues' });
      return;
    }

    const artifact = await prisma.outputArtifact.findFirst({
      where: {
        packVersionId: versionId,
        artifactType,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!artifact || !fs.existsSync(artifact.path)) {
      res.status(404).json({ error: 'Document not found. Please generate documents first.' });
      return;
    }

    const filename = path.basename(artifact.path);
    const contentType = docType === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(artifact.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading amended document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

export default router;
