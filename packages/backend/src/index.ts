import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { CopilotRuntime, AnthropicAdapter, copilotRuntimeNodeExpressEndpoint } from '@copilotkit/runtime';
import path from 'path';
import fs from 'fs';
import packsRouter from './routes/packs.js';
import butlerRouter from './routes/butler.js';
import analysisRouter from './routes/analysis.js';
import changesRouter from './routes/changes.js';
import clientsRouter from './routes/clients.js';
import teamRouter from './routes/team.js';
import templatesRouter from './routes/templates.js';
import quickAssessRouter from './routes/quick-assess.js';
import exportRouter from './routes/export.js';
import adminRouter from './routes/admin.js';
import {
  requestIdMiddleware,
  requestLoggingMiddleware,
} from './middleware/request-logging.js';
import { errorHandler } from './utils/errors.js';
import { initializeTelegramBot } from './services/telegram.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (!isProduction) return callback(null, true);

    // In production, check allowlist
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy violation'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // Increase limit for large assessment data

// Session middleware (used by admin panel)
app.use(session({
  secret: process.env.SESSION_SECRET || 'attlee-admin-session-secret-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'lax',
  },
}));

// Passport (used by Microsoft SSO for admin panel)
app.use(passport.initialize());
app.use(passport.session());

// Request tracking and logging
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

// Increase timeout for long-running operations like matrix assessment
// Default is 120000ms (2 min), increase to 10 min for AI analysis
app.use((req, res, next) => {
  if (req.path.includes('/matrix-assess') || req.path.includes('/analyze')) {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000);
  }
  next();
});

function requireAuth(_req: express.Request, _res: express.Response, next: express.NextFunction) {
  next();
}

// Serve uploaded files statically (ONLY in development)
if (!isProduction) {
  const uploadsPath = path.join(process.cwd(), '..', '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('📁 Serving uploads directory (development mode)');
}

// Health check (public - no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint (development only)
if (!isProduction) {
  app.get('/api/debug', (_req, res) => {
    const frontendPath = path.join(process.cwd(), 'packages', 'frontend', 'dist');
    const exists = fs.existsSync(frontendPath);
    const cwd = process.cwd();
    let files: string[] = [];

    if (exists) {
      files = fs.readdirSync(frontendPath);
    }

    res.json({
      cwd,
      frontendPath,
      exists,
      files,
      isProduction,
      nodeEnv: process.env.NODE_ENV
    });
  });
}

// API Documentation (Swagger UI) - available in all environments
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BSR Quality Checker API Documentation',
}));

// OpenAPI JSON spec endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('📚 API Documentation available at /api-docs');

// CopilotKit runtime endpoint — powers the AI copilot on the results screen.
// Mounted at '/api/copilotkit'; Express strips the prefix so req.url becomes
// '/', which matches endpoint: '/'. Do NOT mount without a path prefix —
// that causes Hono to intercept all requests and return 404 for non-matching routes.
app.use('/api/copilotkit', copilotRuntimeNodeExpressEndpoint({
  runtime: new CopilotRuntime(),
  serviceAdapter: new AnthropicAdapter({ model: 'claude-sonnet-4-6' } as any),
  endpoint: '/',
}));

// Admin routes (session-based auth, separate from Clerk)
app.use('/api/admin', adminRouter);

// Protected API Routes (require authentication in production)
app.use('/api/assess', requireAuth, quickAssessRouter);
app.use('/api/packs', requireAuth, packsRouter);
app.use('/api/packs', requireAuth, changesRouter);
app.use('/api/clients', requireAuth, clientsRouter);
app.use('/api/butler', requireAuth, butlerRouter);
app.use('/api/team', requireAuth, teamRouter);
app.use('/api/templates', requireAuth, templatesRouter);
app.use('/api', requireAuth, analysisRouter);
app.use('/api', requireAuth, exportRouter);

// Serve frontend static files in production
if (isProduction) {
  // When running from /app with CMD ["node", "packages/backend/dist/index.js"]
  // Handle both cwd=/app and cwd=/app/packages/backend
  const frontendPath = process.cwd().endsWith('packages/backend')
    ? path.join(process.cwd(), '..', 'frontend', 'dist')
    : path.join(process.cwd(), 'packages', 'frontend', 'dist');

  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      }
    });
  }
}

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Initialize Telegram bot (polling + scheduled tasks)
initializeTelegramBot().catch((err) => {
  console.error('[Telegram] Failed to initialize bot:', err);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BSR Quality Checker API running on port ${PORT}`);
  console.log(`Health check: /api/health`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
  if (isProduction) {
    console.log(`Serving frontend from: ${process.cwd()}/packages/frontend/dist`);
  }
});

export default app;
