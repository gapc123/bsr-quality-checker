# BSR Quality Checker API Documentation

## Overview

The BSR Quality Checker API provides endpoints for managing building safety documentation and compliance assessments against the Building Safety Regulator Gateway 2 requirements.

## Accessing the Documentation

### Interactive Documentation (Swagger UI)

When the server is running, visit:
- **Development:** http://localhost:3001/api-docs
- **Production:** https://your-domain.com/api-docs

The Swagger UI provides:
- Interactive API exploration
- Request/response examples
- Try-it-out functionality
- Schema definitions

### OpenAPI Specification

The raw OpenAPI 3.0 specification is available at:
- **JSON format:** http://localhost:3001/api-docs.json

You can import this into tools like:
- Postman
- Insomnia
- API testing frameworks
- Code generators

## Authentication

Most endpoints require authentication via Clerk:

```http
Authorization: Bearer <your-jwt-token>
```

### Public Endpoints

The following endpoints are publicly accessible:
- `GET /api/health` - Health check
- `GET /api-docs` - API documentation
- `GET /api-docs.json` - OpenAPI spec

## Rate Limiting

To prevent abuse, certain endpoints have rate limits:

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/*/upload` | 10 requests | 15 minutes |
| `/api/analysis/*` | 5 requests | 15 minutes |

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

## API Endpoints

### Clients (`/api/clients`)

Manage client records for agency workflow.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients |
| GET | `/api/clients/:id` | Get client by ID |
| POST | `/api/clients` | Create new client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |
| GET | `/api/clients/:id/summary` | Get AI-generated client summary |

### Packs (`/api/packs`)

Manage building safety documentation packs.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packs` | List all packs (filter by ?clientId) |
| GET | `/api/packs/:id` | Get pack by ID |
| POST | `/api/packs` | Create new pack |
| PUT | `/api/packs/:id` | Update pack |
| DELETE | `/api/packs/:id` | Delete pack |
| GET | `/api/packs/:id/versions` | List pack versions |
| POST | `/api/packs/:id/versions` | Upload new version (multipart/form-data) |

### Analysis (`/api/analysis`)

Run compliance assessments against Gateway 2 requirements.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/:versionId` | Start analysis for a pack version |
| GET | `/api/analysis/:versionId/status` | Get analysis status |
| GET | `/api/analysis/:versionId/results` | Get analysis results |
| POST | `/api/analysis/:versionId/cancel` | Cancel running analysis |

### Butler Library (`/api/butler`)

Manage reference document library.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/butler` | List butler documents |
| POST | `/api/butler/upload` | Upload reference document |
| DELETE | `/api/butler/:documentId` | Delete document |

### Export (`/api/export`)

Generate and download compliance reports.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/:versionId/pdf` | Download PDF report |
| GET | `/api/export/:versionId/json` | Download JSON results |
| GET | `/api/export/:versionId/excel` | Download Excel matrix |

### Changes (`/api/changes`)

Track document amendments and revisions.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packs/:packId/changes` | List tracked changes |
| POST | `/api/packs/:packId/changes` | Create change tracking |
| PUT | `/api/packs/:packId/changes/:changeId` | Update change |

### Team (`/api/team`)

Manage team members and assignments.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team/members` | List team members |
| POST | `/api/team/members` | Add team member |
| PUT | `/api/team/members/:userId` | Update member |

### Templates (`/api/templates`)

Service package templates for creating standardized workflows.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:packageType` | Get specific template |
| POST | `/api/templates` | Create new template |

## Request/Response Formats

### Standard Response Format

Success responses (2xx):
```json
{
  "id": "uuid",
  "name": "Resource Name",
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

Error responses (4xx, 5xx):
```json
{
  "error": "Human-readable error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/packs/invalid-id"
}
```

In development, error responses also include:
```json
{
  "error": "Error message",
  "stack": "Error: ...\n    at ..."
}
```

### File Uploads

File upload endpoints use `multipart/form-data`:

```http
POST /api/packs/:packId/versions
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="files"; filename="fire-strategy.pdf"
Content-Type: application/pdf

<binary PDF data>
--boundary
Content-Disposition: form-data; name="address"

123 High Street
--boundary--
```

**Requirements:**
- File type: PDF only
- Max file size: 50MB per file
- Multiple files supported
- Filenames automatically sanitized

## Common Workflows

### 1. Create Client and Pack

```bash
# 1. Create client
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "contactEmail": "contact@acme.com"}'

# 2. Create pack for client
curl -X POST http://localhost:3001/api/packs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Westminster Tower",
    "clientId": "client-uuid-from-step-1",
    "servicePackage": "full_pack_prep"
  }'
```

### 2. Upload Documents and Analyze

```bash
# 1. Upload documents (creates version automatically)
curl -X POST http://localhost:3001/api/packs/$PACK_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@fire-strategy.pdf" \
  -F "files=@structural-design.pdf" \
  -F "address=123 High Street" \
  -F "height=25.5" \
  -F "storeys=8"

# 2. Start compliance analysis
curl -X POST http://localhost:3001/api/analysis/$VERSION_ID \
  -H "Authorization: Bearer $TOKEN"

# 3. Check analysis status
curl http://localhost:3001/api/analysis/$VERSION_ID/status \
  -H "Authorization: Bearer $TOKEN"

# 4. Get results
curl http://localhost:3001/api/analysis/$VERSION_ID/results \
  -H "Authorization: Bearer $TOKEN"

# 5. Download PDF report
curl http://localhost:3001/api/export/$VERSION_ID/pdf \
  -H "Authorization: Bearer $TOKEN" \
  -o compliance-report.pdf
```

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid data format |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, constraint violation |
| 422 | Validation Error | Data failed validation rules |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error, check logs |

## Adding New Documentation

When adding new endpoints, include OpenAPI annotations:

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   post:
 *     tags:
 *       - YourTag
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/your-endpoint', async (req, res) => {
  // Implementation
});
```

The documentation will automatically appear in Swagger UI.

## Support

For API issues or questions:
- Check the Swagger UI for interactive examples
- Review the error response for details
- Contact: support@example.com
