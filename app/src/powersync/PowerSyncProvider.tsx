'use client';

import { PowerSyncContext, usePowerSync } from '@powersync/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useUserProfile } from './queries/profile-queries';
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
    let initialized = false;
    const instance = getPowerSyncDb();

    const connector = new PowerSyncConnector();
    const resume = () => {
      const status = instance.currentStatus;
      if (initialized && document.visibilityState === 'visible' && navigator.onLine && !status.connected && !status.connecting) {
        void instance.connect(connector).catch(err => console.error('PowerSync reconnect failed:', err));
      }
    };
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
      initialized = true;
      await instance.connect(connector);
    }

    connect().catch((err) => {
      console.error('PowerSync init failed:', err);
    });

    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
      mounted = false;
      instance.disconnect();
    };
  }, [userId, loading]);

  if (!userId || loading) return <>{children}</>;
  if (local?.userId !== userId) return <FullScreenLoader />;

  return (
    <PowerSyncContext.Provider value={local.db}>
      <AccountDataBoundary key={userId}>{children}</AccountDataBoundary>
    </PowerSyncContext.Provider>
  );
}

// These screens can read a saved server copy when the local database is unavailable.
function AccountDataBoundary({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (['/', '/workout', '/workout/active', '/login', '/signup'].includes(path)) return children;
  return <LocalAccountData>{children}</LocalAccountData>;
}

function LocalAccountData({ children }: { children: ReactNode }) {
  const { data, isLoading } = useUserProfile();
  const db = usePowerSync();
  if (data.length) return children;
  if (isLoading) return <FullScreenLoader />;
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info">Les données de ton compte ne sont pas encore disponibles sur cet appareil.</Alert>
      <Button onClick={() => { void db.connect(new PowerSyncConnector()).catch(err => console.error('PowerSync reconnect failed:', err)); }}>Réessayer la synchronisation</Button>
      <Button component={Link} href="/">Accueil</Button>
    </Box>
  );
}
