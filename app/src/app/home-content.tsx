'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/powersync/auth-context'
import {
  useUserProfile,
  useGamification,
  useUserStats,
  useWeeklyComparison,
} from '@/powersync/queries/profile-queries'
import { useMorphoProfile } from '@/powersync/queries/morphology-queries'
import { calculateLevel } from '@/lib/xp-utils'
import { getISOWeekStart } from '@/lib/date-utils'
import { toSqliteTimestamp } from '@/powersync/helpers'
import { GOLD, GOLD_LIGHT, tc, glass, meshBg, W } from '@/lib/design-tokens'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import { Barbell, GearSix, TrendUp, TrendDown, CaretDown, Flame, Trophy } from '@phosphor-icons/react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const WEEKLY_GOAL = 4

type WeekMetrics = {
  sessions: number
  volumeKg: number
  durationMin: number
  calories: number
  prCount: number
}

const WEEKLY_METRICS: { label: string; unit: string; field: keyof WeekMetrics }[] = [
  { label: 'Séances', unit: '', field: 'sessions' },
  { label: 'Volume', unit: 'kg', field: 'volumeKg' },
  { label: 'Durée', unit: 'min', field: 'durationMin' },
  { label: 'Calories', unit: '', field: 'calories' },
]

const STAT_ITEMS = [
  { field: 'totalWorkouts' as const, label: 'Workouts', color: GOLD },
  { field: 'streak' as const, label: 'Streak', color: '#ff9800' },
  { field: 'totalPRs' as const, label: 'Records', color: GOLD_LIGHT },
]

// =========================================================
// Sub-components
// =========================================================

function ChangeIndicator({ cur, prev, isDark }: { cur: number; prev: number; isDark: boolean }) {
  const green = isDark ? '#4ade80' : '#22c55e'
  const red = isDark ? '#f87171' : '#ef4444'
  const blue = isDark ? '#60a5fa' : '#3b82f6'

  let icon: React.ReactNode = null
  let color = tc.f(isDark)
  let text = '='

  if (prev === 0 && cur > 0) {
    icon = <TrendUp size={12} weight={W} color={blue} />
    color = blue
    text = 'Nouveau'
  } else if (prev > 0) {
    const pct = Math.round(((cur - prev) / prev) * 100)
    if (pct > 0) {
      icon = <TrendUp size={12} weight={W} color={green} />
      color = green
      text = `+${pct}%`
    } else if (pct < 0) {
      icon = <TrendDown size={12} weight={W} color={red} />
      color = red
      text = `${pct}%`
    }
  }

  return (
    <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
      {icon}
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color }}>{text}</Typography>
    </Stack>
  )
}

function SessionRing({ size, sw, workouts, goal, isDark }: {
  size: number; sw: number; workouts: number; goal: number; isDark: boolean
}) {
  const gradId = useId()
  const r = (size / 2) - sw - 4
  const circ = 2 * Math.PI * r
  const ctr = size / 2
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_LIGHT} />
          </linearGradient>
        </defs>
        <circle cx={ctr} cy={ctr} r={r} fill="none" stroke={alpha(GOLD, 0.12)} strokeWidth={sw} />
        <circle cx={ctr} cy={ctr} r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - Math.min(workouts, goal) / goal)}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 10px ${alpha(GOLD, 0.5)})` }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: tc.h(isDark) }}>
          {workouts}<Typography component="span" sx={{ fontSize: '1rem', fontWeight: 500, color: tc.m(isDark) }}>/{goal}</Typography>
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: tc.m(isDark), fontWeight: 500, mt: 0.4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          séances
        </Typography>
      </Box>
    </Box>
  )
}

// =========================================================
// Main
// =========================================================

export default function HomeContent() {
  const { userId, loading: authLoading } = useAuth()

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  return <HomeContentInner />
}

function HomeContentInner() {
  const { displayName: authDisplayName } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  const { data: profileRows } = useUserProfile()
  const { data: gamificationRows } = useGamification()
  const { data: statsRows } = useUserStats()
  const { data: morphoRows } = useMorphoProfile()

  const [thisWeekStart, lastWeekStart] = useMemo(() => {
    const now = new Date()
    const tw = toSqliteTimestamp(getISOWeekStart(now))
    const prev = new Date(now)
    prev.setDate(prev.getDate() - 7)
    const lw = toSqliteTimestamp(getISOWeekStart(prev))
    return [tw, lw]
  }, [])
  const { data: weeklyRows } = useWeeklyComparison(thisWeekStart, lastWeekStart)

  const [statsOpen, setStatsOpen] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const gamification = useMemo(() => {
    if (gamificationRows.length === 0) return null
    const r = gamificationRows[0] as any
    const totalXp = (r.total_xp as number) || 0
    const levelInfo = calculateLevel(totalXp)
    return {
      currentLevel: levelInfo.level,
      xpInCurrentLevel: levelInfo.xpInCurrentLevel,
      xpToNextLevel: levelInfo.xpToNext,
      xpProgress: Math.round((levelInfo.xpInCurrentLevel / levelInfo.xpToNext) * 100),
      currentStreak: (r.current_streak as number) || 0,
    }
  }, [gamificationRows])

  const stats = useMemo(() => {
    if (statsRows.length === 0) return null
    const r = statsRows[0] as any
    return { totalWorkouts: r.total_workouts || 0, totalPRs: r.total_prs || 0 }
  }, [statsRows])

  const morphoProfile = useMemo(() => {
    if (morphoRows.length === 0) return null
    return { primaryMorphotype: (morphoRows[0] as any).primary_morphotype }
  }, [morphoRows])

  const weeklyComparison = useMemo(() => {
    const empty: WeekMetrics = { sessions: 0, volumeKg: 0, durationMin: 0, calories: 0, prCount: 0 }
    const thisWeek: WeekMetrics = { ...empty }
    const lastWeek: WeekMetrics = { ...empty }
    for (const row of weeklyRows as any[]) {
      const target = row.week === 'this' ? thisWeek : lastWeek
      target.sessions = row.sessions || 0
      target.volumeKg = Math.round(parseFloat(row.volume_kg || '0'))
      target.durationMin = parseInt(row.duration_min || '0')
      target.calories = parseInt(row.calories || '0')
      target.prCount = row.pr_count || 0
    }
    return { thisWeek, lastWeek }
  }, [weeklyRows])

  const displayName = authDisplayName || (profileRows[0] as any)?.display_name || 'Guerrier'
  const weeklyWorkouts = Math.min(weeklyComparison.thisWeek.sessions, WEEKLY_GOAL)
  const streak = gamification?.currentStreak || 0
  const totalWorkouts = stats?.totalWorkouts || 0
  const totalPRs = stats?.totalPRs || 0
  const level = gamification?.currentLevel || 1
  const xpPct = gamification?.xpProgress || 0
  const xpCur = gamification?.xpInCurrentLevel || 0
  const xpMax = gamification?.xpToNextLevel || 100

  const statValues = { totalWorkouts, streak, totalPRs }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: meshBg(isDark) }}>

      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ position: 'relative' }}>
              <Avatar
                component={Link}
                href="/profile"
                sx={{
                  width: 46, height: 46, bgcolor: isDark ? '#1e1c16' : '#f0ece4',
                  color: GOLD, fontSize: '1.15rem', fontWeight: 700,
                  border: `2px solid ${GOLD}`,
                  boxShadow: `0 0 16px ${alpha(GOLD, 0.3)}`,
                  textDecoration: 'none',
                }}
              >
                {displayName[0].toUpperCase()}
              </Avatar>
              {streak > 0 && (
                <Box sx={{
                  position: 'absolute', top: -5, right: -10,
                  bgcolor: '#ff9800', color: '#fff', borderRadius: '10px',
                  px: 0.6, py: 0.15, display: 'flex', alignItems: 'center', gap: 0.25,
                  fontSize: '0.58rem', fontWeight: 800,
                  border: `2px solid ${isDark ? '#0a0a0a' : '#f5f3ef'}`,
                  boxShadow: '0 2px 8px rgba(255,152,0,0.4)',
                }}>
                  <Flame size={10} weight={W} />{streak}
                </Box>
              )}
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: tc.m(isDark), lineHeight: 1.3, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Bonjour
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.15, color: tc.h(isDark), letterSpacing: '-0.01em' }}>
                {displayName}
              </Typography>
            </Box>
          </Stack>
          <IconButton component={Link} href="/profile" size="small">
            <GearSix size={20} weight={W} color={tc.f(isDark)} />
          </IconButton>
        </Stack>
      </Box>

      {/* Hero Ring */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2.5, pb: 3 }}>
        <SessionRing size={170} sw={12} workouts={weeklyWorkouts} goal={WEEKLY_GOAL} isDark={isDark} />
      </Box>

      {/* CTA */}
      <Box sx={{ px: 3, pb: 2.5 }}>
        <Button
          component={Link}
          href="/workout"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Barbell size={22} weight={W} />}
          sx={{
            py: 1.8, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            color: '#1a1a1a',
            boxShadow: `0 4px 24px ${alpha(GOLD, 0.45)}`,
            textDecoration: 'none',
            '&:hover': { background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` },
          }}
        >
          Lancer une Séance
        </Button>
      </Box>

      {/* Morpho CTA (conditionnel) */}
      {!morphoProfile && (
        <Box sx={{ px: 3, pb: 2.5 }}>
          <Box
            component={Link}
            href="/morphology"
            sx={{
              ...glass(isDark),
              display: 'flex', alignItems: 'center', gap: 2,
              p: 2.5, textDecoration: 'none',
              borderLeft: `3px solid ${GOLD}`,
            }}
          >
            <Box sx={{ fontSize: '1.5rem' }}>🧬</Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(isDark) }}>
                Découvre ton morphotype
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tc.m(isDark), fontWeight: 500 }}>
                Optimise tes exercices selon ta morphologie
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* XP strip */}
      <Box sx={{ px: 3, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: GOLD, minWidth: 44, letterSpacing: '0.04em' }}>
            Niv. {level}
          </Typography>
          <LinearProgress variant="determinate" value={xpPct} sx={{
            flex: 1, height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` },
          }} />
          <Typography sx={{ fontSize: '0.6rem', color: tc.f(isDark), fontWeight: 500 }}>
            {xpCur}/{xpMax} XP
          </Typography>
        </Stack>
      </Box>

      {/* Stats card (expandable) */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={glass(isDark, { overflow: 'hidden' })}>
          <Box onClick={() => setStatsOpen(!statsOpen)} sx={{ p: 3, cursor: 'pointer', userSelect: 'none' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
              <Typography sx={{
                fontSize: '0.68rem', fontWeight: 600, color: tc.m(isDark),
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Ton activité
              </Typography>
              <CaretDown
                size={20}
                weight={W}
                color={GOLD}
                style={{
                  opacity: 0.6,
                  transform: statsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-around" textAlign="center">
              {STAT_ITEMS.map((item, i) => (
                <Box key={item.field} sx={i === 1 ? { borderLeft: 1, borderRight: 1, borderColor: isDark ? alpha(GOLD, 0.1) : alpha(GOLD, 0.15), px: 4 } : undefined}>
                  <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: item.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {statValues[item.field]}
                  </Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: tc.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Expanded: weekly tiles */}
          <Collapse in={statsOpen}>
            <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
              <Typography sx={{
                fontSize: '0.6rem', fontWeight: 600, color: GOLD, opacity: 0.7,
                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5, px: 0.5,
              }}>
                Hebdo
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {WEEKLY_METRICS.map((m) => (
                  <Box key={m.field} sx={{
                    textAlign: 'center',
                    bgcolor: isDark ? alpha('#ffffff', 0.035) : alpha('#000000', 0.025),
                    borderRadius: '14px',
                    py: 1.8, px: 1.5,
                    border: '1px solid',
                    borderColor: isDark ? alpha(GOLD, 0.07) : alpha(GOLD, 0.1),
                  }}>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tc.h(isDark), letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {weeklyComparison.thisWeek[m.field]}
                      {m.unit && <Typography component="span" sx={{ fontSize: '0.6rem', color: tc.f(isDark), fontWeight: 500 }}> {m.unit}</Typography>}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: tc.m(isDark), mt: 0.6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {m.label}
                    </Typography>
                    <Box sx={{ mt: 0.4 }}>
                      <ChangeIndicator cur={weeklyComparison.thisWeek[m.field]} prev={weeklyComparison.lastWeek[m.field]} isDark={isDark} />
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
                <Trophy size={22} weight={W} color={GOLD} style={{ filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.4)})` }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: GOLD, letterSpacing: '-0.01em' }}>
                    {weeklyComparison.thisWeek.prCount} PRs
                  </Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: tc.m(isDark), fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    cette semaine
                  </Typography>
                </Box>
                <ChangeIndicator cur={weeklyComparison.thisWeek.prCount} prev={weeklyComparison.lastWeek.prCount} isDark={isDark} />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>

      <BottomNav />
    </Box>
  )
}
