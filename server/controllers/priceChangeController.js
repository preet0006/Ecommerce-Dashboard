import crypto from 'crypto';
import { db } from '../db/index.js';
import { priceChanges } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { sendPriceChangeApprovalEmail } from '../services/emailService.js';

const TOKEN_VALIDITY_DAYS = 7;

function baseUrl() {
  return process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
}

function getAdminApprover() {
  const name = process.env.ADMIN_APPROVAL_NAME || 'Rohit Malhotra';
  const email = process.env.ADMIN_APPROVAL_EMAIL || 'malhotrarohit85628@gmail.com';
  if (name && email) return `${name} (${email})`;
  return name || email || 'Rohit Malhotra (malhotrarohit85628@gmail.com)';
}

let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS price_changes (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL,
        product_name VARCHAR(200),
        channel VARCHAR(20) NOT NULL,
        from_price NUMERIC(10, 2) NOT NULL,
        to_price NUMERIC(10, 2) NOT NULL,
        margin_after_pct NUMERIC(5, 2),
        requested_by VARCHAR(100) DEFAULT 'Team',
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        approval_token VARCHAR(64),
        token_expires_at TIMESTAMP,
        decided_at TIMESTAMP,
        decided_via VARCHAR(20),
        decided_by VARCHAR(150),
        email_status VARCHAR(20) DEFAULT 'sent',
        email_preview_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(`
      ALTER TABLE price_changes ADD COLUMN IF NOT EXISTS decided_by VARCHAR(150)
    `);
    tableChecked = true;
  } catch (err) {
    console.error('[priceChanges] ensureTable failed:', err.message);
  }
}

// POST /api/price-changes
export async function createPriceChange(req, res) {
  try {
    await ensureTable();
    const { sku, productName, channel, fromPrice, toPrice, marginAfterPct, requestedBy } = req.body;
    if (!sku || !channel || fromPrice == null || toPrice == null) {
      return res.status(400).json({ message: 'sku, channel, fromPrice, and toPrice are required' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    const [row] = await db.insert(priceChanges).values({
      sku, productName, channel, fromPrice, toPrice, marginAfterPct,
      requestedBy: requestedBy || 'Team',
      status: 'pending',
      approvalToken: token,
      tokenExpiresAt,
    }).returning();

    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL;
    if (adminEmail) {
      try {
        const approveUrl = `${baseUrl()}/api/price-changes/${row.id}/decide?token=${token}&action=approve`;
        const rejectUrl = `${baseUrl()}/api/price-changes/${row.id}/decide?token=${token}&action=reject`;
        const result = await sendPriceChangeApprovalEmail({ to: adminEmail, priceChange: row, approveUrl, rejectUrl });
        await db.update(priceChanges).set({ emailStatus: 'sent', emailPreviewUrl: result.previewUrl }).where(eq(priceChanges.id, row.id));
      } catch (mailErr) {
        console.error('[priceChanges] Failed to send approval email:', mailErr.message);
        await db.update(priceChanges).set({ emailStatus: 'failed' }).where(eq(priceChanges.id, row.id));
      }
    } else {
      console.warn('[priceChanges] ADMIN_APPROVAL_EMAIL not set — skipping email send.');
    }

    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create price change', error: err.message });
  }
}

// GET /api/price-changes?status=pending
export async function listPriceChanges(req, res) {
  try {
    await ensureTable();
    const { status } = req.query;
    const rows = status
      ? await db.select().from(priceChanges).where(eq(priceChanges.status, status))
      : await db.select().from(priceChanges);
    res.json(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch price changes', error: err.message });
  }
}

function htmlPage(title, message, color) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family:-apple-system,sans-serif;background:#edf2ee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="background:#fff;padding:40px 48px;border-radius:16px;border:1px solid #d8e2dc;text-align:center;max-width:420px;">
      <div style="font-size:40px;margin-bottom:12px;">${color === 'red' ? '❌' : '✅'}</div>
      <h2 style="margin:0 0 8px 0;color:#16231d;">${title}</h2>
      <p style="color:#576d61;margin:0;">${message}</p>
    </div>
  </body></html>`;
}

// GET /api/price-changes/:id/decide?token=...&action=approve|reject  (clicked from email — no login)
export async function decideByToken(req, res) {
  try {
    await ensureTable();
    const { id } = req.params;
    const { token, action } = req.query;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).send(htmlPage('Invalid link', 'This approval link is malformed.', 'red'));
    }

    const [row] = await db.select().from(priceChanges).where(eq(priceChanges.id, Number(id)));
    if (!row) return res.status(404).send(htmlPage('Not found', 'This price change no longer exists.', 'red'));
    if (row.status === 'withdrawn') {
      return res.status(200).send(htmlPage('Request Withdrawn', 'This price change request was withdrawn and can no longer be decided.', 'red'));
    }
    if (row.status !== 'pending') {
      return res.status(200).send(htmlPage('Already decided', `This request was already ${row.status}.`, row.status === 'approved' ? 'green' : 'red'));
    }
    if (row.approvalToken !== token || !row.tokenExpiresAt || new Date(row.tokenExpiresAt) < new Date()) {
      return res.status(403).send(htmlPage('Link expired', 'This approval link is invalid or has expired.', 'red'));
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const approver = getAdminApprover();
    await db.update(priceChanges).set({
      status: newStatus,
      decidedAt: new Date(),
      decidedVia: 'email',
      decidedBy: approver,
      approvalToken: null, // invalidate — one-time use
    }).where(eq(priceChanges.id, Number(id)));

    res.status(200).send(htmlPage(
      newStatus === 'approved' ? 'Approved ✓' : 'Rejected',
      `${row.sku} on ${row.channel} — price ${newStatus === 'approved' ? `updated to ₹${row.toPrice}` : 'change rejected'}.`,
      newStatus === 'approved' ? 'green' : 'red'
    ));
  } catch (err) {
    res.status(500).send(htmlPage('Error', 'Something went wrong processing this decision.', 'red'));
  }
}

// POST /api/price-changes/:id/decide   { action: 'approve' | 'reject' | 'withdraw' }  (clicked from dashboard)
export async function decideFromDashboard(req, res) {
  try {
    await ensureTable();
    const { id } = req.params;
    const { action } = req.body;
    if (!['approve', 'reject', 'withdraw'].includes(action)) {
      return res.status(400).json({ message: 'action must be "approve", "reject", or "withdraw"' });
    }

    const [row] = await db.select().from(priceChanges).where(eq(priceChanges.id, Number(id)));
    if (!row) return res.status(404).json({ message: 'Price change not found' });
    if (row.status !== 'pending') return res.status(409).json({ message: `Already ${row.status}` });

    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'withdrawn';
    const approver = action === 'withdraw' ? 'Withdrawn by Team' : (req.body.decidedBy || getAdminApprover());
    const [updated] = await db.update(priceChanges).set({
      status: newStatus,
      decidedAt: new Date(),
      decidedVia: 'dashboard',
      decidedBy: approver,
      approvalToken: null,
    }).where(eq(priceChanges.id, Number(id))).returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to decide price change', error: err.message });
  }
}


