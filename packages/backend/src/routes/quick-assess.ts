import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { runDeterministicChecks, DocumentEvidence, DeterministicAssessment } from '../services/deterministic-rules.js';

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
 * Extract text from PDF file
 */
async function extractPDFText(filepath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filepath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

/**
 * Classify document type based on filename
 */
function classifyDocType(filename: string, text: string): string | null {
  const lowerFilename = filename.toLowerCase();
  const lowerText = text.toLowerCase().slice(0, 5000);

  const typePatterns: { type: string; patterns: string[] }[] = [
    { type: 'fire_strategy', patterns: ['fire strategy', 'fire safety strategy'] },
    { type: 'drawings', patterns: ['drawing', 'plan', 'elevation', 'section'] },
    { type: 'structural', patterns: ['structural', 'structure'] },
    { type: 'mep', patterns: ['mechanical', 'electrical', 'plumbing', 'mep'] },
    { type: 'specifications', patterns: ['specification', 'spec', 'schedule'] },
  ];

  for (const { type, patterns } of typePatterns) {
    for (const pattern of patterns) {
      if (lowerFilename.includes(pattern) || lowerText.includes(pattern)) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Convert deterministic assessment to frontend format
 */
function formatResults(assessments: DeterministicAssessment[]) {
  return assessments.map(assessment => {
    // Determine status from passed boolean and evidence
    let status: 'pass' | 'fail' | 'n/a';
    if (!assessment.result.evidence.found) {
      status = 'n/a';
    } else if (assessment.result.passed) {
      status = 'pass';
    } else {
      status = 'fail';
    }

    // Format evidence text
    const evidenceText = assessment.result.evidence.found
      ? assessment.result.evidence.quote || `Found in ${assessment.result.evidence.document}`
      : 'No evidence found in submitted documents';

    return {
      id: assessment.matrixId,
      name: assessment.ruleName,
      status,
      evidence: evidenceText,
      reasoning: assessment.result.reasoning || '',
      proposedChanges: assessment.result.failureMode || '',
      regulatoryReference: assessment.regulatoryRef,
      phase: 'deterministic' as const,
      category: assessment.category,
      severity: assessment.severity
    };
  });
}

/**
 * Quick assessment endpoint - no database required
 *
 * Runs deterministic rules assessment (55 proprietary rules)
 * Returns results without saving to database
 *
 * Updated: 2026-03-03
 */
router.post('/', upload.array('documents', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    console.log(`📄 Quick assessment started with ${files.length} documents`);

    // Extract text from all PDFs
    const documents: DocumentEvidence[] = await Promise.all(
      files.map(async (file) => {
        const text = await extractPDFText(file.path);
        const docType = classifyDocType(file.originalname, text);

        return {
          filename: file.originalname,
          docType,
          extractedText: text
        };
      })
    );

    // Run deterministic rules assessment
    console.log('🔍 Running deterministic rules (55 checks)...');
    const deterministicResults = runDeterministicChecks(documents);

    // Format results for frontend
    const formattedResults = formatResults(deterministicResults);

    // Calculate summary stats
    const passCount = formattedResults.filter(r => r.status === 'pass').length;
    const failCount = formattedResults.filter(r => r.status === 'fail').length;
    const naCount = formattedResults.filter(r => r.status === 'n/a').length;

    console.log(`✅ Assessment complete: ${passCount} pass, ${failCount} fail, ${naCount} n/a`);

    // Clean up temp files after a delay
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
      assessmentId: uuidv4(),
      documentsProcessed: files.length,
      results: {
        criteria: formattedResults,
        summary: {
          total: formattedResults.length,
          pass: passCount,
          fail: failCount,
          na: naCount,
          passRate: passCount + failCount > 0
            ? Math.round((passCount / (passCount + failCount)) * 100)
            : 0
        },
        phases: {
          deterministic: {
            description: '55 proprietary if-then rules with explicit pass/fail logic',
            criteriaCount: formattedResults.length
          },
          llm: {
            description: 'AI enrichment available in full workflow',
            criteriaCount: 0
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

    // TODO: Implement database save when DB is working
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
