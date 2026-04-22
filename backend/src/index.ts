import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middleware';
import authRoutes from './routes/auth';
import institutionRoutes from './routes/institutions';
import studentRoutes from './routes/students';
import resultRoutes from './routes/results';
import analyticsRoutes from './routes/analytics';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000');

// ── Rate limiter ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/results',      resultRoutes);
app.use('/api/analytics',    analyticsRoutes);

// ── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ActionMetrics API → http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
