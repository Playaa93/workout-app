import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './schema';
import { PowerSyncConnector } from './connector';

let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDb(): PowerSyncDatabase {
  if (powerSyncInstance) return powerSyncInstance;

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: { dbFilename: 'workout.db' },
    flags: { useWebWorker: false },
  });

  return powerSyncInstance;
}

export async function initPowerSync(): Promise<PowerSyncDatabase> {
  const db = getPowerSyncDb();
  const connector = new PowerSyncConnector();

  // Connect to PowerSync service
  await db.connect(connector);

  // Expose for debugging (dev only)
  if (typeof window !== 'undefined') {
    (window as any).__powersync = db;
  }

  return db;
}
