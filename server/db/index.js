import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ [Database Error]: DATABASE_URL is not defined in environment variables!');
}

const sql = neon(connectionString || '');
export const db = drizzle(sql, { schema });
