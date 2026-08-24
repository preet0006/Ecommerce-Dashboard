import { Router } from 'express';
import { sendPoEmail, sendPoToAll } from '../controllers/poController.js';

const router = Router();

// POST /api/pos/send-email — Send PO to a single vendor
router.post('/send-email', sendPoEmail);

// POST /api/pos/send-all — Send PO to all or multiple vendors
router.post('/send-all', sendPoToAll);

export default router;
