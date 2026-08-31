import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import vendorRoutes from './routes/vendors.js';
import poRoutes from './routes/pos.js';
import channelOrderRoutes from './routes/channelOrders.js';
import aiRoutes from './routes/ai.js';
import settingsRoutes from './routes/settings.js';
import priceChangeRoutes from './routes/priceChanges.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import productRoutes from './routes/products.js';
import { runMockChannelSync } from './jobs/mockChannelSync.js';
import { initTables } from './db/initTables.js';
import { startVendorFollowUpCron } from './jobs/vendorFollowupCron.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true, // Allows any origin during local development
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/pos', poRoutes);
app.use('/api/channel-orders', channelOrderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/price-changes', priceChangeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);


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
app.listen(PORT, async () => {
  console.log(`✅  GreenFibre API server running on http://localhost:${PORT}`);
  console.log(`   Neon DB: ${process.env.DATABASE_URL ? '🟢 Connected' : '🔴 DATABASE_URL not set!'}`);

  // 1. Verify / initialize DB tables
  await initTables().catch((err) =>
    console.error('[initTables] Startup table check failed:', err.message)
  );

  // 2. Start daily 10-day vendor follow-up cron job
  startVendorFollowUpCron();

  // 3. Run fake channel sync on startup (stand-in for real cron/API job)
  await runMockChannelSync().catch((err) =>
    console.error('[mockChannelSync] Startup sync failed:', err.message)
  );
});
