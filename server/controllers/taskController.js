import { db } from '../db/index.js';
import { tasks, systemUsers, staffMembers } from '../db/schema.js';
import { eq, or, desc, and, ilike, sql } from 'drizzle-orm';

/**
 * Helper to normalize role names across frontend and backend variants
 * (e.g. 'Salesperson', 'sales', 'field_sales', 'Field Sales' -> 'sales')
 */
function normalizeRole(role) {
  if (!role) return 'reader';
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
    notes: t.notes || '',
    outcome: t.outcome || '',
    reminder: t.reminder ?? true,
    reminderTime: t.reminderTime || '',
    
    // Creator Info
    createdBy: t.createdBy || 'Admin',
    createdById: t.createdById || null,
    createdByRole: normalizeRole(t.createdByRole || 'admin'),
    
    // Assignee & Target Info
    assignedTo: t.assignedTo || 'You',
    assignedToId: t.assignedToId || null,
    assignedToRole: normalizeRole(t.assignedToRole || 'all'),
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
 * - Sales / Salesperson: Sees tasks assigned directly to them, tasks assigned to 'Field Sales Team' / 'all', or created by them.
 */
export async function getTasks(req, res) {
  try {
    // 1. Identify active user role from JWT token (req.user) or query parameter override
    const rawRole = req.user?.role || req.query.role || req.headers['x-user-role'] || 'admin';
    const userRole = normalizeRole(rawRole);
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : null);
    const userName = (req.user?.name || req.query.userName || '').trim();
    const userEmail = (req.user?.email || req.query.userEmail || '').trim();
    const userDept = (req.user?.department || req.query.department || '').trim();

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
      // Admin has full 360-degree visibility across all users and teams
      const filterRole = (targetRole || assignedToRole || req.query.filterRole || '').toLowerCase();
      if (filterRole && filterRole !== 'all') {
        const normalizedFilter = normalizeRole(filterRole);
        list = list.filter(
          (t) =>
            t.assignedToRole === normalizedFilter ||
            t.createdByRole === normalizedFilter ||
            (normalizedFilter === 'sales' && (t.department.toLowerCase().includes('sales') || t.assignedToRole === 'sales')) ||
            (normalizedFilter === 'manager' && (t.department.toLowerCase().includes('operations') || t.assignedToRole === 'manager'))
        );
      }
    } else if (userRole === 'manager') {
      // Manager visibility: Manager's own tasks + Sales team tasks + Staff tasks
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
          ['sales', 'staff', 'warehouse', 'logistics', 'all'].includes(t.assignedToRole) ||
          ['sales', 'staff'].includes(t.createdByRole) ||
          t.department.toLowerCase().includes('sales') ||
          t.department.toLowerCase().includes('operations');

        const isDeptMatch = userDept && t.department.toLowerCase() === userDept.toLowerCase();

        return isCreatedByManager || isAssignedToManager || isTeamOrSalesTask || isDeptMatch || t.assignedToRole === 'all';
      });
    } else if (userRole === 'sales') {
      // Sales Team / Salesperson visibility:
      // A salesperson should only see:
      // 1. Tasks directly assigned to them (by ID, Name, or Email)
      // 2. Tasks assigned to the whole team ("Field Sales Team", "Sales Team", "all")
      // 3. Tasks created by them
      // NOTE: Specific tasks assigned to OTHER sales reps will not be shown to this rep!
      list = list.filter((t) => {
        const targetAssignee = (t.assignedTo || '').toLowerCase().trim();
        const currentLowerName = userName.toLowerCase().trim();

        const isDirectToMe =
          (userId && t.assignedToId === userId) ||
          (currentLowerName && (targetAssignee.includes(currentLowerName) || currentLowerName.includes(targetAssignee))) ||
          (userEmail && targetAssignee.includes(userEmail.toLowerCase())) ||
          targetAssignee === 'you';

        const isTeamBroadcast =
          targetAssignee === 'field sales team' ||
          targetAssignee === 'sales team' ||
          targetAssignee.includes('team') ||
          targetAssignee === 'all' ||
          t.assignedToRole === 'all' ||
          (t.assignedToRole === 'sales' && (targetAssignee === '' || targetAssignee === 'field sales team' || targetAssignee === 'sales team'));

        const isCreatedByMe =
          t.createdByRole === 'sales' &&
          ((userId && t.createdById === userId) ||
           (currentLowerName && (t.createdBy || '').toLowerCase().includes(currentLowerName)));

        return isDirectToMe || isTeamBroadcast || isCreatedByMe;
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
    const rawRole = req.user?.role || req.query.role || 'admin';
    const userRole = normalizeRole(rawRole);
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : null);
    const userName = (req.user?.name || req.query.userName || '').trim().toLowerCase();

    const rows = await db.select().from(tasks);
    const all = rows.map(formatTask);

    // If request comes from a specific salesperson, calculate their personal view metrics
    let scopedList = all;
    if (userRole === 'sales' && (userId || userName)) {
      scopedList = all.filter((t) => {
        const targetAssignee = (t.assignedTo || '').toLowerCase().trim();
        const isDirect = (userId && t.assignedToId === userId) || (userName && targetAssignee.includes(userName)) || targetAssignee === 'you';
        const isTeam = targetAssignee.includes('team') || t.assignedToRole === 'all';
        const isMine = (userId && t.createdById === userId) || (userName && (t.createdBy || '').toLowerCase().includes(userName));
        return isDirect || isTeam || isMine;
      });
    }

    const now = new Date();
    const total = scopedList.length;
    const completed = scopedList.filter((t) => t.completed).length;
    const pending = scopedList.filter((t) => !t.completed && t.status !== 'cancelled').length;
    const inProgress = scopedList.filter((t) => t.status === 'in_progress').length;
    const highPriority = scopedList.filter((t) => ['high', 'urgent'].includes(t.priority.toLowerCase())).length;

    // Check overdue tasks
    const overdue = scopedList.filter((t) => {
      if (t.completed) return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isNaN(due.getTime()) && due < now;
    }).length;

    // Role breakdowns across all tasks
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
        t.department.toLowerCase().includes('sales')
    ).length;

    const otherTasks = Math.max(0, all.length - (adminTasks + managerTasks + salesTasks));

    // Department grouping
    const byDepartment = {};
    scopedList.forEach((t) => {
      const dept = t.department || 'General';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    return res.json({
      role: userRole,
      total,
      totalTasks: total,
      completed,
      completedTasks: completed,
      pending,
      pendingTasks: pending,
      inProgress,
      overdue,
      highPriority,
      salesTasks,
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
    notes,
    outcome,
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
  const authorRole = normalizeRole(req.user?.role || createdByRole || req.body.role || 'admin');

  // Determine Assignee details
  const cleanAssignee = assignedTo ? assignedTo.trim() : (authorRole === 'sales' ? authorName : 'Field Sales Team');
  let effectiveAssignedToId = assignedToId ? parseInt(assignedToId, 10) : null;
  let effectiveAssignedRole = assignedToRole ? normalizeRole(assignedToRole) : null;

  // Auto-detect role and ID if assigning to specific staff member or Field Sales Team
  const lowerAssignee = cleanAssignee.toLowerCase();
  const isTeam = lowerAssignee.includes('team') || lowerAssignee === 'all';

  if (isTeam) {
    effectiveAssignedRole = effectiveAssignedRole || 'sales';
    effectiveAssignedToId = null;
  } else if (!effectiveAssignedToId && !isTeam && cleanAssignee !== 'You') {
    // Try to lookup user from systemUsers or staffMembers by name
    try {
      const [matchedUser] = await db
        .select()
        .from(systemUsers)
        .where(ilike(systemUsers.name, `%${cleanAssignee}%`));
      if (matchedUser) {
        effectiveAssignedToId = matchedUser.id;
        effectiveAssignedRole = effectiveAssignedRole || normalizeRole(matchedUser.role);
      } else {
        const [matchedStaff] = await db
          .select()
          .from(staffMembers)
          .where(ilike(staffMembers.name, `%${cleanAssignee}%`));
        if (matchedStaff) {
          effectiveAssignedRole = effectiveAssignedRole || (matchedStaff.role?.toLowerCase().includes('sales') ? 'sales' : 'staff');
        }
      }
    } catch {
      // Non-fatal if lookup fails
    }
  }

  if (!effectiveAssignedRole) {
    effectiveAssignedRole = authorRole === 'sales' ? 'sales' : 'all';
  }

  const taskDept = department ? department.trim() : (effectiveAssignedRole === 'sales' ? 'Field Sales' : authorRole === 'manager' ? 'Operations' : 'General');
  const taskCategory = category ? category.trim() : (effectiveAssignedRole === 'sales' ? 'Sales Follow-up' : 'General');
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
        notes: notes ? notes.trim() : '',
        outcome: outcome ? outcome.trim() : '',
        
        // Creator
        createdBy: authorName,
        createdById: authorId,
        createdByRole: authorRole,
        
        // Assignee
        assignedTo: cleanAssignee,
        assignedToId: effectiveAssignedToId,
        assignedToRole: effectiveAssignedRole,
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
 * PUT /api/tasks/:id or PATCH /api/tasks/:id — Update task details, status & visit outcome notes
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
    completedAt,
    notes,
    outcome,
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
    if (assignedToRole !== undefined) updates.assignedToRole = normalizeRole(assignedToRole);
    if (department !== undefined) updates.department = department.trim();
    if (category !== undefined) updates.category = category.trim();
    if (notes !== undefined) updates.notes = notes ? notes.trim() : '';
    if (outcome !== undefined) updates.outcome = outcome ? outcome.trim() : '';

    if (completed !== undefined) {
      updates.completed = Boolean(completed);
      if (updates.completed) {
        updates.completedAt = completedAt ? new Date(completedAt) : new Date();
        if (!status || status === 'pending') {
          updates.status = 'completed';
        }
      } else {
        updates.completedAt = null;
        if (!status || status === 'completed') {
          updates.status = 'pending';
        }
      }
    }

    if (status !== undefined) {
      updates.status = status;
      if (status === 'completed') {
        updates.completed = true;
        updates.completedAt = completedAt ? new Date(completedAt) : (existing.completedAt || new Date());
      } else if (['pending', 'in_progress', 'cancelled'].includes(status) && completed === undefined) {
        updates.completed = false;
        updates.completedAt = null;
      }
    }

    if (completedAt !== undefined && completedAt !== null) {
      updates.completedAt = new Date(completedAt);
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
