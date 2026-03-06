'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthState = {
  userId: string | null;
  email: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  userId: null,
  email: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useUserId(): string {
  const { userId } = useAuth();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ userId: null, email: null, loading: true });

  useEffect(() => {
    // Fetch current session from server
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setAuth({
          userId: data.userId || null,
          email: data.email || null,
          loading: false,
        });
      })
      .catch(() => {
        setAuth({ userId: null, email: null, loading: false });
      });
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
