import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { systemUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
  console.log('Usage: node server/scripts/createFirstAdmin.js "Your Name" you@email.com yourPassword');
  process.exit(1);
}

const existing = await db.select().from(systemUsers).where(eq(systemUsers.email, email.toLowerCase()));
if (existing.length > 0) {
  // If user already exists (e.g. seeded admin), update passwordHash to allow login
  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(systemUsers).set({
    name,
    role: 'admin',
    status: 'active',
    passwordHash,
    avatar: name.slice(0, 2).toUpperCase(),
    updatedAt: new Date(),
  }).where(eq(systemUsers.email, email.toLowerCase()));
  console.log(`✅ Existing admin user updated with password: ${email}`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
await db.insert(systemUsers).values({
  name, email: email.toLowerCase(), role: 'admin', status: 'active',
  avatar: name.slice(0, 2).toUpperCase(), passwordHash,
});

console.log(`✅ Admin user created: ${email}`);
process.exit(0);
