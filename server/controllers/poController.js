import { db } from '../db/index.js';
import { vendors } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { sendPurchaseOrderEmail } from '../services/emailService.js';

// ── Send PO email to a single vendor ──────────────────────────────────────────
export async function sendPoEmail(req, res) {
  const { vendorId, vendorEmail, vendorName, poDetails } = req.body;

  try {
    let email = vendorEmail;
    let name = vendorName;

    // If vendorId is provided and email is missing, fetch from database
    if (vendorId && (!email || !name)) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, Number(vendorId)));
      if (vendor) {
        email = email || vendor.email;
        name = name || vendor.name;
      }
    }

    if (!email) {
      return res.status(400).json({
        message: `Vendor ${name || ''} does not have an email address configured.`,
      });
    }

    const result = await sendPurchaseOrderEmail({
      to: email,
      vendorName: name,
      poDetails,
    });

    res.json({
      message: `Purchase order email sent successfully to ${name} (${email})`,
      ...result,
    });
  } catch (err) {
    console.error('[poController.sendPoEmail]', err);
    res.status(500).json({
      message: 'Failed to send purchase order email',
      error: err.message,
    });
  }
}

// ── Send PO email to multiple or all vendors ─────────────────────────────────
export async function sendPoToAll(req, res) {
  const { vendorIds, poDetails } = req.body;

  try {
    let targetVendors = [];

    if (Array.isArray(vendorIds) && vendorIds.length > 0) {
      targetVendors = await db
        .select()
        .from(vendors)
        .where(inArray(vendors.id, vendorIds.map(Number)));
    } else {
      // Fetch all vendors from DB
      targetVendors = await db.select().from(vendors);
    }

    if (targetVendors.length === 0) {
      return res.status(400).json({ message: 'No vendors found to send purchase order to.' });
    }

    const results = await Promise.allSettled(
      targetVendors.map(async (v) => {
        if (!v.email) {
          throw new Error(`Vendor ${v.name} (${v.vendorCode}) has no email address`);
        }
        return await sendPurchaseOrderEmail({
          to: v.email,
          vendorName: v.name,
          poDetails,
        });
      })
    );

    const successful = [];
    const failed = [];

    results.forEach((r, idx) => {
      const v = targetVendors[idx];
      if (r.status === 'fulfilled') {
        successful.push({
          vendorId: v.id,
          vendorCode: v.vendorCode,
          name: v.name,
          email: v.email,
          previewUrl: r.value.previewUrl,
        });
      } else {
        failed.push({
          vendorId: v.id,
          vendorCode: v.vendorCode,
          name: v.name,
          error: r.reason?.message || 'Failed to send email',
        });
      }
    });

    res.json({
      message: `Sent to ${successful.length} of ${targetVendors.length} vendors`,
      total: targetVendors.length,
      successCount: successful.length,
      failCount: failed.length,
      successful,
      failed,
    });
  } catch (err) {
    console.error('[poController.sendPoToAll]', err);
    res.status(500).json({
      message: 'Failed to process bulk purchase order emails',
      error: err.message,
    });
  }
}
