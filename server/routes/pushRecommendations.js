import { Router } from 'express';
import {
  generateRecommendations,
  listRecommendations,
  updateRecommendationStatus,
  decideByToken,
  resendPushRecommendationsEmail,
} from '../controllers/pushRecommendationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public token decision route (clicked directly from email)
router.get('/:id/decide', decideByToken);

// Protected routes (require user login / bearer token)
router.post('/generate', requireAuth, generateRecommendations);
router.post('/resend', requireAuth, resendPushRecommendationsEmail);
router.get('/', requireAuth, listRecommendations);
router.patch('/:id', requireAuth, updateRecommendationStatus);

export default router;
