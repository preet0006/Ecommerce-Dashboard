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
    ];

    for (const q of taskAlterQueries) {
      await db.execute(q);
    }

    // Seed default role-differentiated sample tasks if tasks table is empty
    const existingTasksCount = await db.execute(`SELECT count(*) as count FROM tasks;`);
    const count = Number(existingTasksCount.rows?.[0]?.count ?? existingTasksCount[0]?.count ?? 0);
    if (count === 0) {
      console.log('🌱 Seeding initial multi-role tasks (Admin, Manager, Sales Team)...');
      await db.execute(`
        INSERT INTO tasks (
          task_id, title, description, reminder, reminder_time, due_date, priority, completed, status,
          created_by, created_by_role, assigned_to, assigned_to_role, department, category
        )
        VALUES 
          (
            't_admin_101', 
            'Review Monthly Revenue & Channel Profitability', 
            'Audit Flipkart, Amazon, and Website margins for Q3 strategy alignment.',
            true, '10:00 AM', '${new Date(Date.now() + 86400000).toISOString()}', 'high', false, 'pending',
            'Rahul Joshi (Admin)', 'admin', 'Rahul Joshi', 'admin', 'Executive Management', 'Executive'
          ),
          (
            't_mgr_201', 
            'Audit Bhiwandi Warehouse Inbound Dispatches', 
            'Coordinate with logistics helper team to verify 450 units GF-CAS-001 batch.',
            true, '02:30 PM', '${new Date(Date.now() + 172800000).toISOString()}', 'medium', false, 'in_progress',
            'Vikram Mehta (Manager)', 'manager', 'Vikram Mehta', 'manager', 'Operations', 'Inventory Audit'
          ),
          (
            't_sales_301', 
            'Follow up with Retail Distributor regarding Bulk Festive Order', 
            'Call Metro Garments buyer regarding 300 units cotton denim re-order.',
            true, '11:15 AM', '${new Date(Date.now() + 43200000).toISOString()}', 'high', false, 'pending',
            'Amit Sharma (Sales)', 'sales', 'Amit Sharma', 'sales', 'Sales', 'Sales Follow-up'
          ),
          (
            't_sales_302', 
            'Collect Field Feedback on New Polo Shirts Samples', 
            'Visit 5 retail store counters in Mumbai and record vendor fitment reviews.',
            false, '04:00 PM', '${new Date(Date.now() + 259200000).toISOString()}', 'medium', false, 'pending',
            'Amit Sharma (Sales)', 'sales', 'Field Sales Team', 'sales', 'Sales', 'Field Visits'
          )
        ON CONFLICT (task_id) DO NOTHING;
      `);
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ All PostgreSQL tables (Users, Settings, POs, AI, Products, Tasks, Staff) ready in Neon!');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
}

if (process.argv[1]?.endsWith('initTables.js')) {
  initTables().then(() => process.exit(0));
}
