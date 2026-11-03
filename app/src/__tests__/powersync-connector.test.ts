import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AbstractPowerSyncDatabase } from '@powersync/web';
import { PowerSyncConnector } from '@/powersync/connector';

describe('PowerSync upload acknowledgement', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it.each([500, 503])('keeps the whole transaction queued after HTTP %i', async status => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Failed query: violates constraint' }), { status })));
    const complete = vi.fn();
    const db = { getNextCrudTransaction: async () => ({ crud: [{ op: 'PATCH', table: 'workout_sets', id: 'set', opData: { rest_taken: 120 } }], complete }) } as unknown as AbstractPowerSyncDatabase;
    await expect(new PowerSyncConnector().uploadData(db)).rejects.toThrow('Upload failed');
    expect(complete).not.toHaveBeenCalled();
  });

  it('acknowledges the transaction only after a successful backend response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
    const complete = vi.fn();
    const db = { getNextCrudTransaction: async () => ({ crud: [{ op: 'PATCH', table: 'workout_sets', id: 'set', opData: { notes: 'note' } }], complete }) } as unknown as AbstractPowerSyncDatabase;
    await new PowerSyncConnector().uploadData(db);
    expect(complete).toHaveBeenCalledOnce();
  });
});
