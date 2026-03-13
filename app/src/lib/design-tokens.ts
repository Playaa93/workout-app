import { alpha } from '@mui/material/styles'
import { THEME_PRESETS, type ThemeId } from './theme-presets'

// Brand colors — Black & Gold
export const GOLD = '#d4af37'
export const GOLD_LIGHT = '#e8c860'
export const GOLD_CONTRAST = '#1a1715'
// Muted gold for recap/detail views
export const GOLD_DARK = '#8b7320'
export const GOLD_MID = '#a6892a'
// Gradient stops for the Graal hexagone+calice brand mark (also hardcoded in SVG icons + offline.html)
export const GOLD_GRAD_START = '#e8c54a'
export const GOLD_GRAD_END = '#b8922a'

// Phosphor Icons weight
export const W = 'light' as const

function resolvePreset(d: boolean | ThemeId) {
  if (typeof d === 'boolean') return d ? THEME_PRESETS.dark : THEME_PRESETS.light
  return THEME_PRESETS[d] ?? THEME_PRESETS.dark
}

// Explicit text color tokens (independent of MUI theme)
export const tc = {
  h: (dark: boolean | ThemeId) => resolvePreset(dark).textHeading,
  m: (dark: boolean | ThemeId) => resolvePreset(dark).textMedium,
  f: (dark: boolean | ThemeId) => resolvePreset(dark).textFaint,
}

// Glassmorphism card style
export const glass = (isDark: boolean | ThemeId, extra?: object) => {
  const p = resolvePreset(isDark)
  return {
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    bgcolor: alpha(p.glassBase, p.isDark ? 0.65 : 0.72),
    border: '1px solid',
    borderColor: alpha(GOLD, p.glassBorderAlpha),
    borderRadius: '20px',
    boxShadow: p.isDark
      ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#ffffff', 0.04)}`
      : `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${alpha('#ffffff', 0.6)}`,
    ...extra,
  }
}

// Minimal card style (flat, subtle border)
export const card = (isDark: boolean | ThemeId, extra?: object) => {
  const p = resolvePreset(isDark)
  return {
    bgcolor: p.cardBg,
    borderRadius: '14px',
    border: '1px solid',
    borderColor: p.cardBorder,
    ...extra,
  }
}

// Surface background (page-level)
export const surfaceBg = (isDark: boolean | ThemeId) => resolvePreset(isDark).surfaceBg

// Drawer / dialog background
export const panelBg = (isDark: boolean | ThemeId) => resolvePreset(isDark).panelBg

// Mesh gradient background
export const meshBg = (isDark: boolean | ThemeId) => {
  const p = resolvePreset(isDark)
  return p.isDark
    ? `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.06)} 0%, transparent 50%), ${p.meshTint}`
    : `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.05)} 0%, transparent 50%), ${p.meshTint}`
}

// Gold-themed TextField focus styling
export const goldFieldSx = (isDark: boolean | ThemeId) => {
  const p = resolvePreset(isDark)
  return {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
    '& .MuiInputLabel-root': { color: p.textMedium },
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: p.isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.15),
    },
    '& .MuiInputBase-input': { color: p.textHeading },
  }
}

// Gold primary button sx
export const goldBtnSx = {
  bgcolor: GOLD,
  color: GOLD_CONTRAST,
  fontWeight: 600,
  borderRadius: '14px',
  textTransform: 'none' as const,
  '&:hover': { bgcolor: GOLD_LIGHT },
  '&.Mui-disabled': { bgcolor: alpha('#ffffff', 0.1), color: '#6b655c' },
}

// Gold outlined button sx
export const goldOutlinedBtnSx = {
  border: '1px solid',
  borderColor: alpha(GOLD, 0.3),
  color: GOLD,
  borderRadius: '14px',
  fontWeight: 500,
  textTransform: 'none' as const,
  '&:hover': { borderColor: GOLD, bgcolor: alpha(GOLD, 0.05) },
}

// Focus ring for accessible interactive elements
export const focusRingSx = { outline: `2px solid ${GOLD}`, outlineOffset: 2 } as const

// Dialog PaperProps sx
export const dialogPaperSx = (isDark: boolean | ThemeId) => ({
  bgcolor: panelBg(isDark),
  borderRadius: '14px',
})
