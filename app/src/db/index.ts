import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For queries
const queryClient = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(queryClient, { schema });

// Export all schema items
export * from './schema';
