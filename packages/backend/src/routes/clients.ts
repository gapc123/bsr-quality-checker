import { Router, Request, Response } from 'express';
import prisma from '../db/client.js';
import { getClientSummary } from '../services/ai-summary.js';
import { sendNewOrgNotification } from '../services/telegram.js';

const router = Router();

/**
 * @openapi
 * /api/clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: List all clients
 *     description: Retrieve all clients with their pack counts, ordered by creation date (newest first)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Client'
 *                   - type: object
 *                     properties:
 *                       _count:
 *                         type: object
 *                         properties:
 *                           packs:
 *                             type: integer
 *                             description: Number of packs for this client
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (_req: Request, res: Response) => {
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

/**
 * @openapi
 * /api/clients/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client by ID
 *     description: Retrieve a single client with all their packs and pack details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully retrieved client
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Client'
 *                 - type: object
 *                   properties:
 *                     packs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Pack'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        packs: {
          include: {
            tasks: {
              orderBy: { sortOrder: 'asc' },
            },
            versions: {
              select: {
                id: true,
                versionNumber: true,
                createdAt: true,
                matrixAssessment: true,
              },
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
            _count: {
              select: { versions: true, tasks: true },
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

// GET /api/clients/:id/summary - Get AI summary for client
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const refresh = req.query.refresh === 'true';

    const result = await getClientSummary(id, refresh);
    res.json(result);
  } catch (error) {
    console.error('Error getting client summary:', error);
    res.status(500).json({ error: 'Failed to get client summary' });
  }
});

/**
 * @openapi
 * /api/clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Create a new client
 *     description: Create a new client record
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Client name
 *                 example: John Smith
 *               company:
 *                 type: string
 *                 nullable: true
 *                 description: Company name
 *                 example: Acme Corp
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Contact email
 *                 example: john@acme.com
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

    sendNewOrgNotification(client.name).catch(() => {});

    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

/**
 * @openapi
 * /api/clients/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Update client
 *     description: Update an existing client's information
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               company:
 *                 type: string
 *                 nullable: true
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @openapi
 * /api/clients/{id}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Delete client
 *     description: Delete a client. Associated packs will remain but become unlinked.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Client deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
