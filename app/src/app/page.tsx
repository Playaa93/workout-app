'use client'

import { useEffect, useState } from 'react'
import { getGamificationData, getUserProfile, getUserStats, type GamificationData, type UserProfileData, type StatsData } from './profile/actions'
import { getMorphoProfile } from './morphology/actions'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Fade from '@mui/material/Fade'
import Home from '@mui/icons-material/Home'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Person from '@mui/icons-material/Person'
import Settings from '@mui/icons-material/Settings'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Link from 'next/link'

type MorphoProfileData = {
  primaryMorphotype: string
  secondaryMorphotype: string | null
} | null

const WEEKLY_GOAL = 4

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [morphoProfile, setMorphoProfile] = useState<MorphoProfileData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    async function loadData() {
      const [profileData, gamData, statsData, morphoData] = await Promise.all([
        getUserProfile(),
        getGamificationData(),
        getUserStats(),
        getMorphoProfile(),
      ])
      setProfile(profileData)
      setGamification(gamData)
      setStats(statsData)
      setMorphoProfile(morphoData)
      setLoading(false)
    }
    loadData()
  }, [])

  const weeklyWorkouts = Math.min(stats?.totalWorkouts || 0, WEEKLY_GOAL)
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
              {(profile?.displayName || 'U')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                Bonjour
              </Typography>
              <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {loading ? <Skeleton width={80} /> : (profile?.displayName || 'Guerrier')}
              </Typography>
            </Box>
          </Stack>
          <IconButton component={Link} href="/profile" size="small">
            <Settings sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Progress Rings */}
      <Fade in={!loading}>
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
              {loading ? (
                <Skeleton variant="circular" width={60} height={60} />
              ) : (
                <>
                  <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                    {weeklyWorkouts}<Typography component="span" variant="body2" color="text.secondary">/{WEEKLY_GOAL}</Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    séances/sem
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Fade>

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
      {!loading && !morphoProfile && (
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
            {loading ? (
              <Skeleton variant="rectangular" height={50} />
            ) : (
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
            )}
          </CardContent>
        </Card>
      </Box>

      {/* XP Progress bar */}
      <Box sx={{ px: 2.5, pb: 1 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={16} sx={{ borderRadius: 2 }} />
        ) : (
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
        )}
      </Box>

      {/* Accès rapide */}
      <Box sx={{ px: 2.5, pt: 2, pb: 3, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 0.5 }}>
          Accès rapide
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {[
            { label: 'Mesures', href: '/measurements', icon: '📏' },
            { label: 'Diète', href: '/diet', icon: '🍎' },
            { label: 'Programmes', href: '/workout/programs', icon: '📋' },
          ].map((item) => (
            <Card key={item.label} sx={{ flex: 1 }}>
              <CardActionArea component={Link} href={item.href}>
                <CardContent sx={{ py: 2, px: 1, textAlign: 'center' }}>
                  <Box sx={{ fontSize: '1.4rem', mb: 0.5 }}>{item.icon}</Box>
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
      <Paper
        sx={{ position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 10 }}
        elevation={8}
      >
        <BottomNavigation value={0} showLabels>
          <BottomNavigationAction component={Link} href="/" label="Home" icon={<Home />} />
          <BottomNavigationAction component={Link} href="/workout" label="Workout" icon={<FitnessCenter />} />
          <BottomNavigationAction component={Link} href="/profile" label="Profil" icon={<Person />} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
