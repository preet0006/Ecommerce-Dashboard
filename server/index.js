import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import vendorRoutes from './routes/vendors.js';
import poRoutes from './routes/pos.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'], // Vite dev + preview ports
  credentials: true,
}));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/vendors', vendorRoutes);
app.use('/api/pos', poRoutes);

// ── 404 fallback ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ message: 'Internal server error', error: err?.message });
});

// ── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  GreenFibre API server running on http://localhost:${PORT}`);
  console.log(`   Neon DB: ${process.env.DATABASE_URL ? '🟢 Connected' : '🔴 DATABASE_URL not set!'}`);
});
