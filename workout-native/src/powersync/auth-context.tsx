import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3015';

type AuthState = {
  userId: string | null;
  email: string | null;
  token: string | null;
  loading: boolean;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState & AuthActions>({
  userId: null,
  email: null,
  token: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
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
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    email: null,
    token: null,
    loading: true,
  });

  // Restore token on mount
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const userId = await SecureStore.getItemAsync('user_id');
      const email = await SecureStore.getItemAsync('user_email');

      if (token && userId) {
        setAuth({ userId, email, token, loading: false });
      } else {
        setAuth({ userId: null, email: null, token: null, loading: false });
      }
    })();
  }, []);

  async function login(email: string, password: string): Promise<{ error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Erreur de connexion' };
      }

      // Store credentials
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_id', data.user.id);
      await SecureStore.setItemAsync('user_email', data.user.email);

      setAuth({
        userId: data.user.id,
        email: data.user.email,
        token: data.token,
        loading: false,
      });

      return {};
    } catch {
      return { error: 'Impossible de se connecter au serveur' };
    }
  }

  async function logout(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_id');
    await SecureStore.deleteItemAsync('user_email');
    setAuth({ userId: null, email: null, token: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
