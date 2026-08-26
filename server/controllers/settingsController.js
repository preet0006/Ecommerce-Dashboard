import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/settings/users — Fetch all system team members
 */
export async function getSystemUsers(_req, res) {
  try {
    const users = await db
      .select()
      .from(schema.systemUsers)
      .orderBy(desc(schema.systemUsers.createdAt));

    return res.json(users);
  } catch (err) {
    console.error('[settingsController.getSystemUsers]', err);
    return res.status(500).json({ message: 'Failed to fetch team members', error: err.message });
  }
}

/**
 * POST /api/settings/users — Add a new team member with email, password, role & department
 */
export async function createSystemUser(req, res) {
  try {
    const {
      name,
      email,
      password = 'GreenFibre@2026',
      role = 'reader',
      department = 'Procurement',
      status = 'active',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required for user login' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanRole = ['admin', 'manager', 'reader'].includes(role) ? role : 'reader';

    // Compute initials avatar
    const parts = name.trim().split(' ');
    const avatar = parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    // Check duplicate email
    const existing = await db
      .select()
      .from(schema.systemUsers)
      .where(eq(schema.systemUsers.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ message: `A user with email ${cleanEmail} already exists` });
    }

    const [created] = await db
      .insert(schema.systemUsers)
      .values({
        name: name.trim(),
        email: cleanEmail,
        password: cleanPassword,
        role: cleanRole,
        department: department.trim() || 'Procurement',
        avatar,
        status,
        lastLoginAt: new Date(),
      })
      .returning();

    return res.status(201).json({ success: true, user: created });
  } catch (err) {
    console.error('[settingsController.createSystemUser]', err);
    return res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
}

/**
 * PUT /api/settings/users/:id — Update a user's role, password or details
 */
export async function updateSystemUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, status } = req.body;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const updates = { updatedAt: new Date() };
    if (name) updates.name = name.trim();
    if (email && email.includes('@')) updates.email = email.trim().toLowerCase();
    if (password && password.trim()) updates.password = password.trim();
    if (role && ['admin', 'manager', 'reader'].includes(role)) updates.role = role;
    if (department) updates.department = department.trim();
    if (status && ['active', 'inactive'].includes(status)) updates.status = status;

    const [updated] = await db
      .update(schema.systemUsers)
      .set(updates)
      .where(eq(schema.systemUsers.id, numericId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error('[settingsController.updateSystemUser]', err);
    return res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
}

/**
 * DELETE /api/settings/users/:id — Delete a team member
 */
export async function deleteSystemUser(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    await db.delete(schema.systemUsers).where(eq(schema.systemUsers.id, numericId));
    return res.json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    console.error('[settingsController.deleteSystemUser]', err);
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}

/**
 * POST /api/settings/login — Authenticate user with Email & Password
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const [user] = await db
      .select()
      .from(schema.systemUsers)
      .where(eq(schema.systemUsers.email, cleanEmail))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or user does not exist' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'This user account is inactive. Contact Administrator.' });
    }

    if (user.password !== cleanPassword) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Update last login timestamp
    await db
      .update(schema.systemUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.systemUsers.id, user.id));

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[settingsController.loginUser]', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

/**
 * GET /api/settings/general — Fetch general app settings
 */
export async function getAppSettings(req, res) {
  try {
    const rows = await db.select().from(schema.appSettings);
    const settingsMap = {};
    rows.forEach((r) => {
      try {
        settingsMap[r.settingKey] = JSON.parse(r.settingValue);
      } catch {
        settingsMap[r.settingKey] = r.settingValue;
      }
    });
    return res.json(settingsMap);
  } catch (err) {
    console.error('[settingsController.getAppSettings]', err);
    return res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
}

/**
 * POST /api/settings/general — Upsert general app settings
 */
export async function saveAppSettings(req, res) {
  try {
    const { key, value, updatedBy = 'Admin' } = req.body;
    if (!key) {
      return res.status(400).json({ message: 'Setting key is required' });
    }

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    await db
      .insert(schema.appSettings)
      .values({
        settingKey: key,
        settingValue: stringValue,
        updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.appSettings.settingKey,
        set: {
          settingValue: stringValue,
          updatedBy,
          updatedAt: new Date(),
        },
      });

    return res.json({ success: true, message: `Setting ${key} saved.` });
  } catch (err) {
    console.error('[settingsController.saveAppSettings]', err);
    return res.status(500).json({ message: 'Failed to save setting', error: err.message });
  }
}
