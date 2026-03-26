import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BSR Quality Checker API',
      version: '1.0.0',
      description: `
        API for the Building Safety Regulator (BSR) Quality Checker application.

        This API provides endpoints for:
        - Managing clients and packs
        - Uploading and analyzing building safety documents
        - Running compliance assessments against Gateway 2 requirements
        - Generating compliance reports and matrices
        - Tracking document amendments and issues

        ## Authentication

        Most endpoints require authentication via Clerk. Include the authentication token in the Authorization header:
        \`\`\`
        Authorization: Bearer <token>
        \`\`\`

        ## Rate Limiting

        Upload endpoints are rate-limited to prevent abuse:
        - Upload endpoints: 10 requests per 15 minutes
        - Analysis endpoints: 5 requests per 15 minutes
      `,
      contact: {
        name: 'BSR Quality Checker Support',
        email: 'support@example.com',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.bsr-quality-checker.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk authentication token',
        },
      },
      schemas: {
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique client identifier',
            },
            name: {
              type: 'string',
              description: 'Client name',
            },
            company: {
              type: 'string',
              nullable: true,
              description: 'Company name',
            },
            contactEmail: {
              type: 'string',
              format: 'email',
              nullable: true,
              description: 'Contact email address',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Additional notes about the client',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'name', 'createdAt', 'updatedAt'],
        },
        Pack: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique pack identifier',
            },
            name: {
              type: 'string',
              description: 'Pack name',
            },
            clientId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Associated client ID',
            },
            servicePackage: {
              type: 'string',
              enum: ['gap_assessment', 'full_pack_prep', 'compliance_review', 'ongoing_support'],
              nullable: true,
              description: 'Service package type',
            },
            status: {
              type: 'string',
              enum: ['draft', 'in_progress', 'under_review', 'client_review', 'revision_needed', 'completed', 'archived'],
              default: 'draft',
              description: 'Pack lifecycle status',
            },
            requirements: {
              type: 'string',
              nullable: true,
              description: 'Initial requirements/brief',
            },
            milestones: {
              type: 'string',
              nullable: true,
              description: 'JSON array of milestones',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'name', 'status', 'createdAt', 'updatedAt'],
        },
        PackVersion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            packId: {
              type: 'string',
              format: 'uuid',
            },
            versionNumber: {
              type: 'integer',
              description: 'Sequential version number',
            },
            projectName: {
              type: 'string',
              nullable: true,
            },
            borough: {
              type: 'string',
              nullable: true,
            },
            buildingType: {
              type: 'string',
              nullable: true,
            },
            height: {
              type: 'string',
              nullable: true,
              description: 'Building height in meters',
            },
            storeys: {
              type: 'string',
              nullable: true,
              description: 'Number of storeys',
            },
            targetDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'packId', 'versionNumber', 'createdAt'],
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            packVersionId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            libraryType: {
              type: 'string',
              enum: ['pack', 'baseline', 'butler'],
              description: 'Document library type',
            },
            filename: {
              type: 'string',
            },
            filepath: {
              type: 'string',
            },
            docType: {
              type: 'string',
              nullable: true,
              description: 'Document type classification',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'libraryType', 'filename', 'filepath', 'createdAt'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
            path: {
              type: 'string',
              description: 'Request path',
            },
            stack: {
              type: 'string',
              description: 'Stack trace (development only)',
            },
          },
          required: ['error'],
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request - invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Clients',
        description: 'Client management endpoints',
      },
      {
        name: 'Packs',
        description: 'Pack management endpoints',
      },
      {
        name: 'Analysis',
        description: 'Document analysis and compliance checking',
      },
      {
        name: 'Butler',
        description: 'Reference library management',
      },
      {
        name: 'Export',
        description: 'Report export endpoints',
      },
      {
        name: 'Changes',
        description: 'Document amendment tracking',
      },
      {
        name: 'Team',
        description: 'Team management',
      },
      {
        name: 'Templates',
        description: 'Service package templates',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
