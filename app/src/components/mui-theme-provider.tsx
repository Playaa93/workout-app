'use client';

import { createTheme, ThemeProvider as MuiThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from 'next-themes';
import { useMemo, useEffect, useState, type ReactNode } from 'react';
import { THEME_PRESETS, DARK_THEMES, type ThemeId } from '@/lib/theme-presets';

function getDesignTokens(themeId: ThemeId) {
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS.dark;
  const mode = preset.isDark ? 'dark' as const : 'light' as const;

  return {
    palette: {
      mode,
      ...(preset.isDark
        ? {
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
              default: preset.muiBackground,
              paper: preset.muiPaper,
            },
            text: {
              primary: preset.muiTextPrimary,
              secondary: preset.muiTextSecondary,
              disabled: '#6b6b6b',
            },
            divider: preset.muiDivider,
            error: { main: '#cf6679' },
            warning: { main: '#ffb74d' },
            success: { main: '#81c784' },
            info: { main: '#64b5f6' },
            action: {
              hover: alpha('#ffffff', 0.08),
              selected: alpha('#ffffff', 0.12),
              disabled: alpha('#ffffff', 0.26),
              disabledBackground: alpha('#ffffff', 0.12),
            },
          }
        : {
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
              default: preset.muiBackground,
              paper: preset.muiPaper,
            },
            text: {
              primary: preset.muiTextPrimary,
              secondary: preset.muiTextSecondary,
              disabled: '#a0a0a0',
            },
            divider: preset.muiDivider,
            error: { main: '#b3261e' },
            warning: { main: '#f9a825' },
            success: { main: '#2e7d32' },
            info: { main: '#0288d1' },
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
            scrollbarColor: preset.isDark ? '#3a3a3a #1e1e1e' : '#c4c4c4 #f5f5f5',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': {
              background: preset.isDark ? preset.muiPaper : '#f5f5f5',
            },
            '&::-webkit-scrollbar-thumb': {
              background: preset.isDark ? '#3a3a3a' : '#c4c4c4',
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
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow: preset.isDark
              ? '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)'
              : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.12)',
            border: `1px solid ${preset.muiDivider}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            boxShadow: preset.isDark
              ? '0 1px 3px rgba(0,0,0,0.5)'
              : '0 1px 3px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 64,
            backgroundColor: preset.muiPaper,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: preset.muiTextSecondary,
            '&.Mui-selected': {
              color: preset.isDark ? '#bb86fc' : '#6750a4',
            },
          },
        },
      },
    },
  };
}

interface MuiProviderProps {
  children: ReactNode;
}

export function MuiProvider({ children }: MuiProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const themeId = (resolvedTheme as ThemeId) || 'dark';
    const validId = THEME_PRESETS[themeId] ? themeId : (DARK_THEMES.has(themeId) ? 'dark' : 'light');
    return createTheme(getDesignTokens(validId));
  }, [resolvedTheme]);

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
