'use client'

import { useState, useMemo } from 'react'
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Timeline from '@mui/icons-material/Timeline'
import Restaurant from '@mui/icons-material/Restaurant'
import Straighten from '@mui/icons-material/Straighten'
import Settings from '@mui/icons-material/Settings'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import Home from '@mui/icons-material/Home'
import DarkMode from '@mui/icons-material/DarkMode'
import LightMode from '@mui/icons-material/LightMode'

// =========================================================
// Constants
// =========================================================

const PALETTES = [
  { name: 'Purple Reign', primary: '#7c3aed', accent: '#bb86fc' },
  { name: 'Ocean Deep', primary: '#0ea5e9', accent: '#38bdf8' },
  { name: 'Emerald Power', primary: '#059669', accent: '#34d399' },
  { name: 'Sunset Fire', primary: '#ea580c', accent: '#fb923c' },
  { name: 'Black & Gold', primary: '#1a1a1a', accent: '#d4af37' },
] as const

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

const QUICK_ACCESS = [
  { label: 'Historique', Icon: Timeline, color: '#6750a4' },
  { label: 'Diète', Icon: Restaurant, color: '#e57373' },
  { label: 'Mesures', Icon: Straighten, color: '#64b5f6' },
] as const

// =========================================================
// Theme builder
// =========================================================

function buildDemoTheme(palette: typeof PALETTES[number], mode: 'light' | 'dark') {
  const isDark = mode === 'dark'
  // For Black & Gold in light mode, use gold as primary visual
  const isBlackGold = palette.name === 'Black & Gold'
  const primaryMain = isBlackGold && !isDark ? palette.accent : palette.primary
  const accentColor = palette.accent

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: accentColor,
        dark: primaryMain,
        contrastText: '#ffffff',
      },
      secondary: {
        main: accentColor,
      },
      background: {
        default: isDark ? '#0a0a0a' : '#fafafa',
        paper: isDark ? '#161616' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e8e8e8' : '#1a1a1a',
        secondary: isDark ? '#999999' : '#555555',
        disabled: isDark ? '#555555' : '#aaaaaa',
      },
      divider: isDark ? '#2a2a2a' : '#e5e5e5',
      success: { main: isDark ? '#4ade80' : '#22c55e' },
      error: { main: isDark ? '#f87171' : '#ef4444' },
      info: { main: isDark ? '#60a5fa' : '#3b82f6' },
      action: {
        hover: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
        selected: isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
      },
    },
    typography: {
      fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      button: { textTransform: 'none' as const, fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  })
}

// =========================================================
// Shared helpers
// =========================================================

function ChangeIndicator({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur > 0) {
    return (
      <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
        <TrendingUp sx={{ fontSize: 14 }} />
        <Typography variant="caption" fontWeight={600} sx={{ color: 'info.main' }}>Nouveau</Typography>
      </Stack>
    )
  }
  if (prev === 0) {
    return <Typography variant="caption" fontWeight={600} sx={{ color: 'text.disabled' }}>=</Typography>
  }
  const change = Math.round(((cur - prev) / prev) * 100)
  if (change > 0) {
    return (
      <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
        <TrendingUp sx={{ fontSize: 14 }} />
        <Typography variant="caption" fontWeight={600} sx={{ color: 'success.main' }}>+{change}%</Typography>
      </Stack>
    )
  }
  if (change < 0) {
    return (
      <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
        <TrendingDown sx={{ fontSize: 14 }} />
        <Typography variant="caption" fontWeight={600} sx={{ color: 'error.main' }}>{change}%</Typography>
      </Stack>
    )
  }
  return <Typography variant="caption" fontWeight={600} sx={{ color: 'text.disabled' }}>=</Typography>
}

function ProgressRings({
  workouts,
  goal,
  streak,
  streakMax,
  ringColor,
  streakColor,
  glowFilter,
  strokeOuter,
  strokeInner,
}: {
  workouts: number
  goal: number
  streak: number
  streakMax: number
  ringColor: string
  streakColor: string
  glowFilter?: string
  strokeOuter?: number
  strokeInner?: number
}) {
  const outerR = 72
  const innerR = 56
  const sw1 = strokeOuter || 10
  const sw2 = strokeInner || 8
  const outerCirc = 2 * Math.PI * outerR
  const innerCirc = 2 * Math.PI * innerR

  return (
    <Box sx={{ position: 'relative', width: 160, height: 160 }}>
      <svg viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={outerR} fill="none" stroke={alpha(ringColor, 0.15)} strokeWidth={sw1} />
        <circle
          cx="80" cy="80" r={outerR} fill="none"
          stroke={ringColor} strokeWidth={sw1} strokeLinecap="round"
          strokeDasharray={`${outerCirc}`}
          strokeDashoffset={`${outerCirc * (1 - workouts / goal)}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: glowFilter || 'none' }}
        />
      </svg>
      <svg viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={innerR} fill="none" stroke={alpha(streakColor, 0.15)} strokeWidth={sw2} />
        <circle
          cx="80" cy="80" r={innerR} fill="none"
          stroke={streakColor} strokeWidth={sw2} strokeLinecap="round"
          strokeDasharray={`${innerCirc}`}
          strokeDashoffset={`${innerCirc * (1 - Math.min(streak, streakMax) / streakMax)}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: glowFilter || 'none' }}
        />
      </svg>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1, color: 'text.primary' }}>
          {workouts}<Typography component="span" variant="body2" color="text.secondary">/{goal}</Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>séances/sem</Typography>
      </Box>
    </Box>
  )
}

function RingLegend({ ringColor, streakColor }: { ringColor: string; streakColor: string }) {
  return (
    <Stack direction="row" justifyContent="center" spacing={3} sx={{ pb: 2 }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ringColor }} />
        <Typography variant="caption" color="text.secondary">Séances</Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: streakColor }} />
        <Typography variant="caption" color="text.secondary">Streak</Typography>
      </Stack>
    </Stack>
  )
}

function StaticBottomNav() {
  return (
    <Paper sx={{ borderRadius: 0 }} elevation={8}>
      <BottomNavigation value={0} showLabels>
        <BottomNavigationAction label="Accueil" icon={<Home />} />
        <BottomNavigationAction label="Workout" icon={<FitnessCenter />} />
        <BottomNavigationAction label="Diète" icon={<Restaurant />} />
        <BottomNavigationAction label="Mesures" icon={<Straighten />} />
      </BottomNavigation>
    </Paper>
  )
}

// =========================================================
// VARIANT A: Glass Premium
// =========================================================

function GlassPremium({ palette }: { palette: typeof PALETTES[number] }) {
  const isDark = useMemo(() => {
    // detect from theme context
    return undefined // will be checked via sx
  }, [])

  const glassCard = (extra?: object) => ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    bgcolor: (t: any) => t.palette.mode === 'dark'
      ? alpha('#ffffff', 0.05)
      : alpha('#ffffff', 0.7),
    border: '1px solid',
    borderColor: (t: any) => t.palette.mode === 'dark'
      ? alpha('#ffffff', 0.1)
      : alpha('#000000', 0.06),
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    borderRadius: 4,
    ...extra,
  })

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      background: (t) => t.palette.mode === 'dark'
        ? `radial-gradient(ellipse at 20% 50%, ${alpha(palette.primary, 0.15)} 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${alpha(palette.accent, 0.1)} 0%, transparent 50%), ${t.palette.background.default}`
        : `radial-gradient(ellipse at 20% 50%, ${alpha(palette.primary, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${alpha(palette.accent, 0.06)} 0%, transparent 50%), ${t.palette.background.default}`,
      transition: 'background 0.3s ease',
    }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{
              width: 42, height: 42,
              bgcolor: palette.primary, color: '#fff',
              fontSize: '1rem', fontWeight: 600,
              boxShadow: `0 0 20px ${alpha(palette.primary, 0.4)}`,
            }}>
              {MOCK.displayName[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>Bonjour</Typography>
              <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>{MOCK.displayName}</Typography>
            </Box>
          </Stack>
          <IconButton size="small">
            <Settings sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Progress Rings */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <ProgressRings
          workouts={MOCK.weeklyWorkouts}
          goal={MOCK.weeklyGoal}
          streak={MOCK.currentStreak}
          streakMax={7}
          ringColor={palette.accent}
          streakColor="#ff9800"
          glowFilter={`drop-shadow(0 0 6px ${alpha(palette.accent, 0.5)})`}
        />
      </Box>

      {/* Legend */}
      <RingLegend ringColor={palette.accent} streakColor="#ff9800" />

      {/* CTA */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<FitnessCenter />}
          sx={{
            py: 2,
            fontSize: '1.05rem',
            fontWeight: 700,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: alpha('#ffffff', 0.2),
            boxShadow: `0 4px 20px ${alpha(palette.primary, 0.4)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`,
            },
          }}
        >
          Lancer une Séance
        </Button>
      </Box>

      {/* Stats compactes */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={glassCard()}>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, textAlign: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: palette.primary }}>{MOCK.totalWorkouts}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Workouts</Typography>
              </Box>
              <Box sx={{ borderLeft: 1, borderRight: 1, borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#ff9800' }}>{MOCK.currentStreak}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Streak</Typography>
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: palette.accent }}>{MOCK.totalPRs}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Records</Typography>
              </Box>
            </Box>
          </CardContent>
        </Box>
      </Box>

      {/* Progression hebdo */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={glassCard()}>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Progression hebdo</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {WEEKLY_METRICS.map((m) => (
                <Box key={m.key} sx={{ textAlign: 'center', py: 0.5 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {MOCK.thisWeek[m.thisKey]}
                    {m.unit && <Typography component="span" variant="caption" color="text.secondary"> {m.unit}</Typography>}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
                  <ChangeIndicator cur={MOCK.thisWeek[m.thisKey]} prev={MOCK.lastWeek[m.prevKey]} />
                </Box>
              ))}
            </Box>
            <Box sx={{ textAlign: 'center', pt: 1.5, borderTop: 1, borderColor: 'divider', mt: 1.5 }}>
              <Typography variant="h6" fontWeight={700}>{MOCK.thisWeek.prCount}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Records (PRs)</Typography>
              <ChangeIndicator cur={MOCK.thisWeek.prCount} prev={MOCK.lastWeek.prCount} />
            </Box>
          </CardContent>
        </Box>
      </Box>

      {/* XP Bar */}
      <Box sx={{ px: 2.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 40 }}>
            Niv. {MOCK.level}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.round((MOCK.xp / MOCK.xpMax) * 100)}
            sx={{
              flex: 1, height: 6, borderRadius: 3,
              bgcolor: (t) => alpha(palette.accent, 0.15),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})`,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">{MOCK.xp}/{MOCK.xpMax} XP</Typography>
        </Stack>
      </Box>

      {/* Acces rapide */}
      <Box sx={{ px: 2.5, pt: 2, pb: 2, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 0.5 }}>Accès rapide</Typography>
        <Stack direction="row" spacing={1.5}>
          {QUICK_ACCESS.map((item) => (
            <Box key={item.label} sx={{ flex: 1, ...glassCard({ textAlign: 'center', py: 2, px: 1 }) }}>
              <Box sx={{ mb: 0.5, color: item.color, display: 'flex', justifyContent: 'center' }}>
                <item.Icon />
              </Box>
              <Typography variant="caption" fontWeight={600}>{item.label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Bottom Nav */}
      <StaticBottomNav />
    </Box>
  )
}

// =========================================================
// VARIANT B: Bento Grid
// =========================================================

function BentoGrid({ palette }: { palette: typeof PALETTES[number] }) {
  const bentoCard = (extra?: object) => ({
    borderRadius: '24px',
    boxShadow: 'none',
    border: 'none',
    bgcolor: 'background.paper',
    ...extra,
  })

  const accentCard = (extra?: object) => ({
    ...bentoCard(),
    bgcolor: palette.primary,
    color: '#ffffff',
    ...extra,
  })

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      transition: 'background-color 0.3s ease',
    }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{
              width: 42, height: 42,
              bgcolor: palette.primary, color: '#fff',
              fontSize: '1rem', fontWeight: 900,
            }}>
              {MOCK.displayName[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>Bonjour</Typography>
              <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>{MOCK.displayName}</Typography>
            </Box>
          </Stack>
          <IconButton size="small">
            <Settings sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Bento: Progress Ring + Stats side by side */}
      <Box sx={{ px: 2.5, py: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {/* Ring card */}
        <Box sx={bentoCard({ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2.5, gridRow: 'span 2' })}>
          <Box sx={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
            <ProgressRings
              workouts={MOCK.weeklyWorkouts}
              goal={MOCK.weeklyGoal}
              streak={MOCK.currentStreak}
              streakMax={7}
              ringColor={palette.accent}
              streakColor="#ff9800"
            />
          </Box>
        </Box>

        {/* Workouts stat */}
        <Box sx={accentCard({ py: 2.5, px: 2, textAlign: 'center' })}>
          <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1, color: '#fff' }}>{MOCK.totalWorkouts}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, color: '#fff' }}>Workouts</Typography>
        </Box>

        {/* Streak stat */}
        <Box sx={bentoCard({ py: 2.5, px: 2, textAlign: 'center' })}>
          <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1, color: '#ff9800' }}>{MOCK.currentStreak}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Streak</Typography>
        </Box>
      </Box>

      {/* Legend */}
      <RingLegend ringColor={palette.accent} streakColor="#ff9800" />

      {/* CTA */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<FitnessCenter />}
          sx={{
            py: 2,
            fontSize: '1.05rem',
            fontWeight: 900,
            borderRadius: '24px',
            bgcolor: palette.primary,
            boxShadow: 'none',
            '&:hover': { bgcolor: palette.accent },
          }}
        >
          Lancer une Séance
        </Button>
      </Box>

      {/* Records - full width accent */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={accentCard({ py: 2.5, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
          <Box>
            <Typography variant="h1" fontWeight={900} sx={{ lineHeight: 1, color: '#fff' }}>{MOCK.totalPRs}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600, color: '#fff' }}>Records personnels</Typography>
          </Box>
          <TrendingUp sx={{ fontSize: 48, opacity: 0.3, color: '#fff' }} />
        </Box>
      </Box>

      {/* Progression hebdo */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={bentoCard({ px: 3, py: 2.5 })}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.7rem' }}>
            Progression hebdo
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {WEEKLY_METRICS.map((m) => (
              <Box key={m.key} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={900}>{MOCK.thisWeek[m.thisKey]}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{m.label}{m.unit ? ` (${m.unit})` : ''}</Typography>
                <ChangeIndicator cur={MOCK.thisWeek[m.thisKey]} prev={MOCK.lastWeek[m.prevKey]} />
              </Box>
            ))}
          </Box>
          <Box sx={{ textAlign: 'center', pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h4" fontWeight={900}>{MOCK.thisWeek.prCount}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>PRs cette semaine</Typography>
            <ChangeIndicator cur={MOCK.thisWeek.prCount} prev={MOCK.lastWeek.prCount} />
          </Box>
        </Box>
      </Box>

      {/* XP Bar */}
      <Box sx={{ px: 2.5, pb: 1 }}>
        <Box sx={bentoCard({ px: 2.5, py: 2 })}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="caption" fontWeight={900} sx={{ minWidth: 40, color: palette.primary }}>
              Niv. {MOCK.level}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.round((MOCK.xp / MOCK.xpMax) * 100)}
              sx={{
                flex: 1, height: 8, borderRadius: 4,
                bgcolor: (t) => alpha(palette.primary, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: palette.primary },
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{MOCK.xp}/{MOCK.xpMax}</Typography>
          </Stack>
        </Box>
      </Box>

      {/* Acces rapide - bento grid */}
      <Box sx={{ px: 2.5, pt: 2, pb: 2, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{
          mb: 1, px: 0.5, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.7rem',
        }}>Accès rapide</Typography>
        <Stack direction="row" spacing={1.5}>
          {QUICK_ACCESS.map((item) => (
            <Box key={item.label} sx={bentoCard({ flex: 1, textAlign: 'center', py: 2, px: 1 })}>
              <Box sx={{ mb: 0.5, color: item.color, display: 'flex', justifyContent: 'center' }}>
                <item.Icon />
              </Box>
              <Typography variant="caption" fontWeight={900}>{item.label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Bottom Nav */}
      <StaticBottomNav />
    </Box>
  )
}

// =========================================================
// VARIANT C: Neo Sport
// =========================================================

function NeoSport({ palette }: { palette: typeof PALETTES[number] }) {
  const sportCard = (extra?: object) => ({
    borderRadius: '4px',
    boxShadow: (t: any) => t.palette.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.4)'
      : '0 2px 8px rgba(0,0,0,0.08)',
    border: 'none',
    bgcolor: 'background.paper',
    borderLeft: `5px solid ${palette.primary}`,
    ...extra,
  })

  const pillSx = (bg: string) => ({
    display: 'inline-block',
    bgcolor: alpha(bg, 0.15),
    color: bg,
    px: 1.5,
    py: 0.5,
    borderRadius: '4px',
    fontWeight: 900,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  })

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      transition: 'background-color 0.3s ease',
    }}>
      {/* Diagonal accent stripe */}
      <Box sx={{
        height: 6,
        background: `repeating-linear-gradient(135deg, ${palette.primary}, ${palette.primary} 10px, ${palette.accent} 10px, ${palette.accent} 20px)`,
      }} />

      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{
              width: 42, height: 42,
              bgcolor: palette.primary, color: '#fff',
              fontSize: '1rem', fontWeight: 900,
              borderRadius: '4px',
            }}>
              {MOCK.displayName[0]}
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{
                lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, fontSize: '0.6rem',
              }}>BONJOUR</Typography>
              <Typography fontWeight={900} sx={{
                lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 2,
              }}>{MOCK.displayName}</Typography>
            </Box>
          </Stack>
          <IconButton size="small" sx={{ borderRadius: '4px' }}>
            <Settings sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Progress Rings */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <ProgressRings
          workouts={MOCK.weeklyWorkouts}
          goal={MOCK.weeklyGoal}
          streak={MOCK.currentStreak}
          streakMax={7}
          ringColor={palette.primary}
          streakColor={palette.accent}
          strokeOuter={14}
          strokeInner={12}
        />
      </Box>

      {/* Legend */}
      <RingLegend ringColor={palette.primary} streakColor={palette.accent} />

      {/* CTA */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<FitnessCenter />}
          sx={{
            py: 2,
            fontSize: '1.05rem',
            fontWeight: 900,
            borderRadius: '4px',
            bgcolor: palette.primary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            boxShadow: `0 4px 16px ${alpha(palette.primary, 0.4)}`,
            '&:hover': { bgcolor: palette.accent },
          }}
        >
          Lancer une Séance
        </Button>
      </Box>

      {/* Stats compactes - pill badges */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={sportCard()}>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={pillSx(palette.primary)}>{MOCK.totalWorkouts}</Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{
                  mt: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem',
                }}>Workouts</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={pillSx('#ff9800')}>{MOCK.currentStreak}</Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{
                  mt: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem',
                }}>Streak</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={pillSx(palette.accent)}>{MOCK.totalPRs}</Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{
                  mt: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem',
                }}>Records</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Box>
      </Box>

      {/* Progression hebdo */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box sx={sportCard()}>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{
              mb: 1.5, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.7rem',
            }}>Progression hebdo</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {WEEKLY_METRICS.map((m) => (
                <Box key={m.key} sx={{ textAlign: 'center', py: 0.5 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 1 }}>
                    {MOCK.thisWeek[m.thisKey]}
                    {m.unit && <Typography component="span" variant="caption" color="text.secondary"> {m.unit}</Typography>}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{
                    textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, fontSize: '0.6rem',
                  }}>{m.label}</Typography>
                  <ChangeIndicator cur={MOCK.thisWeek[m.thisKey]} prev={MOCK.lastWeek[m.prevKey]} />
                </Box>
              ))}
            </Box>
            <Box sx={{ textAlign: 'center', pt: 1.5, borderTop: `2px solid ${palette.primary}`, mt: 1.5 }}>
              <Typography variant="h6" fontWeight={900}>{MOCK.thisWeek.prCount}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{
                textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, fontSize: '0.6rem',
              }}>Records (PRs)</Typography>
              <ChangeIndicator cur={MOCK.thisWeek.prCount} prev={MOCK.lastWeek.prCount} />
            </Box>
          </CardContent>
        </Box>
      </Box>

      {/* XP Bar */}
      <Box sx={{ px: 2.5, pb: 1 }}>
        <Box sx={sportCard({ px: 2.5, py: 1.5 })}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="caption" fontWeight={900} sx={{
              minWidth: 40, color: palette.primary, textTransform: 'uppercase', letterSpacing: 1,
            }}>
              Niv. {MOCK.level}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.round((MOCK.xp / MOCK.xpMax) * 100)}
              sx={{
                flex: 1, height: 10, borderRadius: '2px',
                bgcolor: (t) => alpha(palette.primary, 0.15),
                '& .MuiLinearProgress-bar': { borderRadius: '2px', bgcolor: palette.primary },
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{
              textTransform: 'uppercase', letterSpacing: 1,
            }}>{MOCK.xp}/{MOCK.xpMax}</Typography>
          </Stack>
        </Box>
      </Box>

      {/* Acces rapide */}
      <Box sx={{ px: 2.5, pt: 2, pb: 2, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{
          mb: 1, px: 0.5, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.7rem',
        }}>Accès rapide</Typography>
        <Stack direction="row" spacing={1.5}>
          {QUICK_ACCESS.map((item) => (
            <Box key={item.label} sx={{
              flex: 1, textAlign: 'center', py: 2, px: 1,
              borderRadius: '4px',
              bgcolor: 'background.paper',
              borderLeft: `5px solid ${item.color}`,
              boxShadow: (t: any) => t.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.4)'
                : '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <Box sx={{ mb: 0.5, color: item.color, display: 'flex', justifyContent: 'center' }}>
                <item.Icon />
              </Box>
              <Typography variant="caption" fontWeight={900} sx={{
                textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem',
              }}>{item.label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Diagonal accent stripe bottom */}
      <Box sx={{
        height: 6,
        background: `repeating-linear-gradient(135deg, ${palette.primary}, ${palette.primary} 10px, ${palette.accent} 10px, ${palette.accent} 20px)`,
      }} />

      {/* Bottom Nav */}
      <StaticBottomNav />
    </Box>
  )
}

// =========================================================
// Main Demo Page
// =========================================================

export default function DemoHomeV2Page() {
  const [variantIndex, setVariantIndex] = useState(0)
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const palette = PALETTES[paletteIndex]
  const mode = isDarkMode ? 'dark' : 'light'

  const demoTheme = useMemo(
    () => buildDemoTheme(palette, mode as 'light' | 'dark'),
    [palette, mode]
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Sticky Toolbar (global theme) */}
      <Paper
        elevation={4}
        sx={{
          position: 'sticky', top: 0, zIndex: 100, borderRadius: 0,
          bgcolor: 'primary.main', color: 'primary.contrastText',
        }}
      >
        {/* Title row */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, letterSpacing: 1 }}>
              HOME REDESIGN — {palette.name.toUpperCase()}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsDarkMode(!isDarkMode)}
              sx={{ color: 'primary.contrastText' }}
            >
              {isDarkMode
                ? <LightMode sx={{ fontSize: 18 }} />
                : <DarkMode sx={{ fontSize: 18 }} />
              }
            </IconButton>
          </Stack>
        </Box>

        {/* Variant Tabs */}
        <Tabs
          value={variantIndex}
          onChange={(_, v) => setVariantIndex(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem',
              minHeight: 36, py: 0,
            },
            '& .Mui-selected': { color: '#fff' },
            '& .MuiTabs-indicator': { bgcolor: '#fff' },
          }}
        >
          <Tab label="A: Glass" />
          <Tab label="B: Bento" />
          <Tab label="C: NeoSport" />
        </Tabs>

        {/* Palette dots */}
        <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ py: 1 }}>
          {PALETTES.map((p, i) => (
            <Box
              key={p.name}
              onClick={() => setPaletteIndex(i)}
              sx={{
                width: i === paletteIndex ? 28 : 20,
                height: 20,
                borderRadius: i === paletteIndex ? '10px' : '50%',
                background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`,
                cursor: 'pointer',
                border: i === paletteIndex ? '2px solid #fff' : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Demo content (local theme) */}
      <ThemeProvider theme={demoTheme}>
        <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
          {variantIndex === 0 && <GlassPremium palette={palette} />}
          {variantIndex === 1 && <BentoGrid palette={palette} />}
          {variantIndex === 2 && <NeoSport palette={palette} />}
        </Box>
      </ThemeProvider>
    </Box>
  )
}
