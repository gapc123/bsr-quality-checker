import { Router, Request, Response } from 'express';
import prisma from '../db/client.js';

const router = Router();

// GET /api/clients - List all clients with pack counts
router.get('/', async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { packs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get single client with their packs
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        packs: {
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
        },
        _count: {
          select: { packs: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create new client
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, company, contactEmail, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        company: company?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, company, contactEmail, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        company: company?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete client (packs remain but unlinked)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.client.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
