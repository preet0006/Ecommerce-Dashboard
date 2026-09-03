import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
} from '../controllers/notesController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notes — Fetch notes scoped to current user role and permissions
router.get('/', optionalAuth, getNotes);

// POST /api/notes — Create a new note / task note with reminder
router.post('/', optionalAuth, createNote);

// PUT /api/notes/:id or PATCH /api/notes/:id — Update existing note
router.put('/:id', optionalAuth, updateNote);
router.patch('/:id', optionalAuth, updateNote);

// PATCH /api/notes/:id/pin — Toggle pin status
router.patch('/:id/pin', optionalAuth, togglePinNote);

// DELETE /api/notes/:id — Delete note
router.delete('/:id', optionalAuth, deleteNote);

export default router;
