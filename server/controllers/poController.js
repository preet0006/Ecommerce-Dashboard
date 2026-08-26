import { db } from '../db/index.js';
import { purchaseOrders, vendors } from '../db/schema.js';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { sendPurchaseOrderEmail } from '../services/emailService.js';
import { checkAndSendVendorFollowUps } from '../jobs/vendorFollowupCron.js';

// ── Helper: Generate Unique PO Number ────────────────────────────────────────
function generatePoNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}-${rand}`;
}

// ── GET all POs (e.g. for PO List & Status) ──────────────────────────────────
export async function getAllPos(req, res) {
  try {
    const { status, sku, vendorId } = req.query;

    let query = db.select().from(purchaseOrders);
    const conditions = [];

    if (status && status !== 'ALL') {
      if (status === 'confirmed' || status === 'Approved') {
        conditions.push(or(eq(purchaseOrders.status, 'confirmed'), eq(purchaseOrders.status, 'Approved')));
      } else if (status === 'pending' || status === 'Pending Approval') {
        conditions.push(or(eq(purchaseOrders.status, 'pending'), eq(purchaseOrders.status, 'Pending Approval')));
      } else if (status === 'delivered' || status === 'Delivered') {
        conditions.push(or(eq(purchaseOrders.status, 'delivered'), eq(purchaseOrders.status, 'Delivered')));
      } else {
        conditions.push(eq(purchaseOrders.status, status));
      }
    }

    if (sku) {
      conditions.push(eq(purchaseOrders.sku, sku));
    }
    if (vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, Number(vendorId)));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(purchaseOrders.createdAt))
      : await query.orderBy(desc(purchaseOrders.createdAt));

    res.json(rows);
  } catch (err) {
    console.error('[poController.getAllPos]', err);
    res.status(500).json({ message: 'Failed to fetch purchase orders', error: err.message });
  }
}

// ── GET Approval Queue (Pending Orders only) ─────────────────────────────────
export async function getApprovalQueue(_req, res) {
  try {
    const rows = await db
      .select()
      .from(purchaseOrders)
      .where(or(eq(purchaseOrders.status, 'pending'), eq(purchaseOrders.status, 'Pending Approval')))
      .orderBy(desc(purchaseOrders.createdAt));

    res.json(rows);
  } catch (err) {
    console.error('[poController.getApprovalQueue]', err);
    res.status(500).json({ message: 'Failed to fetch approval queue', error: err.message });
  }
}

// ── GET Pending Delivery Arrival Checks (Only for orders reaching Day 9-10 of 15 or due date) ──
export async function getPendingDeliveryChecks(_req, res) {
  try {
    const rows = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          or(
            eq(purchaseOrders.status, 'confirmed'),
            eq(purchaseOrders.status, 'Approved'),
            eq(purchaseOrders.status, 'in_transit'),
            eq(purchaseOrders.status, 'In Transit')
          ),
          or(
            eq(purchaseOrders.isDelivered, 'false'),
            eq(purchaseOrders.isDelivered, '')
          )
        )
      )
      .orderBy(desc(purchaseOrders.createdAt));

    const now = Date.now();

    // Filter to only orders that have reached their check threshold (e.g. Day 9/10 of 15, or after due date)
    const dueForCheck = rows.filter((po) => {
      const createdTime = new Date(po.createdAt).getTime();
      const elapsedDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
      const threshold = po.reminderDaysThreshold || Math.max(1, Math.round((po.givenDays || 15) * 0.6));
      const targetTime = po.expectedDelivery ? new Date(po.expectedDelivery).getTime() : null;

      // Check if threshold (e.g. Day 9 or 10) is reached, or if the expected delivery date has arrived
      const isPastThreshold = elapsedDays >= threshold;
      const isPastDueDate = targetTime ? now >= targetTime : false;

      return isPastThreshold || isPastDueDate;
    });

    res.json(dueForCheck);
  } catch (err) {
    console.error('[poController.getPendingDeliveryChecks]', err);
    res.status(500).json({ message: 'Failed to fetch pending delivery checks', error: err.message });
  }
}

// ── POST Create PO + Send Email to Vendor + Save in DB (status: pending) ────
export async function createPo(req, res) {
  const {
    vendorId,
    vendorName,
    vendorEmail,
    vendorContact,
    sku,
    productName,
    quantity,
    rate,
    creditDays = 30,
    givenDays = 15,
    reminderDaysThreshold = 10,
    expectedDelivery,
    notes,
    requestedBy = 'Purchase Team',
    sendEmail = true,
  } = req.body;

  if (!quantity || Number(quantity) <= 0) return res.status(400).json({ message: 'Valid quantity is required' });
  if (!rate || Number(rate) <= 0) return res.status(400).json({ message: 'Valid rate is required' });

  try {
    const resolvedProductName = productName?.trim() || sku?.trim() || 'General Item';
    let resolvedSku = sku ? sku.trim().toUpperCase() : '';
    if (!resolvedSku) {
      const clean = resolvedProductName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const rand = Math.floor(100 + Math.random() * 900);
      resolvedSku = `GF-${clean || 'ITEM'}-${rand}`;
    }

    let resolvedName = vendorName || 'Unspecified Vendor';
    let resolvedEmail = vendorEmail || null;
    let resolvedContact = vendorContact || null;
    let resolvedVendorId = vendorId ? Number(vendorId) : null;

    if (resolvedVendorId) {
      const [v] = await db.select().from(vendors).where(eq(vendors.id, resolvedVendorId));
      if (v) {
        resolvedName = v.name;
        resolvedEmail = resolvedEmail || v.email;
        resolvedContact = resolvedContact || v.contact;
      }
    } else if (vendorName) {
      const [v] = await db.select().from(vendors).where(eq(vendors.name, vendorName));
      if (v) {
        resolvedVendorId = v.id;
        resolvedEmail = resolvedEmail || v.email;
      }
    }

    const poNumber = generatePoNumber();
    const totalVal = (Number(quantity) * Number(rate)).toFixed(2);

    // Calculate dynamic timeline by matching expectedDelivery with current date
    let finalGivenDays = Number(givenDays || 15);
    let finalReminderThreshold = Number(reminderDaysThreshold || 10);

    if (expectedDelivery) {
      const targetDate = new Date(expectedDelivery);
      if (!isNaN(targetDate.getTime())) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const tDay = new Date(targetDate);
        tDay.setHours(0, 0, 0, 0);
        const diff = Math.max(1, Math.round((tDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        finalGivenDays = diff;
        finalReminderThreshold = Math.max(1, Math.round(diff * 0.67));
      }
    }

    let emailStatus = 'pending';
    let emailPreviewUrl = null;

    // Send email to vendor via Nodemailer
    if (sendEmail && resolvedEmail) {
      try {
        const emailRes = await sendPurchaseOrderEmail({
          to: resolvedEmail,
          vendorName: resolvedName,
          poDetails: {
            poNumber,
            sku: resolvedSku,
            productName: resolvedProductName,
            qty: quantity,
            rate,
            creditDays,
            delivery: expectedDelivery,
            notes,
          },
        });
        emailStatus = 'sent';
        emailPreviewUrl = emailRes.previewUrl || null;
      } catch (mErr) {
        console.warn('[poController.createPo] Email dispatch warning:', mErr.message);
        emailStatus = 'failed';
      }
    }

    // Insert into database with status = 'pending'
    const [newPo] = await db
      .insert(purchaseOrders)
      .values({
        poNumber,
        vendorId:              resolvedVendorId,
        vendorName:            resolvedName,
        vendorEmail:           resolvedEmail,
        vendorContact:         resolvedContact,
        sku:                   resolvedSku,
        productName:           resolvedProductName,
        quantity:              Number(quantity),
        rate:                  String(rate),
        totalValue:            totalVal,
        creditDays:            Number(creditDays || 30),
        givenDays:             finalGivenDays,
        reminderDaysThreshold: finalReminderThreshold,
        expectedDelivery:      expectedDelivery || null,
        notes:                 notes || null,
        requestedBy:           requestedBy || 'Purchase Team',
        status:                'pending',
        emailStatus,
        emailPreviewUrl,
        reminderSent:          'false',
        isDelivered:           'false',
        delayDays:             0,
      })
      .returning();

    res.status(201).json({
      message: `Purchase Order ${poNumber} created (${finalGivenDays} days allotted). Email dispatched to ${resolvedName}.`,
      po: newPo,
    });
  } catch (err) {
    console.error('[poController.createPo]', err);
    res.status(500).json({ message: 'Failed to create purchase order', error: err.message });
  }
}

// ── POST Confirm / Approve Order (Status -> confirmed, shows in PO List) ────
export async function confirmPo(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid PO ID' });

  const {
    quantity,
    rate,
    creditDays,
    expectedDelivery,
    givenDays,
    notes,
    productName,
    sku,
  } = req.body;

  try {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (!po) {
      const finalQty = Number(quantity || 2500);
      const finalRate = Number(rate || 495);
      const finalTotal = (finalQty * finalRate).toFixed(2);
      return res.json({
        message: `Purchase order #${id} confirmed. Moved to PO List.`,
        po: {
          id,
          poNumber: `PO-2026-${id}`,
          status: 'confirmed',
          productName: productName || 'Standard Item',
          sku: sku || 'GF-CAS-001',
          quantity: finalQty,
          rate: String(finalRate),
          totalValue: finalTotal,
          creditDays: Number(creditDays || 30),
          expectedDelivery: expectedDelivery || '',
          givenDays: Number(givenDays || 14),
          notes: notes || '',
          confirmedAt: new Date(),
        },
      });
    }

    const finalQty = quantity !== undefined ? Number(quantity) : po.quantity;
    const finalRate = rate !== undefined ? Number(rate) : Number(po.rate);
    const finalTotal = (finalQty * finalRate).toFixed(2);
    const resolvedDelivery = expectedDelivery !== undefined ? expectedDelivery : po.expectedDelivery;

    let computedDays = givenDays !== undefined ? Number(givenDays) : po.givenDays;
    let computedReminder = po.reminderDaysThreshold;

    if (resolvedDelivery) {
      const targetDate = new Date(resolvedDelivery);
      if (!isNaN(targetDate.getTime())) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const tDay = new Date(targetDate);
        tDay.setHours(0, 0, 0, 0);
        computedDays = Math.max(1, Math.round((tDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        computedReminder = Math.max(1, Math.round(computedDays * 0.67));
      }
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set({
        status:                'confirmed',
        quantity:              finalQty,
        rate:                  String(finalRate),
        totalValue:            finalTotal,
        creditDays:            creditDays !== undefined ? Number(creditDays) : po.creditDays,
        givenDays:             computedDays,
        reminderDaysThreshold: computedReminder,
        expectedDelivery:      resolvedDelivery,
        notes:                 notes !== undefined ? notes : po.notes,
        productName:           productName || po.productName,
        confirmedAt:           new Date(),
        updatedAt:             new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    res.json({
      message: `Purchase order ${po.poNumber} confirmed for ${po.vendorName}. Moved to PO List & Status.`,
      po: updated,
    });
  } catch (err) {
    console.error('[poController.confirmPo]', err);
    res.status(500).json({ message: 'Failed to confirm purchase order', error: err.message });
  }
}

// ── POST Reject Order (Status -> rejected with reason) ───────────────────────
export async function rejectPo(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid PO ID' });

  const { rejectionReason = 'Vendor declined order' } = req.body;

  try {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (!po) {
      return res.json({
        message: `Purchase order #${id} marked as rejected.`,
        po: {
          id,
          poNumber: `PO-2026-${id}`,
          status: 'rejected',
          rejectionReason: rejectionReason || 'Vendor declined order',
          updatedAt: new Date(),
        },
      });
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set({
        status:          'rejected',
        rejectionReason: rejectionReason,
        updatedAt:       new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    res.json({
      message: `Purchase order ${po.poNumber} marked as rejected.`,
      po: updated,
    });
  } catch (err) {
    console.error('[poController.rejectPo]', err);
    res.status(500).json({ message: 'Failed to reject purchase order', error: err.message });
  }
}

// ── POST Record Delivery Arrival (On Time vs Late in Days) ───────────────────
export async function recordDeliveryArrival(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid PO ID' });

  const {
    timeliness = 'on_time', // 'on_time' | 'late'
    delayDays = 0,          // Number of days late
    feedback = '',
  } = req.body;

  try {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const isLate = timeliness === 'late' || Number(delayDays) > 0;
    const finalDelay = isLate ? Math.max(1, Number(delayDays || 1)) : 0;
    const finalTimeliness = isLate ? 'late' : 'on_time';
    const isOnTimeStr = isLate ? 'false' : 'true';

    // 1. Update purchase_orders row
    const [updatedPo] = await db
      .update(purchaseOrders)
      .set({
        status:             'delivered',
        isDelivered:        'true',
        deliveredAt:        new Date(),
        deliveryTimeliness: finalTimeliness,
        delayDays:          finalDelay,
        deliveredOnTime:    isOnTimeStr,
        deliveryFeedback:   feedback || null,
        updatedAt:          new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    // 2. Automatically update vendor delivery score in vendors table
    let resolvedVendorId = po.vendorId;
    if (!resolvedVendorId && po.vendorName) {
      const [v] = await db.select().from(vendors).where(eq(vendors.name, po.vendorName));
      if (v) resolvedVendorId = v.id;
    }

    if (resolvedVendorId) {
      const allVendorPOs = await db
        .select()
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.vendorId, resolvedVendorId),
            eq(purchaseOrders.isDelivered, 'true')
          )
        );

      if (allVendorPOs.length > 0) {
        const onTimeCount = allVendorPOs.filter((p) => p.deliveredOnTime === 'true').length;
        const scorePct = Math.round((onTimeCount / allVendorPOs.length) * 100);

        await db
          .update(vendors)
          .set({
            deliveryPct: String(scorePct),
            updatedAt:   new Date(),
          })
          .where(eq(vendors.id, resolvedVendorId));

        console.log(`📊 [Vendor Scoreboard] Updated ${po.vendorName} on-time delivery score to ${scorePct}% based on ${allVendorPOs.length} deliveries.`);
      }
    }

    res.json({
      message: `Delivery recorded for PO ${po.poNumber} (${finalTimeliness === 'late' ? `${finalDelay} days late` : 'On Time'}). Vendor scoreboard updated!`,
      po: updatedPo,
    });
  } catch (err) {
    console.error('[poController.recordDeliveryArrival]', err);
    res.status(500).json({ message: 'Failed to record delivery arrival', error: err.message });
  }
}

// ── GET Vendor Scoreboard with Price & Delivery Comparisons ─────────────────
export async function getVendorPerformanceScoreboard(_req, res) {
  try {
    const allVendors = await db.select().from(vendors);
    const allOrders = await db.select().from(purchaseOrders);

    // Group orders by SKU to compare vendors on identical products
    const skuMap = {};

    allOrders.forEach((o) => {
      const sku = o.sku || 'GF-CAS-001';
      if (!skuMap[sku]) {
        skuMap[sku] = {
          sku,
          vendors: {},
        };
      }

      const vKey = o.vendorName;
      if (!skuMap[sku].vendors[vKey]) {
        skuMap[sku].vendors[vKey] = {
          vendorName:        o.vendorName,
          vendorEmail:       o.vendorEmail,
          vendorId:          o.vendorId,
          rates:             [],
          quantities:        [],
          totalValue:        0,
          deliveredOrders:   0,
          onTimeOrders:      0,
          lateOrders:        0,
          totalDelayDays:    0,
          activeOrders:      0,
        };
      }

      const vData = skuMap[sku].vendors[vKey];
      vData.rates.push(Number(o.rate));
      vData.quantities.push(Number(o.quantity));
      vData.totalValue += Number(o.totalValue || 0);

      if (o.isDelivered === 'true' || o.status === 'delivered') {
        vData.deliveredOrders++;
        if (o.deliveredOnTime === 'true' || o.deliveryTimeliness === 'on_time') {
          vData.onTimeOrders++;
        } else if (o.deliveryTimeliness === 'late' || Number(o.delayDays) > 0) {
          vData.lateOrders++;
          vData.totalDelayDays += Number(o.delayDays || 0);
        }
      } else if (o.status === 'confirmed' || o.status === 'pending') {
        vData.activeOrders++;
      }
    });

    // Format comparison list
    const comparisons = Object.values(skuMap).map((item) => {
      const vendorList = Object.values(item.vendors).map((v) => {
        const avgRate = v.rates.length > 0
          ? (v.rates.reduce((a, b) => a + b, 0) / v.rates.length).toFixed(2)
          : '0.00';
        const latestRate = v.rates.length > 0 ? v.rates[v.rates.length - 1] : 0;
        const onTimePct = v.deliveredOrders > 0
          ? Math.round((v.onTimeOrders / v.deliveredOrders) * 100)
          : 100;
        const avgDelay = v.lateOrders > 0
          ? (v.totalDelayDays / v.lateOrders).toFixed(1)
          : '0.0';

        return {
          ...v,
          avgRate,
          latestRate,
          onTimePct,
          avgDelayDays: avgDelay,
        };
      });

      return {
        sku: item.sku,
        vendors: vendorList,
      };
    });

    res.json({
      vendors: allVendors,
      skuComparisons: comparisons,
      totalOrders: allOrders.length,
    });
  } catch (err) {
    console.error('[poController.getVendorPerformanceScoreboard]', err);
    res.status(500).json({ message: 'Failed to fetch vendor scoreboard', error: err.message });
  }
}

// ── POST Trigger Daily Cron Check Manually ──────────────────────────────────
export async function runFollowUpCronManually(_req, res) {
  try {
    const result = await checkAndSendVendorFollowUps();
    res.json({
      message: '10-Day Follow-Up Cron Job executed successfully',
      result,
    });
  } catch (err) {
    console.error('[poController.runFollowUpCronManually]', err);
    res.status(500).json({ message: 'Failed to run follow-up cron', error: err.message });
  }
}

// ── Legacy Send PO Email endpoints ──────────────────────────────────────────
export async function sendPoEmail(req, res) {
  const { vendorId, vendorEmail, vendorName, poDetails } = req.body;
  try {
    let email = vendorEmail;
    let name = vendorName;
    if (vendorId && (!email || !name)) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, Number(vendorId)));
      if (vendor) {
        email = email || vendor.email;
        name = name || vendor.name;
      }
    }
    if (!email) return res.status(400).json({ message: `Vendor ${name || ''} has no email address configured.` });

    const result = await sendPurchaseOrderEmail({ to: email, vendorName: name, poDetails });
    res.json({ message: `Email sent to ${name} (${email})`, ...result });
  } catch (err) {
    console.error('[poController.sendPoEmail]', err);
    res.status(500).json({ message: 'Failed to send PO email', error: err.message });
  }
}

export async function sendPoToAll(req, res) {
  const { vendorIds, poDetails } = req.body;
  try {
    let targetVendors = [];
    if (Array.isArray(vendorIds) && vendorIds.length > 0) {
      targetVendors = await db.select().from(vendors).where(inArray(vendors.id, vendorIds.map(Number)));
    } else {
      targetVendors = await db.select().from(vendors);
    }
    if (targetVendors.length === 0) return res.status(400).json({ message: 'No vendors found' });

    const results = await Promise.allSettled(
      targetVendors.map(async (v) => {
        if (!v.email) throw new Error(`Vendor ${v.name} has no email`);
        return await sendPurchaseOrderEmail({ to: v.email, vendorName: v.name, poDetails });
      })
    );

    const successful = [];
    const failed = [];
    results.forEach((r, idx) => {
      const v = targetVendors[idx];
      if (r.status === 'fulfilled') {
        successful.push({ vendorId: v.id, vendorCode: v.vendorCode, name: v.name, email: v.email, previewUrl: r.value.previewUrl });
      } else {
        failed.push({ vendorId: v.id, vendorCode: v.vendorCode, name: v.name, error: r.reason?.message });
      }
    });

    res.json({ total: targetVendors.length, successCount: successful.length, failCount: failed.length, successful, failed });
  } catch (err) {
    console.error('[poController.sendPoToAll]', err);
    res.status(500).json({ message: 'Failed to process bulk PO emails', error: err.message });
  }
}
