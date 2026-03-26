import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import clientsRouter from './clients.js';
import { errorHandler } from '../utils/errors.js';
import { createTestClient, createTestPack } from '../test/helpers.js';
import prisma from '../db/client.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/clients', clientsRouter);
app.use(errorHandler);

describe('Clients API Routes', () => {
  describe('GET /api/clients', () => {
    it('should return an empty array when no clients exist', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all clients with pack counts', async () => {
      const client1 = await createTestClient({ name: 'Client 1', company: 'Company A' });
      const client2 = await createTestClient({ name: 'Client 2', company: 'Company B' });

      // Create packs for client1
      await createTestPack(client1.id);
      await createTestPack(client1.id);

      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toHaveLength(2);

      const responseClient1 = response.body.find((c: any) => c.id === client1.id);
      const responseClient2 = response.body.find((c: any) => c.id === client2.id);

      expect(responseClient1._count.packs).toBe(2);
      expect(responseClient2._count.packs).toBe(0);
    });

    it('should return clients ordered by creation date', async () => {
      const client1 = await createTestClient({ name: 'Old Client' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const client2 = await createTestClient({ name: 'New Client' });

      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(client2.id);
      expect(response.body[1].id).toBe(client1.id);
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        name: 'John Doe',
        company: 'Acme Corp',
        contactEmail: 'john@acme.com',
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      expect(response.body).toMatchObject(clientData);
      expect(response.body.id).toBeDefined();

      // Verify in database
      const created = await prisma.client.findUnique({
        where: { id: response.body.id },
      });
      expect(created).toBeTruthy();
      expect(created?.contactEmail).toBe('john@acme.com');
    });

    it('should create a client with minimal required fields', async () => {
      const clientData = {
        name: 'Jane Smith',
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      expect(response.body.name).toBe('Jane Smith');
      expect(response.body.company).toBeNull();
      expect(response.body.contactEmail).toBeNull();
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return a client with their packs', async () => {
      const client = await createTestClient();
      const pack1 = await createTestPack(client.id, { name: 'Pack 1' });
      const pack2 = await createTestPack(client.id, { name: 'Pack 2' });

      const response = await request(app)
        .get(`/api/clients/${client.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: client.id,
        name: client.name,
      });
      expect(response.body.packs).toHaveLength(2);
      expect(response.body.packs.map((p: any) => p.id)).toContain(pack1.id);
      expect(response.body.packs.map((p: any) => p.id)).toContain(pack2.id);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client details', async () => {
      const client = await createTestClient({ name: 'Old Name' });

      const updateData = {
        name: 'New Name',
        company: 'New Company',
        contactEmail: 'new@email.com',
      };

      const response = await request(app)
        .put(`/api/clients/${client.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.company).toBe('New Company');
      expect(response.body.contactEmail).toBe('new@email.com');

      // Verify persistence
      const updated = await prisma.client.findUnique({
        where: { id: client.id },
      });
      expect(updated?.name).toBe('New Name');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .put('/api/clients/nonexistent-id')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client', async () => {
      const client = await createTestClient();

      await request(app)
        .delete(`/api/clients/${client.id}`)
        .expect(204);

      // Verify deletion
      const deleted = await prisma.client.findUnique({
        where: { id: client.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should fail to delete client with associated packs', async () => {
      const client = await createTestClient();
      await createTestPack(client.id);

      // This should fail due to foreign key constraint
      await request(app)
        .delete(`/api/clients/${client.id}`)
        .expect(500); // Will be 409 Conflict once proper error handling is added
    });
  });
});
