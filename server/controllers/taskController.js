import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { eq, or, desc, and, ilike, sql } from 'drizzle-orm';

/**
 * Format raw database task row into clean response object
 */
function formatTask(t) {
  return {
    id: t.taskId || `t_${t.id}`,
    taskId: t.taskId || `t_${t.id}`,
    numericId: t.id,
    title: t.title,
    description: t.description || '',
    dueDate: t.dueDate || new Date().toISOString(),
    priority: t.priority || 'medium',
    completed: Boolean(t.completed),
    completedAt: t.completedAt || null,
    status: t.status || (t.completed ? 'completed' : 'pending'),
    reminder: t.reminder ?? true,
    reminderTime: t.reminderTime || '',
    
    // Creator Info
    createdBy: t.createdBy || 'Admin',
    createdById: t.createdById || null,
    createdByRole: (t.createdByRole || 'admin').toLowerCase(),
    
    // Assignee & Target Info
    assignedTo: t.assignedTo || 'You',
    assignedToId: t.assignedToId || null,
    assignedToRole: (t.assignedToRole || 'all').toLowerCase(),
    department: t.department || 'General',
    category: t.category || 'General',

    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/**
 * GET /api/tasks — Fetch tasks filtered by user role and permissions
 *
 * RBAC Rules:
 * - Admin: Sees ALL tasks across all users & departments. Can filter by role, assignedTo, status, etc.
 * - Manager: Sees manager tasks, tasks created by them, tasks assigned to them, and team/sales tasks.
 * - Sales / Reader / Staff: Sees tasks assigned to them, created by them, or targetRole = 'sales' / 'all'.
 */
export async function getTasks(req, res) {
  try {
    // 1. Identify active user role from JWT token (req.user) or query parameter override
    const userRole = (req.user?.role || req.query.role || req.headers['x-user-role'] || 'admin').toLowerCase();
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : null);
    const userName = req.user?.name || req.query.userName || '';
    const userEmail = req.user?.email || req.query.userEmail || '';
    const userDept = req.user?.department || req.query.department || '';

    // Additional query filters (search, status, priority, completed, targetRole, assignedTo)
    const {
      status,
      priority,
      completed,
      targetRole,
      assignedToRole,
      assignedTo,
      department,
      category,
      search,
    } = req.query;

    const allRows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    let list = allRows.map(formatTask);

    // 2. Apply Role-based visibility scoping
    if (userRole === 'admin') {
      // Admin has full 360-degree visibility!
      // If admin explicitly requested to filter by a specific role:
      const filterRole = (targetRole || assignedToRole || req.query.filterRole || '').toLowerCase();
      if (filterRole && filterRole !== 'all') {
        list = list.filter(
          (t) =>
            t.assignedToRole === filterRole ||
            t.createdByRole === filterRole ||
            (filterRole === 'sales' && (t.department.toLowerCase().includes('sales') || t.assignedToRole === 'sales')) ||
            (filterRole === 'manager' && (t.department.toLowerCase().includes('operations') || t.assignedToRole === 'manager'))
        );
      }
    } else if (userRole === 'manager') {
      // Manager visibility: Manager's own tasks + Sales & Team tasks + Department tasks
      list = list.filter((t) => {
        const isCreatedByManager =
          t.createdByRole === 'manager' ||
          (userId && t.createdById === userId) ||
          (userName && t.createdBy.toLowerCase().includes(userName.toLowerCase()));
        
        const isAssignedToManager =
          t.assignedToRole === 'manager' ||
          (userId && t.assignedToId === userId) ||
          (userName && t.assignedTo.toLowerCase().includes(userName.toLowerCase()));

        const isTeamOrSalesTask =
          ['sales', 'field sales', 'staff', 'warehouse', 'logistics', 'all'].includes(t.assignedToRole) ||
          ['sales', 'field sales', 'staff'].includes(t.createdByRole) ||
          t.department.toLowerCase().includes('sales') ||
          t.department.toLowerCase().includes('operations');

        const isDeptMatch = userDept && t.department.toLowerCase() === userDept.toLowerCase();

        return isCreatedByManager || isAssignedToManager || isTeamOrSalesTask || isDeptMatch || t.assignedToRole === 'all';
      });
    } else if (userRole === 'sales' || userRole === 'field_sales') {
      // Sales Team visibility: Sales tasks + Directly assigned + Created by them
      list = list.filter((t) => {
        const isAssignedToSales =
          t.assignedToRole === 'sales' ||
          t.assignedToRole === 'field_sales' ||
          t.assignedToRole === 'all' ||
          (userId && t.assignedToId === userId) ||
          (userName && t.assignedTo.toLowerCase().includes(userName.toLowerCase())) ||
          (userEmail && t.assignedTo.toLowerCase().includes(userEmail.toLowerCase()));

        const isCreatedBySales =
          t.createdByRole === 'sales' ||
          (userId && t.createdById === userId) ||
          (userName && t.createdBy.toLowerCase().includes(userName.toLowerCase()));

        const isSalesDept = t.department.toLowerCase().includes('sales');

        return isAssignedToSales || isCreatedBySales || isSalesDept;
      });
    } else {
      // General Reader / Staff role
      list = list.filter((t) => {
        const isDirect =
          (userId && (t.assignedToId === userId || t.createdById === userId)) ||
          (userName && (t.assignedTo.toLowerCase().includes(userName.toLowerCase()) || t.createdBy.toLowerCase().includes(userName.toLowerCase())));
        return isDirect || t.assignedToRole === 'all' || t.assignedToRole === userRole;
      });
    }

    // 3. Apply secondary query parameter filters
    if (status) {
      list = list.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    if (priority) {
      list = list.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (completed !== undefined) {
      const isComp = completed === 'true' || completed === true || completed === '1';
      list = list.filter((t) => t.completed === isComp);
    }

    if (assignedTo) {
      list = list.filter((t) => t.assignedTo.toLowerCase().includes(assignedTo.toLowerCase()));
    }

    if (department) {
      list = list.filter((t) => t.department.toLowerCase().includes(department.toLowerCase()));
    }

    if (category) {
      list = list.filter((t) => t.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q) ||
          t.createdBy.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
      );
    }

    return res.json(list);
  } catch (err) {
    console.error('[taskController.getTasks]', err);
    return res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
}

/**
 * GET /api/tasks/summary — Task counts, role breakdown & analytics
 */
export async function getTaskSummary(req, res) {
  try {
    const userRole = (req.user?.role || req.query.role || 'admin').toLowerCase();
    const rows = await db.select().from(tasks);
    const all = rows.map(formatTask);

    const now = new Date();
    const total = all.length;
    const completed = all.filter((t) => t.completed).length;
    const pending = all.filter((t) => !t.completed && t.status !== 'cancelled').length;
    const inProgress = all.filter((t) => t.status === 'in_progress').length;
    const highPriority = all.filter((t) => ['high', 'urgent'].includes(t.priority.toLowerCase())).length;

    // Check overdue tasks
    const overdue = all.filter((t) => {
      if (t.completed) return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isNaN(due.getTime()) && due < now;
    }).length;

    // Role breakdowns
    const adminTasks = all.filter(
      (t) => t.createdByRole === 'admin' || t.assignedToRole === 'admin' || t.department.toLowerCase().includes('executive')
    ).length;

    const managerTasks = all.filter(
      (t) => t.createdByRole === 'manager' || t.assignedToRole === 'manager' || t.department.toLowerCase().includes('operations')
    ).length;

    const salesTasks = all.filter(
      (t) =>
        t.createdByRole === 'sales' ||
        t.assignedToRole === 'sales' ||
        t.assignedToRole === 'field_sales' ||
        t.department.toLowerCase().includes('sales')
    ).length;

    const otherTasks = Math.max(0, total - (adminTasks + managerTasks + salesTasks));

    // Department grouping
    const byDepartment = {};
    all.forEach((t) => {
      const dept = t.department || 'General';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    return res.json({
      role: userRole,
      total,
      completed,
      pending,
      inProgress,
      overdue,
      highPriority,
      byRole: {
        adminTasks,
        managerTasks,
        salesTasks,
        otherTasks,
      },
      byDepartment,
    });
  } catch (err) {
    console.error('[taskController.getTaskSummary]', err);
    return res.status(500).json({ message: 'Failed to generate task summary', error: err.message });
  }
}

/**
 * GET /api/tasks/:id — Fetch a single task by ID
 */
export async function getTaskById(req, res) {
  const { id } = req.params;
  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('t_');
    const [row] = isNum
      ? await db.select().from(tasks).where(eq(tasks.id, parseInt(id, 10)))
      : await db.select().from(tasks).where(eq(tasks.taskId, id));

    if (!row) {
      return res.status(404).json({ message: `Task ${id} not found` });
    }

    return res.json(formatTask(row));
  } catch (err) {
    console.error('[taskController.getTaskById]', err);
    return res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
}

/**
 * POST /api/tasks — Create task with creator role, target assignee & department
 */
export async function createTask(req, res) {
  const {
    title,
    description,
    reminder,
    reminderTime,
    dueDate,
    priority,
    status,
    // Assignee metadata
    assignedTo,
    assignedToId,
    assignedToRole,
    department,
    category,
    // Creator override if not authenticated
    createdBy,
    createdById,
    createdByRole,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  // Determine Creator attributes from auth token or body
  const authorName = req.user?.name || createdBy?.trim() || 'Admin';
  const authorId = req.user?.id || (createdById ? parseInt(createdById, 10) : null);
  const authorRole = (req.user?.role || createdByRole || req.body.role || 'admin').toLowerCase();

  // Target role / department defaults
  const targetRole = (assignedToRole || (authorRole === 'sales' ? 'sales' : 'all')).toLowerCase();
  const taskDept = department ? department.trim() : (authorRole === 'sales' ? 'Sales' : authorRole === 'manager' ? 'Operations' : 'General');
  const taskCategory = category ? category.trim() : (authorRole === 'sales' ? 'Sales Follow-up' : 'General');
  const taskStatus = status && ['pending', 'in_progress', 'completed', 'cancelled'].includes(status) ? status : 'pending';

  const generatedTaskId = `t_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  try {
    const [inserted] = await db
      .insert(tasks)
      .values({
        taskId: generatedTaskId,
        title: title.trim(),
        description: description ? description.trim() : '',
        reminder: reminder ?? true,
        reminderTime: reminderTime || '',
        dueDate: dueDate || new Date(Date.now() + 86400000).toISOString(),
        priority: priority || 'medium',
        completed: taskStatus === 'completed',
        completedAt: taskStatus === 'completed' ? new Date() : null,
        status: taskStatus,
        
        // Creator
        createdBy: authorName,
        createdById: authorId,
        createdByRole: authorRole,
        
        // Assignee
        assignedTo: assignedTo ? assignedTo.trim() : (authorRole === 'sales' ? authorName : 'You'),
        assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
        assignedToRole: targetRole,
        department: taskDept,
        category: taskCategory,
      })
      .returning();

    return res.status(201).json(formatTask(inserted));
  } catch (err) {
    console.error('[taskController.createTask]', err);
    return res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
}

/**
 * PUT /api/tasks/:id or PATCH /api/tasks/:id — Update task details
 */
export async function updateTask(req, res) {
  const { id } = req.params;
  const {
    title,
    description,
    reminder,
    reminderTime,
    dueDate,
    priority,
    status,
    completed,
    assignedTo,
    assignedToId,
    assignedToRole,
    department,
    category,
  } = req.body;

  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('t_');
    const [existing] = isNum
      ? await db.select().from(tasks).where(eq(tasks.id, parseInt(id, 10)))
      : await db.select().from(tasks).where(eq(tasks.taskId, id));

    if (!existing) {
      return res.status(404).json({ message: `Task ${id} not found` });
    }

    const updates = { updatedAt: new Date() };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (reminder !== undefined) updates.reminder = Boolean(reminder);
    if (reminderTime !== undefined) updates.reminderTime = reminderTime;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo.trim();
    if (assignedToId !== undefined) updates.assignedToId = assignedToId ? parseInt(assignedToId, 10) : null;
    if (assignedToRole !== undefined) updates.assignedToRole = assignedToRole.toLowerCase();
    if (department !== undefined) updates.department = department.trim();
    if (category !== undefined) updates.category = category.trim();

    if (completed !== undefined) {
      updates.completed = Boolean(completed);
      updates.completedAt = updates.completed ? new Date() : null;
      if (updates.completed && (!status || status === 'pending')) {
        updates.status = 'completed';
      } else if (!updates.completed && (!status || status === 'completed')) {
        updates.status = 'pending';
      }
    }

    if (status !== undefined) {
      updates.status = status;
      if (status === 'completed') {
        updates.completed = true;
        updates.completedAt = new Date();
      } else if (['pending', 'in_progress'].includes(status) && completed === undefined) {
        updates.completed = false;
        updates.completedAt = null;
      }
    }

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.taskId, existing.taskId))
      .returning();

    return res.json(formatTask(updated));
  } catch (err) {
    console.error('[taskController.updateTask]', err);
    return res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
}

/**
 * PATCH /api/tasks/:id/toggle — Toggle task completion status
 */
export async function toggleTask(req, res) {
  const { id } = req.params;
  try {
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('t_');
    const [existing] = isNum
      ? await db.select().from(tasks).where(eq(tasks.id, parseInt(id, 10)))
      : await db.select().from(tasks).where(eq(tasks.taskId, id));

    if (!existing) {
      return res.status(404).json({ message: `Task ${id} not found` });
    }

    const nextCompleted = !existing.completed;
    const nextStatus = nextCompleted ? 'completed' : 'pending';
    const nextCompletedAt = nextCompleted ? new Date() : null;

    const [updated] = await db
      .update(tasks)
      .set({
        completed: nextCompleted,
        status: nextStatus,
        completedAt: nextCompletedAt,
        updatedAt: new Date(),
      })
      .where(eq(tasks.taskId, existing.taskId))
      .returning();

    return res.json({
      success: true,
      completed: nextCompleted,
      task: formatTask(updated),
    });
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
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('t_');
    const [existing] = isNum
      ? await db.select().from(tasks).where(eq(tasks.id, parseInt(id, 10)))
      : await db.select().from(tasks).where(eq(tasks.taskId, id));

    if (!existing) {
      return res.status(404).json({ message: `Task ${id} not found` });
    }

    await db.delete(tasks).where(eq(tasks.taskId, existing.taskId));
    return res.json({ success: true, message: `Task ${id} deleted successfully` });
  } catch (err) {
    console.error('[taskController.deleteTask]', err);
    return res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
}
