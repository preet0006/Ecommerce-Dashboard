import { Router } from 'express';
import {
  createPriceChange,
  listPriceChanges,
  decideByToken,
  decideFromDashboard,
} from '../controllers/priceChangeController.js';

const router = Router();

router.post('/', createPriceChange);
router.get('/', listPriceChanges);
router.get('/:id/decide', decideByToken);       // clicked from email, returns HTML
router.post('/:id/decide', decideFromDashboard); // clicked from dashboard, returns JSON

export default router;
