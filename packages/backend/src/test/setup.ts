import { beforeAll, afterAll, beforeEach } from 'vitest';
import prisma from '../db/client.js';

/**
 * Global test setup
 * Runs once before all tests
 */
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  console.log('Setting up test environment...');
});

/**
 * Global test teardown
 * Runs once after all tests
 */
afterAll(async () => {
  console.log('Tearing down test environment...');
  await prisma.$disconnect();
});

/**
 * Reset database before each test
 * This ensures test isolation
 */
beforeEach(async () => {
  // Delete all records in reverse order of dependencies
  await prisma.chunk.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.issueAction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.packStatusChange.deleteMany();
  await prisma.packVersion.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.client.deleteMany();
  await prisma.servicePackageTemplate.deleteMany();
});
