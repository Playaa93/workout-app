'use client';

import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/web';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getPowerSyncDb } from './system';
import { PowerSyncConnector } from './connector';

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const { userId, loading } = useAuth();
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !userId) return;

    let mounted = true;
    const instance = getPowerSyncDb();

    async function connect() {
      // If user changed, disconnect and clear local data
      if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
        await instance.disconnectAndClear();
      }

      lastUserIdRef.current = userId;
      await instance.connect(new PowerSyncConnector());

      if (mounted) {
        (window as any).__powersync = instance;
        setDb(instance);
      }
    }

    connect().catch((err) => {
      console.error('PowerSync init failed:', err);
      // Still provide the db instance so hooks can read from local cache
      if (mounted) setDb(instance);
    });

    return () => {
      mounted = false;
      instance.disconnect();
    };
  }, [userId, loading]);

  if (!db) {
    return <>{children}</>;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
