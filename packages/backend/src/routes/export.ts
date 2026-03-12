/**
 * Export Routes (Simplified)
 *
 * Two outputs only:
 * 1. Submission Readiness Report PDF (3-5 pages)
 * 2. Evidence Matrix Excel (detailed audit file)
 *
 * All other PDF exports removed for clarity and actionability.
 */

import express, { Request, Response } from 'express';
import { generatePDFFromHTML, streamPDFToResponse } from '../utils/pdf-generator.js';
import { generateSubmissionReadinessHTML } from '../templates/submission-readiness-report.js';
import { generateComplianceMatrix } from '../services/compliance-matrix.js';
import { generateComplianceMatrixExcel } from '../services/excel-export.js';
import prisma from '../db/client.js';

const router = express.Router();

/**
 * POST /api/packs/:packId/versions/:versionId/submission-readiness/download
 *
 * Generate Submission Readiness Report PDF (NEW - replaces all old PDFs)
 *
 * Single 3-5 page PDF with:
 * - Submission verdict
 * - Top 5 blockers
 * - Review-required items (max 15)
 * - Consultant request list
 * - Missing information summary
 * - Next steps
 */
router.post(
  '/packs/:packId/versions/:versionId/submission-readiness/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      console.log('[Export] Generating Submission Readiness Report...');

      // Generate HTML from new template
      const html = generateSubmissionReadinessHTML(assessment);

      // Generate PDF using utility
      const tempFile = await generatePDFFromHTML(html, 'submission-readiness');

      // Stream to response and cleanup
      const filename = `submission-readiness-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);

      console.log(`[Export] ✓ Submission Readiness Report generated: ${filename}`);
    } catch (error) {
      console.error('[Export] Error generating Submission Readiness Report:', error);
      res.status(500).json({
        error: 'Failed to generate Submission Readiness Report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/compliance-matrix/excel
 *
 * Generate compliance matrix Excel export
 * Detailed audit file with all requirements and evidence
 */
router.post(
  '/packs/:packId/versions/:versionId/compliance-matrix/excel',
  async (req: Request, res: Response) => {
    try {
      const { assessment, projectName } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      console.log('[Export] Generating compliance matrix Excel...');

      // Generate matrix data
      const matrix = generateComplianceMatrix(assessment, projectName || 'BSR Submission');

      // Generate Excel file
      const buffer = await generateComplianceMatrixExcel(matrix);

      // Send file
      const filename = `evidence-matrix-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

      console.log(`[Export] ✓ Evidence Matrix Excel generated: ${filename}`);
    } catch (error) {
      console.error('[Export] Error generating compliance matrix Excel:', error);
      res.status(500).json({
        error: 'Failed to generate compliance matrix',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/packs/:packId/versions/:versionId/saved-assessment/compliance-matrix/excel
 *
 * Generate compliance matrix Excel from SAVED assessment (from database)
 */
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/compliance-matrix/excel',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;
      const packId = req.params.packId as string;

      console.log(`[Export] GET saved compliance matrix Excel - Pack: ${packId}, Version: ${versionId}`);

      // Fetch the pack version with matrixAssessment
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: {
          pack: {
            select: { name: true }
          }
        }
      });

      if (!version) {
        console.error(`[Export] Version not found: ${versionId}`);
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (!version.matrixAssessment) {
        console.error(`[Export] No saved assessment for version: ${versionId}`);
        res.status(404).json({ error: 'No saved assessment found for this version' });
        return;
      }

      // Parse the saved assessment
      const assessment = typeof version.matrixAssessment === 'string'
        ? JSON.parse(version.matrixAssessment)
        : version.matrixAssessment;

      console.log('[Export] Generating Excel from saved assessment...');

      // Generate matrix data
      const matrix = generateComplianceMatrix(assessment, version.pack.name);

      // Generate Excel file
      const buffer = await generateComplianceMatrixExcel(matrix);

      // Send file
      const filename = `evidence-matrix-${version.pack.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

      console.log(`[Export] ✓ Saved Evidence Matrix Excel generated: ${filename}`);
    } catch (error) {
      console.error('[Export] Error generating saved compliance matrix Excel:', error);
      res.status(500).json({
        error: 'Failed to generate compliance matrix',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/packs/:packId/versions/:versionId/saved-assessment/submission-readiness/download
 *
 * Generate Submission Readiness Report from SAVED assessment (from database)
 */
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/submission-readiness/download',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;
      const packId = req.params.packId as string;

      console.log(`[Export] GET saved Submission Readiness Report - Pack: ${packId}, Version: ${versionId}`);

      // Fetch the pack version with matrixAssessment
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: {
          pack: {
            select: { name: true }
          }
        }
      });

      if (!version) {
        console.error(`[Export] Version not found: ${versionId}`);
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (!version.matrixAssessment) {
        console.error(`[Export] No saved assessment for version: ${versionId}`);
        res.status(404).json({ error: 'No saved assessment found for this version' });
        return;
      }

      // Parse the saved assessment
      const assessment = typeof version.matrixAssessment === 'string'
        ? JSON.parse(version.matrixAssessment)
        : version.matrixAssessment;

      console.log('[Export] Generating PDF from saved assessment...');

      // Generate HTML
      const html = generateSubmissionReadinessHTML(assessment);

      // Generate PDF
      const tempFile = await generatePDFFromHTML(html, 'submission-readiness');

      // Stream to response
      const filename = `submission-readiness-${version.pack.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);

      console.log(`[Export] ✓ Saved Submission Readiness Report generated: ${filename}`);
    } catch (error) {
      console.error('[Export] Error generating saved Submission Readiness Report:', error);
      res.status(500).json({
        error: 'Failed to generate Submission Readiness Report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
