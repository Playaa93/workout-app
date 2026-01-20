'use client'

import { useEffect, useState } from 'react'
import { getGamificationData, getUserStats, type GamificationData, type StatsData } from './profile/actions'
import { getMorphoProfile } from './morphology/actions'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Fade from '@mui/material/Fade'
import Home from '@mui/icons-material/Home'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Person from '@mui/icons-material/Person'
import TrendingUp from '@mui/icons-material/TrendingUp'
import EmojiEvents from '@mui/icons-material/EmojiEvents'
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment'
import Link from 'next/link'

type MorphoProfileData = {
  primaryMorphotype: string
  secondaryMorphotype: string | null
} | null

export default function HomePage() {
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [morphoProfile, setMorphoProfile] = useState<MorphoProfileData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    async function loadData() {
      const [gamData, statsData, morphoData] = await Promise.all([
        getGamificationData(),
        getUserStats(),
        getMorphoProfile(),
      ])
      setGamification(gamData)
      setStats(statsData)
      setMorphoProfile(morphoData)
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
    }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              H
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Salut, haze
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prêt pour ta séance ?
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Morphology CTA - First thing to do if not defined */}
      {!morphoProfile && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #6750a4 0%, #7f67be 50%, #9a67ea 100%)',
              color: 'white',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
              },
            }}
          >
            <CardActionArea component={Link} href="/morphology" sx={{ textDecoration: 'none' }}>
              <CardContent sx={{ py: 2.5, position: 'relative' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                    }}
                  >
                    🧬
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Commence par ton analyse
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      Découvre ton morphotype et tes exercices idéaux
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.6 }}>→</Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      )}

      {/* Level & Streak Card */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Fade in={!loading}>
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(187,134,252,0.15) 0%, rgba(3,218,198,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(103,80,164,0.1) 0%, rgba(1,135,134,0.08) 100%)',
              border: 1,
              borderColor: 'primary.main',
              borderStyle: 'solid',
              borderWidth: 1,
              opacity: 0.9,
            }}
          >
            <CardActionArea component={Link} href="/profile">
              <CardContent sx={{ py: 2.5 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={80} />
                ) : gamification && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <Stack alignItems="center" spacing={1}>
                      <TrendingUp sx={{ fontSize: 28, color: '#bb86fc' }} />
                      <Typography variant="h3" fontWeight={700} sx={{ color: '#bb86fc' }}>
                        {gamification.currentLevel}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Niveau
                      </Typography>
                    </Stack>

                    <Stack alignItems="center" spacing={1} sx={{ borderLeft: 1, borderRight: 1, borderColor: 'divider' }}>
                      <LocalFireDepartment sx={{ fontSize: 28, color: '#ff9800' }} />
                      <Typography variant="h3" fontWeight={700} sx={{ color: '#ff9800' }}>
                        {gamification.currentStreak}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Jours
                      </Typography>
                    </Stack>

                    <Stack alignItems="center" spacing={1}>
                      <EmojiEvents sx={{ fontSize: 28, color: '#03dac6' }} />
                      <Typography variant="h3" fontWeight={700} sx={{ color: '#03dac6' }}>
                        {gamification.totalXp}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        XP Total
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Fade>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ px: 2, pt: 2.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, px: 0.5 }}>
          Actions rapides
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <QuickActionCard
            icon={<FitnessCenter sx={{ fontSize: 28 }} />}
            label="Workout"
            href="/workout"
            color="primary"
          />
          <QuickActionCard
            icon="📏"
            label="Mesures"
            href="/measurements"
            color="secondary"
          />
          <QuickActionCard
            icon="🍎"
            label="Diète"
            href="/diet"
            color="success"
          />
        </Stack>
      </Box>

      {/* Stats Overview */}
      <Box sx={{ px: 2, pt: 2.5, pb: 2, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, px: 0.5 }}>
          Tes statistiques
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <StatCard
            label="Workouts"
            value={stats?.totalWorkouts || 0}
            icon={<FitnessCenter sx={{ fontSize: 28, color: 'primary.main' }} />}
          />
          <StatCard
            label="Records"
            value={stats?.totalPRs || 0}
            icon={<EmojiEvents sx={{ fontSize: 28, color: 'warning.main' }} />}
          />
          <StatCard
            label="Repas"
            value={stats?.totalFoodEntries || 0}
            icon="🍎"
          />
          <StatCard
            label="Mesures"
            value={stats?.totalMeasurements || 0}
            icon="📏"
          />
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
        elevation={8}
      >
        <BottomNavigation value={0} showLabels>
          <BottomNavigationAction
            component={Link}
            href="/"
            label="Home"
            icon={<Home />}
          />
          <BottomNavigationAction
            component={Link}
            href="/workout"
            label="Workout"
            icon={<FitnessCenter />}
          />
          <BottomNavigationAction
            component={Link}
            href="/profile"
            label="Profil"
            icon={<Person />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}

function QuickActionCard({
  icon,
  label,
  href,
  color = 'primary'
}: {
  icon: React.ReactNode
  label: string
  href: string
  color?: 'primary' | 'secondary' | 'success' | 'warning'
}) {
  const colorMap = {
    primary: { bg: 'rgba(187,134,252,0.2)', text: '#bb86fc' },
    secondary: { bg: 'rgba(3,218,198,0.2)', text: '#03dac6' },
    success: { bg: 'rgba(76,175,80,0.2)', text: '#4caf50' },
    warning: { bg: 'rgba(255,183,77,0.2)', text: '#ffb74d' },
  }
  const colors = colorMap[color]

  return (
    <Card sx={{ flex: 1 }}>
      <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: colors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              color: colors.text,
              fontSize: typeof icon === 'string' ? '1.75rem' : undefined,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function StatCard({
  label,
  value,
  icon
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent sx={{ py: 2.5, px: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            fontSize: typeof icon === 'string' ? '1.5rem' : undefined,
            display: 'flex',
            alignItems: 'center',
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

