import { Router } from 'express';
import {
  getSystemUsers,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  getAppSettings,
  saveAppSettings,
} from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Team members (RBAC: Admin vs Reader)
router.get('/users', getSystemUsers);
router.post('/users', requireAuth, requireRole('admin'), createSystemUser);
router.put('/users/:id', requireAuth, requireRole('admin'), updateSystemUser);
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteSystemUser);

// General app settings
router.get('/general', getAppSettings);
router.post('/general', saveAppSettings);

export default router;

