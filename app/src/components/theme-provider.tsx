'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';
import { ALL_THEME_IDS } from '@/lib/theme-presets';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      themes={ALL_THEME_IDS}
      disableTransitionOnChange={false}
      storageKey="workout-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
