import React, { useEffect, useState, type ReactNode } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { getPowerSyncDb, initPowerSync } from './system';

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);

  useEffect(() => {
    let mounted = true;

    initPowerSync()
      .then((instance) => {
        if (mounted) setDb(instance);
      })
      .catch((err) => {
        console.error('PowerSync init failed:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!db) {
    return <>{children}</>;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
