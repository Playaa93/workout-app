import { alpha } from '@mui/material/styles'

// Brand colors — Black & Gold
export const GOLD = '#d4af37'
export const GOLD_LIGHT = '#e8c860'

// Explicit text color tokens (independent of MUI theme)
export const tc = {
  h: (dark: boolean) => dark ? '#f5f0e6' : '#1a1715',
  m: (dark: boolean) => dark ? '#8a8478' : '#8a7e70',
  f: (dark: boolean) => dark ? '#5c574e' : '#b5ad9f',
}

// Glassmorphism card style
export const glass = (isDark: boolean, extra?: object) => ({
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  bgcolor: isDark ? alpha('#1c1a14', 0.65) : alpha('#ffffff', 0.72),
  border: '1px solid',
  borderColor: isDark ? alpha(GOLD, 0.12) : alpha(GOLD, 0.18),
  borderRadius: '20px',
  boxShadow: isDark
    ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#ffffff', 0.04)}`
    : `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${alpha('#ffffff', 0.6)}`,
  ...extra,
})

// Mesh gradient background
export const meshBg = (isDark: boolean) => isDark
  ? `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.06)} 0%, transparent 50%), #0a0a0a`
  : `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.05)} 0%, transparent 50%), #f5f3ef`
