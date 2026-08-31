import crypto from 'crypto';
import { db } from '../db/index.js';
import { pushRecommendations, channelOrders } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { sendPushRecommendationEmail } from '../services/emailService.js';

const CHANNELS = ['amazon', 'flipkart', 'website'];
const TOKEN_VALIDITY_DAYS = 7;

function baseUrl() {
  let url = (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`).trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url.replace(/\/+$/, '');
}

function getAdminApprover() {
  const name = process.env.ADMIN_APPROVAL_NAME || 'Rohit Malhotra';
  const email = process.env.ADMIN_APPROVAL_EMAIL || 'malhotrarohit85628@gmail.com';
  if (name && email) return `${name} (${email})`;
  return name || email || 'Rohit Malhotra (malhotrarohit85628@gmail.com)';
}

async function countRecentOrdersByChannel(sku) {
  const counts = { amazon: 0, flipkart: 0, website: 0 };
  if (!sku) return counts;

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await db.select().from(channelOrders).where(
      and(
        eq(channelOrders.productSku, sku),
        sql`${channelOrders.orderedAt} >= ${since.toISOString()}`
      )
    );
    for (const row of rows) {
      if (counts[row.channel] !== undefined) counts[row.channel] += 1;
    }
  } catch (err) {
    console.warn(`[countRecentOrdersByChannel] Warning for ${sku}:`, err.message);
  }
  return counts;
}

function pickChannel(candidate, orderCounts) {
  const prices = candidate?.prices || {};
  let best = CHANNELS[0];
  for (const ch of CHANNELS) {
    const chCount = orderCounts?.[ch] ?? 0;
    const bestCount = orderCounts?.[best] ?? 0;
    const chPrice = prices[ch] ?? Infinity;
    const bestPrice = prices[best] ?? Infinity;

    if (chCount < bestCount) {
      best = ch;
    } else if (chCount === bestCount && chPrice < bestPrice) {
      best = ch;
    }
  }
  return best;
}

let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS push_recommendations (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        recommended_channel VARCHAR(20) NOT NULL,
        sell_through_pct NUMERIC(5, 2),
        days_cover NUMERIC(6, 1),
        margin_pct NUMERIC(5, 2),
        channel_order_counts JSONB,
        reason_tags JSONB NOT NULL,
        suggested_action TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new' NOT NULL,
        approval_token VARCHAR(64),
        token_expires_at TIMESTAMP,
        decided_at TIMESTAMP,
        decided_via VARCHAR(20),
        decided_by VARCHAR(150),
        emailed_at TIMESTAMP,
        email_preview_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    await db.execute(`ALTER TABLE push_recommendations ADD COLUMN IF NOT EXISTS approval_token VARCHAR(64);`);
    await db.execute(`ALTER TABLE push_recommendations ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;`);
    await db.execute(`ALTER TABLE push_recommendations ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP;`);
    await db.execute(`ALTER TABLE push_recommendations ADD COLUMN IF NOT EXISTS decided_via VARCHAR(20);`);
    await db.execute(`ALTER TABLE push_recommendations ADD COLUMN IF NOT EXISTS decided_by VARCHAR(150);`);
    tableChecked = true;
  } catch (err) {
    console.warn('[pushRecommendations] ensureTable notice:', err.message);
  }
}

function htmlPage(title, message, color = 'green', subtext = '') {
  const isGreen = color === 'green';
  const isRed = color === 'red';
  const icon = isGreen ? '✓' : isRed ? '✕' : 'ℹ';
  const iconBg = isGreen ? '#eaf5ee' : isRed ? '#fef2f2' : '#fef9c3';
  const iconColor = isGreen ? '#135235' : isRed ? '#dc2626' : '#ca8a04';
  const dashboardUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — GreenFibre Procurement</title>
  <style>
    body { margin:0; padding:32px 16px; background:#ebf0ec; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:90vh; color:#16231d; }
    .card { background:#ffffff; border-radius:20px; border:1px solid #d4dfd7; max-width:480px; width:100%; padding:44px 36px; text-align:center; box-shadow:0 12px 40px rgba(0,0,0,0.06); }
    .icon-bubble { width:68px; height:68px; border-radius:50%; background:${iconBg}; color:${iconColor}; font-size:30px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.04); }
    .title { margin:0 0 10px 0; color:#111827; font-size:22px; font-weight:800; line-height:1.25; }
    .desc { color:#4a5c52; font-size:15px; line-height:1.55; margin:0 0 18px 0; }
    .subtext { background:#f7faf8; border-radius:10px; padding:12px 16px; font-size:12.5px; color:#576d61; margin:0 0 24px 0; border:1px solid #e5ede7; line-height:1.45; }
    .btn { display:inline-block; background:#135235; color:#ffffff; font-weight:700; font-size:13.5px; text-decoration:none; padding:12px 28px; border-radius:10px; box-shadow:0 3px 10px rgba(19,82,53,0.25); transition:background 0.2s ease; }
    .btn:hover { background:#0d3824; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-bubble">${icon}</div>
    <h2 class="title">${title}</h2>
    <div class="desc">${message}</div>
    ${subtext ? `<div class="subtext">${subtext}</div>` : ''}
    <a href="${dashboardUrl}/forecasting" class="btn">Open Demand Dashboard →</a>
  </div>
</body>
</html>`;
}

// POST /api/push-recommendations/generate   { candidates: [...], force?: boolean }
export async function generateRecommendations(req, res) {
  try {
    await ensureTable();
    const { candidates, force = false } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ message: 'No candidates provided' });
    }

    // ── Smart Deduplication & Cooldown ──────────────────────────────────────
    // Check existing recommendations:
    // If an SKU is currently 'new' or 'emailed' (or was emailed within the last 24h),
    // skip re-sending email unless force is explicitly true.
    const existingRows = await db.select().from(pushRecommendations);
    const now = Date.now();
    const activeSkuMap = new Map();

    for (const row of existingRows) {
      const isPending = row.status === 'new' || row.status === 'emailed';
      const isRecent = row.emailedAt && (now - new Date(row.emailedAt).getTime() < 24 * 60 * 60 * 1000);
      if (isPending || isRecent) {
        activeSkuMap.set(row.sku, row);
      }
    }

    const newlyFlaggedCandidates = [];
    const skippedAlreadyActive = [];

    for (const c of candidates) {
      if (!force && activeSkuMap.has(c.sku)) {
        skippedAlreadyActive.push(c.sku);
      } else {
        newlyFlaggedCandidates.push(c);
      }
    }

    const built = [];
    for (const c of newlyFlaggedCandidates) {
      const orderCounts = await countRecentOrdersByChannel(c.sku);
      const recommendedChannel = pickChannel(c, orderCounts);
      const prices = c.prices || {};
      const channelPrice = prices[recommendedChannel] ?? '—';
      const suggestedAction = `Feature "${c.productName || c.sku}" on ${recommendedChannel} — it only had ${orderCounts[recommendedChannel]} order(s) there in the last 30 days despite being listed at ₹${channelPrice}. Consider a sponsored placement or a short discount push to capture demand it isn't currently getting on this channel.`;

      const sellThroughPctStr = c.sellThroughPct != null ? String(Number(c.sellThroughPct).toFixed(2)) : null;
      const daysCoverStr = c.daysCover != null ? String(Math.min(99999.9, Number(c.daysCover)).toFixed(1)) : null;
      const marginPctStr = c.marginPct != null ? String(Number(c.marginPct).toFixed(2)) : null;
      const reasonTags = Array.isArray(c.reasonTags) ? c.reasonTags : [String(c.reasonTags || 'Underperforming on sales channel')];

      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

      // Check if existing record for this SKU can be updated
      const existing = activeSkuMap.get(c.sku);
      if (force && existing) {
        const [updated] = await db.update(pushRecommendations).set({
          productName: c.productName || c.sku,
          category: c.category || 'General',
          recommendedChannel,
          sellThroughPct: sellThroughPctStr,
          daysCover: daysCoverStr,
          marginPct: marginPctStr,
          channelOrderCounts: orderCounts,
          reasonTags,
          suggestedAction,
          status: 'new',
          approvalToken: token,
          tokenExpiresAt,
        }).where(eq(pushRecommendations.id, existing.id)).returning();
        if (updated) built.push(updated);
      } else {
        const [row] = await db.insert(pushRecommendations).values({
          sku: c.sku,
          productName: c.productName || c.sku,
          category: c.category || 'General',
          recommendedChannel,
          sellThroughPct: sellThroughPctStr,
          daysCover: daysCoverStr,
          marginPct: marginPctStr,
          channelOrderCounts: orderCounts,
          reasonTags,
          suggestedAction,
          status: 'new',
          approvalToken: token,
          tokenExpiresAt,
        }).returning();

        if (row) {
          built.push(row);
        }
      }
    }

    // ── Send Email for Flagged Products ─────────────────────────────────────
    let emailResult = null;
    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL;
    if (adminEmail && built.length > 0) {
      try {
        emailResult = await sendPushRecommendationEmail({
          to: adminEmail,
          recommendations: built,
          baseUrl: baseUrl(),
        });
        for (const row of built) {
          if (row?.id) {
            await db.update(pushRecommendations)
              .set({
                status: 'emailed',
                emailedAt: new Date(),
                emailPreviewUrl: emailResult?.previewUrl || null,
              })
              .where(eq(pushRecommendations.id, row.id));
          }
        }
      } catch (mailErr) {
        console.error('[pushRecommendations] Failed to send recommendation email:', mailErr.message);
      }
    }

    const finalRows = await db.select().from(pushRecommendations);
    const sorted = finalRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(201).json({
      items: sorted,
      newlyEmailedCount: built.length,
      skippedCount: skippedAlreadyActive.length,
      emailPreviewUrl: emailResult?.previewUrl || null,
      message: built.length > 0
        ? `Flagged and emailed ${built.length} recommendation(s) with the new approval template to admin.`
        : `Scan complete: All ${skippedAlreadyActive.length} flagged product(s) are already active or were previously emailed.`,
    });
  } catch (err) {
    console.error('[pushRecommendations] generateRecommendations error:', err);
    res.status(500).json({ message: 'Failed to generate recommendations', error: err.message });
  }
}

// POST /api/push-recommendations/resend  (Resend new email template for all active recommendations)
export async function resendPushRecommendationsEmail(req, res) {
  try {
    await ensureTable();
    const rows = await db.select().from(pushRecommendations);
    const active = rows.filter((r) => r.status === 'new' || r.status === 'emailed');

    if (active.length === 0) {
      return res.status(400).json({ message: 'No active recommendations available to email. Please run a scan first.' });
    }

    const updatedList = [];
    for (const r of active) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
      const [up] = await db.update(pushRecommendations).set({
        approvalToken: token,
        tokenExpiresAt,
      }).where(eq(pushRecommendations.id, r.id)).returning();
      if (up) updatedList.push(up);
    }

    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'malhotrarohit85628@gmail.com';
    let emailResult = null;
    if (adminEmail && updatedList.length > 0) {
      emailResult = await sendPushRecommendationEmail({
        to: adminEmail,
        recommendations: updatedList,
        baseUrl: baseUrl(),
      });
      for (const row of updatedList) {
        await db.update(pushRecommendations).set({
          status: 'emailed',
          emailedAt: new Date(),
          emailPreviewUrl: emailResult?.previewUrl || null,
        }).where(eq(pushRecommendations.id, row.id));
      }
    }

    const finalRows = await db.select().from(pushRecommendations);
    const sorted = finalRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      success: true,
      message: `Fresh approval email template sent to ${adminEmail} for ${updatedList.length} recommendation(s)!`,
      emailPreviewUrl: emailResult?.previewUrl || null,
      items: sorted,
    });
  } catch (err) {
    console.error('[pushRecommendations] resendPushRecommendationsEmail error:', err);
    res.status(500).json({ message: 'Failed to resend approval email', error: err.message });
  }
}

// GET /api/push-recommendations?status=new
export async function listRecommendations(req, res) {
  try {
    await ensureTable();
    const { status } = req.query;
    const rows = status
      ? await db.select().from(pushRecommendations).where(eq(pushRecommendations.status, status))
      : await db.select().from(pushRecommendations);
    res.json(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recommendations', error: err.message });
  }
}

// GET /api/push-recommendations/:id/decide?token=...&action=approve|dismiss (Clicked directly from email)
export async function decideByToken(req, res) {
  try {
    await ensureTable();
    const { id } = req.params;
    const { token, action } = req.query;

    if (!['approve', 'dismiss'].includes(action)) {
      return res.status(400).send(htmlPage('Invalid Action', 'This approval link contains an unrecognized action.', 'red'));
    }

    const [row] = await db.select().from(pushRecommendations).where(eq(pushRecommendations.id, Number(id)));
    if (!row) {
      return res.status(404).send(htmlPage('Recommendation Not Found', 'This sales push recommendation no longer exists.', 'red'));
    }

    if (row.status === 'actioned' || row.status === 'dismissed') {
      return res.status(200).send(
        htmlPage(
          'Already Decided',
          `This recommendation for <strong>${row.productName}</strong> (${row.sku}) has already been marked as <strong>${row.status.toUpperCase()}</strong>.`,
          row.status === 'actioned' ? 'green' : 'amber',
          `Decided via ${row.decidedVia || 'system'} on ${row.decidedAt ? new Date(row.decidedAt).toLocaleString('en-IN') : 'earlier'}`
        )
      );
    }

    const reqToken = String(token || '').trim();
    const dbToken = String(row.approvalToken || row.approval_token || '').trim();

    if (!dbToken || dbToken !== reqToken) {
      return res.status(403).send(htmlPage('Link Invalid', 'This approval token is invalid or has already been used.', 'red'));
    }

    if (row.tokenExpiresAt && new Date(row.tokenExpiresAt) < new Date()) {
      return res.status(403).send(htmlPage('Link Expired', 'This approval link has expired (valid for 7 days).', 'red'));
    }

    const newStatus = action === 'approve' ? 'actioned' : 'dismissed';
    const approver = getAdminApprover();

    await db.update(pushRecommendations).set({
      status: newStatus,
      decidedAt: new Date(),
      decidedVia: 'email',
      decidedBy: approver,
      approvalToken: null, // Invalidate token for single use
    }).where(eq(pushRecommendations.id, Number(id)));

    if (action === 'approve') {
      return res.status(200).send(
        htmlPage(
          'Sales Push Approved! 🎉',
          `You have approved pushing <strong>${row.productName}</strong> (${row.sku}) on <strong>${row.recommendedChannel.toUpperCase()}</strong>.`,
          'green',
          `Approved by ${approver} via email at ${new Date().toLocaleTimeString('en-IN')}`
        )
      );
    } else {
      return res.status(200).send(
        htmlPage(
          'Recommendation Dismissed',
          `You have dismissed the push recommendation for <strong>${row.productName}</strong> (${row.sku}).`,
          'amber',
          `Dismissed by ${approver} via email at ${new Date().toLocaleTimeString('en-IN')}`
        )
      );
    }
  } catch (err) {
    console.error('[pushRecommendations] decideByToken error:', err);
    res.status(500).send(htmlPage('Server Error', 'Failed to process your decision.', 'red'));
  }
}

// PATCH /api/push-recommendations/:id   { status: 'actioned' | 'dismissed' }  (From Dashboard UI)
export async function updateRecommendationStatus(req, res) {
  try {
    await ensureTable();
    const { id } = req.params;
    const { status } = req.body;
    if (!['actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'status must be "actioned" or "dismissed"' });
    }

    const userName = req.user?.name || req.user?.email || 'Dashboard Admin';
    const [updated] = await db.update(pushRecommendations).set({
      status,
      decidedAt: new Date(),
      decidedVia: 'dashboard',
      decidedBy: userName,
      approvalToken: null,
    }).where(eq(pushRecommendations.id, Number(id))).returning();

    if (!updated) return res.status(404).json({ message: 'Recommendation not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update recommendation', error: err.message });
  }
}
