import { Router } from 'express';
import {
  getAiSessions,
  getAiQuestionHistory,
  processAiQuery,
  deleteAiSession,
  handleAiChat,
} from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/chat — Official Groq AI Chatbot endpoint with PostgreSQL Grounding
router.post('/chat', handleAiChat);

// GET /api/ai/sessions — List all saved chat sessions
router.get('/sessions', getAiSessions);

// GET /api/ai/history/:sessionId — Fetch user's question history for a session
router.get('/history/:sessionId', getAiQuestionHistory);

// POST /api/ai/query — Save user question & file to DB and return Groq AI response
router.post('/query', processAiQuery);

// DELETE /api/ai/sessions/:sessionId — Delete session & question history
router.delete('/sessions/:sessionId', deleteAiSession);

export default router;
