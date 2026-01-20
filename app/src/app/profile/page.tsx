'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  getUserProfile,
  getGamificationData,
  getAchievements,
  getRecentXp,
  getUserStats,
  type UserProfileData,
  type GamificationData,
  type AchievementData,
  type XpTransactionData,
  type StatsData,
} from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Lock from '@mui/icons-material/Lock';
import LightMode from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import SettingsBrightness from '@mui/icons-material/SettingsBrightness';
import Check from '@mui/icons-material/Check';

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [recentXp, setRecentXp] = useState<XpTransactionData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [profileData, gamificationData, achievementsData, xpData, statsData] = await Promise.all([
        getUserProfile(),
        getGamificationData(),
        getAchievements(),
        getRecentXp(),
        getUserStats(),
      ]);
      setProfile(profileData);
      setGamification(gamificationData);
      setAchievements(achievementsData);
      setRecentXp(xpData);
      setStats(statsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton component={Link} href="/" size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>
            Mon Profil
          </Typography>
        </Stack>
      </Paper>

      {/* Profile Header */}
      {gamification && profile && (
        <Box
          sx={{
            p: 3,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(103,80,164,0.3) 0%, rgba(154,103,234,0.2) 100%)'
              : 'linear-gradient(135deg, rgba(103,80,164,0.15) 0%, rgba(154,103,234,0.1) 100%)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center">
            {/* Avatar */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
                  fontSize: '2rem',
                }}
              >
                {getAvatarEmoji(gamification.avatarStage)}
              </Avatar>
              <Chip
                label={`Niv. ${gamification.currentLevel}`}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -8,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {profile.displayName || 'Guerrier'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                <TrendingUp sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {gamification.totalXp.toLocaleString()} XP
                </Typography>
              </Stack>
              {/* XP Progress */}
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={gamification.xpProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #ffb74d 0%, #ff9800 100%)',
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {gamification.xpProgress}% vers niveau {gamification.currentLevel + 1}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Streak */}
          <Card sx={{ mt: 2.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-around" alignItems="center" divider={<Divider orientation="vertical" flexItem />}>
                <Stack alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocalFireDepartment sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="h4" fontWeight={700}>
                      {gamification.currentStreak}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">jours streak</Typography>
                </Stack>
                <Stack alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <EmojiEvents sx={{ fontSize: 20, color: 'secondary.main' }} />
                    <Typography variant="h4" fontWeight={700}>
                      {gamification.longestStreak}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">record</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tab label="Stats" />
        <Tab label="Succès" />
        <Tab label="XP" />
        <Tab label="Param." />
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {tab === 0 && stats && <StatsTab stats={stats} achievements={achievements} />}
        {tab === 1 && <AchievementsTab achievements={achievements} />}
        {tab === 2 && <HistoryTab transactions={recentXp} />}
        {tab === 3 && <SettingsTab />}
      </Box>
    </Box>
  );
}

function getAvatarEmoji(stage: number): string {
  const avatars = ['🥚', '🐣', '🐥', '🦅', '🐉'];
  return avatars[Math.min(stage - 1, avatars.length - 1)];
}

function StatsTab({ stats, achievements }: { stats: StatsData; achievements: AchievementData[] }) {
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const totalCount = achievements.length;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <StatCard icon="🏋️" label="Entraînements" value={stats.totalWorkouts} />
        <StatCard icon="🍎" label="Repas loggés" value={stats.totalFoodEntries} />
        <StatCard icon="📏" label="Mensurations" value={stats.totalMeasurements} />
        <StatCard icon="🏆" label="Records (PR)" value={stats.totalPRs} />
        <StatCard icon="🐉" label="Boss vaincus" value={stats.bossFightsWon} />
        <StatCard icon="⭐" label="Succès" value={`${unlockedCount}/${totalCount}`} />
      </Box>

      {/* Recent Achievements */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Derniers succès débloqués
        </Typography>
        <Stack spacing={1}>
          {achievements
            .filter((a) => a.unlockedAt)
            .slice(0, 3)
            .map((achievement) => (
              <Card key={achievement.id}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h5">{achievement.icon}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{achievement.nameFr}</Typography>
                      <Typography variant="caption" color="text.secondary">{achievement.descriptionFr}</Typography>
                    </Box>
                    <Chip label={`+${achievement.xpReward} XP`} size="small" color="warning" />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          {achievements.filter((a) => a.unlockedAt).length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              Aucun succès débloqué pour l&apos;instant
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography fontSize="1.25rem">{icon}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={700}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

function AchievementsTab({ achievements }: { achievements: AchievementData[] }) {
  const categories = ['training', 'consistency', 'nutrition', 'measurements'];
  const categoryLabels: Record<string, string> = {
    training: '🏋️ Entraînement',
    consistency: '🔥 Régularité',
    nutrition: '🍎 Nutrition',
    measurements: '📏 Mensurations',
  };

  return (
    <Stack spacing={3}>
      {categories.map((category) => {
        const categoryAchievements = achievements.filter((a) => a.category === category);
        if (categoryAchievements.length === 0) return null;

        return (
          <Box key={category}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              {categoryLabels[category]}
            </Typography>
            <Stack spacing={1}>
              {categoryAchievements.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt;
                const isSecret = achievement.isSecret && !isUnlocked;

                return (
                  <Card
                    key={achievement.id}
                    sx={{
                      opacity: isUnlocked ? 1 : 0.6,
                      ...(isUnlocked && {
                        background: (theme) => theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(255,183,77,0.15) 0%, rgba(255,152,0,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255,183,77,0.2) 0%, rgba(255,152,0,0.15) 100%)',
                        border: 1,
                        borderColor: 'warning.main',
                      }),
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography
                          variant="h5"
                          sx={{ filter: !isUnlocked ? 'grayscale(1)' : 'none' }}
                        >
                          {isSecret ? <Lock sx={{ fontSize: 28 }} /> : achievement.icon}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {isSecret ? '???' : achievement.nameFr}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isSecret ? 'Succès secret' : achievement.descriptionFr}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={`+${achievement.xpReward} XP`}
                            size="small"
                            color={isUnlocked ? 'warning' : 'default'}
                          />
                          {isUnlocked && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {new Date(achievement.unlockedAt!).toLocaleDateString('fr-FR')}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

function HistoryTab({ transactions }: { transactions: XpTransactionData[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        Historique XP récent
      </Typography>
      {transactions.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
          Pas encore d&apos;XP gagné. Commence à t&apos;entraîner !
        </Typography>
      ) : (
        <Stack spacing={1}>
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{tx.reason}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${tx.amount > 0 ? '+' : ''}${tx.amount} XP`}
                    size="small"
                    color={tx.amount > 0 ? 'success' : 'error'}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function SettingsTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const themeOptions = [
    {
      value: 'system',
      label: 'Système',
      description: 'Suit les préférences de ton appareil',
      icon: <SettingsBrightness sx={{ fontSize: 28 }} />,
    },
    {
      value: 'light',
      label: 'Clair',
      description: 'Thème lumineux',
      icon: <LightMode sx={{ fontSize: 28, color: '#ffb74d' }} />,
    },
    {
      value: 'dark',
      label: 'Sombre',
      description: 'Thème sombre pour les yeux',
      icon: <DarkMode sx={{ fontSize: 28, color: '#bb86fc' }} />,
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Apparence
        </Typography>
        <Stack spacing={1}>
          {themeOptions.map((option) => {
            const isSelected = theme === option.value;
            return (
              <Card
                key={option.value}
                sx={{
                  ...(isSelected && {
                    border: 2,
                    borderColor: 'primary.main',
                    bgcolor: (t) => t.palette.mode === 'dark'
                      ? 'rgba(187,134,252,0.1)'
                      : 'rgba(103,80,164,0.08)',
                  }),
                }}
              >
                <CardActionArea onClick={() => setTheme(option.value)} sx={{ p: 0 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected ? 'primary.main' : 'text.secondary',
                      }}>
                        {option.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Check sx={{ color: 'primary.main' }} />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
        {theme === 'system' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            Mode actuel : {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
          </Typography>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          À propos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Workout App v1.0.0
        </Typography>
      </Box>
    </Stack>
  );
}
