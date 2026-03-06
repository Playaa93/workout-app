'use client';

import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/web';
import { useEffect, useState, type ReactNode } from 'react';
import { getPowerSyncDb, initPowerSync } from './system';

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    initPowerSync()
      .then((instance) => {
        if (mounted) setDb(instance);
      })
      .catch((err) => {
        console.error('PowerSync init failed:', err);
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // During SSR or before init, render children without PowerSync context
  // This allows server components and static parts to render normally
  if (!db) {
    return <>{children}</>;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
