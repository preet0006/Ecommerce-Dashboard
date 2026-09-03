import { pgTable, serial, varchar, text, integer, numeric, timestamp, unique, boolean } from 'drizzle-orm/pg-core';

// ─── Staff & Team Members Table ──────────────────────────────────────────────
export const staffMembers = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  memberId: text('member_id').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'Field Sales' | 'Warehouse Helper' | 'Logistics / Driver'
  phone: text('phone'),
  reportingTime: text('reporting_time').default('09:00 AM'),
  status: text('status').default('on_time'), // 'on_time' | 'late' | 'absent' | 'present'
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  lastCheckedInAt: timestamp('last_checked_in_at'),
  lastCheckedOutAt: timestamp('last_checked_out_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Attendance History & Daily Logs (10-Hour Lock Rule) ─────────────────────
export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  role: text('role').default('sales'),
  checkInTime: text('check_in_time'),
  checkOutTime: text('check_out_time'),
  status: varchar('status', { length: 30 }).default('present'), // 'present' | 'late' | 'on_time'
  checkInTimestamp: timestamp('check_in_timestamp').defaultNow(),
  checkOutTimestamp: timestamp('check_out_timestamp'),
  date: varchar('date', { length: 30 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Tasks & Reminders Table (Multi-User & Role-Based RBAC) ──────────────────
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  taskId: text('task_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  reminder: boolean('reminder').default(true),
  reminderTime: text('reminder_time'),
  dueDate: text('due_date'),
  priority: text('priority').default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 30 }).default('pending'), // 'pending' | 'in_progress' | 'completed' | 'cancelled'

  // Creator attribution
  createdBy: text('created_by').default('Admin'),
  createdById: integer('created_by_id'),
  createdByRole: varchar('created_by_role', { length: 50 }).default('admin'), // 'admin' | 'manager' | 'sales' | 'reader' | 'staff'

  // Assignee attribution & Targeting
  assignedTo: text('assigned_to').default('You'),
  assignedToId: integer('assigned_to_id'),
  assignedToRole: varchar('assigned_to_role', { length: 50 }).default('all'), // 'admin' | 'manager' | 'sales' | 'all' | specific role
  department: varchar('department', { length: 100 }).default('General'), // 'Executive' | 'Sales' | 'Operations' | 'Procurement' | 'Warehouse' | 'General'
  category: varchar('category', { length: 100 }).default('General'), // 'Sales Follow-up' | 'Inventory Audit' | 'PO Approval' | 'Dispatch' | 'General'
  notes: text('notes'),
  outcome: text('outcome'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── System Users (Role-Based Access Control) ───────────────────────────────
export const systemUsers = pgTable('system_users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password: varchar('password', { length: 255 }).default('GreenFibre@2026'),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 30 }).default('reader').notNull(), // 'admin' | 'manager' | 'reader'
  status: varchar('status', { length: 30 }).default('active').notNull(), // 'active' | 'inactive'
  department: varchar('department', { length: 100 }).default('Procurement'),
  phone: varchar('phone', { length: 50 }),
  avatar: varchar('avatar', { length: 10 }).default('GF'),
  resetToken: varchar('reset_token', { length: 64 }),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Application Global Settings ────────────────────────────────────────────
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  settingKey: varchar('setting_key', { length: 100 }).notNull().unique(), // e.g. 'company_profile', 'font_preference'
  settingValue: text('setting_value').notNull(),                             // JSON stringified configuration
  updatedBy: varchar('updated_by', { length: 100 }).default('Admin'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  vendorCode: varchar('vendor_code', { length: 20 }).notNull().unique(), // e.g. V-001
  name: varchar('name', { length: 200 }).notNull(),
  contact: varchar('contact', { length: 30 }),
  email: varchar('email', { length: 150 }),
  gstin: varchar('gstin', { length: 20 }),
  address: text('address'),
  leadTimeDays: integer('lead_time_days').default(7),
  creditDays: integer('credit_days').default(30),
  // Performance metrics (updated via purchase / quality module)
  skusSupplied: integer('skus_supplied').default(0),
  rejectionPct: numeric('rejection_pct', { precision: 5, scale: 2 }).default('0'),
  deliveryPct: numeric('delivery_pct', { precision: 5, scale: 2 }).default('100'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Channel Orders ──────────────────────────────────────────────────────────
export const channelOrders = pgTable('channel_orders', {
  id: serial('id').primaryKey(),
  channel: varchar('channel', { length: 20 }).notNull(),           // 'amazon' | 'flipkart' | 'website'
  channelOrderId: varchar('channel_order_id', { length: 100 }).notNull(), // order ID as given by that channel
  productName: varchar('product_name', { length: 200 }).notNull(),
  productSku: varchar('product_sku', { length: 100 }),
  quantity: integer('quantity').default(1).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),             // 'pending'|'shipped'|'delivered'|'cancelled'|'returned'
  location: varchar('location', { length: 150 }),
  orderedAt: timestamp('ordered_at').notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
}, (t) => ({
  uniqChannelOrder: unique('uq_channel_order').on(t.channel, t.channelOrderId),
}));

// ─── Purchase Orders Schema ──────────────────────────────────────────────────
export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(), // e.g. PO-2026-0145
  vendorId: integer('vendor_id'),                                     // references vendors.id
  vendorName: varchar('vendor_name', { length: 200 }).notNull(),
  vendorEmail: varchar('vendor_email', { length: 150 }),
  vendorContact: varchar('vendor_contact', { length: 50 }),
  sku: varchar('sku', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 200 }),
  quantity: integer('quantity').notNull(),
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  totalValue: numeric('total_value', { precision: 12, scale: 2 }).notNull(),
  creditDays: integer('credit_days').default(30),
  givenDays: integer('given_days').default(15),                         // Total delivery timeline given to vendor (e.g. 15 days)
  reminderDaysThreshold: integer('reminder_days_threshold').default(10),             // Day on which status update reminder will be sent (e.g. 10th day)
  expectedDelivery: varchar('expected_delivery', { length: 50 }),              // Due date / Delivery deadline
  notes: text('notes'),
  requestedBy: varchar('requested_by', { length: 100 }).default('Purchase Team'),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' (shows in Approval Queue) | 'confirmed' (shows in PO List) | 'rejected' | 'in_transit' | 'delivered'
  emailStatus: varchar('email_status', { length: 50 }).default('sent'),        // 'sent' | 'pending' | 'failed'
  emailPreviewUrl: text('email_preview_url'),
  reminderSent: varchar('reminder_sent', { length: 10 }).default('false'),     // 'true' | 'false'
  reminderSentAt: timestamp('reminder_sent_at'),
  reminderEmailPreviewUrl: text('reminder_email_preview_url'),
  rejectionReason: text('rejection_reason'),
  confirmedAt: timestamp('confirmed_at'),
  isDelivered: varchar('is_delivered', { length: 10 }).default('false'),       // 'true' | 'false'
  deliveredAt: timestamp('delivered_at'),
  deliveryTimeliness: varchar('delivery_timeliness', { length: 50 }),                  // 'on_time' | 'late'
  delayDays: integer('delay_days').default(0),                                // Number of days late
  deliveredOnTime: varchar('delivered_on_time', { length: 10 }),                    // 'true' | 'false'
  deliveryFeedback: text('delivery_feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── AI Chat Sessions ────────────────────────────────────────────────────────
export const aiChatSessions = pgTable('ai_chat_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  pinned: varchar('pinned', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── AI User Question History (Stores only user queries & attachments) ────────
export const aiUserQueries = pgTable('ai_user_queries', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  queryText: text('query_text').notNull(),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: varchar('file_size', { length: 50 }),
  fileType: varchar('file_type', { length: 50 }),
  fileContentSummary: text('file_content_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Products & Master Inventory/Pricing Schema ──────────────────────────────
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(), // e.g. GF-CAS-001
  name: varchar('name', { length: 250 }).notNull(),
  category: varchar('category', { length: 100 }),
  warehouse: varchar('warehouse', { length: 100 }).default('Bhiwandi'),

  // Costing & Base Pricing
  mrp: numeric('mrp', { precision: 10, scale: 2 }),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  landedCost: numeric('landed_cost', { precision: 10, scale: 2 }),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }),

  // Multi-Channel Listing Prices
  amazon: numeric('amazon_price', { precision: 10, scale: 2 }),
  flipkart: numeric('flipkart_price', { precision: 10, scale: 2 }),
  website: numeric('website_price', { precision: 10, scale: 2 }),

  // Inventory Dimensions
  physical: integer('physical_stock').default(0),
  inTransit: integer('in_transit').default(0),
  reserved: integer('reserved').default(0),
  sales30d: integer('sales_30d').default(0),
  sales7d: integer('sales_7d').default(0),
  avgMonthlySales: integer('avg_monthly_sales').default(0),
  leadTimeDays: integer('lead_time_days').default(14),
  safetyStockDays: integer('safety_stock_days').default(5),
  orderDate: varchar('order_date', { length: 50 }),
  lastSaleDaysAgo: integer('last_sale_days_ago').default(0),
  holdingCostPctPerMonth: numeric('holding_cost_pct', { precision: 4, scale: 2 }).default('2.00'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Price Changes (email + dashboard approval) ──────────────────────────────
export const priceChanges = pgTable('price_changes', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 200 }),
  channel: varchar('channel', { length: 20 }).notNull(),        // 'amazon' | 'flipkart' | 'website'
  fromPrice: numeric('from_price', { precision: 10, scale: 2 }).notNull(),
  toPrice: numeric('to_price', { precision: 10, scale: 2 }).notNull(),
  marginAfterPct: numeric('margin_after_pct', { precision: 5, scale: 2 }),
  requestedBy: varchar('requested_by', { length: 100 }).default('Team'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  approvalToken: varchar('approval_token', { length: 64 }),
  tokenExpiresAt: timestamp('token_expires_at'),
  decidedAt: timestamp('decided_at'),
  decidedVia: varchar('decided_via', { length: 20 }),               // 'email' | 'dashboard'
  decidedBy: varchar('decided_by', { length: 150 }),
  emailStatus: varchar('email_status', { length: 20 }).default('sent'),
  emailPreviewUrl: text('email_preview_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Sales Orders (Field Sales Mobile & Web) ──────────────────────────────────
export const salesOrders = pgTable('sales_orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(), // e.g. SO-2026-001
  clientName: varchar('client_name', { length: 200 }).notNull(),
  clientPhone: varchar('client_phone', { length: 50 }),
  salesRepId: varchar('sales_rep_id', { length: 50 }),
  salesRepName: varchar('sales_rep_name', { length: 150 }),
  items: text('items'), // JSON stringified array of items
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  status: varchar('status', { length: 50 }).default('confirmed').notNull(), // 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  deliveryAddress: text('delivery_address'),
  paymentMethod: varchar('payment_method', { length: 50 }).default('Cash on Delivery'),
  notes: text('notes'),
  orderDate: varchar('order_date', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Sales Client Visits (Field Sales Telemetry & Routes) ─────────────────────
export const salesVisits = pgTable('sales_visits', {
  id: serial('id').primaryKey(),
  visitId: varchar('visit_id', { length: 50 }).notNull().unique(), // e.g. VST-2026-001
  clientName: varchar('client_name', { length: 200 }).notNull(),
  clientAddress: text('client_address'),
  clientPhone: varchar('client_phone', { length: 50 }),
  salesRepId: varchar('sales_rep_id', { length: 50 }),
  salesRepName: varchar('sales_rep_name', { length: 150 }),
  scheduledDate: varchar('scheduled_date', { length: 50 }),
  scheduledTime: varchar('scheduled_time', { length: 50 }),
  status: varchar('status', { length: 50 }).default('scheduled').notNull(), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  purpose: varchar('purpose', { length: 200 }).default('Product Demo & Order Taking'),
  outcome: text('outcome'),
  notes: text('notes'),
  latitude: numeric('latitude', { precision: 10, scale: 6 }),
  longitude: numeric('longitude', { precision: 10, scale: 6 }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Sales Locations (Live GPS Telemetry & Fleet Tracking) ───────────────────
export const salesLocations = pgTable('sales_locations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 100 }).default('Field Sales Rep'),
  latitude: numeric('latitude', { precision: 10, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 6 }).notNull(),
  address: text('address').default('Location not tracked'),
  isGpsEnabled: boolean('is_gps_enabled').default(true),
  lastUpdate: timestamp('last_update').defaultNow(),
});

// ─── Notes & Reminders Table (Role-Based Access Control) ──────────────────────
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  noteId: text('note_id').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').default(''),
  category: varchar('category', { length: 100 }).default('General'), // 'General', 'Client', 'Order', 'Meeting', 'Personal'
  color: varchar('color', { length: 30 }).default('#F3F4F6'),
  priority: varchar('priority', { length: 30 }).default('medium'), // 'low' | 'medium' | 'high'
  isPinned: boolean('is_pinned').default(false),
  
  // Reminder details
  reminder: boolean('reminder').default(false),
  reminderTime: text('reminder_time'),
  reminderDate: text('reminder_date'),
  
  // Author Attribution & RBAC Scoping
  authorId: integer('author_id'),
  authorName: text('author_name').notNull().default('Staff Member'),
  authorRole: varchar('author_role', { length: 50 }).notNull().default('sales'), // 'admin' | 'manager' | 'sales'
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

