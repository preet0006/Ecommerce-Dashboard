import { db } from '../db/index.js';
import { purchaseOrders } from '../db/schema.js';
import { eq, or, and, isNull } from 'drizzle-orm';
import { sendVendorFollowUpReminderEmail } from '../services/emailService.js';

/**
 * Runs the daily check on all active purchase orders.
 * Matches orders where day given is e.g. 15 days, and elapsed days >= 10 days (threshold).
 * Automatically dispatches the "What's the update?" status email to the vendor.
 */
export async function checkAndSendVendorFollowUps() {
  console.log('⏰ [Daily Cron Job] Running vendor 10-day status follow-up check...');

  try {
    const activeOrders = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          or(
            eq(purchaseOrders.status, 'pending'),
            eq(purchaseOrders.status, 'confirmed'),
            eq(purchaseOrders.status, 'Pending Approval'),
            eq(purchaseOrders.status, 'Approved')
          ),
          or(
            eq(purchaseOrders.reminderSent, 'false'),
            isNull(purchaseOrders.reminderSent)
          )
        )
      );

    console.log(`[Daily Cron Job] Found ${activeOrders.length} active orders to evaluate for reminders.`);

    let sentCount = 0;
    const now = Date.now();

    for (const po of activeOrders) {
      const createdTime = new Date(po.createdAt).getTime();
      const elapsedDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
      const threshold = po.reminderDaysThreshold || 10;
      const givenDays = po.givenDays || 15;

      // Check if threshold days (e.g. 10 days out of 15) have been reached
      // For immediate demonstration, if elapsedDays >= threshold OR if po was specifically flagged
      if (elapsedDays >= threshold && po.vendorEmail) {
        try {
          console.log(`📨 [Daily Cron Job] Order ${po.poNumber} (${po.vendorName}) reached Day ${elapsedDays} of ${givenDays}. Sending status inquiry...`);

          const result = await sendVendorFollowUpReminderEmail({
            to: po.vendorEmail,
            vendorName: po.vendorName,
            poDetails: po,
            daysElapsed: elapsedDays,
            givenDays: givenDays,
          });

          await db
            .update(purchaseOrders)
            .set({
              reminderSent: 'true',
              reminderSentAt: new Date(),
              reminderEmailPreviewUrl: result.previewUrl || null,
              updatedAt: new Date(),
            })
            .where(eq(purchaseOrders.id, po.id));

          sentCount++;
          console.log(`✅ [Daily Cron Job] Reminder recorded in DB for PO ${po.poNumber} to ${po.vendorName}`);
        } catch (mailErr) {
          console.error(`❌ [Daily Cron Job] Failed to send reminder for PO ${po.poNumber}:`, mailErr.message);
        }
      }
    }

    console.log(`⏰ [Daily Cron Job] Finished. ${sentCount} reminder email(s) dispatched.`);
    return { checked: activeOrders.length, sent: sentCount };
  } catch (err) {
    console.error('❌ [Daily Cron Job] Error evaluating vendor follow-ups:', err.message);
    return { error: err.message };
  }
}

/**
 * Initializes the once-a-day background cron scheduler
 */
export function startVendorFollowUpCron() {
  console.log('⏰ Initializing Vendor 10-Day Follow-Up Cron Job (Runs once daily)...');

  // Run initial check after server starts (with 5s delay)
  setTimeout(() => {
    checkAndSendVendorFollowUps().catch((e) =>
      console.error('[vendorFollowupCron] Initial run error:', e.message)
    );
  }, 5000);

  // Set recurring daily interval (24 hours = 86,400,000 ms)
  const ONCE_A_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    checkAndSendVendorFollowUps().catch((e) =>
      console.error('[vendorFollowupCron] Scheduled daily run error:', e.message)
    );
  }, ONCE_A_DAY_MS);
}
