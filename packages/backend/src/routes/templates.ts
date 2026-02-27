import { Router, Request, Response } from 'express';
import prisma from '../db/client.js';
import { applyTemplateToPack } from '../services/template-service.js';

const router = Router();

// GET /api/templates - List all templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.servicePackageTemplate.findMany({
      orderBy: { displayName: 'asc' },
    });

    // Parse JSON fields for response
    const templatesWithParsedData = templates.map((template) => ({
      ...template,
      taskTemplates: JSON.parse(template.taskTemplates),
      milestoneTemplates: template.milestoneTemplates
        ? JSON.parse(template.milestoneTemplates)
        : null,
      defaultTags: template.defaultTags ? JSON.parse(template.defaultTags) : null,
    }));

    res.json(templatesWithParsedData);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:packageType - Get specific template
router.get('/:packageType', async (req: Request, res: Response) => {
  try {
    const packageType = req.params.packageType as string;

    const template = await prisma.servicePackageTemplate.findUnique({
      where: { packageType },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Parse JSON fields for response
    const templateWithParsedData = {
      ...template,
      taskTemplates: JSON.parse(template.taskTemplates),
      milestoneTemplates: template.milestoneTemplates
        ? JSON.parse(template.milestoneTemplates)
        : null,
      defaultTags: template.defaultTags ? JSON.parse(template.defaultTags) : null,
    };

    res.json(templateWithParsedData);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates/apply - Apply template to a pack
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { packId, packageType, baseDate } = req.body;

    if (!packId || !packageType) {
      res.status(400).json({ error: 'packId and packageType are required' });
      return;
    }

    // Check if pack exists
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: { tasks: true },
    });

    if (!pack) {
      res.status(404).json({ error: 'Pack not found' });
      return;
    }

    // Optional: Check if pack already has tasks
    if (pack.tasks.length > 0) {
      res.status(400).json({
        error: 'Pack already has tasks. Clear existing tasks before applying template.',
      });
      return;
    }

    // Apply template
    const result = await applyTemplateToPack(
      packId,
      packageType,
      baseDate ? new Date(baseDate) : undefined
    );

    res.status(201).json({
      message: 'Template applied successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: error.message || 'Failed to apply template' });
  }
});

export default router;
