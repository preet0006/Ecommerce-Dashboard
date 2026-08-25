import { pgTable, serial, varchar, text, integer, numeric, timestamp, unique } from 'drizzle-orm/pg-core';

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id:           serial('id').primaryKey(),
  vendorCode:   varchar('vendor_code', { length: 20 }).notNull().unique(), // e.g. V-001
  name:         varchar('name', { length: 200 }).notNull(),
  contact:      varchar('contact', { length: 30 }),
  email:        varchar('email', { length: 150 }),
  gstin:        varchar('gstin', { length: 20 }),
  address:      text('address'),
  leadTimeDays: integer('lead_time_days').default(7),
  creditDays:   integer('credit_days').default(30),
  // Performance metrics (updated via purchase / quality module)
  skusSupplied:   integer('skus_supplied').default(0),
  rejectionPct:   numeric('rejection_pct', { precision: 5, scale: 2 }).default('0'),
  deliveryPct:    numeric('delivery_pct',  { precision: 5, scale: 2 }).default('100'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
});

// ─── Channel Orders ──────────────────────────────────────────────────────────
export const channelOrders = pgTable('channel_orders', {
  id:             serial('id').primaryKey(),
  channel:        varchar('channel', { length: 20 }).notNull(),           // 'amazon' | 'flipkart' | 'website'
  channelOrderId: varchar('channel_order_id', { length: 100 }).notNull(), // order ID as given by that channel
  productName:    varchar('product_name', { length: 200 }).notNull(),
  productSku:     varchar('product_sku', { length: 100 }),
  quantity:       integer('quantity').default(1).notNull(),
  price:          numeric('price', { precision: 10, scale: 2 }).notNull(),
  status:         varchar('status', { length: 30 }).notNull(),             // 'pending'|'shipped'|'delivered'|'cancelled'|'returned'
  location:       varchar('location', { length: 150 }),
  orderedAt:      timestamp('ordered_at').notNull(),
  lastSyncedAt:   timestamp('last_synced_at').defaultNow().notNull(),
}, (t) => ({
  uniqChannelOrder: unique('uq_channel_order').on(t.channel, t.channelOrderId),
}));
