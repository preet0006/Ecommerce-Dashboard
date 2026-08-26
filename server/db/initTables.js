import 'dotenv/config';
import { db } from './index.js';

export async function initTables() {
  try {
    console.log('📦 Verifying and aligning purchase_orders table columns in PostgreSQL...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) NOT NULL UNIQUE,
        vendor_id INTEGER,
        vendor_name VARCHAR(200) NOT NULL,
        vendor_email VARCHAR(150),
        vendor_contact VARCHAR(50),
        sku VARCHAR(100) NOT NULL,
        product_name VARCHAR(200),
        quantity INTEGER NOT NULL DEFAULT 1,
        rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
        credit_days INTEGER DEFAULT 30,
        given_days INTEGER DEFAULT 15,
        reminder_days_threshold INTEGER DEFAULT 10,
        expected_delivery VARCHAR(50),
        notes TEXT,
        requested_by VARCHAR(100) DEFAULT 'Purchase Team',
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        email_status VARCHAR(50) DEFAULT 'sent',
        email_preview_url TEXT,
        reminder_sent VARCHAR(10) DEFAULT 'false',
        reminder_sent_at TIMESTAMP,
        reminder_email_preview_url TEXT,
        rejection_reason TEXT,
        confirmed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Ensure all new columns exist
    const alterQueries = [
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quantity INTEGER;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rate NUMERIC(10, 2);`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_contact VARCHAR(50);`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS product_name VARCHAR(200);`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS given_days INTEGER DEFAULT 15;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reminder_days_threshold INTEGER DEFAULT 10;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'sent';`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS email_preview_url TEXT;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reminder_sent VARCHAR(10) DEFAULT 'false';`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reminder_email_preview_url TEXT;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS is_delivered VARCHAR(10) DEFAULT 'false';`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_timeliness VARCHAR(50);`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 0;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivered_on_time VARCHAR(10);`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_feedback TEXT;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT;`,
      `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requested_by VARCHAR(100) DEFAULT 'Purchase Team';`,
    ];

    for (const q of alterQueries) {
      await db.execute(q);
    }

    // Drop NOT NULL constraints from any old legacy columns if they exist
    const legacyDropNotNull = [
      `ALTER TABLE purchase_orders ALTER COLUMN requested_qty DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN target_rate DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN total_value DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN margin DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approved_qty DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approved_rate DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approved_credit_days DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approved_delivery DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approval_notes DROP NOT NULL;`,
      `ALTER TABLE purchase_orders ALTER COLUMN approved_by DROP NOT NULL;`,
    ];

    for (const q of legacyDropNotNull) {
      try {
        await db.execute(q);
      } catch (_) {}
    }

    console.log('✅ purchase_orders table & all constraints ready in PostgreSQL (Neon)!');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
}

if (process.argv[1]?.endsWith('initTables.js')) {
  initTables().then(() => process.exit(0));
}
