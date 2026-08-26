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

// ─── Purchase Orders Schema ──────────────────────────────────────────────────
export const purchaseOrders = pgTable('purchase_orders', {
  id:                     serial('id').primaryKey(),
  poNumber:               varchar('po_number', { length: 50 }).notNull().unique(), // e.g. PO-2026-0145
  vendorId:               integer('vendor_id'),                                     // references vendors.id
  vendorName:             varchar('vendor_name', { length: 200 }).notNull(),
  vendorEmail:            varchar('vendor_email', { length: 150 }),
  vendorContact:          varchar('vendor_contact', { length: 50 }),
  sku:                    varchar('sku', { length: 100 }).notNull(),
  productName:            varchar('product_name', { length: 200 }),
  quantity:               integer('quantity').notNull(),
  rate:                   numeric('rate', { precision: 10, scale: 2 }).notNull(),
  totalValue:             numeric('total_value', { precision: 12, scale: 2 }).notNull(),
  creditDays:             integer('credit_days').default(30),
  givenDays:              integer('given_days').default(15),                         // Total delivery timeline given to vendor (e.g. 15 days)
  reminderDaysThreshold:  integer('reminder_days_threshold').default(10),             // Day on which status update reminder will be sent (e.g. 10th day)
  expectedDelivery:       varchar('expected_delivery', { length: 50 }),              // Due date / Delivery deadline
  notes:                  text('notes'),
  requestedBy:            varchar('requested_by', { length: 100 }).default('Purchase Team'),
  status:                 varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' (shows in Approval Queue) | 'confirmed' (shows in PO List) | 'rejected' | 'in_transit' | 'delivered'
  emailStatus:            varchar('email_status', { length: 50 }).default('sent'),        // 'sent' | 'pending' | 'failed'
  emailPreviewUrl:        text('email_preview_url'),
  reminderSent:           varchar('reminder_sent', { length: 10 }).default('false'),     // 'true' | 'false'
  reminderSentAt:         timestamp('reminder_sent_at'),
  reminderEmailPreviewUrl: text('reminder_email_preview_url'),
  rejectionReason:        text('rejection_reason'),
  confirmedAt:            timestamp('confirmed_at'),
  isDelivered:            varchar('is_delivered', { length: 10 }).default('false'),       // 'true' | 'false'
  deliveredAt:            timestamp('delivered_at'),
  deliveryTimeliness:     varchar('delivery_timeliness', { length: 50 }),                  // 'on_time' | 'late'
  delayDays:              integer('delay_days').default(0),                                // Number of days late
  deliveredOnTime:        varchar('delivered_on_time', { length: 10 }),                    // 'true' | 'false'
  deliveryFeedback:       text('delivery_feedback'),
  createdAt:              timestamp('created_at').defaultNow().notNull(),
  updatedAt:              timestamp('updated_at').defaultNow().notNull(),
});
