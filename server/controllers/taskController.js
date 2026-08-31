import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/tasks — Fetch all tasks from Neon PostgreSQL
 */
export async function getTasks(_req, res) {
  try {
    const list = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const formatted = list.map((t) => ({
      id: t.taskId || `t_${t.id}`,
      title: t.title,
      description: t.description || '',
      dueDate: t.dueDate || new Date().toISOString(),
      priority: t.priority || 'medium',
      completed: t.completed || false,
      reminder: t.reminder ?? true,
      reminderTime: t.reminderTime || '',
      assignedTo: t.assignedTo || 'You',
    }));
    return res.json(formatted);
  } catch (err) {
    console.error('[taskController.getTasks]', err);
    return res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
}

/**
 * POST /api/tasks — Create task with reminder date & time in Neon DB
 */
export async function createTask(req, res) {
  const { title, description, reminder, reminderTime, dueDate, priority, assignedTo } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const generatedTaskId = `t_${Date.now()}`;
  try {
    const [inserted] = await db
      .insert(tasks)
      .values({
        taskId: generatedTaskId,
        title: title.trim(),
        description: description ? description.trim() : '',
        reminder: reminder ?? true,
        reminderTime: reminderTime || '',
        dueDate: dueDate || new Date().toISOString(),
        priority: priority || 'medium',
        completed: false,
        assignedTo: assignedTo || 'You',
      })
      .returning();

    return res.status(201).json({
      id: inserted.taskId,
      title: inserted.title,
      description: inserted.description,
      dueDate: inserted.dueDate,
      priority: inserted.priority,
      completed: inserted.completed,
      reminder: inserted.reminder,
      reminderTime: inserted.reminderTime,
      assignedTo: inserted.assignedTo,
    });
  } catch (err) {
    console.error('[taskController.createTask]', err);
    return res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
}

/**
 * PATCH /api/tasks/:id/toggle — Toggle task completion status
 */
export async function toggleTask(req, res) {
  const { id } = req.params;
  try {
    const [existing] = await db.select().from(tasks).where(eq(tasks.taskId, id));
    if (existing) {
      await db
        .update(tasks)
        .set({ completed: !existing.completed, updatedAt: new Date() })
        .where(eq(tasks.taskId, id));
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[taskController.toggleTask]', err);
    return res.status(500).json({ message: 'Failed to toggle task', error: err.message });
  }
}

/**
 * DELETE /api/tasks/:id — Delete task
 */
export async function deleteTask(req, res) {
  const { id } = req.params;
  try {
    await db.delete(tasks).where(eq(tasks.taskId, id));
    return res.json({ success: true });
  } catch (err) {
    console.error('[taskController.deleteTask]', err);
    return res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
}
