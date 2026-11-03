import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Share a bounded pool for workflows that need an interactive transaction.
export const transactionalDb = drizzle(postgres(process.env.DATABASE_URL!, {
  max: 2,
  prepare: false,
  idle_timeout: 15,
  connect_timeout: 8,
}));
