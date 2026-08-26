import { Router } from 'express';
import {
  getSystemUsers,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  getAppSettings,
  saveAppSettings,
} from '../controllers/settingsController.js';

const router = Router();

// Team members (RBAC: Admin vs Reader)
router.get('/users', getSystemUsers);
router.post('/users', createSystemUser);
router.put('/users/:id', updateSystemUser);
router.delete('/users/:id', deleteSystemUser);

// General app settings
router.get('/general', getAppSettings);
router.post('/general', saveAppSettings);

export default router;
