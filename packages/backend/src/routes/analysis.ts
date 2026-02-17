import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { analyzePackVersion } from '../services/analysis.js';
import {
  generateMarkdownReport,
  generatePDFReport,
  generateJSONExport,
  getReportContent,
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
      const { versionId } = req.params;

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
      const { versionId } = req.params;

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
      const { versionId } = req.params;

      const { markdown, data } = await getReportContent(versionId);

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
        },
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
      const { versionId, format } = req.params;

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
      const { versionId } = req.params;
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
      const { versionId } = req.params;

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

export default router;
