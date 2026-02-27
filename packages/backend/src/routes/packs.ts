import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { ingestDocument } from '../services/ingestion.js';
import { getPackSummary } from '../services/ai-summary.js';

const router = Router();

// Configure multer for file uploads
// In Docker, process.cwd() is /app. In dev, it's /packages/backend
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = isProduction
  ? path.join(process.cwd(), 'uploads')
  : path.join(process.cwd(), '..', '..', 'uploads');
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

// GET /api/packs - List all packs (optionally filter by clientId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.query;

    const packs = await prisma.pack.findMany({
      where: clientId ? { clientId: clientId as string } : undefined,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
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
    const { name, clientId, servicePackage, requirements } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Pack name is required' });
      return;
    }

    const pack = await prisma.pack.create({
      data: {
        name,
        clientId: clientId || null,
        servicePackage: servicePackage || null,
        requirements: requirements || null,
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
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
        client: {
          select: { id: true, name: true, company: true },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
        },
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

// PUT /api/packs/:id - Update pack details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, clientId, servicePackage, requirements } = req.body;

    const pack = await prisma.pack.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(clientId !== undefined && { clientId: clientId || null }),
        ...(servicePackage !== undefined && { servicePackage: servicePackage || null }),
        ...(requirements !== undefined && { requirements: requirements || null }),
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json(pack);
  } catch (error) {
    console.error('Error updating pack:', error);
    res.status(500).json({ error: 'Failed to update pack' });
  }
});

// GET /api/packs/:id/summary - Get AI summary for pack
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const refresh = req.query.refresh === 'true';

    const result = await getPackSummary(id, refresh);
    res.json(result);
  } catch (error) {
    console.error('Error getting pack summary:', error);
    res.status(500).json({ error: 'Failed to get pack summary' });
  }
});

// ==================== TASK ENDPOINTS ====================

// GET /api/packs/:id/tasks - Get all tasks for a pack
router.get('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const tasks = await prisma.packTask.findMany({
      where: { packId: id },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /api/packs/:id/tasks - Create a new task
router.post('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const packId = req.params.id as string;
    const { title, description } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    // Get max sortOrder for this pack
    const maxOrder = await prisma.packTask.aggregate({
      where: { packId },
      _max: { sortOrder: true },
    });

    const task = await prisma.packTask.create({
      data: {
        packId,
        title,
        description: description || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/packs/:packId/tasks/:taskId - Update a task
router.put('/:packId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const { title, description, completed, sortOrder } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }

    const task = await prisma.packTask.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/packs/:packId/tasks/:taskId - Delete a task
router.delete('/:packId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;

    await prisma.packTask.delete({
      where: { id: taskId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
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
