import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Neon serverless driver - optimized for edge/serverless
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Export all schema items
export * from './schema';
