# API Testing Guide

This directory contains the test infrastructure for the BSR Quality Checker backend API.

## Test Structure

```
src/
├── test/
│   ├── setup.ts       # Global test setup/teardown
│   ├── helpers.ts     # Test data factories and utilities
│   └── README.md      # This file
└── routes/
    ├── packs.test.ts       # Tests for /api/packs endpoints
    ├── clients.test.ts     # Tests for /api/clients endpoints
    ├── analysis.test.ts    # Tests for /api/analysis endpoints
    └── [other routes].test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- packs.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Setup

### Automatic Database Reset

The `setup.ts` file automatically:
- Clears all database tables before each test
- Ensures test isolation
- Disconnects from the database after all tests

### Test Factories

Use the helper functions in `helpers.ts` to create test data:

```typescript
import {
  createTestClient,
  createTestPack,
  createTestPackVersion,
  createTestDocument,
  createFullTestPack,
} from '../test/helpers.js';

// Create individual entities
const client = await createTestClient({ name: 'Custom Name' });
const pack = await createTestPack(client.id);
const version = await createTestPackVersion(pack.id);

// Create a complete pack hierarchy
const { client, pack, version, document } = await createFullTestPack();
```

## Writing New Tests

### Basic Route Test Example

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import myRouter from './my-route.js';
import { errorHandler } from '../utils/errors.js';
import { createTestClient } from '../test/helpers.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/my-route', myRouter);
app.use(errorHandler);

describe('My Route API', () => {
  describe('GET /api/my-route', () => {
    it('should return data', async () => {
      const response = await request(app)
        .get('/api/my-route')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
```

### Testing Error Cases

```typescript
it('should return 404 when resource not found', async () => {
  const response = await request(app)
    .get('/api/packs/nonexistent-id')
    .expect(404);

  expect(response.body.error).toBe('Pack not found');
});
```

### Testing with Authentication

For routes requiring authentication, mock the Clerk middleware:

```typescript
// TODO: Implement auth mocking when needed
// For now, test unauthenticated routes
```

## Test Coverage Goals

Each API route should have tests for:
- ✅ Successful responses (200, 201, 204)
- ✅ Error responses (400, 404, 500)
- ✅ Database persistence verification
- ✅ Data validation
- ✅ Query parameters/filters
- ✅ Request body validation

## Current Test Status

### Completed
- ✅ Packs API (`/api/packs`) - 10 tests
- ✅ Clients API (`/api/clients`) - 9 tests
- ✅ Analysis API (`/api/analysis`) - 4 tests (basic structure)

### Pending
- ⏳ Butler API (`/api/butler`)
- ⏳ Export API (`/api/export`)
- ⏳ Changes API (`/api/changes`)
- ⏳ Team API (`/api/team`)
- ⏳ Templates API (`/api/templates`)
- ⏳ Quick Assess API (`/api/quick-assess`)

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, specific test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Database Cleanup**: Rely on automatic cleanup in setup.ts
5. **Test Data**: Use factories from helpers.ts
6. **Error Cases**: Always test both success and failure paths

## Troubleshooting

### Tests Failing Due to Database Issues

Ensure your DATABASE_URL is set correctly in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
```

For development, you can use SQLite:
```
DATABASE_URL="file:./test.db"
```

### Type Errors

Run TypeScript check before testing:
```bash
npx tsc --noEmit
```

### Slow Tests

Tests run sequentially to avoid database conflicts. If tests are slow:
- Reduce the number of database operations
- Use `createFullTestPack()` instead of creating entities separately
- Mock external services (AI, file uploads, etc.)
