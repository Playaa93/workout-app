'use client';

import { createTheme, ThemeProvider as MuiThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from 'next-themes';
import { useMemo, useEffect, useState, type ReactNode } from 'react';

// Minimal Dark - Apple-like premium palette
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          // DARK MODE - Minimal Dark style
          primary: {
            main: '#bb86fc',
            light: '#d4b4fc',
            dark: '#9a67ea',
            contrastText: '#000000',
          },
          secondary: {
            main: '#03dac6',
            light: '#66fff9',
            dark: '#00a896',
            contrastText: '#000000',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#e1e1e1',
            secondary: '#a0a0a0',
            disabled: '#6b6b6b',
          },
          divider: '#2c2c2c',
          error: {
            main: '#cf6679',
          },
          warning: {
            main: '#ffb74d',
          },
          success: {
            main: '#81c784',
          },
          info: {
            main: '#64b5f6',
          },
          action: {
            hover: alpha('#ffffff', 0.08),
            selected: alpha('#ffffff', 0.12),
            disabled: alpha('#ffffff', 0.26),
            disabledBackground: alpha('#ffffff', 0.12),
          },
        }
      : {
          // LIGHT MODE - Clean minimal
          primary: {
            main: '#6750a4',
            light: '#7f67be',
            dark: '#4f378b',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#018786',
            light: '#4db6ac',
            dark: '#00695c',
            contrastText: '#ffffff',
          },
          background: {
            default: '#fafafa',
            paper: '#ffffff',
          },
          text: {
            primary: '#1c1b1f',
            secondary: '#49454f',
            disabled: '#a0a0a0',
          },
          divider: '#e0e0e0',
          error: {
            main: '#b3261e',
          },
          warning: {
            main: '#f9a825',
          },
          success: {
            main: '#2e7d32',
          },
          info: {
            main: '#0288d1',
          },
          action: {
            hover: alpha('#000000', 0.04),
            selected: alpha('#000000', 0.08),
          },
        }),
  },
  typography: {
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'dark' ? '#3a3a3a #1e1e1e' : '#c4c4c4 #f5f5f5',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? '#3a3a3a' : '#c4c4c4',
            borderRadius: 4,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          boxShadow: mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)'
            : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.12)',
          border: mode === 'dark' ? '1px solid #2c2c2c' : '1px solid #e8e8e8',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.5)'
            : '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#a0a0a0' : '#49454f',
          '&.Mui-selected': {
            color: mode === 'dark' ? '#bb86fc' : '#6750a4',
          },
        },
      },
    },
  },
});

interface MuiProviderProps {
  children: ReactNode;
}

export function MuiProvider({ children }: MuiProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(
    () => createTheme(getDesignTokens(resolvedTheme === 'dark' ? 'dark' : 'light')),
    [resolvedTheme]
  );

  // Avoid hydration flash
  if (!mounted) {
    return (
      <MuiThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
