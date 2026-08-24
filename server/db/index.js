import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// DATABASE_URL must be set in server/.env
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
