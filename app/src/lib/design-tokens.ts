import { alpha } from '@mui/material/styles'

// Brand colors — Black & Gold
export const GOLD = '#d4af37'
export const GOLD_LIGHT = '#e8c860'
export const GOLD_CONTRAST = '#1a1715'

// Phosphor Icons weight
export const W = 'light' as const

// Explicit text color tokens (independent of MUI theme)
export const tc = {
  h: (dark: boolean) => dark ? '#f5f0e6' : '#1a1715',
  m: (dark: boolean) => dark ? '#9a9488' : '#7a7468',
  f: (dark: boolean) => dark ? '#6b655c' : '#a09888',
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

// Minimal card style (flat, subtle border)
export const card = (isDark: boolean, extra?: object) => ({
  bgcolor: isDark ? alpha('#ffffff', 0.07) : '#ffffff',
  borderRadius: '14px',
  border: '1px solid',
  borderColor: isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
  ...extra,
})

// Surface background (page-level)
export const surfaceBg = (isDark: boolean) => isDark ? '#0a0a09' : '#f3f1ec'

// Drawer / dialog background
export const panelBg = (isDark: boolean) => isDark ? '#1c1a14' : '#ffffff'

// Mesh gradient background
export const meshBg = (isDark: boolean) => isDark
  ? `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.06)} 0%, transparent 50%), #0a0a0a`
  : `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.05)} 0%, transparent 50%), #f5f3ef`

// Gold-themed TextField focus styling
export const goldFieldSx = (isDark: boolean) => ({
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
  '& .MuiInputLabel-root': { color: tc.m(isDark) },
  '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
    borderColor: isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.15),
  },
  '& .MuiInputBase-input': { color: tc.h(isDark) },
})

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
export const dialogPaperSx = (isDark: boolean) => ({
  bgcolor: panelBg(isDark),
  borderRadius: '14px',
})
