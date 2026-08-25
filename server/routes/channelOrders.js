import { Router } from 'express';
import {
  getAllChannelOrders,
  getChannelOrderById,
} from '../controllers/channelOrderController.js';

const router = Router();

// GET /api/channel-orders          — all orders, optional ?channel= ?status=
router.get('/', getAllChannelOrders);

// GET /api/channel-orders/:id      — single order by id
router.get('/:id', getChannelOrderById);

export default router;
