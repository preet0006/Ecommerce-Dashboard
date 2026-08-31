import express from 'express';
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from '../controllers/staffController.js';

const router = express.Router();

// GET /api/staff — Fetch all staff members & attendance summary
router.get('/', getStaffMembers);

// POST /api/staff — Create & Register new team member / helper
router.post('/', createStaffMember);

// PUT /api/staff/:id — Update team member
router.put('/:id', updateStaffMember);

// DELETE /api/staff/:id — Delete team member
router.delete('/:id', deleteStaffMember);

export default router;
