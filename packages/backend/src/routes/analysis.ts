import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { analyzePackVersion, runMatrixAssessment } from '../services/analysis.js';
import {
  generateMarkdownReport,
  generatePDFReport,
  generateJSONExport,
  getReportContent,
  getMatrixReportContent,
  generateMatrixMarkdownReport,
  generateMatrixPDFReport,
  generateMatrixJSONExport,
} from '../services/report.js';

const router = Router();

// In-memory analysis status tracking
const analysisStatus = new Map<
  string,
  { status: 'pending' | 'running' | 'completed' | 'failed'; error?: string }
>();

// POST /api/packs/:packId/versions/:versionId/analyze - Run analysis
router.post(
  '/packs/:packId/versions/:versionId/analyze',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      // Check version exists
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { documents: true },
      });

      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (version.documents.length === 0) {
        res.status(400).json({ error: 'No documents in this version' });
        return;
      }

      // Set status to running
      analysisStatus.set(versionId, { status: 'running' });

      // Return immediately, run analysis in background
      res.json({ status: 'running', versionId });

      // Run analysis (don't await)
      analyzePackVersion(versionId)
        .then(() => {
          analysisStatus.set(versionId, { status: 'completed' });
        })
        .catch((error) => {
          console.error('Analysis failed:', error);
          analysisStatus.set(versionId, {
            status: 'failed',
            error: error.message,
          });
        });
    } catch (error) {
      console.error('Error starting analysis:', error);
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/analyze/status - Get analysis status
router.get(
  '/packs/:packId/versions/:versionId/analyze/status',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const status = analysisStatus.get(versionId) || { status: 'pending' };

      // Also check if we have issues (analysis completed previously)
      if (status.status === 'pending') {
        const issueCount = await prisma.issueAction.count({
          where: { packVersionId: versionId },
        });
        if (issueCount > 0) {
          res.json({ status: 'completed' });
          return;
        }
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting analysis status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/report - Get report content
router.get(
  '/packs/:packId/versions/:versionId/report',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const { markdown, data } = await getReportContent(versionId);

      // Parse JSON fields for issues
      const parsedIssues = data.issues.map((issue) => ({
        id: (issue as { id?: string }).id,
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
        citations: JSON.parse(issue.citations || '[]'),
        evidence: JSON.parse(issue.evidence || '[]'),
      }));

      // Calculate criteria based on Gateway 2 standard checks
      // These are the core criteria areas checked for every submission:
      const GATEWAY2_CRITERIA = [
        'Building Height Consistency',
        'Storey Count Consistency',
        'Fire Strategy Documentation',
        'Structural Information',
        'External Wall System Details',
        'Means of Escape Provisions',
        'Compartmentation Strategy',
        'Ventilation Systems',
        'Principal Designer Competence',
        'Principal Contractor Competence',
        'Construction Control Plan',
        'Change Control Process',
        'Golden Thread Compliance',
        'Fire Risk Assessment',
        'Building Description Accuracy',
        'Site Location Documentation',
        'Document Cross-Referencing',
        'Regulatory Compliance Mapping',
      ];

      const criteriaChecked = GATEWAY2_CRITERIA.length;
      // Issues represent criteria with problems - we need to ensure passed is never negative
      const criteriaWithIssues = Math.min(data.issues.length, criteriaChecked);
      const criteriaPassed = criteriaChecked - criteriaWithIssues;

      res.json({
        markdown,
        summary: {
          packName: data.pack.name,
          versionNumber: data.version.versionNumber,
          projectName: data.version.projectName,
          documentCount: data.documents.length,
          fieldCount: data.fields.length,
          issueCount: data.issues.length,
          highIssues: data.issues.filter((i) => i.severity === 'high').length,
          mediumIssues: data.issues.filter((i) => i.severity === 'medium')
            .length,
          lowIssues: data.issues.filter((i) => i.severity === 'low').length,
          criteriaChecked,
          criteriaPassed: Math.max(0, criteriaPassed),
        },
        issues: parsedIssues,
        documents: data.documents.map((d) => ({
          filename: d.filename.replace(/^\d+-\d+-/, ''),
          docType: d.docType,
        })),
        fields: data.fields,
      });
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({ error: 'Failed to get report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/report/download/:format - Download report
router.get(
  '/packs/:packId/versions/:versionId/report/download/:format',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string; const format = req.params.format as string;

      let filepath: string;
      let contentType: string;

      switch (format) {
        case 'md':
          filepath = await generateMarkdownReport(versionId);
          contentType = 'text/markdown';
          break;
        case 'pdf':
          filepath = await generatePDFReport(versionId);
          contentType = 'application/pdf';
          break;
        case 'json':
          filepath = await generateJSONExport(versionId);
          contentType = 'application/json';
          break;
        default:
          res.status(400).json({ error: 'Invalid format' });
          return;
      }

      const filename = path.basename(filepath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({ error: 'Failed to download report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/issues - Get issues
router.get(
  '/packs/:packId/versions/:versionId/issues',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;
      const { severity, category } = req.query;

      const where: {
        packVersionId: string;
        severity?: 'high' | 'medium' | 'low';
        category?: string;
      } = {
        packVersionId: versionId,
      };

      if (severity && ['high', 'medium', 'low'].includes(severity as string)) {
        where.severity = severity as 'high' | 'medium' | 'low';
      }
      if (category && typeof category === 'string') {
        where.category = category;
      }

      const issues = await prisma.issueAction.findMany({
        where,
        orderBy: [{ severity: 'asc' }, { category: 'asc' }, { createdAt: 'desc' }],
      });

      // Parse JSON fields
      const parsedIssues = issues.map((issue) => ({
        ...issue,
        citations: JSON.parse(issue.citations || '[]'),
        evidence: JSON.parse(issue.evidence || '[]'),
      }));

      res.json(parsedIssues);
    } catch (error) {
      console.error('Error getting issues:', error);
      res.status(500).json({ error: 'Failed to get issues' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/fields - Get extracted fields
router.get(
  '/packs/:packId/versions/:versionId/fields',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const fields = await prisma.extractedField.findMany({
        where: { packVersionId: versionId },
        include: {
          evidenceDocument: true,
        },
        orderBy: { fieldName: 'asc' },
      });

      res.json(fields);
    } catch (error) {
      console.error('Error getting fields:', error);
      res.status(500).json({ error: 'Failed to get fields' });
    }
  }
);

// ============================================
// MATRIX-BASED ASSESSMENT ENDPOINTS
// ============================================

// POST /api/packs/:packId/versions/:versionId/matrix-assess - Run matrix assessment
router.post(
  '/packs/:packId/versions/:versionId/matrix-assess',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      // Check version exists
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { documents: true },
      });

      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (version.documents.length === 0) {
        res.status(400).json({ error: 'No documents in this version' });
        return;
      }

      // Set status to running
      analysisStatus.set(versionId, { status: 'running' });

      // Return immediately, run assessment in background
      res.json({ status: 'running', versionId, type: 'matrix' });

      // Run matrix assessment (don't await)
      runMatrixAssessment(versionId)
        .then(() => {
          analysisStatus.set(versionId, { status: 'completed' });
        })
        .catch((error) => {
          console.error('Matrix assessment failed:', error);
          analysisStatus.set(versionId, {
            status: 'failed',
            error: error.message,
          });
        });
    } catch (error) {
      console.error('Error starting matrix assessment:', error);
      res.status(500).json({ error: 'Failed to start matrix assessment' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/matrix-report - Get matrix report
router.get(
  '/packs/:packId/versions/:versionId/matrix-report',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const { markdown, assessment, uiSummary } = await getMatrixReportContent(versionId);

      if (!assessment) {
        res.status(404).json({ error: 'No matrix assessment found. Run matrix-assess first.' });
        return;
      }

      res.json({
        markdown,
        uiSummary,
        summary: {
          criteria_summary: assessment.criteria_summary,
          flagged_by_severity: assessment.flagged_by_severity,
          reference_standards: assessment.reference_standards_applied.length,
          guardrail_stats: assessment.guardrail_stats,
        },
        results: assessment.results,
        reference_standards: assessment.reference_standards_applied,
      });
    } catch (error) {
      console.error('Error getting matrix report:', error);
      res.status(500).json({ error: 'Failed to get matrix report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/matrix-report/download/:format
router.get(
  '/packs/:packId/versions/:versionId/matrix-report/download/:format',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string; const format = req.params.format as string;

      let filepath: string;
      let contentType: string;

      switch (format) {
        case 'md':
          filepath = await generateMatrixMarkdownReport(versionId);
          contentType = 'text/markdown';
          break;
        case 'pdf':
          filepath = await generateMatrixPDFReport(versionId);
          contentType = 'application/pdf';
          break;
        case 'json':
          filepath = await generateMatrixJSONExport(versionId);
          contentType = 'application/json';
          break;
        default:
          res.status(400).json({ error: 'Invalid format. Use md, pdf, or json.' });
          return;
      }

      const filename = path.basename(filepath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading matrix report:', error);
      res.status(500).json({ error: 'Failed to download matrix report' });
    }
  }
);

export default router;
