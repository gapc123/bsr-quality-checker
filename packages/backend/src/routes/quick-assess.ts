import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { assessPackAgainstMatrix } from '../services/matrix-assessment.js';
import prisma from '../db/client.js';

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
  limits: { fileSize: 50 * 1024 * 1024 }
});

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
 * Full two-phase matrix assessment - no database required to run
 *
 * Phase 1: 55 deterministic rules
 * Phase 2: LLM enrichment with Claude
 *
 * Returns complete assessment results for carousel display
 */
router.post('/', upload.array('documents', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { buildingType, heightMeters, storeys, isLondon, isHRB } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    console.log(`📄 Full matrix assessment started with ${files.length} documents`);

    // Extract text from all PDFs
    const packDocs = await Promise.all(
      files.map(async (file) => {
        const extractedText = await extractPDFText(file.path);
        const docType = classifyDocType(file.originalname, extractedText);

        return {
          filename: file.originalname,
          docType,
          extractedText,
          filepath: file.path // Store for later saving
        };
      })
    );

    // Create pack context (use provided values or defaults)
    const context = {
      isLondon: isLondon === 'true' || isLondon === true || false,
      isHRB: isHRB === 'true' || isHRB === true || true, // Default to HRB
      buildingType: buildingType || 'residential',
      heightMeters: heightMeters ? parseFloat(heightMeters) : null,
      storeys: storeys ? parseInt(storeys) : null
    };

    console.log('Assessment context:', context);

    // Run full two-phase assessment (deterministic + LLM)
    console.log('🚀 Starting two-phase assessment...');
    const fullAssessment = await assessPackAgainstMatrix(packDocs, context);

    console.log(`✅ Assessment complete: ${fullAssessment.results.length} criteria assessed`);

    // Store file paths temporarily for later save
    const assessmentId = uuidv4();
    const tempData = {
      assessmentId,
      packDocs: packDocs.map(d => ({
        filename: d.filename,
        docType: d.docType,
        filepath: d.filepath
      })),
      context,
      results: fullAssessment
    };

    // Store in temp directory for potential save
    const tempDataPath = path.join(process.cwd(), 'temp-uploads', `${assessmentId}.json`);
    fs.writeFileSync(tempDataPath, JSON.stringify(tempData));

    // Clean up temp files after 1 hour
    setTimeout(() => {
      try {
        if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      } catch (err) {
        console.error('Error cleaning up temp files:', err);
      }
    }, 3600000); // 1 hour

    res.json({
      success: true,
      assessmentId,
      documentsProcessed: files.length,
      context,
      results: fullAssessment
    });

  } catch (error) {
    console.error('❌ Matrix assessment error:', error);
    res.status(500).json({
      error: 'Assessment failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Save assessment results to database (creates client + pack)
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { assessmentId, clientName, projectName, clientCompany } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ error: 'Assessment ID required' });
    }

    if (!clientName || !projectName) {
      return res.status(400).json({ error: 'Client name and project name required' });
    }

    // Load temp assessment data
    const tempDataPath = path.join(process.cwd(), 'temp-uploads', `${assessmentId}.json`);

    if (!fs.existsSync(tempDataPath)) {
      return res.status(404).json({ error: 'Assessment data not found or expired' });
    }

    const tempData = JSON.parse(fs.readFileSync(tempDataPath, 'utf-8'));

    console.log(`💾 Saving assessment to database: ${clientName} / ${projectName}`);

    // Create client
    const client = await prisma.client.create({
      data: {
        name: clientName,
        company: clientCompany || null
      }
    });

    console.log(`✓ Created client: ${client.id}`);

    // Create pack
    const pack = await prisma.pack.create({
      data: {
        name: projectName,
        clientId: client.id
      }
    });

    console.log(`✓ Created pack: ${pack.id}`);

    // Create pack version
    const version = await prisma.packVersion.create({
      data: {
        packId: pack.id,
        versionNumber: 1,
        matrixAssessment: JSON.stringify(tempData.results),
        buildingType: tempData.context.buildingType,
        height: tempData.context.heightMeters?.toString() || null,
        storeys: tempData.context.storeys?.toString() || null
      }
    });

    console.log(`✓ Created version: ${version.id}`);

    // Move uploaded files to permanent storage
    const uploadsDir = path.join(process.cwd(), 'uploads', pack.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create document records
    for (const doc of tempData.packDocs) {
      if (fs.existsSync(doc.filepath)) {
        const newPath = path.join(uploadsDir, doc.filename);
        fs.copyFileSync(doc.filepath, newPath);

        await prisma.document.create({
          data: {
            packVersionId: version.id,
            libraryType: 'pack',
            filename: doc.filename,
            filepath: newPath,
            docType: doc.docType
          }
        });
      }
    }

    console.log(`✓ Saved ${tempData.packDocs.length} documents`);

    // Clean up temp files
    fs.unlinkSync(tempDataPath);
    tempData.packDocs.forEach((doc: any) => {
      if (fs.existsSync(doc.filepath)) fs.unlinkSync(doc.filepath);
    });

    res.json({
      success: true,
      client: { id: client.id, name: client.name },
      pack: { id: pack.id, name: pack.name },
      version: { id: version.id, versionNumber: version.versionNumber }
    });

  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({
      error: 'Failed to save assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
