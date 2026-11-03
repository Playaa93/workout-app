'use client';

import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/web';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getPowerSyncDb } from './system';
import { PowerSyncConnector } from './connector';
import FullScreenLoader from '@/components/FullScreenLoader';

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const { userId, loading } = useAuth();
  const [local, setLocal] = useState<{ userId: string; db: PowerSyncDatabase } | null>(null);
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

      if (!mounted || !userId) return;
      lastUserIdRef.current = userId;
      // Queries can open the local database while the remote connection starts.
      setLocal({ userId, db: instance });
      Object.assign(window, { __powersync: instance });
      await instance.connect(new PowerSyncConnector());
    }

    connect().catch((err) => {
      console.error('PowerSync init failed:', err);
    });

    return () => {
      mounted = false;
      instance.disconnect();
    };
  }, [userId, loading]);

  if (!userId || loading) return <>{children}</>;
  if (local?.userId !== userId) return <FullScreenLoader />;

  return (
    <PowerSyncContext.Provider value={local.db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
