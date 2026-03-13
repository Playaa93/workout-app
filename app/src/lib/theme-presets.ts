export type ThemeId = 'light' | 'dark' | 'navy' | 'gray' | 'cream'
export const DARK_THEMES = new Set<ThemeId>(['dark', 'navy'])
export const ALL_THEME_IDS: ThemeId[] = ['light', 'dark', 'navy', 'gray', 'cream']

export interface ThemePreset {
  id: ThemeId
  label: string
  description: string
  isDark: boolean
  // surfaces
  surfaceBg: string
  panelBg: string
  // text
  textHeading: string
  textMedium: string
  textFaint: string
  // glass card
  glassBase: string
  glassBorderAlpha: number
  cardBg: string
  cardBorder: string
  // mesh gradient tint
  meshTint: string
  // MUI overrides
  muiBackground: string
  muiPaper: string
  muiDivider: string
  muiTextPrimary: string
  muiTextSecondary: string
  // preview (pour UI settings)
  previewBg: string
  previewCard: string
  previewText: string
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  dark: {
    id: 'dark',
    label: 'Sombre',
    description: 'Sombre pour les yeux',
    isDark: true,
    surfaceBg: '#0a0a09',
    panelBg: '#1c1a14',
    textHeading: '#f5f0e6',
    textMedium: '#9a9488',
    textFaint: '#6b655c',
    glassBase: '#1c1a14',
    glassBorderAlpha: 0.12,
    cardBg: 'rgba(255,255,255,0.07)',
    cardBorder: 'rgba(255,255,255,0.1)',
    meshTint: '#0a0a0a',
    muiBackground: '#121212',
    muiPaper: '#1e1e1e',
    muiDivider: '#2c2c2c',
    muiTextPrimary: '#e1e1e1',
    muiTextSecondary: '#a0a0a0',
    previewBg: '#0a0a09',
    previewCard: '#1c1a14',
    previewText: '#f5f0e6',
  },
  light: {
    id: 'light',
    label: 'Clair',
    description: 'Lumineux et aéré',
    isDark: false,
    surfaceBg: '#f3f1ec',
    panelBg: '#ffffff',
    textHeading: '#1a1715',
    textMedium: '#7a7468',
    textFaint: '#a09888',
    glassBase: '#ffffff',
    glassBorderAlpha: 0.18,
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    meshTint: '#f5f3ef',
    muiBackground: '#fafafa',
    muiPaper: '#ffffff',
    muiDivider: '#e0e0e0',
    muiTextPrimary: '#1c1b1f',
    muiTextSecondary: '#49454f',
    previewBg: '#f3f1ec',
    previewCard: '#ffffff',
    previewText: '#1a1715',
  },
  navy: {
    id: 'navy',
    label: 'Bleu Marine',
    description: 'Premium et profond',
    isDark: true,
    surfaceBg: '#0b1120',
    panelBg: '#131d33',
    textHeading: '#e8eaf0',
    textMedium: '#8891a5',
    textFaint: '#5c6478',
    glassBase: '#131d33',
    glassBorderAlpha: 0.15,
    cardBg: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.08)',
    meshTint: '#0a1020',
    muiBackground: '#0b1120',
    muiPaper: '#131d33',
    muiDivider: '#1e2d4a',
    muiTextPrimary: '#e8eaf0',
    muiTextSecondary: '#8891a5',
    previewBg: '#0b1120',
    previewCard: '#131d33',
    previewText: '#e8eaf0',
  },
  gray: {
    id: 'gray',
    label: 'Gris Clair',
    description: 'Minimal et épuré',
    isDark: false,
    surfaceBg: '#f0f2f5',
    panelBg: '#ffffff',
    textHeading: '#1a1c20',
    textMedium: '#6b7280',
    textFaint: '#9ca3af',
    glassBase: '#ffffff',
    glassBorderAlpha: 0.20,
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.07)',
    meshTint: '#eef0f4',
    muiBackground: '#f0f2f5',
    muiPaper: '#ffffff',
    muiDivider: '#e2e5ea',
    muiTextPrimary: '#1a1c20',
    muiTextSecondary: '#6b7280',
    previewBg: '#f0f2f5',
    previewCard: '#ffffff',
    previewText: '#1a1c20',
  },
  cream: {
    id: 'cream',
    label: 'Crème',
    description: 'Chaleureux et élégant',
    isDark: false,
    surfaceBg: '#f5f0e6',
    panelBg: '#fffdf7',
    textHeading: '#2d2418',
    textMedium: '#7a6f5e',
    textFaint: '#a09580',
    glassBase: '#fffdf7',
    glassBorderAlpha: 0.22,
    cardBg: '#fffdf7',
    cardBorder: 'rgba(0,0,0,0.07)',
    meshTint: '#f3ede0',
    muiBackground: '#f5f0e6',
    muiPaper: '#fffdf7',
    muiDivider: '#e5ddd0',
    muiTextPrimary: '#2d2418',
    muiTextSecondary: '#7a6f5e',
    previewBg: '#f5f0e6',
    previewCard: '#fffdf7',
    previewText: '#2d2418',
  },
}
