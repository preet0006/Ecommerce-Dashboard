import { db } from '../db/index.js';
import { notes } from '../db/schema.js';
import { eq, desc, and, ilike, or, not, sql } from 'drizzle-orm';

/**
 * Helper to normalize role names across frontend and backend variants
 */
function normalizeRole(role) {
  if (!role) return 'sales';
  const r = String(role).toLowerCase().trim();
  if (['sales', 'salesperson', 'field_sales', 'field sales', 'sales rep', 'sales_rep'].includes(r)) {
    return 'sales';
  }
  if (['admin', 'administrator', 'superadmin'].includes(r)) {
    return 'admin';
  }
  if (['manager', 'operations_manager', 'operations'].includes(r)) {
    return 'manager';
  }
  return r;
}

/**
 * Format raw database note row into clean response object
 */
function formatNote(n) {
  return {
    id: n.noteId || `note_${n.id}`,
    noteId: n.noteId || `note_${n.id}`,
    numericId: n.id,
    title: n.title,
    content: n.content || '',
    category: n.category || 'General',
    color: n.color || '#F3F4F6',
    priority: n.priority || 'medium',
    isPinned: Boolean(n.isPinned),
    
    // Reminders
    reminder: Boolean(n.reminder),
    reminderTime: n.reminderTime || '',
    reminderDate: n.reminderDate || '',
    
    // Author Attribution & RBAC
    authorId: n.authorId || null,
    authorName: n.authorName || 'Staff Member',
    authorRole: normalizeRole(n.authorRole || 'sales'),
    
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

/**
 * GET /api/notes — Fetch notes with strict Multi-Role RBAC Privacy Rules
 *
 * RBAC Visibility Rules:
 * 1. Admin: Sees EVERYONE's notes (Admin, Manager, and all Sales Reps).
 * 2. Manager: Sees ALL notes EXCEPT Admin notes (Manager's own + all Sales Reps; Admin notes strictly hidden).
 * 3. Salesperson: Sees ONLY their own individual notes (cannot see other sales reps, manager, or admin notes).
 */
export async function getNotes(req, res) {
  try {
    const userRole = normalizeRole(req.user?.role || req.query.role || 'sales');
    const userName = (req.user?.name || req.query.userName || req.query.name || '').trim();
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : null);
    const { category, search, reminderOnly, pinnedOnly } = req.query;

    const allRows = await db.select().from(notes).orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    // Filter rows strictly according to RBAC hierarchy
    const accessibleNotes = allRows.filter((n) => {
      const noteAuthorRole = normalizeRole(n.authorRole);
      const noteAuthorName = (n.authorName || '').trim().toLowerCase();
      const noteAuthorId = n.authorId;

      // 👑 Admin sees all notes without exception
      if (userRole === 'admin') {
        return true;
      }

      // 👔 Manager sees everything EXCEPT Admin notes
      if (userRole === 'manager') {
        return noteAuthorRole !== 'admin';
      }

      // 💼 Sales Rep sees ONLY their own notes
      if (userRole === 'sales') {
        const isMyId = userId && noteAuthorId && userId === noteAuthorId;
        const isMyName = userName && noteAuthorName && noteAuthorName === userName.toLowerCase();
        return isMyId || isMyName;
      }

      // Fallback for reader/helper
      return false;
    });

    // Apply secondary filters (category, search, reminder, pinned)
    let filtered = accessibleNotes;

    if (category && category !== 'All') {
      filtered = filtered.filter((n) => (n.category || '').toLowerCase() === category.toLowerCase());
    }

    if (pinnedOnly === 'true' || pinnedOnly === true) {
      filtered = filtered.filter((n) => Boolean(n.isPinned));
    }

    if (reminderOnly === 'true' || reminderOnly === true) {
      filtered = filtered.filter((n) => Boolean(n.reminder));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content && n.content.toLowerCase().includes(q)) ||
          (n.authorName && n.authorName.toLowerCase().includes(q)) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }

    const formattedList = filtered.map(formatNote);

    return res.json({
      role: userRole,
      total: formattedList.length,
      pinnedCount: formattedList.filter((n) => n.isPinned).length,
      reminderCount: formattedList.filter((n) => n.reminder).length,
      notes: formattedList,
    });
  } catch (err) {
    console.error('[notesController.getNotes]', err);
    return res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
}

/**
 * POST /api/notes — Create a new note with optional reminder
 */
export async function createNote(req, res) {
  try {
    const {
      title,
      content,
      category = 'General',
      color = '#F3F4F6',
      priority = 'medium',
      isPinned = false,
      reminder = false,
      reminderTime = '',
      reminderDate = '',
      authorName,
      authorRole,
      authorId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Note title is required' });
    }

    const effectiveRole = normalizeRole(req.user?.role || authorRole || req.body.role || 'sales');
    const effectiveName = (req.user?.name || authorName || req.body.name || (effectiveRole === 'admin' ? 'Admin' : effectiveRole === 'manager' ? 'Manager' : 'Sales Rep')).trim();
    const effectiveId = req.user?.id || (authorId ? parseInt(authorId, 10) : null);

    const generatedNoteId = `note_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const [inserted] = await db
      .insert(notes)
      .values({
        noteId: generatedNoteId,
        title: title.trim(),
        content: content ? content.trim() : '',
        category: category.trim(),
        color: color.trim(),
        priority: priority.toLowerCase(),
        isPinned: Boolean(isPinned),
        reminder: Boolean(reminder),
        reminderTime: reminderTime || '',
        reminderDate: reminderDate || '',
        authorId: effectiveId,
        authorName: effectiveName,
        authorRole: effectiveRole,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: formatNote(inserted),
    });
  } catch (err) {
    console.error('[notesController.createNote]', err);
    return res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
}

/**
 * PUT /api/notes/:id — Update an existing note
 */
export async function updateNote(req, res) {
  const { id } = req.params;
  const {
    title,
    content,
    category,
    color,
    priority,
    isPinned,
    reminder,
    reminderTime,
    reminderDate,
  } = req.body;

  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('note_');
    const [existing] = isNum
      ? await db.select().from(notes).where(eq(notes.id, parseInt(id, 10)))
      : await db.select().from(notes).where(eq(notes.noteId, id));

    if (!existing) {
      return res.status(404).json({ message: `Note ${id} not found` });
    }

    const userRole = normalizeRole(req.user?.role || req.body.userRole || req.query.role || 'sales');
    const userName = (req.user?.name || req.body.userName || req.query.userName || '').trim().toLowerCase();
    const userId = req.user?.id || (req.body.userId ? parseInt(req.body.userId, 10) : null);

    // Permission Verification
    if (userRole === 'sales') {
      const isMyNote = (userId && existing.authorId === userId) || (userName && existing.authorName.toLowerCase() === userName);
      if (!isMyNote) {
        return res.status(403).json({ message: 'Access denied: You can only edit your own notes.' });
      }
    } else if (userRole === 'manager') {
      if (normalizeRole(existing.authorRole) === 'admin') {
        return res.status(403).json({ message: 'Access denied: Managers cannot edit Admin notes.' });
      }
    }

    const updates = { updatedAt: new Date() };

    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content ? content.trim() : '';
    if (category !== undefined) updates.category = category.trim();
    if (color !== undefined) updates.color = color.trim();
    if (priority !== undefined) updates.priority = priority.toLowerCase();
    if (isPinned !== undefined) updates.isPinned = Boolean(isPinned);
    if (reminder !== undefined) updates.reminder = Boolean(reminder);
    if (reminderTime !== undefined) updates.reminderTime = reminderTime;
    if (reminderDate !== undefined) updates.reminderDate = reminderDate;

    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.noteId, existing.noteId))
      .returning();

    return res.json({
      success: true,
      message: 'Note updated successfully',
      note: formatNote(updated),
    });
  } catch (err) {
    console.error('[notesController.updateNote]', err);
    return res.status(500).json({ message: 'Failed to update note', error: err.message });
  }
}

/**
 * DELETE /api/notes/:id — Delete a note
 */
export async function deleteNote(req, res) {
  const { id } = req.params;

  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('note_');
    const [existing] = isNum
      ? await db.select().from(notes).where(eq(notes.id, parseInt(id, 10)))
      : await db.select().from(notes).where(eq(notes.noteId, id));

    if (!existing) {
      return res.status(404).json({ message: `Note ${id} not found` });
    }

    const userRole = normalizeRole(req.user?.role || req.body.userRole || req.query.role || 'sales');
    const userName = (req.user?.name || req.body.userName || req.query.userName || '').trim().toLowerCase();
    const userId = req.user?.id || (req.body.userId ? parseInt(req.body.userId, 10) : null);

    // Permission Verification
    if (userRole === 'sales') {
      const isMyNote = (userId && existing.authorId === userId) || (userName && existing.authorName.toLowerCase() === userName);
      if (!isMyNote) {
        return res.status(403).json({ message: 'Access denied: You can only delete your own notes.' });
      }
    } else if (userRole === 'manager') {
      if (normalizeRole(existing.authorRole) === 'admin') {
        return res.status(403).json({ message: 'Access denied: Managers cannot delete Admin notes.' });
      }
    }

    await db.delete(notes).where(eq(notes.noteId, existing.noteId));

    return res.json({
      success: true,
      message: `Note "${existing.title}" deleted successfully`,
    });
  } catch (err) {
    console.error('[notesController.deleteNote]', err);
    return res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
}

/**
 * PATCH /api/notes/:id/pin — Toggle pin status of a note
 */
export async function togglePinNote(req, res) {
  const { id } = req.params;

  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('note_');
    const [existing] = isNum
      ? await db.select().from(notes).where(eq(notes.id, parseInt(id, 10)))
      : await db.select().from(notes).where(eq(notes.noteId, id));

    if (!existing) {
      return res.status(404).json({ message: `Note ${id} not found` });
    }

    const nextPinned = !existing.isPinned;

    const [updated] = await db
      .update(notes)
      .set({ isPinned: nextPinned, updatedAt: new Date() })
      .where(eq(notes.noteId, existing.noteId))
      .returning();

    return res.json({
      success: true,
      isPinned: nextPinned,
      note: formatNote(updated),
    });
  } catch (err) {
    console.error('[notesController.togglePinNote]', err);
    return res.status(500).json({ message: 'Failed to toggle pin', error: err.message });
  }
}
