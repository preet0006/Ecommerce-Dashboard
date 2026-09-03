import express from 'express';
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  markAttendance,
  getAttendanceStatus,
  checkoutAttendance,
} from '../controllers/staffController.js';

const router = express.Router();

// ── Daily Attendance Check-In & 10-Hour Lock Rule ────────────────────────────
// POST /api/staff/checkin or /api/staff/attendance — Mark daily attendance (Locked for 10 hours)
router.post('/checkin', markAttendance);
router.post('/attendance', markAttendance);

// GET /api/staff/attendance/status — Check if user is checked in and lock duration
router.get('/attendance/status', getAttendanceStatus);

// POST /api/staff/checkout — Mark shift checkout time
router.post('/checkout', checkoutAttendance);

// ── Team Roster & Members Management ─────────────────────────────────────────
// GET /api/staff — Fetch all staff members & attendance summary
router.get('/', getStaffMembers);

// POST /api/staff — Create & Register new team member / helper
router.post('/', createStaffMember);

// PUT /api/staff/:id — Update team member
router.put('/:id', updateStaffMember);

// DELETE /api/staff/:id — Delete team member
router.delete('/:id', deleteStaffMember);

export default router;
