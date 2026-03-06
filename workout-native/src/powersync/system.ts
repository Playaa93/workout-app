import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';
import { NativePowerSyncConnector } from './connector';

let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDb(): PowerSyncDatabase {
  if (powerSyncInstance) return powerSyncInstance;

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: { dbFilename: 'workout.db' },
  });

  return powerSyncInstance;
}

export async function initPowerSync(): Promise<PowerSyncDatabase> {
  const db = getPowerSyncDb();
  const connector = new NativePowerSyncConnector();
  await db.connect(connector);
  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
  }
}
