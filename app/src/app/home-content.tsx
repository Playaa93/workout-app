'use client'

import React, { useEffect, useMemo } from 'react'
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
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Timeline from '@mui/icons-material/Timeline'
import Restaurant from '@mui/icons-material/Restaurant'
import Straighten from '@mui/icons-material/Straighten'
import Settings from '@mui/icons-material/Settings'
import ChevronRight from '@mui/icons-material/ChevronRight'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

type WeekMetrics = {
  sessions: number
  volumeKg: number
  durationMin: number
  calories: number
  prCount: number
}

type WeeklyComparisonData = {
  thisWeek: WeekMetrics
  lastWeek: WeekMetrics
}

type GamificationData = {
  totalXp: number
  currentLevel: number
  xpToNextLevel: number
  xpProgress: number
  currentStreak: number
  longestStreak: number
  avatarStage: number
}

type MorphoProfileData = {
  primaryMorphotype: string
} | null

const WEEKLY_GOAL = 4

const QUICK_ACCESS_ITEMS = [
  { label: 'Historique', href: '/workout', Icon: Timeline, color: '#6750a4' },
  { label: 'Diète', href: '/diet', Icon: Restaurant, color: '#e57373' },
  { label: 'Mesures', href: '/measurements', Icon: Straighten, color: '#64b5f6' },
] as const


function getChangeIndicator(cur: number, prev: number): { label: string; color: string; icon: React.ReactNode } {
  if (prev === 0 && cur > 0) return { label: 'Nouveau', color: 'info.main', icon: <TrendingUp sx={{ fontSize: 14 }} /> }
  if (prev === 0) return { label: '=', color: 'text.disabled', icon: null }
  const change = Math.round(((cur - prev) / prev) * 100)
  if (change > 0) return { label: `+${change}%`, color: 'success.main', icon: <TrendingUp sx={{ fontSize: 14 }} /> }
  if (change < 0) return { label: `${change}%`, color: 'error.main', icon: <TrendingDown sx={{ fontSize: 14 }} /> }
  return { label: '=', color: 'text.disabled', icon: null }
}

function ChangeIndicator({ cur, prev }: { cur: number; prev: number }) {
  const ch = getChangeIndicator(cur, prev)
  return (
    <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
      {ch.icon}
      <Typography variant="caption" fontWeight={600} sx={{ color: ch.color }}>
        {ch.label}
      </Typography>
    </Stack>
  )
}

const WEEKLY_METRICS: { key: string; label: string; unit: string; thisKey: keyof WeekMetrics; prevKey: keyof WeekMetrics }[] = [
  { key: 'sessions', label: 'Séances', unit: '', thisKey: 'sessions', prevKey: 'sessions' },
  { key: 'volume', label: 'Volume', unit: 'kg', thisKey: 'volumeKg', prevKey: 'volumeKg' },
  { key: 'duration', label: 'Durée', unit: 'min', thisKey: 'durationMin', prevKey: 'durationMin' },
  { key: 'calories', label: 'Calories', unit: '', thisKey: 'calories', prevKey: 'calories' },
]

function WeeklyComparisonCard({ data }: { data: WeeklyComparisonData }) {
  const { thisWeek, lastWeek } = data
  return (
    <Box sx={{ px: 2.5, pb: 2 }}>
      <Card>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Progression hebdo
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {WEEKLY_METRICS.map((m) => (
              <Box key={m.key} sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  {thisWeek[m.thisKey]}{m.unit && <Typography component="span" variant="caption" color="text.secondary"> {m.unit}</Typography>}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {m.label}
                </Typography>
                <ChangeIndicator cur={thisWeek[m.thisKey]} prev={lastWeek[m.prevKey]} />
              </Box>
            ))}
          </Box>
          <Box sx={{ textAlign: 'center', pt: 1.5, borderTop: 1, borderColor: 'divider', mt: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              {thisWeek.prCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Records (PRs)
            </Typography>
            <ChangeIndicator cur={thisWeek.prCount} prev={lastWeek.prCount} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default function HomeContent() {
  const { userId, loading: authLoading } = useAuth()

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return <HomeContentInner />
}

function HomeContentInner() {
  const { displayName: authDisplayName } = useAuth()
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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  // Map profile
  const profile = useMemo(() => {
    if (profileRows.length === 0) return null
    const r = profileRows[0] as any
    return { displayName: r.display_name as string | null, email: r.email as string }
  }, [profileRows])

  // Map gamification
  const gamification = useMemo<GamificationData | null>(() => {
    if (gamificationRows.length === 0) return null
    const r = gamificationRows[0] as any
    const totalXp = (r.total_xp as number) || 0
    const levelInfo = calculateLevel(totalXp)
    return {
      totalXp,
      currentLevel: levelInfo.level,
      xpToNextLevel: levelInfo.xpToNext,
      xpProgress: Math.round((levelInfo.xpInCurrentLevel / levelInfo.xpToNext) * 100),
      currentStreak: (r.current_streak as number) || 0,
      longestStreak: (r.longest_streak as number) || 0,
      avatarStage: (r.avatar_stage as number) || 1,
    }
  }, [gamificationRows])

  // Map stats
  const stats = useMemo(() => {
    if (statsRows.length === 0) return null
    const r = statsRows[0] as any
    return {
      totalWorkouts: r.total_workouts || 0,
      totalFoodEntries: r.total_food_entries || 0,
      totalMeasurements: r.total_measurements || 0,
      totalPRs: r.total_prs || 0,
      bossFightsWon: r.boss_fights_won || 0,
    }
  }, [statsRows])

  // Map morpho profile
  const morphoProfile = useMemo<MorphoProfileData>(() => {
    if (morphoRows.length === 0) return null
    const r = morphoRows[0] as any
    return { primaryMorphotype: r.primary_morphotype }
  }, [morphoRows])

  // Map weekly comparison
  const weeklyComparison = useMemo<WeeklyComparisonData>(() => {
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

  const weeklyWorkouts = Math.min(weeklyComparison.thisWeek.sessions, WEEKLY_GOAL)
  const streakDays = gamification?.currentStreak || 0
  const streakMax = 7

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              component={Link}
              href="/profile"
              sx={{
                width: 42, height: 42,
                bgcolor: 'text.primary', color: 'background.default',
                fontSize: '1rem', fontWeight: 600, textDecoration: 'none',
              }}
            >
              {(authDisplayName || profile?.displayName || 'U')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                Bonjour
              </Typography>
              <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {authDisplayName || profile?.displayName || 'Guerrier'}
              </Typography>
            </Box>
          </Stack>
          <IconButton component={Link} href="/profile" size="small">
            <Settings sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Progress Rings */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <Box sx={{ position: 'relative', width: 160, height: 160 }}>
          {/* Outer ring - Workouts cette semaine */}
          <svg viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(187,134,252,0.15)" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="72" fill="none"
              stroke="#bb86fc" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - weeklyWorkouts / WEEKLY_GOAL)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          {/* Inner ring - Streak */}
          <svg viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="56" fill="none" stroke="rgba(255,152,0,0.15)" strokeWidth="8" />
            <circle
              cx="80" cy="80" r="56" fill="none"
              stroke="#ff9800" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(streakDays, streakMax) / streakMax)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          {/* Center text */}
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
              {weeklyWorkouts}<Typography component="span" variant="body2" color="text.secondary">/{WEEKLY_GOAL}</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              séances/sem
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Ring legend */}
      <Stack direction="row" justifyContent="center" spacing={3} sx={{ pb: 2 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#bb86fc' }} />
          <Typography variant="caption" color="text.secondary">Séances</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff9800' }} />
          <Typography variant="caption" color="text.secondary">Streak</Typography>
        </Stack>
      </Stack>

      {/* CTA Workout */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Button
          component={Link}
          href="/workout"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<FitnessCenter />}
          sx={{
            py: 2,
            fontSize: '1.05rem',
            fontWeight: 700,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #6750a4, #9a67ea)',
          }}
        >
          Lancer une Séance
        </Button>
      </Box>

      {/* Morpho CTA conditionnel */}
      {!morphoProfile && (
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Card sx={{ bgcolor: 'rgba(103,80,164,0.08)', border: '1px solid', borderColor: 'primary.main', opacity: 0.9 }}>
            <CardActionArea component={Link} href="/morphology">
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ fontSize: '1.5rem' }}>🧬</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Découvre ton morphotype
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Optimise tes exercices selon ta morphologie
                    </Typography>
                  </Box>
                  <ChevronRight sx={{ color: 'text.secondary', fontSize: 20 }} />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      )}

      {/* Stats compactes */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Card>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, textAlign: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {stats?.totalWorkouts || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Workouts
                </Typography>
              </Box>
              <Box sx={{ borderLeft: 1, borderRight: 1, borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#ff9800' }}>
                  {gamification?.currentStreak || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Streak
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#03dac6' }}>
                  {stats?.totalPRs || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Records
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Weekly comparison */}
      {(weeklyComparison.thisWeek.sessions > 0 || weeklyComparison.lastWeek.sessions > 0) && (
        <WeeklyComparisonCard data={weeklyComparison} />
      )}

      {/* XP Progress bar */}
      <Box sx={{ px: 2.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 40 }}>
            Niv. {gamification?.currentLevel || 1}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={gamification?.xpProgress || 0}
            sx={{
              flex: 1, height: 6, borderRadius: 3, bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#bb86fc' },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {gamification?.totalXp || 0}/{gamification?.xpToNextLevel || 100} XP
          </Typography>
        </Stack>
      </Box>

      {/* Accès rapide */}
      <Box sx={{ px: 2.5, pt: 2, pb: 12, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 0.5 }}>
          Accès rapide
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {QUICK_ACCESS_ITEMS.map((item) => (
            <Card key={item.label} sx={{ flex: 1 }}>
              <CardActionArea component={Link} href={item.href}>
                <CardContent sx={{ py: 2, px: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 0.5, color: item.color, display: 'flex', justifyContent: 'center' }}>
                    <item.Icon />
                  </Box>
                  <Typography variant="caption" fontWeight={600}>
                    {item.label}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
