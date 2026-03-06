'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getHuaweiCredentials,
  saveHuaweiCredentials,
  disconnectHuawei,
  type HuaweiCredentials,
} from './actions';
import { useAuth } from '@/powersync/auth-context';
import {
  useUserProfile,
  useGamification,
  useAchievementsWithStatus,
  useRecentXp,
  useUserStats,
} from '@/powersync/queries/profile-queries';
import { useMorphoProfile } from '@/powersync/queries/morphology-queries';
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
import Logout from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Key from '@mui/icons-material/Key';
import Watch from '@mui/icons-material/Watch';
import Sync from '@mui/icons-material/Sync';
import LinkOff from '@mui/icons-material/LinkOff';
import Link2 from '@mui/icons-material/Link';
import { logout } from '@/lib/auth-actions';
import { triggerHaptic } from '@/lib/haptic';
import { calculateLevel } from '@/lib/xp-utils';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
import BottomNav from '@/components/BottomNav';

type MorphoProfileData = {
  primaryMorphotype: string;
  morphotypeScore: { globalType?: string } | null;
  strengths: string[];
  weaknesses: string[];
} | null;

type GamificationData = {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  longestStreak: number;
  avatarStage: number;
};

type AchievementData = {
  id: string;
  key: string;
  nameFr: string;
  descriptionFr: string | null;
  icon: string | null;
  xpReward: number;
  category: string | null;
  isSecret: boolean;
  unlockedAt: string | null;
};

type XpTransactionData = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type StatsData = {
  totalWorkouts: number;
  totalFoodEntries: number;
  totalMeasurements: number;
  totalPRs: number;
  bossFightsWon: number;
};

export default function ProfilePage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ProfileContent />;
}

function ProfileContent() {
  const [tab, setTab] = useState(0);

  // PowerSync reactive hooks
  const { data: profileRows, isLoading: profileLoading } = useUserProfile();
  const { data: gamificationRows, isLoading: gamLoading } = useGamification();
  const { data: achievementRows, isLoading: achLoading } = useAchievementsWithStatus();
  const { data: xpRows, isLoading: xpLoading } = useRecentXp();
  const { data: statsRows, isLoading: statsLoading } = useUserStats();
  const { data: morphoRows } = useMorphoProfile();

  const isLoading = profileLoading || gamLoading || achLoading || xpLoading || statsLoading;

  // Map profile
  const profile = useMemo(() => {
    if (profileRows.length === 0) return null;
    const r = profileRows[0];
    return { id: r.id as string, displayName: r.display_name as string | null, email: r.email as string };
  }, [profileRows]);

  // Map gamification
  const gamification = useMemo<GamificationData | null>(() => {
    if (gamificationRows.length === 0) return null;
    const r = gamificationRows[0];
    const totalXp = (r.total_xp as number) || 0;
    const levelInfo = calculateLevel(totalXp);
    return {
      totalXp,
      currentLevel: levelInfo.level,
      xpToNextLevel: levelInfo.xpToNext,
      xpProgress: Math.round((levelInfo.xpInCurrentLevel / levelInfo.xpToNext) * 100),
      currentStreak: (r.current_streak as number) || 0,
      longestStreak: (r.longest_streak as number) || 0,
      avatarStage: (r.avatar_stage as number) || 1,
    };
  }, [gamificationRows]);

  // Map achievements
  const achievements = useMemo<AchievementData[]>(() => {
    return achievementRows.map((a: any) => ({
      id: a.id,
      key: a.key,
      nameFr: a.name_fr,
      descriptionFr: a.description_fr,
      icon: a.icon,
      xpReward: a.xp_reward || 0,
      category: a.category,
      isSecret: !!a.is_secret,
      unlockedAt: a.unlocked_at || null,
    }));
  }, [achievementRows]);

  // Map XP transactions
  const recentXp = useMemo<XpTransactionData[]>(() => {
    return xpRows.map((t: any) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      createdAt: t.created_at,
    }));
  }, [xpRows]);

  // Map stats
  const stats = useMemo<StatsData | null>(() => {
    if (statsRows.length === 0) return null;
    const r = statsRows[0] as any;
    return {
      totalWorkouts: r.total_workouts || 0,
      totalFoodEntries: r.total_food_entries || 0,
      totalMeasurements: r.total_measurements || 0,
      totalPRs: r.total_prs || 0,
      bossFightsWon: r.boss_fights_won || 0,
    };
  }, [statsRows]);

  // Map morpho profile
  const morphoProfile = useMemo<MorphoProfileData>(() => {
    if (morphoRows.length === 0) return null;
    const r = morphoRows[0] as any;
    return {
      primaryMorphotype: r.primary_morphotype,
      morphotypeScore: parseJson<{ globalType?: string }>(r.morphotype_score as string),
      strengths: parseJsonArray<string>(r.strengths as string),
      weaknesses: parseJsonArray<string>(r.weaknesses as string),
    };
  }, [morphoRows]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleTabChange = (newTab: number) => {
    triggerHaptic('light');
    setTab(newTab);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            component={Link}
            href="/"
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Mon Profil
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

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

      {/* Tabs - text style */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="center" spacing={3}>
          {([
            { key: 0, label: 'Stats' },
            { key: 1, label: 'Succès' },
            { key: 2, label: 'XP' },
            { key: 3, label: 'Param.' },
          ] as const).map((item) => (
            <Typography
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: tab === item.key ? 600 : 400,
                color: tab === item.key ? 'text.primary' : 'text.disabled',
                transition: 'all 0.15s ease',
                '&:active': { opacity: 0.5 },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
        {tab === 0 && <StatsTab stats={stats} achievements={achievements} morphoProfile={morphoProfile} />}
        {tab === 1 && <AchievementsTab achievements={achievements} />}
        {tab === 2 && <HistoryTab transactions={recentXp} />}
        {tab === 3 && <SettingsTab />}
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
}

function getAvatarEmoji(stage: number): string {
  const avatars = ['🥚', '🐣', '🐥', '🦅', '🐉'];
  return avatars[Math.min(stage - 1, avatars.length - 1)];
}

const morphotypeInfo: Record<string, { emoji: string; title: string; gradient: string }> = {
  longiligne: { emoji: '🦒', title: 'Longiligne', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
  breviline: { emoji: '🐻', title: 'Bréviligne', gradient: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)' },
  normo: { emoji: '🦁', title: 'Normoligne', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
  ectomorph: { emoji: '🦒', title: 'Ectomorphe', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
  mesomorph: { emoji: '🦁', title: 'Mésomorphe', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
  endomorph: { emoji: '🐻', title: 'Endomorphe', gradient: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)' },
  ecto_meso: { emoji: '🦅', title: 'Ecto-Méso', gradient: 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)' },
  meso_endo: { emoji: '🦍', title: 'Méso-Endo', gradient: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)' },
  ecto_endo: { emoji: '🦎', title: 'Ecto-Endo', gradient: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' },
};

function StatsTab({ stats, achievements, morphoProfile }: { stats: StatsData | null; achievements: AchievementData[]; morphoProfile: MorphoProfileData }) {
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  if (!stats) return null;
  const totalCount = achievements.length;

  return (
    <Stack spacing={3}>
      {/* Morphotype Section */}
      {morphoProfile ? (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Mon morphotype
          </Typography>
          <Card
            sx={{
              background: morphotypeInfo[morphoProfile.morphotypeScore?.globalType || morphoProfile.primaryMorphotype]?.gradient || morphotypeInfo.longiligne.gradient,
              color: 'white',
            }}
          >
            <CardActionArea component={Link} href="/morphology">
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h2">
                    {morphotypeInfo[morphoProfile.morphotypeScore?.globalType || morphoProfile.primaryMorphotype]?.emoji || '🧬'}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {morphotypeInfo[morphoProfile.morphotypeScore?.globalType || morphoProfile.primaryMorphotype]?.title || 'Morphotype'}
                    </Typography>
                    {morphoProfile.strengths && morphoProfile.strengths.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {morphoProfile.strengths.slice(0, 2).map((s) => (
                          <Chip
                            key={s}
                            label={s}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Typography sx={{ opacity: 0.7 }}>→</Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      ) : (
        <Card
          sx={{
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            color: 'white',
          }}
        >
          <CardActionArea component={Link} href="/morphology">
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h4">🧬</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={600}>Analyse Morphologique</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>Découvre ton morphotype</Typography>
                </Box>
                <Typography sx={{ opacity: 0.7 }}>→</Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      )}

      {/* Stats Grid */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Statistiques
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <StatCard icon="🏋️" label="Entraînements" value={stats.totalWorkouts} />
          <StatCard icon="🍎" label="Repas loggés" value={stats.totalFoodEntries} />
          <StatCard icon="📏" label="Mensurations" value={stats.totalMeasurements} />
          <StatCard icon="🏆" label="Records (PR)" value={stats.totalPRs} />
          <StatCard icon="🐉" label="Boss vaincus" value={stats.bossFightsWon} />
          <StatCard icon="⭐" label="Succès" value={`${unlockedCount}/${totalCount}`} />
        </Box>
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
                      {new Date(tx.createdAt as string).toLocaleDateString('fr-FR', {
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
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  // Huawei
  const [huaweiCreds, setHuaweiCreds] = useState<HuaweiCredentials | null>(null);
  const [hwClientId, setHwClientId] = useState('');
  const [hwClientSecret, setHwClientSecret] = useState('');
  const [showHwSecret, setShowHwSecret] = useState(false);
  const [savingHw, setSavingHw] = useState(false);
  const [syncingHw, setSyncingHw] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    setMounted(true);
    getGeminiApiKey().then((key) => {
      if (key) setApiKey(key);
      setApiKeyLoaded(true);
    });
    getHuaweiCredentials().then((creds) => {
      setHuaweiCreds(creds);
      if (creds.clientId) setHwClientId(creds.clientId);
      if (creds.clientSecret) setHwClientSecret(creds.clientSecret);
    });
    // Check URL params for Huawei OAuth callback
    const params = new URLSearchParams(window.location.search);
    const huaweiStatus = params.get('huawei');
    if (huaweiStatus === 'success') {
      setSnackbar({ open: true, message: 'Huawei Health connecté !', severity: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
      getHuaweiCredentials().then(setHuaweiCreds);
    } else if (huaweiStatus === 'error') {
      const msg = params.get('message') || 'Erreur de connexion';
      setSnackbar({ open: true, message: `Huawei: ${msg}`, severity: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      await saveGeminiApiKey(apiKey.trim());
      setSnackbar({ open: true, message: 'Clé API sauvegardée', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setSavingKey(false);
    }
  };

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
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Reconnaissance IA
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Clé API Google Gemini pour la reconnaissance photo (repas et screenshots cardio).
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="AIza..."
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={!apiKeyLoaded}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Key sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)} edge="end">
                      {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveApiKey}
            disabled={savingKey || !apiKey.trim()}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 2 }}
          >
            {savingKey ? <CircularProgress size={18} /> : 'OK'}
          </Button>
        </Stack>
        <Button
          component="a"
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{ textTransform: 'none', mt: 1, fontWeight: 600, fontSize: '0.8rem' }}
        >
          Obtenir une clé gratuite →
        </Button>
      </Box>

      <Divider />

      {/* Huawei Health */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Watch sx={{ fontSize: 20, color: 'error.main' }} />
          <Typography variant="subtitle2" color="text.secondary">
            Huawei Health
          </Typography>
          {huaweiCreds?.isConnected && (
            <Chip label="Connecté" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Connecte ta montre Huawei pour synchroniser tes séances cardio automatiquement.
        </Typography>

        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            label="Client ID"
            placeholder="1234567890"
            value={hwClientId}
            onChange={(e) => setHwClientId(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            label="Client Secret"
            type={showHwSecret ? 'text' : 'password'}
            value={hwClientSecret}
            onChange={(e) => setHwClientSecret(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowHwSecret(!showHwSecret)} edge="end">
                      {showHwSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                if (!hwClientId.trim() || !hwClientSecret.trim()) {
                  setSnackbar({ open: true, message: 'Client ID et Secret requis', severity: 'error' });
                  return;
                }
                setSavingHw(true);
                try {
                  await saveHuaweiCredentials(hwClientId.trim(), hwClientSecret.trim());
                  setSnackbar({ open: true, message: 'Credentials sauvegardés', severity: 'success' });
                  setHuaweiCreds((prev) => prev ? { ...prev, clientId: hwClientId.trim(), clientSecret: hwClientSecret.trim() } : prev);
                } catch {
                  setSnackbar({ open: true, message: 'Erreur de sauvegarde', severity: 'error' });
                } finally {
                  setSavingHw(false);
                }
              }}
              disabled={savingHw || !hwClientId.trim() || !hwClientSecret.trim()}
              sx={{ textTransform: 'none', flex: 1 }}
            >
              {savingHw ? <CircularProgress size={18} /> : 'Sauvegarder'}
            </Button>

            {huaweiCreds?.isConnected ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={syncingHw ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Sync />}
                  onClick={async () => {
                    setSyncingHw(true);
                    try {
                      const res = await fetch('/api/huawei/sync', { method: 'POST' });
                      const data = await res.json();
                      if (!res.ok) {
                        setSnackbar({ open: true, message: data.error || 'Erreur sync', severity: 'error' });
                        return;
                      }
                      setSnackbar({
                        open: true,
                        message: data.imported > 0
                          ? `${data.imported} séance(s) importée(s) ! +${data.totalXp} XP`
                          : 'Aucune nouvelle séance à importer',
                        severity: 'success',
                      });
                    } catch {
                      setSnackbar({ open: true, message: 'Erreur de synchronisation', severity: 'error' });
                    } finally {
                      setSyncingHw(false);
                    }
                  }}
                  disabled={syncingHw}
                  sx={{ textTransform: 'none', flex: 1 }}
                >
                  Sync
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={async () => {
                    await disconnectHuawei();
                    setHuaweiCreds((prev) => prev ? { ...prev, isConnected: false, tokenExpiresAt: null } : prev);
                    setSnackbar({ open: true, message: 'Huawei déconnecté', severity: 'success' });
                  }}
                >
                  <LinkOff fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<Link2 />}
                onClick={() => {
                  if (!hwClientId.trim() || !hwClientSecret.trim()) {
                    setSnackbar({ open: true, message: 'Sauvegarde d\'abord tes credentials', severity: 'error' });
                    return;
                  }
                  window.location.href = '/api/huawei/auth';
                }}
                disabled={!huaweiCreds?.clientId}
                sx={{ textTransform: 'none', flex: 1 }}
              >
                Connecter
              </Button>
            )}
          </Stack>
        </Stack>

        <Button
          component="a"
          href="https://developer.huawei.com/consumer/en/service/josp/agc/index.html"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{ textTransform: 'none', mt: 1, fontWeight: 600, fontSize: '0.8rem' }}
        >
          Huawei Developer Console →
        </Button>
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

      <Divider />

      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Compte
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          fullWidth
          onClick={() => logout()}
        >
          Se déconnecter
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
