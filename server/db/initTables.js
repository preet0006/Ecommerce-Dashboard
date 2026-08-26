import 'dotenv/config';
import { db } from './index.js';

export async function initTables() {
  try {
    console.log('📦 Verifying and aligning PostgreSQL tables in Neon...');

    // 1. System Users table (Role-Based Access Control)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        role VARCHAR(30) DEFAULT 'reader' NOT NULL,
        status VARCHAR(30) DEFAULT 'active' NOT NULL,
        department VARCHAR(100) DEFAULT 'Procurement',
        avatar VARCHAR(10) DEFAULT 'GF',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    await db.execute(`
      ALTER TABLE system_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
    await db.execute(`
      ALTER TABLE system_users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64)
    `);
    await db.execute(`
      ALTER TABLE system_users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP
    `);

    // Seed default Admin and Reader users if table is empty
    await db.execute(`
      INSERT INTO system_users (name, email, role, status, department, avatar)
      VALUES 
        ('Rahul Joshi', 'admin@greenfibre.com', 'admin', 'active', 'Executive Management', 'RJ'),
        ('Pooja Patel', 'pooja.patel@greenfibre.com', 'reader', 'active', 'Inventory Auditing', 'PP')
      ON CONFLICT (email) DO NOTHING;
    `);

    // 2. App Settings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        updated_by VARCHAR(100) DEFAULT 'Admin',
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 3. Purchase Orders table
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

    // Ensure all columns exist on purchase_orders
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

    // 4. AI Chat Sessions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        pinned VARCHAR(10) DEFAULT 'false',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 5. AI User Queries History table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_user_queries (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        query_text TEXT NOT NULL,
        file_name VARCHAR(255),
        file_size VARCHAR(50),
        file_type VARCHAR(50),
        file_content_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ All PostgreSQL tables (Users, Settings, POs, AI) ready in Neon!');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
}

if (process.argv[1]?.endsWith('initTables.js')) {
  initTables().then(() => process.exit(0));
}
