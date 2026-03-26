import prisma from '../db/client.js';
import { Client, Pack, PackVersion } from '@prisma/client';

/**
 * Test data factories for creating test fixtures
 */

export async function createTestClient(data?: Partial<Client>): Promise<Client> {
  return await prisma.client.create({
    data: {
      name: data?.name || 'Test Client',
      company: data?.company || 'Test Company',
      contactEmail: data?.contactEmail || 'test@example.com',
      ...data,
    },
  });
}

export async function createTestPack(
  clientId: string,
  data?: Partial<Pack>
): Promise<Pack> {
  return await prisma.pack.create({
    data: {
      clientId,
      name: data?.name || 'Test Pack',
      servicePackage: data?.servicePackage || 'gap_assessment',
      status: data?.status || 'draft',
      ...data,
    },
  });
}

export async function createTestPackVersion(
  packId: string,
  data?: Partial<PackVersion>
): Promise<PackVersion> {
  // Get the next version number
  const existingVersions = await prisma.packVersion.count({
    where: { packId },
  });

  return await prisma.packVersion.create({
    data: {
      packId,
      versionNumber: data?.versionNumber || existingVersions + 1,
      projectName: data?.projectName || 'Test Project',
      borough: data?.borough || 'Westminster',
      buildingType: data?.buildingType || 'Residential',
      height: data?.height || '25.0',
      storeys: data?.storeys || '8',
      ...data,
    },
  });
}

export async function createTestDocument(
  packVersionId: string,
  data?: Partial<{
    filename: string;
    filepath: string;
    docType: string;
    libraryType: string;
  }>
) {
  return await prisma.document.create({
    data: {
      packVersionId,
      filename: data?.filename || 'test-document.pdf',
      filepath: data?.filepath || '/uploads/test-document.pdf',
      docType: data?.docType || 'fire_strategy',
      libraryType: data?.libraryType || 'pack',
      ...data,
    },
  });
}

/**
 * Create a full test pack with client, pack, version, and documents
 */
export async function createFullTestPack() {
  const client = await createTestClient();
  const pack = await createTestPack(client.id);
  const version = await createTestPackVersion(pack.id);
  const document = await createTestDocument(version.id);

  return { client, pack, version, document };
}

/**
 * Mock authentication middleware bypass
 * For testing routes that require authentication
 */
export function mockAuthBypass() {
  // In a real implementation, you might want to:
  // 1. Mock the Clerk authentication
  // 2. Set test user in req.auth
  // For now, we'll test unauthenticated routes
}
