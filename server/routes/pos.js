import { Router } from 'express';
import {
  getAllPos,
  getApprovalQueue,
  getPendingDeliveryChecks,
  createPo,
  confirmPo,
  rejectPo,
  recordDeliveryArrival,
  getVendorPerformanceScoreboard,
  runFollowUpCronManually,
  sendPoEmail,
  sendPoToAll,
} from '../controllers/poController.js';

const router = Router();

// GET /api/pos — List all purchase orders (status: confirmed, etc.)
router.get('/', getAllPos);

// POST /api/pos — Create new PO + email vendor + store in DB (status: pending)
router.post('/', createPo);
router.post('/create', createPo);

// GET /api/pos/approval-queue — Get pending purchase orders (status: pending)
router.get('/approval-queue', getApprovalQueue);

// GET /api/pos/pending-deliveries — Get confirmed orders pending delivery arrival check
router.get('/pending-deliveries', getPendingDeliveryChecks);

// POST /api/pos/:id/record-delivery — Record delivery arrival (On Time vs Late in days)
router.post('/:id/record-delivery', recordDeliveryArrival);

// GET /api/pos/vendor-scoreboard — Vendor Performance Scoreboard by SKU & Vendor
router.get('/vendor-scoreboard', getVendorPerformanceScoreboard);

// POST /api/pos/:id/confirm (or approve) — Confirm PO (status -> confirmed)
router.post('/:id/confirm', confirmPo);
router.post('/:id/approve', confirmPo);
router.put('/:id/confirm', confirmPo);
router.put('/:id/approve', confirmPo);

// POST /api/pos/:id/reject — Reject PO (status -> rejected with reason)
router.post('/:id/reject', rejectPo);

// POST /api/pos/run-followup-cron — Manually run/test the 10-day cron check
router.post('/run-followup-cron', runFollowUpCronManually);
router.get('/run-followup-cron', runFollowUpCronManually);

// Email dispatch endpoints
router.post('/send-email', sendPoEmail);
router.post('/send-all', sendPoToAll);

export default router;
