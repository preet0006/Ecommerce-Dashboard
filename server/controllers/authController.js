import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { systemUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'greenfibre_jwt_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function baseUrlFrontend() {
  return process.env.APP_FRONTEND_URL || 'http://localhost:5173';
}

// POST /api/auth/login   { email, password }
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email.trim().toLowerCase()));
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'This account is inactive. Contact your admin.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await db.update(systemUsers).set({ lastLoginAt: new Date() }).where(eq(systemUsers.id, user.id));

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

// POST /api/auth/forgot-password   { email }
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email.trim().toLowerCase()));
    // Always respond success even if not found — don't leak which emails exist
    if (!user) return res.json({ success: true, message: 'If that account exists, a reset email has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(systemUsers).set({ resetToken, resetTokenExpiresAt }).where(eq(systemUsers.id, user.id));

    const resetUrl = `${baseUrlFrontend()}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    res.json({ success: true, message: 'If that account exists, a reset email has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request', error: err.message });
  }
}

// POST /api/auth/reset-password   { email, token, newPassword }
export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email.trim().toLowerCase()));
    if (!user || user.resetToken !== token || !user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(systemUsers).set({
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    }).where(eq(systemUsers.id, user.id));

    res.json({ success: true, message: 'Password updated. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
}

// GET /api/auth/me — verify current token, used by the frontend on page load
export async function me(req, res) {
  res.json({ user: req.user });
}
