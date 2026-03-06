import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './schema';

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
