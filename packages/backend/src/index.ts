import express from 'express';
import cors from 'cors';
import path from 'path';
import packsRouter from './routes/packs.js';
import butlerRouter from './routes/butler.js';
import analysisRouter from './routes/analysis.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically (for debugging)
app.use('/uploads', express.static(path.join(process.cwd(), '..', '..', 'uploads')));

// API Routes
app.use('/api/packs', packsRouter);
app.use('/api/butler', butlerRouter);
app.use('/api', analysisRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`BSR Quality Checker API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
