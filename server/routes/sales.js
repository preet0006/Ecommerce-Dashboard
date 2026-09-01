import express from 'express';
import {
  updateLocation,
  getLiveLocations,
  getSalesOrders,
  createSalesOrder,
  getSalesVisits,
  createSalesVisit,
} from '../controllers/salesLocationController.js';

const router = express.Router();

// ── GPS Telemetry & Fleet Tracking ──────────────────────────────────────────
// POST /api/sales/location — Sales rep sends live coordinates
router.post('/location', updateLocation);

// GET /api/sales/locations — Admin & Manager fetch live sales rep positions
router.get('/locations', getLiveLocations);
router.get('/team', getLiveLocations);

// ── Field Sales Orders ───────────────────────────────────────────────────────
// GET /api/sales/orders — Fetch sales orders
router.get('/orders', getSalesOrders);

// POST /api/sales/orders — Create sales order
router.post('/orders', createSalesOrder);

// ── Client Visits & Route Stops ──────────────────────────────────────────────
// GET /api/sales/visits — Fetch scheduled visits
router.get('/visits', getSalesVisits);

// POST /api/sales/visits — Schedule client visit
router.post('/visits', createSalesVisit);

export default router;

