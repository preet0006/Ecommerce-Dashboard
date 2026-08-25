/**
 * mockChannelSync.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Stand-in for real Amazon SP-API / Flipkart Seller API / Website webhook sync.
 * Generates ~18 realistic fake orders and upserts them into `channel_orders`
 * using the unique constraint on (channel, channelOrderId) so re-running is safe.
 *
 * Replace the FAKE_ORDERS array with real API calls once credentials exist.
 */

import { db } from '../db/index.js';
import { channelOrders } from '../db/schema.js';
import { sql } from 'drizzle-orm';

const FAKE_ORDERS = [
  // ── Amazon ────────────────────────────────────────────────────────────────
  {
    channel: 'amazon', channelOrderId: 'AMZ-4820931',
    productName: 'Casserole Set A (3pc)', productSku: 'GF-CAS-001',
    quantity: 2, price: '1798.00', status: 'delivered',
    location: 'Amazon FC — Bhiwandi MH', orderedAt: new Date('2026-08-20T08:14:00Z'),
  },
  {
    channel: 'amazon', channelOrderId: 'AMZ-4821104',
    productName: 'Bowl Set B (6pc)', productSku: 'GF-BWL-014',
    quantity: 1, price: '549.00', status: 'shipped',
    location: 'Amazon FC — Bhiwandi MH', orderedAt: new Date('2026-08-21T10:30:00Z'),
  },
  {
    channel: 'amazon', channelOrderId: 'AMZ-4821389',
    productName: 'Pet Bowl Steel', productSku: 'GF-PET-002',
    quantity: 3, price: '747.00', status: 'pending',
    location: 'Amazon FC — Delhi NCR', orderedAt: new Date('2026-08-23T06:45:00Z'),
  },
  {
    channel: 'amazon', channelOrderId: 'AMZ-4819977',
    productName: 'Casserole Set C (5pc)', productSku: 'GF-CAS-005',
    quantity: 1, price: '1399.00', status: 'cancelled',
    location: 'Amazon FC — Bhiwandi MH', orderedAt: new Date('2026-08-18T14:20:00Z'),
  },
  {
    channel: 'amazon', channelOrderId: 'AMZ-4820001',
    productName: 'Storage Container Set', productSku: 'GF-STG-009',
    quantity: 2, price: '998.00', status: 'returned',
    location: 'Amazon FC — Pune MH', orderedAt: new Date('2026-08-15T09:10:00Z'),
  },
  {
    channel: 'amazon', channelOrderId: 'AMZ-4822010',
    productName: 'Pet Feeder Large', productSku: 'GF-PET-006',
    quantity: 1, price: '349.00', status: 'delivered',
    location: 'Amazon FC — Hyderabad TS', orderedAt: new Date('2026-08-24T11:05:00Z'),
  },

  // ── Flipkart ──────────────────────────────────────────────────────────────
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-88231',
    productName: 'Casserole Set A (3pc)', productSku: 'GF-CAS-001',
    quantity: 1, price: '899.00', status: 'delivered',
    location: 'Flipkart WH — Mumbai MH', orderedAt: new Date('2026-08-19T13:00:00Z'),
  },
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-88350',
    productName: 'Bowl Set B (6pc)', productSku: 'GF-BWL-014',
    quantity: 2, price: '1098.00', status: 'shipped',
    location: 'Flipkart WH — Mumbai MH', orderedAt: new Date('2026-08-22T07:30:00Z'),
  },
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-88401',
    productName: 'Casserole Set C (5pc)', productSku: 'GF-CAS-005',
    quantity: 1, price: '1399.00', status: 'pending',
    location: 'Flipkart WH — Bhiwandi MH', orderedAt: new Date('2026-08-24T09:15:00Z'),
  },
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-87990',
    productName: 'Pet Bowl Steel', productSku: 'GF-PET-002',
    quantity: 4, price: '996.00', status: 'delivered',
    location: 'Flipkart WH — Delhi NCR', orderedAt: new Date('2026-08-17T16:45:00Z'),
  },
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-88100',
    productName: 'Storage Container Set', productSku: 'GF-STG-009',
    quantity: 1, price: '499.00', status: 'cancelled',
    location: 'Flipkart WH — Bangalore KA', orderedAt: new Date('2026-08-20T12:00:00Z'),
  },
  {
    channel: 'flipkart', channelOrderId: 'FK-OD-2026-88510',
    productName: 'Casserole Set A (3pc)', productSku: 'GF-CAS-001',
    quantity: 1, price: '899.00', status: 'returned',
    location: 'Flipkart WH — Chennai TN', orderedAt: new Date('2026-08-14T10:30:00Z'),
  },

  // ── Website ───────────────────────────────────────────────────────────────
  {
    channel: 'website', channelOrderId: 'GF-WEB-10041',
    productName: 'Casserole Set A (3pc)', productSku: 'GF-CAS-001',
    quantity: 2, price: '1698.00', status: 'delivered',
    location: 'Self-fulfilled — Bhiwandi', orderedAt: new Date('2026-08-21T08:00:00Z'),
  },
  {
    channel: 'website', channelOrderId: 'GF-WEB-10042',
    productName: 'Pet Bowl Steel', productSku: 'GF-PET-002',
    quantity: 1, price: '249.00', status: 'shipped',
    location: 'Self-fulfilled — Bhiwandi', orderedAt: new Date('2026-08-22T09:45:00Z'),
  },
  {
    channel: 'website', channelOrderId: 'GF-WEB-10043',
    productName: 'Bowl Set B (6pc)', productSku: 'GF-BWL-014',
    quantity: 1, price: '499.00', status: 'pending',
    location: 'Self-fulfilled — Bhiwandi', orderedAt: new Date('2026-08-24T11:30:00Z'),
  },
  {
    channel: 'website', channelOrderId: 'GF-WEB-10044',
    productName: 'Casserole Set C (5pc)', productSku: 'GF-CAS-005',
    quantity: 3, price: '3597.00', status: 'delivered',
    location: 'Self-fulfilled — Delhi NCR', orderedAt: new Date('2026-08-16T14:10:00Z'),
  },
  {
    channel: 'website', channelOrderId: 'GF-WEB-10045',
    productName: 'Pet Feeder Large', productSku: 'GF-PET-006',
    quantity: 2, price: '698.00', status: 'cancelled',
    location: null, orderedAt: new Date('2026-08-23T16:00:00Z'),
  },
  {
    channel: 'website', channelOrderId: 'GF-WEB-10046',
    productName: 'Storage Container Set', productSku: 'GF-STG-009',
    quantity: 1, price: '449.00', status: 'returned',
    location: 'Self-fulfilled — Bhiwandi', orderedAt: new Date('2026-08-12T07:20:00Z'),
  },
];

export async function runMockChannelSync() {
  console.log('[mockChannelSync] Starting fake order sync…');
  let inserted = 0;
  let skipped  = 0;

  for (const order of FAKE_ORDERS) {
    try {
      await db
        .insert(channelOrders)
        .values({ ...order, lastSyncedAt: new Date() })
        .onConflictDoNothing(); // safe upsert: skip if (channel, channelOrderId) already exists
      inserted++;
    } catch (err) {
      console.warn(`[mockChannelSync] Skipped ${order.channelOrderId}:`, err.message);
      skipped++;
    }
  }

  console.log(`[mockChannelSync] Done — ${inserted} inserted, ${skipped} skipped (already exist).`);
}
