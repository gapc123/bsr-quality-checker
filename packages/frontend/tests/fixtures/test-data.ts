/**
 * Test data fixtures for Playwright E2E tests
 */

export const testClient = {
  name: 'Test Client Corp',
  email: 'test@client.com',
  phone: '555-0100',
  address: '123 Test Street',
};

export const testPack = {
  name: 'Test Gateway 2 Assessment Pack',
  clientName: 'Test Client Corp',
  servicePackage: 'Gateway 2',
  template: 'Standard Assessment',
};

export const testTask = {
  title: 'Review preliminary assessment',
  description: 'Complete initial review of uploaded documents',
  status: 'pending',
  priority: 'high',
  category: 'Review',
  estimatedHours: 2,
};

export const testCredentials = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'test-password',
};

export const apiEndpoints = {
  packs: '/api/packs',
  clients: '/api/clients',
  tasks: (packId: string) => `/api/packs/${packId}/tasks`,
  versions: (packId: string) => `/api/packs/${packId}/versions`,
  matrixAssess: (packId: string, versionId: string) =>
    `/api/packs/${packId}/versions/${versionId}/matrix-assess`,
  analyzeStatus: (packId: string, versionId: string) =>
    `/api/packs/${packId}/versions/${versionId}/analyze/status`,
};
