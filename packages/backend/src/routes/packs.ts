import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { ingestDocument } from '../services/ingestion.js';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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

// GET /api/packs - List all packs
router.get('/', async (req: Request, res: Response) => {
  try {
    const packs = await prisma.pack.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(packs);
  } catch (error) {
    console.error('Error listing packs:', error);
    res.status(500).json({ error: 'Failed to list packs' });
  }
});

// POST /api/packs - Create a new pack
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Pack name is required' });
      return;
    }

    const pack = await prisma.pack.create({
      data: { name },
    });

    res.status(201).json(pack);
  } catch (error) {
    console.error('Error creating pack:', error);
    res.status(500).json({ error: 'Failed to create pack' });
  }
});

// GET /api/packs/:id - Get pack with versions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            documents: true,
            _count: {
              select: {
                fields: true,
                issues: true,
              },
            },
          },
        },
      },
    });

    if (!pack) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }

    res.json(pack);
  } catch (error) {
    console.error('Error getting pack:', error);
    res.status(500).json({ error: 'Failed to get pack' });
  }
});

// DELETE /api/packs/:id - Delete pack
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.pack.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pack:', error);
    res.status(500).json({ error: 'Failed to delete pack' });
  }
});

// POST /api/packs/:id/versions - Create new version with documents
router.post(
  '/:id/versions',
  upload.array('documents', 20),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const files = req.files as Express.Multer.File[];

      // Get pack with versions
      const pack = await prisma.pack.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      }) as any;

      if (!pack) {
        res.status(404).json({ error: 'Pack not found' });
        return;
      }

      // Calculate next version number
      const nextVersion =
        pack.versions && pack.versions.length > 0 ? pack.versions[0].versionNumber + 1 : 1;

      // Parse optional metadata
      const metadata = {
        projectName: req.body.projectName || null,
        borough: req.body.borough || null,
        buildingType: req.body.buildingType || null,
        height: req.body.height || null,
        storeys: req.body.storeys || null,
        targetDate: req.body.targetDate
          ? new Date(req.body.targetDate)
          : null,
      };

      // Create version
      const version = await prisma.packVersion.create({
        data: {
          packId: id,
          versionNumber: nextVersion,
          ...metadata,
        },
      });

      // Ingest documents
      const documentIds: string[] = [];
      for (const file of files || []) {
        try {
          const docId = await ingestDocument(file.path, 'pack', version.id);
          documentIds.push(docId);
        } catch (error) {
          console.error(`Error ingesting ${file.originalname}:`, error);
        }
      }

      // Return version with documents
      const result = await prisma.packVersion.findUnique({
        where: { id: version.id },
        include: {
          documents: true,
        },
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating version:', error);
      res.status(500).json({ error: 'Failed to create version' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId - Get version details
router.get('/:packId/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;

    const version = await prisma.packVersion.findUnique({
      where: { id: versionId },
      include: {
        pack: true,
        documents: {
          include: {
            _count: { select: { chunks: true } },
          },
        },
        fields: {
          include: {
            evidenceDocument: true,
          },
        },
        issues: {
          orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        },
        artifacts: true,
      },
    });

    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    res.json(version);
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ error: 'Failed to get version' });
  }
});

export default router;
