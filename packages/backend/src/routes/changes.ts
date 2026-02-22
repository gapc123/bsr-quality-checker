import { Router, Request, Response } from 'express';
import prisma from '../db/client.js';

const router = Router();

// POST /api/packs/:packId/versions/:versionId/apply-changes
// Apply AI-actionable changes and generate updated report
router.post('/:packId/versions/:versionId/apply-changes', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const { selectedChangeIds } = req.body;

    if (!Array.isArray(selectedChangeIds)) {
      res.status(400).json({ error: 'selectedChangeIds must be an array' });
      return;
    }

    // Get current version with assessment
    const version = await prisma.packVersion.findUnique({
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
    await prisma.packVersion.update({
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
    const { versionId } = req.params;

    const version = await prisma.packVersion.findUnique({
      where: { id: versionId },
      include: {
        issues: true,
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
        riskLevel: 'mechanical',
        appliesTo: 'Report structure',
        category: 'navigation'
      },
      {
        id: 'standardise_headings',
        title: 'Standardise heading formats',
        description: 'Ensure consistent capitalisation and formatting across all section headings',
        riskLevel: 'mechanical',
        appliesTo: 'All sections',
        category: 'formatting'
      },
      {
        id: 'add_cross_refs',
        title: 'Add document cross-references',
        description: 'Link findings to specific documents and page numbers in your submission',
        riskLevel: 'low',
        appliesTo: 'Evidence citations',
        category: 'cross-reference'
      },
      {
        id: 'format_citations',
        title: 'Improve citation formatting',
        description: 'Standardise the format of regulatory references and document citations',
        riskLevel: 'mechanical',
        appliesTo: 'All citations',
        category: 'formatting'
      },
      {
        id: 'add_page_numbers',
        title: 'Add page number references',
        description: 'Include specific page numbers when referencing source documents',
        riskLevel: 'low',
        appliesTo: 'Document references',
        category: 'cross-reference'
      }
    ];

    // Generate human-judgement changes from issues
    const humanChanges = version.issues
      .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
      .slice(0, 10)
      .map(issue => ({
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

export default router;
