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
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 status changes
        },
      },
    });

    if (!pack) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }

    // Parse JSON fields
    const packWithParsedData = {
      ...pack,
      milestones: pack.milestones ? JSON.parse(pack.milestones) : null,
      tasks: pack.tasks.map(task => ({
        ...task,
        blockedByIds: task.blockedByIds ? JSON.parse(task.blockedByIds) : [],
        tags: task.tags ? JSON.parse(task.tags) : [],
      })),
    };

    res.json(packWithParsedData);
  } catch (error) {
    console.error('Error getting pack:', error);
    res.status(500).json({ error: 'Failed to get pack' });
  }
});

// PUT /api/packs/:id - Update pack details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      clientId,
      servicePackage,
      requirements,
      leadAssignee,
      leadName,
      targetCompletionDate,
      milestones,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (clientId !== undefined) updateData.clientId = clientId || null;
    if (servicePackage !== undefined) updateData.servicePackage = servicePackage || null;
    if (requirements !== undefined) updateData.requirements = requirements || null;
    if (leadAssignee !== undefined) updateData.leadAssignee = leadAssignee || null;
    if (leadName !== undefined) updateData.leadName = leadName || null;
    if (targetCompletionDate !== undefined) {
      updateData.targetCompletionDate = targetCompletionDate ? new Date(targetCompletionDate) : null;
    }
    if (milestones !== undefined) {
      updateData.milestones = milestones ? JSON.stringify(milestones) : null;
    }

    const pack = await prisma.pack.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Parse milestones for response
    const packWithParsedData = {
      ...pack,
      milestones: pack.milestones ? JSON.parse(pack.milestones) : null,
    };

    res.json(packWithParsedData);
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

// ==================== STATUS ENDPOINTS ====================

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_progress', 'archived'],
  in_progress: ['under_review', 'revision_needed', 'archived'],
  under_review: ['client_review', 'revision_needed', 'in_progress'],
  client_review: ['revision_needed', 'completed'],
  revision_needed: ['in_progress'],
  completed: ['archived'],
  archived: ['in_progress'], // Re-open
};

// PUT /api/packs/:id/status - Change pack status with validation
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, notes, userId, userName } = req.body;

    if (!status || !userId || !userName) {
      res.status(400).json({ error: 'status, userId, and userName are required' });
      return;
    }

    // Get current pack
    const pack = await prisma.pack.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!pack) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }

    // Validate status transition
    const currentStatus = pack.status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!validTransitions?.includes(status)) {
      res.status(400).json({
        error: `Invalid status transition from ${currentStatus} to ${status}`,
        validTransitions,
      });
      return;
    }

    // Update pack status
    const updateData: any = { status };

    // Set timestamps based on status
    if (status === 'in_progress' && currentStatus === 'draft') {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.actualCompletionDate = new Date();
    }

    const updatedPack = await prisma.pack.update({
      where: { id },
      data: updateData,
    });

    // Record status change in history
    await prisma.packStatusChange.create({
      data: {
        packId: id,
        fromStatus: currentStatus,
        toStatus: status,
        changedBy: userId,
        changedByName: userName,
        notes: notes || null,
      },
    });

    res.json(updatedPack);
  } catch (error) {
    console.error('Error changing pack status:', error);
    res.status(500).json({ error: 'Failed to change pack status' });
  }
});

// GET /api/packs/:id/status-history - Get pack status history
router.get('/:id/status-history', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const history = await prisma.packStatusChange.findMany({
      where: { packId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error('Error getting status history:', error);
    res.status(500).json({ error: 'Failed to get status history' });
  }
});

// ==================== TASK ENDPOINTS ====================

// GET /api/packs/:id/tasks - Get all tasks for a pack with filtering and sorting
router.get('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, assignedTo, priority, overdue, blocked, sort, order } = req.query;

    // Build where clause
    const where: any = { packId: id };

    if (status) {
      where.status = status as string;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo as string;
    }

    if (priority) {
      where.priority = priority as string;
    }

    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'completed' };
    }

    if (blocked === 'true') {
      where.status = 'blocked';
    }

    // Build orderBy clause
    let orderBy: any = { sortOrder: 'asc' };
    if (sort) {
      const direction = order === 'desc' ? 'desc' : 'asc';
      switch (sort) {
        case 'dueDate':
          orderBy = { dueDate: direction };
          break;
        case 'priority':
          orderBy = { priority: direction };
          break;
        case 'status':
          orderBy = { status: direction };
          break;
        case 'createdAt':
          orderBy = { createdAt: direction };
          break;
        default:
          orderBy = { sortOrder: direction };
      }
    }

    const tasks = await prisma.packTask.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    // Parse JSON fields
    const tasksWithParsedData = tasks.map(task => ({
      ...task,
      blockedByIds: task.blockedByIds ? JSON.parse(task.blockedByIds) : [],
      tags: task.tags ? JSON.parse(task.tags) : [],
    }));

    res.json(tasksWithParsedData);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// GET /api/packs/:packId/tasks/:taskId - Get single task with full details
router.get('/:packId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const packId = req.params.packId as string;

    const task = await prisma.packTask.findFirst({
      where: { id: taskId, packId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Parse JSON fields
    const taskWithParsedData = {
      ...task,
      blockedByIds: task.blockedByIds ? JSON.parse(task.blockedByIds) : [],
      tags: task.tags ? JSON.parse(task.tags) : [],
    };

    // If task has blockedByIds, fetch those tasks for display
    if (taskWithParsedData.blockedByIds.length > 0) {
      const blockingTasks = await prisma.packTask.findMany({
        where: { id: { in: taskWithParsedData.blockedByIds } },
        select: { id: true, title: true, status: true },
      });
      (taskWithParsedData as any).blockingTasks = blockingTasks;
    }

    res.json(taskWithParsedData);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
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
    const packId = req.params.packId as string;
    const {
      title,
      description,
      completed,
      status,
      sortOrder,
      assignedTo,
      assignedToName,
      dueDate,
      priority,
      blockedByIds,
      tags,
      category,
      estimatedHours,
      actualHours,
    } = req.body;

    // Validate circular dependencies if blockedByIds is being updated
    if (blockedByIds !== undefined && Array.isArray(blockedByIds)) {
      // Check for self-reference
      if (blockedByIds.includes(taskId)) {
        res.status(400).json({ error: 'A task cannot block itself' });
        return;
      }

      // Check for circular dependencies using simple BFS
      const visited = new Set<string>([taskId]);
      const queue = [...blockedByIds];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) {
          res.status(400).json({ error: 'Circular dependency detected' });
          return;
        }
        visited.add(currentId);

        // Get dependencies of current task
        const currentTask = await prisma.packTask.findUnique({
          where: { id: currentId },
          select: { blockedByIds: true },
        });

        if (currentTask?.blockedByIds) {
          const deps = JSON.parse(currentTask.blockedByIds);
          queue.push(...deps);
        }
      }
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (category !== undefined) updateData.category = category || null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;

    // Handle status update
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed = true;
        updateData.completedAt = new Date();
      } else {
        updateData.completed = false;
        if (status !== 'completed') updateData.completedAt = null;
      }
    }

    // Backward compatibility for completed field
    if (completed !== undefined && status === undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
      updateData.status = completed ? 'completed' : 'not_started';
    }

    // Assignment
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (assignedToName !== undefined) updateData.assignedToName = assignedToName || null;

    // Dates
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Priority
    if (priority !== undefined) updateData.priority = priority;

    // JSON fields
    if (blockedByIds !== undefined) {
      updateData.blockedByIds = JSON.stringify(blockedByIds);
    }
    if (tags !== undefined) {
      updateData.tags = JSON.stringify(tags);
    }

    const task = await prisma.packTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    // Parse JSON fields for response
    const taskWithParsedData = {
      ...task,
      blockedByIds: task.blockedByIds ? JSON.parse(task.blockedByIds) : [],
      tags: task.tags ? JSON.parse(task.tags) : [],
    };

    res.json(taskWithParsedData);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/packs/:packId/tasks/:taskId - Delete a task
router.delete('/:packId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const packId = req.params.packId as string;

    // Remove this task from other tasks' blockedByIds
    const allTasks = await prisma.packTask.findMany({
      where: {
        packId,
      },
    });

    for (const task of allTasks) {
      if (task.blockedByIds) {
        const blockedByIds = JSON.parse(task.blockedByIds);
        if (blockedByIds.includes(taskId)) {
          const updatedIds = blockedByIds.filter((id: string) => id !== taskId);
          await prisma.packTask.update({
            where: { id: task.id },
            data: { blockedByIds: JSON.stringify(updatedIds) },
          });
        }
      }
    }

    await prisma.packTask.delete({
      where: { id: taskId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/packs/:packId/tasks/:taskId/comments - Add comment to task
router.post('/:packId/tasks/:taskId/comments', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const { userId, userName, content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    if (!userId || !userName) {
      res.status(400).json({ error: 'User information is required' });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        userName,
        content,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /api/packs/:packId/tasks/:taskId/comments/:commentId - Delete comment
router.delete('/:packId/tasks/:taskId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const commentId = req.params.commentId as string;

    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/packs/:packId/tasks/bulk - Bulk create tasks (for templates)
router.post('/:packId/tasks/bulk', async (req: Request, res: Response) => {
  try {
    const packId = req.params.packId as string;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ error: 'Tasks array is required' });
      return;
    }

    // Create all tasks
    const createdTasks = await Promise.all(
      tasks.map((task, index) =>
        prisma.packTask.create({
          data: {
            packId,
            title: task.title,
            description: task.description || null,
            sortOrder: task.sortOrder !== undefined ? task.sortOrder : index,
            status: task.status || 'not_started',
            priority: task.priority || 'medium',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            category: task.category || null,
            estimatedHours: task.estimatedHours || null,
            tags: task.tags ? JSON.stringify(task.tags) : null,
            blockedByIds: task.blockedByIds ? JSON.stringify(task.blockedByIds) : null,
            assignedTo: task.assignedTo || null,
            assignedToName: task.assignedToName || null,
          },
        })
      )
    );

    // Parse JSON fields for response
    const tasksWithParsedData = createdTasks.map(task => ({
      ...task,
      blockedByIds: task.blockedByIds ? JSON.parse(task.blockedByIds) : [],
      tags: task.tags ? JSON.parse(task.tags) : [],
    }));

    res.status(201).json(tasksWithParsedData);
  } catch (error) {
    console.error('Error bulk creating tasks:', error);
    res.status(500).json({ error: 'Failed to bulk create tasks' });
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
