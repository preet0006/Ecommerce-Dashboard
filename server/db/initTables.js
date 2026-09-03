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
        password VARCHAR(255) DEFAULT 'GreenFibre@2026' NOT NULL,
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
    await db.execute(`
      ALTER TABLE system_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)
    `);

    // Ensure password column exists if table was created previously
    await db.execute(`
      ALTER TABLE system_users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'GreenFibre@2026';
    `);

    // Seed default Admin, Manager, Sales, and Reader users if table is empty
    await db.execute(`
      INSERT INTO system_users (name, email, password, role, status, department, avatar)
      VALUES 
        ('Rahul Joshi', 'admin@greenfibre.com', 'Admin@1234', 'admin', 'active', 'Executive Management', 'RJ'),
        ('Vikram Mehta', 'manager@greenfibre.com', 'Manager@1234', 'manager', 'active', 'Operations & Sales', 'VM'),
        ('Amit Sharma', 'sales@greenfibre.com', 'Sales@1234', 'sales', 'active', 'Field Sales', 'AS'),
        ('Pooja Patel', 'pooja.patel@greenfibre.com', 'Reader@1234', 'reader', 'active', 'Inventory Auditing', 'PP')
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

    // 6. Products table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(250) NOT NULL,
        category VARCHAR(100),
        warehouse VARCHAR(100) DEFAULT 'Bhiwandi',
        mrp NUMERIC(10, 2),
        cost_price NUMERIC(10, 2),
        landed_cost NUMERIC(10, 2),
        selling_price NUMERIC(10, 2),
        amazon_price NUMERIC(10, 2),
        flipkart_price NUMERIC(10, 2),
        website_price NUMERIC(10, 2),
        physical_stock INTEGER DEFAULT 0,
        in_transit INTEGER DEFAULT 0,
        reserved INTEGER DEFAULT 0,
        sales_30d INTEGER DEFAULT 0,
        sales_7d INTEGER DEFAULT 0,
        avg_monthly_sales INTEGER DEFAULT 0,
        lead_time_days INTEGER DEFAULT 14,
        safety_stock_days INTEGER DEFAULT 5,
        order_date VARCHAR(50),
        last_sale_days_ago INTEGER DEFAULT 0,
        holding_cost_pct NUMERIC(4, 2) DEFAULT 2.00,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 7. Tasks & Reminders table (Multi-User & Role-Based RBAC)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        task_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        reminder BOOLEAN DEFAULT true,
        reminder_time TEXT,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP,
        status VARCHAR(30) DEFAULT 'pending',
        created_by TEXT DEFAULT 'Admin',
        created_by_id INTEGER,
        created_by_role VARCHAR(50) DEFAULT 'admin',
        assigned_to TEXT DEFAULT 'You',
        assigned_to_id INTEGER,
        assigned_to_role VARCHAR(50) DEFAULT 'all',
        department VARCHAR(100) DEFAULT 'General',
        category VARCHAR(100) DEFAULT 'General',
        notes TEXT,
        outcome TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure all role-based task columns exist if tasks table was created previously
    const taskAlterQueries = [
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Admin';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_id INTEGER;`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) DEFAULT 'admin';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_id INTEGER;`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(50) DEFAULT 'all';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'General';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS outcome TEXT;`,
    ];

    for (const q of taskAlterQueries) {
      await db.execute(q);
    }

    // 8. Staff & Team Members table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id SERIAL PRIMARY KEY,
        member_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        reporting_time TEXT DEFAULT '09:00 AM',
        status TEXT DEFAULT 'on_time',
        check_in TEXT,
        check_out TEXT,
        last_checked_in_at TIMESTAMP,
        last_checked_out_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const staffAlterQueries = [
      `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS check_in TEXT;`,
      `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS check_out TEXT;`,
      `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS last_checked_in_at TIMESTAMP;`,
      `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS last_checked_out_at TIMESTAMP;`,
    ];

    for (const q of staffAlterQueries) {
      await db.execute(q);
    }

    // 9. Attendance History Logs table (10-Hour Lock Enforcement)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        name VARCHAR(150) NOT NULL,
        role VARCHAR(50) DEFAULT 'sales',
        check_in_time VARCHAR(50),
        check_out_time VARCHAR(50),
        status VARCHAR(30) DEFAULT 'present',
        check_in_timestamp TIMESTAMP DEFAULT NOW(),
        check_out_timestamp TIMESTAMP,
        date VARCHAR(30),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Notes & Reminders table (Multi-Role Privacy & RBAC Visibility)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        note_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'General',
        color VARCHAR(30) DEFAULT '#F3F4F6',
        priority VARCHAR(30) DEFAULT 'medium',
        is_pinned BOOLEAN DEFAULT false,
        reminder BOOLEAN DEFAULT false,
        reminder_time TEXT,
        reminder_date TEXT,
        author_id INTEGER,
        author_name TEXT DEFAULT 'Staff Member' NOT NULL,
        author_role VARCHAR(50) DEFAULT 'sales' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 11. Sales Locations table (Live GPS Telemetry & Fleet Tracking)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales_locations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'Field Sales Rep',
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        address TEXT DEFAULT 'Location not tracked',
        is_gps_enabled BOOLEAN DEFAULT TRUE,
        last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ All PostgreSQL tables (Users, Settings, POs, AI, Products, Tasks, Staff, Attendance, Notes, Locations) ready in Neon!');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
}

if (process.argv[1]?.endsWith('initTables.js')) {
  initTables().then(() => process.exit(0));
}
