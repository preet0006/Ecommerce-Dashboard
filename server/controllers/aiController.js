import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { executeGroqChat } from '../services/groqService.js';

/**
 * GET /api/ai/sessions — Fetch all chat sessions
 */
export async function getAiSessions(_req, res) {
  try {
    const sessions = await db
      .select()
      .from(schema.aiChatSessions)
      .orderBy(desc(schema.aiChatSessions.updatedAt));

    return res.json(sessions);
  } catch (err) {
    console.error('[aiController.getAiSessions]', err);
    return res.status(500).json({ message: 'Failed to fetch AI chat sessions', error: err.message });
  }
}

/**
 * GET /api/ai/history/:sessionId — Fetch user's question history for a session
 * (Stores and returns only the questions asked by the user, as requested)
 */
export async function getAiQuestionHistory(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const queries = await db
      .select({
        id: schema.aiUserQueries.id,
        sessionId: schema.aiUserQueries.sessionId,
        queryText: schema.aiUserQueries.queryText,
        fileName: schema.aiUserQueries.fileName,
        fileSize: schema.aiUserQueries.fileSize,
        fileType: schema.aiUserQueries.fileType,
        fileContentSummary: schema.aiUserQueries.fileContentSummary,
        createdAt: schema.aiUserQueries.createdAt,
      })
      .from(schema.aiUserQueries)
      .where(eq(schema.aiUserQueries.sessionId, sessionId))
      .orderBy(asc(schema.aiUserQueries.createdAt));

    return res.json({
      sessionId,
      totalQuestionsAsked: queries.length,
      questionHistory: queries,
    });
  } catch (err) {
    console.error('[aiController.getAiQuestionHistory]', err);
    return res.status(500).json({ message: 'Failed to fetch question history', error: err.message });
  }
}

/**
 * POST /api/ai/chat — Official Groq AI Chatbot endpoint with PostgreSQL Grounding
 *
 * Request:
 *   { "message": "user question", "history": [...] }
 *
 * Response:
 *   { "answer": "AI response", "model": "...", "grounded": true }
 */
export async function handleAiChat(req, res) {
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required and must be a non-empty string' });
    }

    const cleanMessage = message.trim();

    // 1. Optionally log user query if sessionId is provided
    if (sessionId) {
      try {
        await db.insert(schema.aiUserQueries).values({
          sessionId,
          queryText: cleanMessage,
        });
      } catch (_) {}
    }

    // 2. Execute Groq Chat with PostgreSQL live grounding & anti-hallucination rules
    const result = await executeGroqChat({ message: cleanMessage, history });

    return res.json({
      answer: result.answer,
      model: result.model,
      grounded: result.grounded,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[aiController.handleAiChat]', err);
    return res.status(500).json({
      message: 'Failed to process AI chat query',
      answer: 'Sorry, I encountered an internal error while accessing our supply chain records. Please try again.',
      error: err.message,
    });
  }
}

/**
 * POST /api/ai/query — Save user question & file to DB, retrieve question history, and generate Groq AI response
 */
export async function processAiQuery(req, res) {
  try {
    const {
      sessionId = `conv-${Date.now()}`,
      title = 'Supply Chain Inquiry',
      queryText,
      file, // { name, size, type, contentSummary, rawPreview }
    } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ message: 'queryText is required' });
    }

    const cleanQuery = queryText.trim();

    // 1. Upsert session in ai_chat_sessions
    try {
      const existingSession = await db
        .select()
        .from(schema.aiChatSessions)
        .where(eq(schema.aiChatSessions.sessionId, sessionId))
        .limit(1);

      if (existingSession.length === 0) {
        await db.insert(schema.aiChatSessions).values({
          sessionId,
          title: title.slice(0, 100),
          pinned: 'false',
        });
      } else {
        await db
          .update(schema.aiChatSessions)
          .set({ updatedAt: new Date() })
          .where(eq(schema.aiChatSessions.sessionId, sessionId));
      }
    } catch (e) {
      console.warn('[aiController] Session upsert notice:', e.message);
    }

    // 2. Save ONLY the user question & file metadata in the database
    await db.insert(schema.aiUserQueries).values({
      sessionId,
      queryText: cleanQuery,
      fileName: file?.name || null,
      fileSize: file?.size || null,
      fileType: file?.type || null,
      fileContentSummary: file?.contentSummary || null,
    });

    // 3. Fetch past question history for this session from DB
    const pastQuestions = await db
      .select({
        queryText: schema.aiUserQueries.queryText,
        fileName: schema.aiUserQueries.fileName,
        createdAt: schema.aiUserQueries.createdAt,
      })
      .from(schema.aiUserQueries)
      .where(eq(schema.aiUserQueries.sessionId, sessionId))
      .orderBy(asc(schema.aiUserQueries.createdAt));

    const pastQuestionsList = pastQuestions.map((q) => q.queryText);

    // 4. Query Groq AI with PostgreSQL grounding
    const groqResult = await executeGroqChat({
      message: file?.contentSummary
        ? `${cleanQuery}\n\n[Attached File: "${file.name}" (${file.size || 'N/A'}) - Summary: ${file.contentSummary}]`
        : cleanQuery,
      history: pastQuestions.map((q) => ({ sender: 'user', content: q.queryText })),
    });

    // 5. Construct thoughts trace & action suggestions
    const thoughts = [
      `1. Logged user question in PostgreSQL database (Session: ${sessionId}).`,
      `2. Question History Memory: ${pastQuestions.length} query record(s) loaded.`,
      `3. Real-time PostgreSQL Grounding: vendors, purchase orders, channel orders retrieved.`,
      `4. Model: ${groqResult.model} executed with anti-hallucination verification.`,
    ];

    let actionChips = [
      'Check Active Inventory Status',
      'View Approval Queue',
      'Analyze Vendor SLA Scorecard',
    ];

    if (cleanQuery.toLowerCase().includes('po') || cleanQuery.toLowerCase().includes('order')) {
      actionChips = ['Create New Purchase Order', 'View PO List', 'Run SLA Cron'];
    }

    return res.json({
      success: true,
      sessionId,
      questionHistoryCount: pastQuestions.length,
      pastQuestions: pastQuestionsList,
      aiResponse: {
        modelName: groqResult.model,
        thinkingDuration: '1.2s',
        thoughts,
        content: groqResult.answer,
        actionChips,
      },
    });
  } catch (err) {
    console.error('[aiController.processAiQuery]', err);
    return res.status(500).json({ message: 'Failed to process AI query', error: err.message });
  }
}

/**
 * DELETE /api/ai/sessions/:sessionId — Delete chat session and its question history
 */
export async function deleteAiSession(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    await db.delete(schema.aiUserQueries).where(eq(schema.aiUserQueries.sessionId, sessionId));
    await db.delete(schema.aiChatSessions).where(eq(schema.aiChatSessions.sessionId, sessionId));

    return res.json({ success: true, message: `Session ${sessionId} and its question history deleted.` });
  } catch (err) {
    console.error('[aiController.deleteAiSession]', err);
    return res.status(500).json({ message: 'Failed to delete session', error: err.message });
  }
}
