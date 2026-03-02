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

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';


// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically (for debugging)
const uploadsPath = isProduction
  ? path.join(process.cwd(), 'uploads')
  : path.join(process.cwd(), '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/packs', packsRouter);
app.use('/api/packs', changesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/butler', butlerRouter);
app.use('/api/team', teamRouter);
app.use('/api/templates', templatesRouter);
app.use('/api', analysisRouter);

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
app.listen(PORT, () => {
  console.log(`BSR Quality Checker API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  if (isProduction) {
    console.log(`Mode: Production (serving frontend)`);
  }
});

export default app;
