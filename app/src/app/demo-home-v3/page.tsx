'use client'

import { useState, useMemo } from 'react'
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import Collapse from '@mui/material/Collapse'
import Chip from '@mui/material/Chip'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Restaurant from '@mui/icons-material/Restaurant'
import Settings from '@mui/icons-material/Settings'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import Home from '@mui/icons-material/Home'
import Person from '@mui/icons-material/Person'
import DarkMode from '@mui/icons-material/DarkMode'
import LightMode from '@mui/icons-material/LightMode'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Whatshot from '@mui/icons-material/Whatshot'
import EmojiEvents from '@mui/icons-material/EmojiEvents'

// =========================================================
// Design tokens
// =========================================================

const GOLD = '#d4af37'
const GOLD_LIGHT = '#e8c860'
const GOLD_DIM = '#b8941f'

const MOCK = {
  displayName: 'Alex',
  weeklyWorkouts: 3,
  weeklyGoal: 4,
  currentStreak: 5,
  totalWorkouts: 147,
  totalPRs: 23,
  level: 12,
  xp: 2450,
  xpMax: 3000,
  thisWeek: { sessions: 3, volumeKg: 12500, durationMin: 195, calories: 1450, prCount: 2 },
  lastWeek: { sessions: 2, volumeKg: 9800, durationMin: 140, calories: 1100, prCount: 1 },
}

const WEEKLY_METRICS: { key: string; label: string; unit: string; thisKey: keyof typeof MOCK.thisWeek; prevKey: keyof typeof MOCK.lastWeek }[] = [
  { key: 'sessions', label: 'Séances', unit: '', thisKey: 'sessions', prevKey: 'sessions' },
  { key: 'volume', label: 'Volume', unit: 'kg', thisKey: 'volumeKg', prevKey: 'volumeKg' },
  { key: 'duration', label: 'Durée', unit: 'min', thisKey: 'durationMin', prevKey: 'durationMin' },
  { key: 'calories', label: 'Calories', unit: '', thisKey: 'calories', prevKey: 'calories' },
]

// =========================================================
// Theme
// =========================================================

function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: GOLD, light: GOLD_LIGHT, dark: GOLD_DIM, contrastText: '#1a1a1a' },
      secondary: { main: GOLD },
      background: {
        default: isDark ? '#0a0a0a' : '#f5f3ef',
        paper: isDark ? '#161616' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f0ece4' : '#1a1a1a',
        secondary: isDark ? '#8a8478' : '#7a7268',
      },
      divider: isDark ? alpha('#d4af37', 0.12) : alpha('#d4af37', 0.15),
      success: { main: isDark ? '#4ade80' : '#22c55e' },
      error: { main: isDark ? '#f87171' : '#ef4444' },
      info: { main: isDark ? '#60a5fa' : '#3b82f6' },
    },
    typography: {
      fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      button: { textTransform: 'none' as const, fontWeight: 600 },
    },
    shape: { borderRadius: 20 },
    components: {
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  })
}

// =========================================================
// Shared sx factories
// =========================================================

const glass = (isDark: boolean, extra?: object) => ({
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

const meshBg = (isDark: boolean) => isDark
  ? `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.06)} 0%, transparent 50%), #0a0a0a`
  : `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.05)} 0%, transparent 50%), #f5f3ef`

const ctaButton = {
  py: 1.8,
  fontSize: '1rem',
  fontWeight: 700,
  borderRadius: '14px',
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
  color: '#1a1a1a',
  boxShadow: `0 4px 24px ${alpha(GOLD, 0.45)}`,
  '&:hover': { background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` },
}

// =========================================================
// Shared components
// =========================================================

function ChangeIndicator({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur > 0) return (
    <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
      <TrendingUp sx={{ fontSize: 12 }} />
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'info.main' }}>Nouveau</Typography>
    </Stack>
  )
  if (prev === 0) return <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>=</Typography>
  const pct = Math.round(((cur - prev) / prev) * 100)
  if (pct > 0) return (
    <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
      <TrendingUp sx={{ fontSize: 12 }} />
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'success.main' }}>+{pct}%</Typography>
    </Stack>
  )
  if (pct < 0) return (
    <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
      <TrendingDown sx={{ fontSize: 12 }} />
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'error.main' }}>{pct}%</Typography>
    </Stack>
  )
  return <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>=</Typography>
}

function SessionRing({ size, sw, workouts, goal, showText = true }: {
  size: number; sw: number; workouts: number; goal: number; showText?: boolean
}) {
  const r = (size / 2) - sw - 4
  const circ = 2 * Math.PI * r
  const c = size / 2
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={alpha(GOLD, 0.12)} strokeWidth={sw} />
        <circle cx={c} cy={c} r={r} fill="none"
          stroke="url(#goldGrad)" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - workouts / goal)}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 10px ${alpha(GOLD, 0.5)})` }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_LIGHT} />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* L0 — hero number */}
          <Typography sx={{ fontSize: size >= 140 ? '3rem' : '1.6rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'text.primary' }}>
            {workouts}<Typography component="span" sx={{ fontSize: size >= 140 ? '1rem' : '0.75rem', fontWeight: 500, color: 'text.secondary' }}>/{goal}</Typography>
          </Typography>
          {/* L5 — caption */}
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 500, mt: 0.4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            séances
          </Typography>
        </Box>
      )}
    </Box>
  )
}

const NAV_ITEMS = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'workout', label: 'Training', icon: FitnessCenter },
  { key: 'journal', label: 'Journal', icon: Restaurant },
  { key: 'profile', label: 'Profil', icon: Person },
] as const

function GlassNav({ isDark }: { isDark: boolean }) {
  return (
    <>
      <Box sx={{ height: 88 }} />
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        maxWidth: 500, mx: 'auto', p: 1.5, pt: 0,
      }}>
        <Box sx={{
          borderRadius: '22px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          bgcolor: isDark ? alpha('#1c1a14', 0.7) : alpha('#ffffff', 0.75),
          border: '1px solid',
          borderColor: isDark ? alpha(GOLD, 0.15) : alpha(GOLD, 0.2),
          boxShadow: isDark
            ? `0 -4px 30px rgba(0,0,0,0.5), 0 0 1px ${alpha(GOLD, 0.2)}, inset 0 1px 0 ${alpha('#ffffff', 0.06)}`
            : `0 -4px 30px rgba(0,0,0,0.06), 0 0 1px ${alpha(GOLD, 0.3)}, inset 0 1px 0 ${alpha('#ffffff', 0.7)}`,
          overflow: 'hidden',
        }}>
          <Stack direction="row" sx={{ height: 64 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === 'home'
              const Icon = item.icon
              return (
                <Box key={item.key} sx={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 0.4,
                  cursor: 'pointer',
                }}>
                  <Box sx={{
                    px: isActive ? 2.5 : 1, py: 0.6,
                    borderRadius: '12px',
                    bgcolor: isActive ? alpha(GOLD, 0.15) : 'transparent',
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon sx={{
                      fontSize: 21,
                      color: isActive ? GOLD : isDark ? '#6b6560' : '#9a9490',
                      ...(isActive && { filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.5)})` }),
                    }} />
                  </Box>
                  <Typography sx={{
                    fontSize: '0.58rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? GOLD : isDark ? '#6b6560' : '#9a9490',
                    letterSpacing: 0.2,
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Box>
    </>
  )
}

// =========================================================
// Typography scale for luxury fitness
// =========================================================
// L0 — Hero number (ring center): 3rem / 800 / -0.03em
// L1 — Stat number (big): 1.75rem / 800 / -0.02em
// L2 — Card title / Name: 1.2rem / 700 / -0.01em
// L3 — Body / CTA: 1rem / 600
// L4 — Section label: 0.72rem / 600 / 0.08em / uppercase / gold
// L5 — Caption: 0.65rem / 500 / muted
// L6 — Micro: 0.58rem / 500 / very muted

const t = {
  // text colors (explicit, no theme dependency)
  h: (dark: boolean) => dark ? '#f5f0e6' : '#1a1715',     // heading
  b: (dark: boolean) => dark ? '#d4cfc5' : '#3d3830',      // body
  m: (dark: boolean) => dark ? '#8a8478' : '#8a7e70',      // muted
  f: (dark: boolean) => dark ? '#5c574e' : '#b5ad9f',      // faint
}

// =========================================================
// VARIANT A: "The Stage"
// =========================================================

function VariantA({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false)
  const xpPct = Math.round((MOCK.xp / MOCK.xpMax) * 100)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: meshBg(isDark) }}>

      {/* — Header — */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ position: 'relative' }}>
              <Avatar sx={{
                width: 46, height: 46, bgcolor: isDark ? '#1e1c16' : '#f0ece4',
                color: GOLD, fontSize: '1.15rem', fontWeight: 700,
                border: `2px solid ${GOLD}`,
                boxShadow: `0 0 16px ${alpha(GOLD, 0.3)}`,
              }}>A</Avatar>
              <Box sx={{
                position: 'absolute', top: -5, right: -10,
                bgcolor: '#ff9800', color: '#fff', borderRadius: '10px',
                px: 0.6, py: 0.15, display: 'flex', alignItems: 'center', gap: 0.25,
                fontSize: '0.58rem', fontWeight: 800,
                border: `2px solid ${isDark ? '#0a0a0a' : '#f5f3ef'}`,
                boxShadow: '0 2px 8px rgba(255,152,0,0.4)',
              }}>
                <Whatshot sx={{ fontSize: 10 }} />{MOCK.currentStreak}
              </Box>
            </Box>
            <Box>
              {/* L5 — greeting micro */}
              <Typography sx={{ fontSize: '0.65rem', color: t.m(isDark), lineHeight: 1.3, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Bonjour
              </Typography>
              {/* L2 — name */}
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.15, color: t.h(isDark), letterSpacing: '-0.01em' }}>
                {MOCK.displayName}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small">
            <Settings sx={{ fontSize: 20, color: t.f(isDark) }} />
          </IconButton>
        </Stack>
      </Box>

      {/* — Hero Ring — */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2.5, pb: 3 }}>
        <SessionRing size={170} sw={12} workouts={MOCK.weeklyWorkouts} goal={MOCK.weeklyGoal} />
      </Box>

      {/* — CTA — */}
      <Box sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" size="large" fullWidth startIcon={<FitnessCenter />} sx={{
          ...ctaButton,
          /* L3 — action text */
          fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em',
        }}>
          Lancer une Séance
        </Button>
      </Box>

      {/* — XP strip — */}
      <Box sx={{ px: 3, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* L4 — label */}
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: GOLD, minWidth: 44, letterSpacing: '0.04em' }}>
            Niv. {MOCK.level}
          </Typography>
          <LinearProgress variant="determinate" value={xpPct} sx={{
            flex: 1, height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` },
          }} />
          {/* L6 — micro */}
          <Typography sx={{ fontSize: '0.6rem', color: t.f(isDark), fontWeight: 500 }}>
            {MOCK.xp}/{MOCK.xpMax} XP
          </Typography>
        </Stack>
      </Box>

      {/* — Stats card (expandable) — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { overflow: 'hidden' })}>
          <Box onClick={() => setOpen(!open)} sx={{ p: 3, cursor: 'pointer', userSelect: 'none' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
              {/* L4 — section label */}
              <Typography sx={{
                fontSize: '0.68rem', fontWeight: 600, color: t.m(isDark),
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Ton activité
              </Typography>
              <ExpandMore sx={{
                fontSize: 20, color: GOLD, opacity: 0.6,
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }} />
            </Stack>
            <Stack direction="row" justifyContent="space-around" textAlign="center">
              <Box>
                {/* L1 — stat number */}
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: GOLD, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {MOCK.totalWorkouts}
                </Typography>
                {/* L5 — stat label */}
                <Typography sx={{ fontSize: '0.62rem', color: t.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Workouts
                </Typography>
              </Box>
              <Box sx={{ borderLeft: 1, borderRight: 1, borderColor: isDark ? alpha(GOLD, 0.1) : alpha(GOLD, 0.15), px: 4 }}>
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#ff9800', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {MOCK.currentStreak}
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: t.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Streak
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {MOCK.totalPRs}
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: t.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Records
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* — Expanded: weekly tiles — */}
          <Collapse in={open}>
            <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
              {/* L4 — section divider label */}
              <Typography sx={{
                fontSize: '0.6rem', fontWeight: 600, color: GOLD, opacity: 0.7,
                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5, px: 0.5,
              }}>
                Hebdo
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {WEEKLY_METRICS.map((m) => (
                  <Box key={m.key} sx={{
                    textAlign: 'center',
                    bgcolor: isDark ? alpha('#ffffff', 0.035) : alpha('#000000', 0.025),
                    borderRadius: '14px',
                    py: 1.8, px: 1.5,
                    border: '1px solid',
                    borderColor: isDark ? alpha(GOLD, 0.07) : alpha(GOLD, 0.1),
                  }}>
                    {/* L1 — number */}
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: t.h(isDark), letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {MOCK.thisWeek[m.thisKey]}
                      {m.unit && <Typography component="span" sx={{ fontSize: '0.6rem', color: t.f(isDark), fontWeight: 500 }}> {m.unit}</Typography>}
                    </Typography>
                    {/* L5 — label */}
                    <Typography sx={{ fontSize: '0.6rem', color: t.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {m.label}
                    </Typography>
                    <Box sx={{ mt: 0.4 }}>
                      <ChangeIndicator cur={MOCK.thisWeek[m.thisKey]} prev={MOCK.lastWeek[m.prevKey]} />
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* PR highlight tile */}
              <Box sx={{
                mt: 1.5,
                bgcolor: alpha(GOLD, 0.07),
                borderRadius: '14px',
                py: 1.5, px: 2.5,
                border: '1px solid',
                borderColor: alpha(GOLD, 0.15),
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                <EmojiEvents sx={{ fontSize: 22, color: GOLD, filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.4)})` }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: GOLD, letterSpacing: '-0.01em' }}>
                    {MOCK.thisWeek.prCount} PRs
                  </Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: t.m(isDark), fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    cette semaine
                  </Typography>
                </Box>
                <ChangeIndicator cur={MOCK.thisWeek.prCount} prev={MOCK.lastWeek.prCount} />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>

      <GlassNav isDark={isDark} />
    </Box>
  )
}

// =========================================================
// VARIANT B: "The Dashboard"
// Ring + CTA fused in one card. Weekly grid. Lifetime pills.
// =========================================================

function VariantB({ isDark }: { isDark: boolean }) {
  const xpPct = Math.round((MOCK.xp / MOCK.xpMax) * 100)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: meshBg(isDark) }}>

      {/* — Header — */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 42, height: 42, bgcolor: isDark ? '#1e1c16' : '#f0ece4',
            color: GOLD, fontSize: '1rem', fontWeight: 700,
            border: `2px solid ${GOLD}`,
          }}>A</Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.2 }}>Bonjour</Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{MOCK.displayName}</Typography>
          </Box>
        </Stack>
      </Box>

      {/* — Action + Progress Card — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { overflow: 'hidden' })}>
          <Box sx={{ p: 3, pb: 2.5 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <SessionRing size={115} sw={10} workouts={MOCK.weeklyWorkouts} goal={MOCK.weeklyGoal} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>Cette semaine</Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
                  {MOCK.weeklyWorkouts}<Typography component="span" sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>/{MOCK.weeklyGoal} séances</Typography>
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                  <Whatshot sx={{ fontSize: 16, color: '#ff9800' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{MOCK.currentStreak} jours</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>streak</Typography>
                </Stack>

                <Box sx={{
                  mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1,
                  bgcolor: alpha(GOLD, 0.1), borderRadius: '10px', px: 1.5, py: 0.6,
                }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: GOLD }}>Niv. {MOCK.level}</Typography>
                  <Box sx={{ width: 44, height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.2), overflow: 'hidden' }}>
                    <Box sx={{ width: `${xpPct}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{xpPct}%</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ px: 3, pb: 3 }}>
            <Button variant="contained" size="large" fullWidth startIcon={<FitnessCenter />} sx={ctaButton}>
              Lancer une Séance
            </Button>
          </Box>
        </Box>
      </Box>

      {/* — This Week — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { p: 3 })}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 2.5 }}>Cette semaine</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { label: 'Séances', value: MOCK.thisWeek.sessions, unit: '', k: 'sessions' as const },
              { label: 'Volume', value: MOCK.thisWeek.volumeKg, unit: 'kg', k: 'volumeKg' as const },
              { label: 'Durée', value: MOCK.thisWeek.durationMin, unit: 'min', k: 'durationMin' as const },
              { label: 'PRs', value: MOCK.thisWeek.prCount, unit: '', k: 'prCount' as const },
            ].map((m) => (
              <Box key={m.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {m.value}
                  {m.unit && <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}> {m.unit}</Typography>}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>{m.label}</Typography>
                <ChangeIndicator cur={MOCK.thisWeek[m.k]} prev={MOCK.lastWeek[m.k]} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* — Lifetime pills — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Chip icon={<FitnessCenter sx={{ fontSize: 14 }} />} label={`${MOCK.totalWorkouts} Workouts`} size="small"
            sx={{ ...glass(isDark), height: 36, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: GOLD } }}
          />
          <Chip icon={<EmojiEvents sx={{ fontSize: 14 }} />} label={`${MOCK.totalPRs} Records`} size="small"
            sx={{ ...glass(isDark), height: 36, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: GOLD_LIGHT } }}
          />
        </Stack>
      </Box>

      <GlassNav isDark={isDark} />
    </Box>
  )
}

// =========================================================
// VARIANT C: "The Feed"
// Minimal header. Context card. Streak dots. Collapsible weekly.
// =========================================================

function StreakDots({ current, max }: { current: number; max: number }) {
  return (
    <Stack direction="row" spacing={0.6} alignItems="center">
      {Array.from({ length: max }, (_, i) => (
        <Box key={i} sx={{
          width: 10, height: 10, borderRadius: '50%',
          bgcolor: i < current ? '#ff9800' : alpha('#ff9800', 0.12),
          ...(i < current && { boxShadow: `0 0 6px ${alpha('#ff9800', 0.4)}` }),
          transition: 'all 0.3s ease',
        }} />
      ))}
    </Stack>
  )
}

function VariantC({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false)
  const xpPct = Math.round((MOCK.xp / MOCK.xpMax) * 100)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: meshBg(isDark) }}>

      {/* — Header ultra-minimal — */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>
          Bonjour, {MOCK.displayName}
        </Typography>
      </Box>

      {/* — Primary action card — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { overflow: 'hidden', borderLeft: `4px solid ${GOLD}` })}>
          <Box sx={{ p: 3, pb: 2.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500, mb: 2 }}>
              Prêt pour ta séance ?
            </Typography>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {MOCK.weeklyWorkouts}<Typography component="span" sx={{ fontSize: '1rem', color: 'text.secondary', fontWeight: 400 }}> / {MOCK.weeklyGoal}</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>séances cette semaine</Typography>
              </Box>
              <SessionRing size={88} sw={8} workouts={MOCK.weeklyWorkouts} goal={MOCK.weeklyGoal} showText={false} />
            </Stack>
          </Box>
          <Box sx={{ px: 3, pb: 3 }}>
            <Button variant="contained" size="large" fullWidth startIcon={<FitnessCenter />} sx={ctaButton}>
              Lancer une Séance
            </Button>
          </Box>
        </Box>
      </Box>

      {/* — Streak + Level — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { p: 3 })}>
          <Stack direction="row" alignItems="center" spacing={3} divider={
            <Box sx={{ width: 1, alignSelf: 'stretch', bgcolor: 'divider' }} />
          }>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Whatshot sx={{ fontSize: 16, color: '#ff9800' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{MOCK.currentStreak} jours</Typography>
              </Stack>
              <StreakDots current={MOCK.currentStreak} max={7} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                <EmojiEvents sx={{ fontSize: 16, color: GOLD }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Niv. {MOCK.level}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(GOLD, 0.1), overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${xpPct}%`, height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                  }} />
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', minWidth: 28 }}>{xpPct}%</Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* — Weekly pulse (collapsible) — */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { overflow: 'hidden' })}>
          <Box onClick={() => setOpen(!open)} sx={{ p: 3, cursor: 'pointer', userSelect: 'none' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>Cette semaine</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography sx={{ fontSize: '0.7rem', color: GOLD, fontWeight: 600 }}>
                  {open ? 'Réduire' : 'Voir détail'}
                </Typography>
                <ExpandMore sx={{
                  fontSize: 18, color: GOLD,
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }} />
              </Stack>
            </Stack>
            <Stack direction="row" justifyContent="space-around" textAlign="center">
              <Box>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800 }}>{MOCK.thisWeek.sessions}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.3 }}>Séances</Typography>
              </Box>
              <Box sx={{ borderLeft: 1, borderRight: 1, borderColor: 'divider', px: 4 }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {(MOCK.thisWeek.volumeKg / 1000).toFixed(1)}<Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>t</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.3 }}>Volume</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800 }}>{MOCK.thisWeek.prCount}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.3 }}>PRs</Typography>
              </Box>
            </Stack>
          </Box>

          <Collapse in={open}>
            <Box sx={{ px: 3, pb: 3, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, pt: 2.5 }}>
                {WEEKLY_METRICS.map((m) => (
                  <Box key={m.key} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      {MOCK.thisWeek[m.thisKey]}
                      {m.unit && <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}> {m.unit}</Typography>}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>{m.label}</Typography>
                    <ChangeIndicator cur={MOCK.thisWeek[m.thisKey]} prev={MOCK.lastWeek[m.prevKey]} />
                  </Box>
                ))}
              </Box>
              <Box sx={{ textAlign: 'center', pt: 2.5, borderTop: 1, borderColor: 'divider', mt: 2.5 }}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>{MOCK.thisWeek.prCount}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>PRs cette semaine</Typography>
                <ChangeIndicator cur={MOCK.thisWeek.prCount} prev={MOCK.lastWeek.prCount} />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>

      <GlassNav isDark={isDark} />
    </Box>
  )
}

// =========================================================
// Main Page
// =========================================================

export default function DemoHomeV3Page() {
  const [variantIndex, setVariantIndex] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const demoTheme = useMemo(() => buildTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Sticky Toolbar (global theme) */}
      <Paper elevation={4} sx={{
        position: 'sticky', top: 0, zIndex: 100, borderRadius: 0,
        bgcolor: 'primary.main', color: 'primary.contrastText',
      }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, letterSpacing: 1 }}>
              HOME UX — GLASS + BLACK & GOLD
            </Typography>
            <IconButton size="small" onClick={() => setIsDarkMode(!isDarkMode)} sx={{ color: 'primary.contrastText' }}>
              {isDarkMode ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
        </Box>
        <Tabs value={variantIndex} onChange={(_, v) => setVariantIndex(v)} variant="fullWidth" sx={{
          minHeight: 36,
          '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem', minHeight: 36, py: 0 },
          '& .Mui-selected': { color: '#fff' },
          '& .MuiTabs-indicator': { bgcolor: '#fff' },
        }}>
          <Tab label="A: The Stage" />
          <Tab label="B: Dashboard" />
          <Tab label="C: The Feed" />
        </Tabs>
      </Paper>

      {/* Demo content */}
      <ThemeProvider theme={demoTheme}>
        <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
          {variantIndex === 0 && <VariantA isDark={isDarkMode} />}
          {variantIndex === 1 && <VariantB isDark={isDarkMode} />}
          {variantIndex === 2 && <VariantC isDark={isDarkMode} />}
        </Box>
      </ThemeProvider>
    </Box>
  )
}
