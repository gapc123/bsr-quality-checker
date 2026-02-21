import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { ingestDocument } from '../services/ingestion.js';

const router = Router();

// Configure multer for butler library uploads
const butlerDir = path.join(process.cwd(), '..', '..', 'data', 'butler');
if (!fs.existsSync(butlerDir)) {
  fs.mkdirSync(butlerDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, butlerDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// GET /api/butler - List butler library documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: { libraryType: 'butler' },
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Error listing butler docs:', error);
    res.status(500).json({ error: 'Failed to list butler documents' });
  }
});

// POST /api/butler - Upload butler library document
router.post('/', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const source = req.body.source || null;

    // Ingest document
    const docId = await ingestDocument(file.path, 'butler', undefined, source);

    // Return created document
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading butler doc:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/butler/:id - Get butler document details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id, libraryType: 'butler' },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          take: 10, // Preview first 10 chunks
        },
        _count: { select: { chunks: true } },
      },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Error getting butler doc:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// DELETE /api/butler/:id - Delete butler library document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id, libraryType: 'butler' },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Delete file from disk
    if (fs.existsSync(document.filepath)) {
      fs.unlinkSync(document.filepath);
    }

    // Delete from database (cascades to chunks)
    await prisma.document.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting butler doc:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
