import { createTamagui, createTokens } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes as tamaguiThemes } from '@tamagui/themes';

const interFont = createInterFont();

const tokens = createTokens({
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 48,
    12: 56,
    13: 64,
    14: 80,
    15: 96,
    16: 128,
    true: 16,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    true: 16,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    true: 8,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
    true: 0,
  },
  color: {
    // Purple theme (Material Design 3 inspired)
    primary: '#6750a4',
    primaryDark: '#bb86fc',
    onPrimary: '#ffffff',
    onPrimaryDark: '#381e72',

    secondary: '#625b71',
    secondaryDark: '#ccc2dc',

    surface: '#ffffff',
    surfaceDark: '#1c1b1f',

    surfaceVariant: '#f5f5f5',
    surfaceVariantDark: '#2d2d30',

    background: '#fafafa',
    backgroundDark: '#121212',

    error: '#b3261e',
    errorDark: '#f2b8b5',

    success: '#2e7d32',
    successDark: '#81c784',

    warning: '#ed6c02',
    warningDark: '#ffb74d',

    textPrimary: '#1c1b1f',
    textPrimaryDark: '#e6e1e5',

    textSecondary: '#49454f',
    textSecondaryDark: '#cac4d0',

    border: '#e0e0e0',
    borderDark: '#383838',

    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
});

const lightTheme = {
  background: tokens.color.background,
  backgroundHover: tokens.color.surfaceVariant,
  backgroundPress: tokens.color.surfaceVariant,
  backgroundFocus: tokens.color.surfaceVariant,
  color: tokens.color.textPrimary,
  colorHover: tokens.color.textPrimary,
  colorPress: tokens.color.textPrimary,
  colorFocus: tokens.color.textPrimary,
  borderColor: tokens.color.border,
  borderColorHover: tokens.color.primary,
  borderColorPress: tokens.color.primary,
  borderColorFocus: tokens.color.primary,
  shadowColor: 'rgba(0,0,0,0.1)',
  shadowColorHover: 'rgba(0,0,0,0.15)',
  // Custom semantic tokens
  primary: tokens.color.primary,
  onPrimary: tokens.color.onPrimary,
  secondary: tokens.color.secondary,
  surface: tokens.color.surface,
  surfaceVariant: tokens.color.surfaceVariant,
  error: tokens.color.error,
  success: tokens.color.success,
  warning: tokens.color.warning,
  textSecondary: tokens.color.textSecondary,
};

const darkTheme = {
  background: tokens.color.backgroundDark,
  backgroundHover: tokens.color.surfaceVariantDark,
  backgroundPress: tokens.color.surfaceVariantDark,
  backgroundFocus: tokens.color.surfaceVariantDark,
  color: tokens.color.textPrimaryDark,
  colorHover: tokens.color.textPrimaryDark,
  colorPress: tokens.color.textPrimaryDark,
  colorFocus: tokens.color.textPrimaryDark,
  borderColor: tokens.color.borderDark,
  borderColorHover: tokens.color.primaryDark,
  borderColorPress: tokens.color.primaryDark,
  borderColorFocus: tokens.color.primaryDark,
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowColorHover: 'rgba(0,0,0,0.4)',
  // Custom semantic tokens
  primary: tokens.color.primaryDark,
  onPrimary: tokens.color.onPrimaryDark,
  secondary: tokens.color.secondaryDark,
  surface: tokens.color.surfaceDark,
  surfaceVariant: tokens.color.surfaceVariantDark,
  error: tokens.color.errorDark,
  success: tokens.color.successDark,
  warning: tokens.color.warningDark,
  textSecondary: tokens.color.textSecondaryDark,
};

const config = createTamagui({
  defaultFont: 'body',
  fonts: {
    body: interFont,
    heading: interFont,
  },
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  shorthands,
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
