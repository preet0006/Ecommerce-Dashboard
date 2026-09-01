import express from 'express';
import {
  getTasks,
  getTaskSummary,
  getTaskById,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} from '../controllers/taskController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply optionalAuth so req.user is automatically populated from JWT if present
router.use(optionalAuth);

// GET /api/tasks — List tasks with role-based visibility & filters
router.get('/', getTasks);

// GET /api/tasks/summary (and /stats) — Task analytics and role breakdown
router.get('/summary', getTaskSummary);
router.get('/stats', getTaskSummary);

// GET /api/tasks/:id — Single task detail
router.get('/:id', getTaskById);

// POST /api/tasks — Create new task with role attribution & targeting
router.post('/', createTask);

// PUT / PATCH /api/tasks/:id — Update task details
router.put('/:id', updateTask);
router.patch('/:id', updateTask);

// PATCH /api/tasks/:id/toggle — Toggle completion status
router.patch('/:id/toggle', toggleTask);
router.post('/:id/toggle', toggleTask);

// DELETE /api/tasks/:id — Delete task
router.delete('/:id', deleteTask);

export default router;

