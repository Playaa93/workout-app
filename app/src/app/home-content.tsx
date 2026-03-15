'use client'

import React, { useEffect, useMemo } from 'react'
import { useThemeTokens } from '@/hooks/useDark'
import { useAuth } from '@/powersync/auth-context'
import {
  useUserProfile,
  useGamification,
  useUserStats,
  useWeeklyComparison,
} from '@/powersync/queries/profile-queries'
import { useMorphoProfile } from '@/powersync/queries/morphology-queries'
import { useDailySummary, useNutritionProfile } from '@/powersync/queries/diet-queries'
import { useRecentSessions, usePersonalRecords } from '@/powersync/queries/workout-queries'
import { useLatestMeasurement, useFirstMeasurement } from '@/powersync/queries/measurement-queries'
import { calculateLevel } from '@/lib/xp-utils'
import { getISOWeekStart } from '@/lib/date-utils'
import { toSqliteTimestamp } from '@/powersync/helpers'
import { GOLD, GOLD_LIGHT, tc, sc, card, surfaceBg, W } from '@/lib/design-tokens'
import { MUSCLE_LABELS } from '@/lib/workout-constants'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import { GearSix, TrendUp, TrendDown, CaretRight, Flame, Trophy, Scales } from '@phosphor-icons/react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const WEEKLY_GOAL = 4

const STAT_ITEMS = [
  { field: 'totalWorkouts' as const, label: 'Workouts', color: GOLD },
  { field: 'streak' as const, label: 'Streak', color: '#ff9800' },
  { field: 'totalPRs' as const, label: 'Records', color: GOLD_LIGHT },
]

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
  const { t, d: isDark } = useThemeTokens()

  const { data: profileRows } = useUserProfile()
  const { data: gamificationRows } = useGamification()
  const { data: statsRows } = useUserStats()
  const { data: morphoRows } = useMorphoProfile()
  const { data: nutritionRows } = useDailySummary()
  const { data: nutritionProfileRows } = useNutritionProfile()
  const { data: recentSessionRows } = useRecentSessions(3)
  const { data: prRows } = usePersonalRecords()
  const { data: latestMeasRows } = useLatestMeasurement()
  const { data: firstMeasRows } = useFirstMeasurement()

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

  const hasMorphoProfile = morphoRows.length > 0

  const weeklySessionCount = useMemo(() => {
    const thisWeekRow = (weeklyRows as any[]).find(r => r.week === 'this')
    return thisWeekRow?.sessions || 0
  }, [weeklyRows])

  const displayName = authDisplayName || (profileRows[0] as any)?.display_name || 'Guerrier'
  const weeklyWorkouts = Math.min(weeklySessionCount, WEEKLY_GOAL)
  const streak = gamification?.currentStreak || 0
  const totalWorkouts = stats?.totalWorkouts || 0
  const totalPRs = stats?.totalPRs || 0
  const level = gamification?.currentLevel || 1
  const xpPct = gamification?.xpProgress || 0
  const xpCur = gamification?.xpInCurrentLevel || 0
  const xpMax = gamification?.xpToNextLevel || 100

  const statValues = { totalWorkouts, streak, totalPRs }

  // Nutrition today
  const nutrition = useMemo(() => {
    const summary = nutritionRows[0] as any
    const profile = nutritionProfileRows[0] as any
    if (!profile) return null
    const cal = Math.round(parseFloat(summary?.total_calories || '0'))
    const prot = Math.round(parseFloat(summary?.total_protein || '0'))
    const carbs = Math.round(parseFloat(summary?.total_carbs || '0'))
    const fat = Math.round(parseFloat(summary?.total_fat || '0'))
    const targetCal = profile.target_calories || 2200
    const targetProt = profile.target_protein || 140
    return { cal, prot, carbs, fat, targetCal, targetProt }
  }, [nutritionRows, nutritionProfileRows])

  // Recent sessions
  const recentSessions = useMemo(() => {
    return recentSessionRows
      .filter((s: any) => s.ended_at)
      .slice(0, 3)
      .map((s: any) => ({
        id: s.id,
        templateName: s.template_name || null,
        exerciseNames: s.exercise_names ? (s.exercise_names as string).split(',') : [],
        muscleGroups: s.muscle_groups ? (s.muscle_groups as string).split(',').filter(Boolean) : [],
        startedAt: new Date(s.started_at),
        sessionType: s.session_type,
        cardioActivity: s.cardio_activity,
      }))
  }, [recentSessionRows])

  // Recent PRs (last 5)
  const recentPRs = useMemo(() => {
    return prRows.slice(0, 5).map((r: any) => ({
      exerciseName: r.exercise_name || '—',
      value: r.value ? parseFloat(r.value) : 0,
      recordType: r.record_type,
      achievedAt: new Date(r.achieved_at),
    }))
  }, [prRows])

  // Body evolution
  const bodyEvolution = useMemo(() => {
    const latest = latestMeasRows[0] as any
    if (!latest?.weight) return null
    const weight = parseFloat(latest.weight)
    const bodyFat = latest.body_fat_percentage ? parseFloat(latest.body_fat_percentage) : null
    const firstRow = firstMeasRows[0] as any
    const firstWeight = firstRow?.weight ? parseFloat(firstRow.weight) : null
    const weightDiff = firstWeight ? weight - firstWeight : null
    return { weight, bodyFat, weightDiff }
  }, [latestMeasRows, firstMeasRows])

  const MC = { P: GOLD, G: sc.green(t), L: '#f97316' }
  const cellSx = card(t, { p: 2.5 })
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase' as const }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(t) }}>
      <Box sx={{ px: 3, pt: 3, pb: 12 }}>

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: GOLD, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.3 }}>
              Bonjour
            </Typography>
            <Typography
              component={Link}
              href="/profile"
              sx={{ fontSize: '1.4rem', fontWeight: 800, color: tc.h(t), letterSpacing: '-0.03em', lineHeight: 1, textDecoration: 'none' }}
            >
              {displayName}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {streak > 0 && (
              <Stack direction="row" spacing={0.3} alignItems="center" sx={{ bgcolor: alpha('#ff9800', 0.1), px: 1, py: 0.4, borderRadius: '10px' }}>
                <Flame size={12} weight={W} color="#ff9800" />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#ff9800' }}>{streak}</Typography>
              </Stack>
            )}
            <IconButton component={Link} href="/profile" size="small">
              <GearSix size={18} weight={W} color={tc.f(t)} />
            </IconButton>
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          {/* Big number + stats in card */}
          <Box sx={cellSx}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: tc.h(t), lineHeight: 1, letterSpacing: '-0.04em' }}>
                {weeklyWorkouts}
                <Typography component="span" sx={{ fontSize: '1.2rem', color: tc.f(t), fontWeight: 500 }}> / {WEEKLY_GOAL}</Typography>
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: tc.m(t), fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                séances cette semaine
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, maxWidth: 200, mx: 'auto' }}>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv.{level}</Typography>
                <LinearProgress variant="determinate" value={xpPct} sx={{
                  flex: 1, height: 2.5, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
                  '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
                }} />
              </Stack>
            </Box>
            <Stack direction="row" justifyContent="space-around" textAlign="center" sx={{
              pt: 2, borderTop: '1px solid', borderColor: alpha(isDark ? '#fff' : '#000', 0.06),
            }}>
              {STAT_ITEMS.map((item, i) => (
                <Box key={item.field} sx={i === 1 ? { borderLeft: 1, borderRight: 1, borderColor: alpha(isDark ? '#fff' : '#000', 0.06), px: 4 } : undefined}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tc.h(t), lineHeight: 1 }}>
                    {statValues[item.field]}
                  </Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tc.f(t), mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* CTA */}
          <Button
            component={Link}
            href="/workout"
            fullWidth
            sx={{
              py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
              bgcolor: tc.h(t), color: surfaceBg(t), textTransform: 'none', textDecoration: 'none',
              '&:hover': { bgcolor: tc.h(t), opacity: 0.9 },
            }}
          >
            Lancer une Séance
          </Button>

          {/* Morpho CTA (conditionnel) */}
          {!hasMorphoProfile && (
            <Box
              component={Link}
              href="/morphology"
              sx={{ ...cellSx, display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', borderLeft: `3px solid ${GOLD}` }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(t) }}>Découvre ton morphotype</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tc.m(t), fontWeight: 500 }}>Optimise tes exercices selon ta morphologie</Typography>
              </Box>
            </Box>
          )}

          {/* Nutrition */}
          {nutrition && (
            <Box
              component={Link}
              href="/diet"
              sx={{ ...cellSx, textDecoration: 'none', color: 'inherit', '&:active': { opacity: 0.85 } }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography sx={lblSx}>Nutrition</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: GOLD, fontWeight: 600 }}>
                  {nutrition.cal} / {nutrition.targetCal} kcal
                </Typography>
              </Stack>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden', mb: 1.2 }}>
                <Box sx={{ width: `${Math.min((nutrition.cal / nutrition.targetCal) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: GOLD, transition: 'width 0.5s' }} />
              </Box>
              <Stack direction="row" spacing={2}>
                {[
                  { k: 'Prot', v: nutrition.prot, target: nutrition.targetProt, c: MC.P },
                  { k: 'Gluc', v: nutrition.carbs, target: Math.round(nutrition.targetCal * 0.45 / 4), c: MC.G },
                  { k: 'Lip', v: nutrition.fat, target: Math.round(nutrition.targetCal * 0.3 / 9), c: MC.L },
                ].map((m) => (
                  <Box key={m.k} sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.2 }}>
                      <Typography sx={{ fontSize: '0.5rem', color: tc.f(t), fontWeight: 500 }}>{m.k}</Typography>
                      <Typography sx={{ fontSize: '0.5rem', color: tc.m(t), fontWeight: 600 }}>{m.v}/{m.target}g</Typography>
                    </Stack>
                    <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(m.c, 0.1), overflow: 'hidden' }}>
                      <Box sx={{ width: `${Math.min((m.v / m.target) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: m.c, transition: 'width 0.5s' }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <Box sx={cellSx}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={lblSx}>Dernières séances</Typography>
                <Typography component={Link} href="/workout" sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Tout</Typography>
              </Stack>
              {recentSessions.map((s, i) => {
                const dateStr = s.startedAt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                const isCardio = s.sessionType === 'cardio'
                const title = s.templateName || (isCardio ? s.cardioActivity || 'Cardio' : dateStr)
                const muscles = s.muscleGroups.map((m: string) => MUSCLE_LABELS[m] || m).filter(Boolean)
                const isLast = i === recentSessions.length - 1
                return (
                  <Stack
                    key={s.id}
                    component={Link}
                    href={`/workout/session?id=${s.id}`}
                    direction="row"
                    alignItems="center"
                    sx={{
                      py: 0.8, textDecoration: 'none', color: 'inherit', '&:active': { opacity: 0.85 },
                      borderBottom: isLast ? 'none' : '1px solid',
                      borderColor: alpha(isDark ? '#fff' : '#000', 0.05),
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(t) }}>{title}</Typography>
                      <Typography sx={{ fontSize: '0.5rem', color: tc.f(t) }}>
                        {muscles.length > 0 ? muscles.join(' · ') + ' · ' : ''}{s.templateName ? dateStr : ''}
                      </Typography>
                    </Box>
                    <CaretRight size={14} weight={W} color={tc.f(t)} />
                  </Stack>
                )
              })}
            </Box>
          )}

          {/* PRs + Body — side by side in cards */}
          <Stack direction="row" spacing={1.5}>
            {recentPRs.length > 0 && (
              <Box sx={{ ...cellSx, flex: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                  <Trophy size={12} weight={W} color={GOLD} />
                  <Typography sx={lblSx}>Records</Typography>
                </Stack>
                {recentPRs.slice(0, 3).map((pr, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.6rem', color: tc.m(t), fontWeight: 500 }} noWrap>{pr.exerciseName}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: tc.h(t), ml: 1, flexShrink: 0 }}>
                      {pr.value % 1 === 0 ? pr.value : pr.value.toFixed(1)}kg
                    </Typography>
                  </Stack>
                ))}
              </Box>
            )}

            {bodyEvolution && (
              <Box
                component={Link}
                href="/measurements"
                sx={{ ...cellSx, flex: 1, textDecoration: 'none', color: 'inherit', '&:active': { opacity: 0.85 } }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                  <Scales size={12} weight={W} color={GOLD} />
                  <Typography sx={lblSx}>Poids</Typography>
                </Stack>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: tc.h(t), lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {bodyEvolution.weight.toFixed(1)}
                  <Typography component="span" sx={{ fontSize: '0.6rem', color: tc.m(t), fontWeight: 500 }}> kg</Typography>
                </Typography>
                {bodyEvolution.weightDiff !== null && (
                  <Stack direction="row" spacing={0.3} alignItems="center" sx={{ mt: 0.5 }}>
                    {bodyEvolution.weightDiff <= 0
                      ? <TrendDown size={12} weight={W} color={tc.m(t)} />
                      : <TrendUp size={12} weight={W} color={sc.red(t)} />
                    }
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: bodyEvolution.weightDiff <= 0 ? tc.m(t) : sc.red(t) }}>
                      {bodyEvolution.weightDiff > 0 ? '+' : ''}{bodyEvolution.weightDiff.toFixed(1)} kg
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Stack>

        </Stack>
      </Box>

      <BottomNav />
    </Box>
  )
}
