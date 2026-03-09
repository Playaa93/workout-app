import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/web';

// Determine base URL for API calls
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3015';
}

export class PowerSyncConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const response = await fetch(`${getBaseUrl()}/api/powersync-token`, {
      credentials: 'include', // Send session cookie
    });

    if (!response.ok) {
      throw new Error('Failed to fetch PowerSync credentials');
    }

    const data = await response.json();
    return {
      endpoint: data.powersync_url,
      token: data.token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      const operations = transaction.crud.map((entry: CrudEntry) => ({
        op: entry.op,
        table: entry.table,
        id: entry.id,
        data: entry.opData,
      }));

      const response = await fetch(`${getBaseUrl()}/api/powersync-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload failed: ${error}`);
      }

      await transaction.complete();
    } catch (error) {
      console.error('PowerSync upload error:', error);
      const msg = error instanceof Error ? error.message : '';
      // Permanent errors (bad SQL, schema mismatch): complete transaction to unblock queue
      // Transient errors (network): rethrow so PowerSync retries
      if (msg.includes('Failed query') || msg.includes('violates') || msg.includes('no column')) {
        console.warn('Permanent upload error — discarding transaction to unblock sync queue');
        await transaction.complete();
      } else {
        throw error;
      }
    }
  }
}
