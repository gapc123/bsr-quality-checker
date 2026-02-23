import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import packsRouter from './routes/packs.js';
import butlerRouter from './routes/butler.js';
import analysisRouter from './routes/analysis.js';
import subscriptionRouter from './routes/subscription.js';
import changesRouter from './routes/changes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Stripe webhook needs raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

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
app.use('/api/butler', butlerRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api', analysisRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
if (isProduction) {
  // When running from /app with CMD ["node", "packages/backend/dist/index.js"]
  const frontendPath = path.join(process.cwd(), 'packages', 'frontend', 'dist');

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
