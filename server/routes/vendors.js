import { Router } from 'express';
import {
  getAllVendors,
  getVendorById,
  getVendorCodes,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController.js';

const router = Router();

// GET /api/vendors/codes  — lightweight list for dropdowns (must be before /:id)
router.get('/codes', getVendorCodes);

// GET /api/vendors
router.get('/', getAllVendors);

// GET /api/vendors/:id
router.get('/:id', getVendorById);

// POST /api/vendors
router.post('/', createVendor);

// PUT /api/vendors/:id
router.put('/:id', updateVendor);

// DELETE /api/vendors/:id
router.delete('/:id', deleteVendor);

export default router;
