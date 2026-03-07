import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';


// Middleware
app.use(cors());
app.use(express.json());

// Increase timeout for long-running operations like matrix assessment
// Default is 120000ms (2 min), increase to 10 min for AI analysis
app.use((req, res, next) => {
  if (req.path.includes('/matrix-assess') || req.path.includes('/analyze')) {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000);
  }
  next();
});

// Serve uploaded files statically (for debugging)
const uploadsPath = isProduction
  ? path.join(process.cwd(), 'uploads')
  : path.join(process.cwd(), '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/assess', quickAssessRouter);
app.use('/api/packs', packsRouter);
app.use('/api/packs', changesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/butler', butlerRouter);
app.use('/api/team', teamRouter);
app.use('/api/templates', templatesRouter);
app.use('/api', analysisRouter);
app.use('/api', exportRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check frontend path
app.get('/api/debug', (req, res) => {
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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
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
