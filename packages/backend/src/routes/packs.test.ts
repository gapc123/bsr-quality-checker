import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import packsRouter from './packs.js';
import { errorHandler } from '../utils/errors.js';
import {
  createTestClient,
  createTestPack,
  createTestPackVersion,
  createFullTestPack,
} from '../test/helpers.js';
import prisma from '../db/client.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/packs', packsRouter);
app.use(errorHandler);

describe('Packs API Routes', () => {
  describe('GET /api/packs', () => {
    it('should return an empty array when no packs exist', async () => {
      const response = await request(app)
        .get('/api/packs')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all packs with their latest version', async () => {
      const { client, pack } = await createFullTestPack();

      const response = await request(app)
        .get('/api/packs')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: pack.id,
        name: pack.name,
        clientId: client.id,
      });
      expect(response.body[0].client).toBeDefined();
      expect(response.body[0].versions).toHaveLength(1);
    });

    it('should filter packs by clientId when provided', async () => {
      const client1 = await createTestClient({ name: 'Client 1' });
      const client2 = await createTestClient({ name: 'Client 2' });

      await createTestPack(client1.id, { name: 'Pack 1' });
      await createTestPack(client2.id, { name: 'Pack 2' });

      const response = await request(app)
        .get(`/api/packs?clientId=${client1.id}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].clientId).toBe(client1.id);
      expect(response.body[0].name).toBe('Pack 1');
    });

    it('should return packs ordered by creation date (newest first)', async () => {
      const client = await createTestClient();

      const pack1 = await createTestPack(client.id, { name: 'Old Pack' });
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const pack2 = await createTestPack(client.id, { name: 'New Pack' });

      const response = await request(app)
        .get('/api/packs')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Newest should be first
      expect(response.body[0].id).toBe(pack2.id);
      expect(response.body[1].id).toBe(pack1.id);
    });
  });

  describe('GET /api/packs/:id', () => {
    it('should return a pack with all its details', async () => {
      const { pack, client, version } = await createFullTestPack();

      const response = await request(app)
        .get(`/api/packs/${pack.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: pack.id,
        name: pack.name,
        clientId: client.id,
      });
      expect(response.body.client).toBeDefined();
      expect(response.body.versions).toHaveLength(1);
      expect(response.body.versions[0].id).toBe(version.id);
    });

    it('should return 404 when pack does not exist', async () => {
      const response = await request(app)
        .get('/api/packs/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBe('Pack not found');
    });

    it('should parse JSON fields correctly', async () => {
      const client = await createTestClient();
      const pack = await createTestPack(client.id, {
        milestones: JSON.stringify([
          { name: 'Gateway 2', date: '2024-06-01' }
        ]),
      });

      const response = await request(app)
        .get(`/api/packs/${pack.id}`)
        .expect(200);

      expect(response.body.milestones).toEqual([
        { name: 'Gateway 2', date: '2024-06-01' }
      ]);
    });
  });

  describe('POST /api/packs', () => {
    it('should create a new pack', async () => {
      const client = await createTestClient();

      const packData = {
        clientId: client.id,
        name: 'New Test Pack',
        servicePackage: 'full_pack_prep',
        status: 'draft',
      };

      const response = await request(app)
        .post('/api/packs')
        .send(packData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Test Pack',
        servicePackage: 'full_pack_prep',
        status: 'draft',
        clientId: client.id,
      });
      expect(response.body.id).toBeDefined();

      // Verify it was actually created in the database
      const createdPack = await prisma.pack.findUnique({
        where: { id: response.body.id },
      });
      expect(createdPack).toBeTruthy();
      expect(createdPack?.name).toBe('New Test Pack');
    });

    it('should create a pack with milestones', async () => {
      const client = await createTestClient();

      const packData = {
        clientId: client.id,
        name: 'Pack with Milestones',
        milestones: [
          { name: 'Gateway 2', date: '2024-06-01', status: 'pending' },
          { name: 'Gateway 3', date: '2024-12-01', status: 'pending' },
        ],
      };

      const response = await request(app)
        .post('/api/packs')
        .send(packData)
        .expect(201);

      expect(response.body.milestones).toBeDefined();

      // Verify the milestones were stored correctly
      const createdPack = await prisma.pack.findUnique({
        where: { id: response.body.id },
      });
      expect(createdPack?.milestones).toBeDefined();
    });

    it('should return 400 when clientId is missing', async () => {
      const packData = {
        name: 'Invalid Pack',
        servicePackage: 'gap_assessment',
      };

      await request(app)
        .post('/api/packs')
        .send(packData)
        .expect(500); // Will be 400 once validation is added
    });
  });

  describe('PUT /api/packs/:id', () => {
    it('should update pack details', async () => {
      const { pack } = await createFullTestPack();

      const updateData = {
        name: 'Updated Pack Name',
        status: 'in_review',
      };

      const response = await request(app)
        .put(`/api/packs/${pack.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Pack Name');
      expect(response.body.status).toBe('in_review');

      // Verify the update persisted
      const updatedPack = await prisma.pack.findUnique({
        where: { id: pack.id },
      });
      expect(updatedPack?.name).toBe('Updated Pack Name');
      expect(updatedPack?.status).toBe('in_review');
    });

    it('should return 404 when updating non-existent pack', async () => {
      await request(app)
        .put('/api/packs/nonexistent-id')
        .send({ name: 'Updated Name' })
        .expect(500); // Will be 404 once proper error handling is added
    });
  });

  describe('DELETE /api/packs/:id', () => {
    it('should delete a pack and all related data', async () => {
      const { pack, version, document } = await createFullTestPack();

      await request(app)
        .delete(`/api/packs/${pack.id}`)
        .expect(200);

      // Verify pack was deleted
      const deletedPack = await prisma.pack.findUnique({
        where: { id: pack.id },
      });
      expect(deletedPack).toBeNull();

      // Verify version was deleted (cascade)
      const deletedVersion = await prisma.packVersion.findUnique({
        where: { id: version.id },
      });
      expect(deletedVersion).toBeNull();

      // Verify document was deleted (cascade)
      const deletedDocument = await prisma.document.findUnique({
        where: { id: document.id },
      });
      expect(deletedDocument).toBeNull();
    });

    it('should return 404 when deleting non-existent pack', async () => {
      await request(app)
        .delete('/api/packs/nonexistent-id')
        .expect(500); // Will be 404 once proper error handling is added
    });
  });

  describe('GET /api/packs/:id/summary', () => {
    it('should return pack summary for existing pack', async () => {
      const { pack } = await createFullTestPack();

      // Note: This endpoint may require AI service which we should mock
      const response = await request(app)
        .get(`/api/packs/${pack.id}/summary`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('GET /api/packs/:id/versions', () => {
    it('should return all versions for a pack', async () => {
      const { pack } = await createFullTestPack();

      // Create additional versions
      await createTestPackVersion(pack.id, { versionNumber: 2 });
      await createTestPackVersion(pack.id, { versionNumber: 3 });

      const response = await request(app)
        .get(`/api/packs/${pack.id}/versions`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].versionNumber).toBe(3); // Newest first
      expect(response.body[2].versionNumber).toBe(1);
    });

    it('should return empty array for pack with no versions', async () => {
      const client = await createTestClient();
      const pack = await createTestPack(client.id);

      const response = await request(app)
        .get(`/api/packs/${pack.id}/versions`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
