import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPDF } from '../services/pdf-parser.js';
import { assessDocumentsWithDeterministicRules } from '../services/deterministic-rules.js';
import { enrichWithLLMAnalysis } from '../services/matrix-assessment.js';

const router = express.Router();

// Configure multer for file uploads (temp storage)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(process.cwd(), 'temp-uploads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * Quick assessment endpoint - no database required
 *
 * Runs full two-phase assessment:
 * 1. Deterministic rules (55 proprietary rules)
 * 2. LLM enrichment (nuanced analysis)
 *
 * Returns results without saving to database
 */
router.post('/', upload.array('documents', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    console.log(`📄 Quick assessment started with ${files.length} documents`);

    // Extract text from all PDFs
    const documents = await Promise.all(
      files.map(async (file) => {
        try {
          const text = await extractTextFromPDF(file.path);
          return {
            id: uuidv4(),
            filename: file.originalname,
            filepath: file.path,
            text,
            docType: 'submission'
          };
        } catch (error) {
          console.error(`Error extracting text from ${file.originalname}:`, error);
          return {
            id: uuidv4(),
            filename: file.originalname,
            filepath: file.path,
            text: '',
            docType: 'submission'
          };
        }
      })
    );

    const combinedText = documents.map(d => d.text).join('\n\n');

    // Phase 1: Deterministic Rules Assessment
    console.log('🔍 Phase 1: Running deterministic rules...');
    const deterministicResults = await assessDocumentsWithDeterministicRules(
      combinedText,
      documents
    );

    // Phase 2: LLM Enrichment
    console.log('🤖 Phase 2: LLM enrichment...');
    const enrichedResults = await enrichWithLLMAnalysis(
      deterministicResults,
      combinedText,
      documents
    );

    // Calculate summary stats
    const passCount = enrichedResults.filter(r => r.status === 'pass').length;
    const failCount = enrichedResults.filter(r => r.status === 'fail').length;
    const naCount = enrichedResults.filter(r => r.status === 'n/a').length;

    console.log(`✅ Assessment complete: ${passCount} pass, ${failCount} fail, ${naCount} n/a`);

    // Clean up temp files after a delay (give time for potential saves)
    setTimeout(() => {
      files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
      });
    }, 300000); // 5 minutes

    res.json({
      success: true,
      assessmentId: uuidv4(), // For potential later save
      documentsProcessed: files.length,
      documentDetails: documents.map(d => ({
        id: d.id,
        filename: d.filename,
        filepath: d.filepath
      })),
      results: {
        criteria: enrichedResults,
        summary: {
          total: enrichedResults.length,
          pass: passCount,
          fail: failCount,
          na: naCount,
          passRate: Math.round((passCount / (passCount + failCount)) * 100)
        },
        phases: {
          deterministic: {
            description: '55 proprietary if-then rules',
            criteriaCount: deterministicResults.length
          },
          llm: {
            description: 'AI-enriched analysis for nuanced criteria',
            criteriaCount: enrichedResults.length - deterministicResults.length
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Quick assessment error:', error);
    res.status(500).json({
      error: 'Assessment failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Save assessment results to database (creates client + pack)
 * Called after user reviews results and wants to save
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { assessmentResults, clientName, projectName, documents } = req.body;

    // TODO: Implement database save
    // 1. Create client
    // 2. Create pack under client
    // 3. Create pack version
    // 4. Move temp documents to permanent storage
    // 5. Save assessment results as matrixAssessment JSON

    res.json({
      success: true,
      message: 'Save feature coming soon - database connection needed'
    });

  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

export default router;
