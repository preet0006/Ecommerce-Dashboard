import express from 'express';
import { db } from '../db/index.js';
import { channelOrders, products } from '../db/schema.js';
import { sql } from 'drizzle-orm';

const router = express.Router();

// ── GET /api/dashboard/kpis ──────────────────────────────────────────────────
router.get('/kpis', async (_req, res) => {
  try {
    let totalSalesToday = 184500;
    let grossMargin = 27.4;
    let contribution = 61200;
    let inventoryValue = 2840000;
    let cashForNextPo = 950000;
    let projected30d = 4200000;

    if (db) {
      const salesResult = await db
        .select({ sum: sql`COALESCE(SUM(CAST(${channelOrders.price} AS NUMERIC) * ${channelOrders.quantity}), 0)` })
        .from(channelOrders)
        .catch(() => []);
      if (salesResult[0]?.sum > 0) {
        totalSalesToday = Math.round(Number(salesResult[0].sum));
      }

      const invResult = await db
        .select({ sum: sql`COALESCE(SUM(CAST(${products.landedCost} AS NUMERIC) * ${products.physical}), 0)` })
        .from(products)
        .catch(() => []);
      if (invResult[0]?.sum > 0) {
        inventoryValue = Math.round(Number(invResult[0].sum));
      }
    }

    res.json([
      { id: 'sales', label: "Today's sales", value: totalSalesToday, format: 'currency', delta: 6.2, tone: 'ok' },
      { id: 'margin', label: 'Gross margin', value: grossMargin, format: 'percent', delta: -1.8, tone: 'warn' },
      { id: 'contribution', label: 'Contribution', value: contribution, format: 'currency', delta: 3.1, tone: 'ok' },
      { id: 'inventory', label: 'Inventory value', value: inventoryValue, format: 'currency', delta: 0, tone: 'ok' },
      { id: 'cash', label: 'Cash for next PO', value: cashForNextPo, format: 'currency', delta: 0, tone: 'warn' },
      { id: 'forecast', label: 'Projected 30-day sales', value: projected30d, format: 'currency', delta: 4.4, tone: 'ok' },
    ]);
  } catch (err) {
    console.error('[dashboard/kpis]', err);
    res.status(500).json({ message: 'Failed to load KPIs' });
  }
});

// ── GET /api/dashboard/alerts ────────────────────────────────────────────────
router.get('/alerts', async (_req, res) => {
  try {
    const alerts = [
      { id: 1, tone: 'danger', title: 'Reorder now — Bowl Set B', detail: '14 days stock cover, below safety threshold', time: '2h ago' },
      { id: 2, tone: 'warn', title: 'Margin below target — Pet Bowl', detail: 'Contribution margin at 17%, below 20% floor', time: '4h ago' },
      { id: 3, tone: 'warn', title: 'Vendor price increased', detail: 'Anand Plastics quoted +5.2% vs last PO', time: '6h ago' },
      { id: 4, tone: 'ok', title: 'Discount opportunity', detail: 'Casserole Set A has room for 12% promo', time: '1d ago' },
      { id: 5, tone: 'danger', title: 'Slow-moving inventory', detail: 'Tiffin Combo: 92 days cover, no sale in 18d', time: '1d ago' },
    ];
    res.json(alerts);
  } catch (err) {
    console.error('[dashboard/alerts]', err);
    res.status(500).json({ message: 'Failed to load alerts' });
  }
});

// ── GET /api/dashboard/channel-margins ────────────────────────────────────────
router.get('/channel-margins', async (_req, res) => {
  try {
    const margins = [
      { channel: 'Amazon', margin: 24 },
      { channel: 'Flipkart', margin: 19 },
      { channel: 'Website', margin: 33 },
    ];
    res.json(margins);
  } catch (err) {
    console.error('[dashboard/channel-margins]', err);
    res.status(500).json({ message: 'Failed to load channel margins' });
  }
});

// ── POST /api/dashboard/what-if ──────────────────────────────────────────────
router.post('/what-if', (req, res) => {
  try {
    const { discountPct = 0, costChangePct = 0, volume = 500, basePrice = 1000, baseCost = 650 } = req.body || {};
    const newPrice = basePrice * (1 - discountPct / 100);
    const newCost = baseCost * (1 + costChangePct / 100);
    const marginPerUnit = newPrice - newCost;
    const marginPct = newPrice > 0 ? (marginPerUnit / newPrice) * 100 : 0;
    const monthlyProfit = marginPerUnit * volume;

    res.json({
      newPrice: Math.round(newPrice),
      marginPerUnit: Math.round(marginPerUnit),
      marginPct: Number(marginPct.toFixed(1)),
      monthlyProfit: Math.round(monthlyProfit),
    });
  } catch (err) {
    console.error('[dashboard/what-if]', err);
    res.status(500).json({ message: 'Failed to compute simulator result' });
  }
});

export default router;
