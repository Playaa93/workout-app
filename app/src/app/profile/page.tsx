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
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Barbell,
  BowlSteam,
  Ruler,
  PersonArmsSpread,
  Flame,
  Trophy,
  ShieldCheck,
  Star,
  Lightning,
  GearSix,
  CaretRight,
  TrendUp,
  Lock,
  Sun,
  Moon,
  Monitor,
  Check,
  SignOut,
  Key,
  Watch,
  ArrowsClockwise,
  LinkBreak,
  LinkSimple,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { logout } from '@/lib/auth-actions';
import { triggerHaptic } from '@/lib/haptic';
import { calculateLevel } from '@/lib/xp-utils';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
import { GOLD, GOLD_LIGHT, tc, card, surfaceBg } from '@/lib/design-tokens';
import BottomNav from '@/components/BottomNav';

const W = 'light' as const; // Phosphor weight

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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a09' }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    );
  }

  return <ProfileContent />;
}

const morphotypeInfo: Record<string, { abbr: string; title: string }> = {
  longiligne: { abbr: 'Lo', title: 'Longiligne' },
  breviline: { abbr: 'Br', title: 'Bréviligne' },
  normo: { abbr: 'No', title: 'Normoligne' },
  ectomorph: { abbr: 'Ec', title: 'Ectomorphe' },
  mesomorph: { abbr: 'Me', title: 'Mésomorphe' },
  endomorph: { abbr: 'En', title: 'Endomorphe' },
  ecto_meso: { abbr: 'EM', title: 'Ecto-Méso' },
  meso_endo: { abbr: 'ME', title: 'Méso-Endo' },
  ecto_endo: { abbr: 'EE', title: 'Ecto-Endo' },
};

function ProfileContent() {
  const [tab, setTab] = useState(0);
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';

  const { data: profileRows, isLoading: profileLoading } = useUserProfile();
  const { data: gamificationRows, isLoading: gamLoading } = useGamification();
  const { data: achievementRows, isLoading: achLoading } = useAchievementsWithStatus();
  const { data: xpRows, isLoading: xpLoading } = useRecentXp();
  const { data: statsRows, isLoading: statsLoading } = useUserStats();
  const { data: morphoRows } = useMorphoProfile();

  const isLoading = profileLoading || gamLoading || achLoading || xpLoading || statsLoading;

  const profile = useMemo(() => {
    if (profileRows.length === 0) return null;
    const r = profileRows[0];
    return { id: r.id as string, displayName: r.display_name as string | null, email: r.email as string };
  }, [profileRows]);

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

  const achievements = useMemo<AchievementData[]>(() => {
    return achievementRows.map((a: any) => ({
      id: a.id, key: a.key, nameFr: a.name_fr, descriptionFr: a.description_fr,
      icon: a.icon, xpReward: a.xp_reward || 0, category: a.category,
      isSecret: !!a.is_secret, unlockedAt: a.unlocked_at || null,
    }));
  }, [achievementRows]);

  const recentXp = useMemo<XpTransactionData[]>(() => {
    return xpRows.map((t: any) => ({
      id: t.id, amount: t.amount, reason: t.reason, createdAt: t.created_at,
    }));
  }, [xpRows]);

  const stats = useMemo<StatsData | null>(() => {
    if (statsRows.length === 0) return null;
    const r = statsRows[0] as any;
    return {
      totalWorkouts: r.total_workouts || 0, totalFoodEntries: r.total_food_entries || 0,
      totalMeasurements: r.total_measurements || 0, totalPRs: r.total_prs || 0,
      bossFightsWon: r.boss_fights_won || 0,
    };
  }, [statsRows]);

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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(d) }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    );
  }

  const morphoKey = morphoProfile?.morphotypeScore?.globalType || morphoProfile?.primaryMorphotype || '';
  const morphoInfo = morphotypeInfo[morphoKey] || morphotypeInfo.longiligne;

  const handleTabChange = (newTab: number) => {
    triggerHaptic('light');
    setTab(newTab);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(d) }}>

      {/* ── Header compact ── */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{
            width: 52, height: 52,
            bgcolor: d ? '#1e1c16' : '#f0ece4',
            color: GOLD, fontSize: '1.2rem', fontWeight: 700,
            border: `2px solid ${GOLD}`,
            boxShadow: `0 0 20px ${alpha(GOLD, 0.2)}`,
          }}>
            {(profile?.displayName || 'G')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: tc.h(d) }}>
              {profile?.displayName || 'Guerrier'}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label={`Niv. ${gamification?.currentLevel ?? 1}`} size="small" sx={{
                bgcolor: GOLD, color: '#1a1a1a', fontWeight: 700, fontSize: '0.6rem', height: 20,
              }} />
              <Stack direction="row" alignItems="center" spacing={0.3}>
                <Lightning size={14} weight={W} color={GOLD} />
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>
                  {(gamification?.totalXp ?? 0).toLocaleString()} XP
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <Box
            onClick={() => handleTabChange(3)}
            sx={{ cursor: 'pointer', p: 0.5, color: tc.f(d), display: 'flex', '&:active': { opacity: 0.5 } }}
          >
            <GearSix size={22} weight={W} />
          </Box>
        </Stack>

        {/* XP bar */}
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress variant="determinate" value={gamification?.xpProgress ?? 0} sx={{
            height: 4, borderRadius: 2,
            bgcolor: d ? alpha('#fff', 0.06) : alpha('#000', 0.05),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
              borderRadius: 2,
            },
          }} />
          <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), mt: 0.3, textAlign: 'right' }}>
            {gamification?.xpProgress ?? 0}% vers niv. {(gamification?.currentLevel ?? 1) + 1}
          </Typography>
        </Box>
      </Box>

      {/* ── Streak + Morpho row ── */}
      <Stack direction="row" spacing={1} sx={{ px: 2.5, mt: 0.5 }}>
        <Box sx={card(d, { flex: 1, p: 1.5 })}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Flame size={24} weight={W} color="#ff9800" />
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tc.h(d), lineHeight: 1 }}>
                {gamification?.currentStreak ?? 0}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>jours streak</Typography>
            </Box>
          </Stack>
        </Box>
        <Box
          component={Link}
          href="/morphology"
          sx={card(d, {
            flex: 1.5, p: 1.5, cursor: 'pointer', textDecoration: 'none',
            borderColor: alpha(GOLD, 0.2),
            '&:active': { transform: 'scale(0.98)' },
            transition: 'transform 0.1s ease',
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              bgcolor: alpha(GOLD, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {morphoProfile
                ? <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: GOLD }}>{morphoInfo.abbr}</Typography>
                : <PersonArmsSpread size={20} weight={W} color={GOLD} />}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tc.h(d) }}>
                {morphoProfile ? morphoInfo.title : 'Morphotype'}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>
                {morphoProfile ? 'Mon morphotype' : 'Découvrir'}
              </Typography>
            </Box>
            <CaretRight size={16} weight="bold" color={tc.f(d)} />
          </Stack>
        </Box>
      </Stack>

      {/* ── Actions grid 2x2 ── */}
      <Box sx={{ px: 2.5, mt: 2.5 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
          Actions rapides
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {[
            { Icon: Barbell, label: 'Training', sub: stats ? `${stats.totalWorkouts} séances` : '0 séance', href: '/workout', accent: '#ff9800' },
            { Icon: BowlSteam, label: 'Journal', sub: stats ? `${stats.totalFoodEntries} repas` : '0 repas', href: '/diet', accent: '#4caf50' },
            { Icon: Ruler, label: 'Mesures', sub: stats ? `${stats.totalMeasurements} prises` : '0 prise', href: '/measurements', accent: '#2196f3' },
            { Icon: PersonArmsSpread, label: 'Morpho', sub: morphoProfile ? morphoInfo.title : 'Analyser', href: '/morphology', accent: '#9c27b0' },
          ].map((item) => (
            <Box
              key={item.label}
              component={Link}
              href={item.href}
              sx={card(d, {
                p: 2, cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.15s ease',
                '&:active': { transform: 'scale(0.96)', bgcolor: d ? alpha('#fff', 0.1) : alpha('#000', 0.03) },
              })}
            >
              <Box sx={{ mb: 1.5, display: 'flex' }}>
                <item.Icon size={30} weight={W} color={item.accent} />
              </Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: tc.h(d) }}>{item.label}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mt: 0.2 }}>{item.sub}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ px: 2.5, mt: 2.5 }}>
        <Stack direction="row" spacing={0}>
          {['En bref', 'Succès', 'XP', 'Param.'].map((label, i) => (
            <Box
              key={label}
              onClick={() => handleTabChange(i)}
              sx={{
                flex: 1, py: 1, textAlign: 'center', cursor: 'pointer',
                borderBottom: tab === i ? `2px solid ${GOLD}` : `1px solid ${d ? alpha('#fff', 0.06) : alpha('#000', 0.06)}`,
                transition: 'all 0.15s ease',
                '&:active': { opacity: 0.5 },
              }}
            >
              <Typography sx={{
                fontSize: '0.8rem', fontWeight: tab === i ? 700 : 400,
                color: tab === i ? tc.h(d) : tc.f(d),
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Tab content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pt: 2, pb: 12 }}>
        {tab === 0 && <OverviewTab stats={stats} unlockedAchievements={achievements.filter((a) => a.unlockedAt)} totalCount={achievements.length} d={d} />}
        {tab === 1 && <AchievementsTab achievements={achievements} d={d} />}
        {tab === 2 && <HistoryTab transactions={recentXp} d={d} />}
        {tab === 3 && <SettingsTab />}
      </Box>

      <BottomNav />
    </Box>
  );
}

/* ── Overview tab (mini stats + recent achievements) ── */
function OverviewTab({ stats, unlockedAchievements, totalCount, d }: {
  stats: StatsData | null; unlockedAchievements: AchievementData[]; totalCount: number; d: boolean;
}) {
  if (!stats) return null;

  return (
    <Stack spacing={2.5}>
      {/* Mini stats row */}
      <Stack direction="row" spacing={1}>
        {[
          { val: stats.totalPRs, label: 'PRs', Icon: Trophy },
          { val: stats.bossFightsWon, label: 'Boss', Icon: ShieldCheck },
          { val: `${unlockedAchievements.length}/${totalCount}`, label: 'Succès', Icon: Star },
          { val: stats.totalWorkouts, label: 'Séances', Icon: Barbell },
        ].map((s) => (
          <Box key={s.label} sx={card(d, { flex: 1, py: 1.5, textAlign: 'center' })}>
            <Box sx={{ mb: 0.3, display: 'flex', justifyContent: 'center', color: GOLD }}>
              <s.Icon size={18} weight={W} />
            </Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d), lineHeight: 1 }}>{s.val}</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tc.f(d), mt: 0.3 }}>{s.label}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Recent achievements */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
          Derniers succès
        </Typography>
        {unlockedAchievements.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Star size={32} weight={W} color={tc.f(d)} />
            <Typography sx={{ fontSize: '0.8rem', color: tc.f(d), mt: 1 }}>
              Aucun succès débloqué pour l&apos;instant
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {unlockedAchievements
              .slice(0, 3)
              .map((a) => (
                <Box key={a.id} sx={card(d, { p: 1.5 })}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '8px',
                      bgcolor: alpha(GOLD, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: GOLD,
                    }}>
                      <Star size={16} weight={W} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(d) }}>{a.nameFr}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>{a.descriptionFr}</Typography>
                    </Box>
                    <Chip label={`+${a.xpReward}`} size="small" sx={{ bgcolor: alpha(GOLD, 0.1), color: GOLD, fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                  </Stack>
                </Box>
              ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

/* ── Achievements tab ── */
const categoryColors: Record<string, string> = {
  training: '#ff9800',
  consistency: '#f59e0b',
  nutrition: '#4caf50',
  measurements: '#2196f3',
};

const CATEGORIES = ['training', 'consistency', 'nutrition', 'measurements'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  training: 'Entraînement',
  consistency: 'Régularité',
  nutrition: 'Nutrition',
  measurements: 'Mensurations',
};

function AchievementsTab({ achievements, d }: { achievements: AchievementData[]; d: boolean }) {

  return (
    <Stack spacing={3}>
      {CATEGORIES.map((category) => {
        const catAch = achievements.filter((a) => a.category === category);
        if (catAch.length === 0) return null;

        return (
          <Box key={category}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: categoryColors[category] || GOLD }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {CATEGORY_LABELS[category]}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {catAch.map((a) => {
                const unlocked = !!a.unlockedAt;
                const secret = a.isSecret && !unlocked;
                return (
                  <Box
                    key={a.id}
                    sx={card(d, {
                      p: 1.5,
                      opacity: unlocked ? 1 : 0.6,
                      ...(unlocked && {
                        borderColor: alpha(GOLD, 0.3),
                        bgcolor: d ? alpha(GOLD, 0.06) : alpha(GOLD, 0.04),
                      }),
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '10px',
                        bgcolor: unlocked ? alpha(GOLD, 0.12) : (d ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: unlocked ? GOLD : tc.f(d),
                      }}>
                        {secret ? <Lock size={18} weight={W} /> : <Star size={18} weight={W} />}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d) }}>
                          {secret ? '???' : a.nameFr}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>
                          {secret ? 'Succès secret' : a.descriptionFr}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`+${a.xpReward}`}
                          size="small"
                          sx={unlocked
                            ? { bgcolor: alpha(GOLD, 0.1), color: GOLD, fontWeight: 700, fontSize: '0.6rem', height: 20 }
                            : { bgcolor: d ? alpha('#fff', 0.06) : alpha('#000', 0.04), color: tc.f(d), fontSize: '0.6rem', height: 20 }
                          }
                        />
                        {unlocked && (
                          <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), mt: 0.3 }}>
                            {new Date(a.unlockedAt!).toLocaleDateString('fr-FR')}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

/* ── XP History tab ── */
function HistoryTab({ transactions, d }: { transactions: XpTransactionData[]; d: boolean }) {
  return (
    <Box>
      {transactions.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <TrendUp size={36} weight={W} color={tc.f(d)} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.m(d), mt: 1, mb: 0.5 }}>
            Pas encore d&apos;XP
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: tc.f(d) }}>
            Commence à t&apos;entraîner pour gagner de l&apos;XP !
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {transactions.map((tx) => (
            <Box key={tx.id} sx={card(d, { p: 1.5 })}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(d) }}>{tx.reason}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: tc.f(d) }}>
                    {new Date(tx.createdAt as string).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Typography>
                </Box>
                <Chip
                  label={`${tx.amount > 0 ? '+' : ''}${tx.amount} XP`}
                  size="small"
                  sx={tx.amount > 0
                    ? { bgcolor: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600, fontSize: '0.6rem', height: 20 }
                    : { bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600, fontSize: '0.6rem', height: 20 }
                  }
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const GOLD_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
};

const THEME_OPTIONS = [
  { value: 'system', label: 'Système', desc: 'Suit les préférences de ton appareil', Icon: Monitor },
  { value: 'light', label: 'Clair', desc: 'Thème lumineux', Icon: Sun },
  { value: 'dark', label: 'Sombre', desc: 'Thème sombre pour les yeux', Icon: Moon },
];

/* ── Settings tab ── */
function SettingsTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
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
    const params = new URLSearchParams(window.location.search);
    const huaweiStatus = params.get('huawei');
    if (huaweiStatus === 'success') {
      setSnackbar({ open: true, message: 'Huawei Health connecté !', severity: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
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
        <CircularProgress size={32} sx={{ color: GOLD }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Theme */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), mb: 1.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Apparence
        </Typography>
        <Stack spacing={0.75}>
          {THEME_OPTIONS.map((option) => {
            const sel = theme === option.value;
            return (
              <Box
                key={option.value}
                onClick={() => setTheme(option.value)}
                sx={card(d, {
                  p: 0, overflow: 'hidden', cursor: 'pointer',
                  borderColor: sel ? GOLD : undefined,
                  transition: 'all 0.2s ease',
                })}
              >
                <Stack direction="row" alignItems="stretch">
                  <Box sx={{
                    width: 4,
                    bgcolor: sel ? GOLD : 'transparent',
                    borderRadius: '4px 0 0 4px',
                    transition: 'background-color 0.2s ease',
                  }} />
                  <Box sx={{ py: 1.5, px: 2, flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ display: 'flex', color: sel ? GOLD : tc.f(d) }}>
                        <option.Icon size={22} weight={W} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: sel ? GOLD : tc.h(d) }}>
                          {option.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>{option.desc}</Typography>
                      </Box>
                      {sel && <Check size={18} weight="bold" color={GOLD} />}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
        {theme === 'system' && (
          <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mt: 1.5 }}>
            Mode actuel : {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
          </Typography>
        )}
      </Box>

      {/* Gemini API Key */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), mb: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Reconnaissance IA
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mb: 1.5 }}>
          Clé API Google Gemini pour la reconnaissance photo.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small" fullWidth placeholder="AIza..."
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={!apiKeyLoaded}
            sx={GOLD_FIELD_SX}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Key size={16} weight={W} color={tc.f(d)} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)} edge="end">
                      {showApiKey ? <EyeSlash size={16} weight={W} /> : <Eye size={16} weight={W} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained" size="small"
            onClick={handleSaveApiKey}
            disabled={savingKey || !apiKey.trim()}
            sx={{
              textTransform: 'none', minWidth: 'auto', px: 2,
              bgcolor: GOLD, color: '#1a1a1a', fontWeight: 600,
              '&:hover': { bgcolor: GOLD_LIGHT },
              '&.Mui-disabled': { bgcolor: alpha(GOLD, 0.3), color: alpha('#1a1a1a', 0.4) },
            }}
          >
            {savingKey ? <CircularProgress size={18} sx={{ color: '#1a1a1a' }} /> : 'OK'}
          </Button>
        </Stack>
        <Button
          component="a" href="https://aistudio.google.com/apikey"
          target="_blank" rel="noopener noreferrer" size="small"
          sx={{ textTransform: 'none', mt: 1, fontWeight: 600, fontSize: '0.75rem', color: GOLD }}
        >
          Obtenir une clé gratuite ›
        </Button>
      </Box>

      {/* Huawei Health */}
      <Box sx={card(d, { p: 2 })}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Watch size={20} weight={W} color={GOLD} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Huawei Health
          </Typography>
          {huaweiCreds?.isConnected && (
            <Chip label="Connecté" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem' }} />
          )}
        </Stack>
        <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mb: 1.5 }}>
          Connecte ta montre Huawei pour synchroniser tes séances cardio.
        </Typography>

        <Stack spacing={1.5}>
          <TextField size="small" fullWidth label="Client ID" placeholder="1234567890"
            value={hwClientId} onChange={(e) => setHwClientId(e.target.value)} sx={GOLD_FIELD_SX} />
          <TextField size="small" fullWidth label="Client Secret"
            type={showHwSecret ? 'text' : 'password'}
            value={hwClientSecret} onChange={(e) => setHwClientSecret(e.target.value)} sx={GOLD_FIELD_SX}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowHwSecret(!showHwSecret)} edge="end">
                      {showHwSecret ? <EyeSlash size={16} weight={W} /> : <Eye size={16} weight={W} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined" size="small"
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
              sx={{ textTransform: 'none', flex: 1, borderColor: alpha(GOLD, 0.3), color: GOLD, '&:hover': { borderColor: GOLD, bgcolor: alpha(GOLD, 0.05) } }}
            >
              {savingHw ? <CircularProgress size={18} sx={{ color: GOLD }} /> : 'Sauvegarder'}
            </Button>

            {huaweiCreds?.isConnected ? (
              <>
                <Button
                  variant="contained" size="small"
                  startIcon={syncingHw ? <CircularProgress size={16} sx={{ color: '#1a1a1a' }} /> : <ArrowsClockwise size={16} weight={W} />}
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
                  sx={{ textTransform: 'none', flex: 1, bgcolor: GOLD, color: '#1a1a1a', '&:hover': { bgcolor: GOLD_LIGHT } }}
                >
                  Sync
                </Button>
                <IconButton size="small"
                  onClick={async () => {
                    await disconnectHuawei();
                    setHuaweiCreds((prev) => prev ? { ...prev, isConnected: false, tokenExpiresAt: null } : prev);
                    setSnackbar({ open: true, message: 'Huawei déconnecté', severity: 'success' });
                  }}
                  sx={{ color: '#ef4444' }}
                >
                  <LinkBreak size={18} weight={W} />
                </IconButton>
              </>
            ) : (
              <Button
                variant="contained" size="small"
                startIcon={<LinkSimple size={16} weight={W} />}
                onClick={() => {
                  if (!hwClientId.trim() || !hwClientSecret.trim()) {
                    setSnackbar({ open: true, message: 'Sauvegarde d\'abord tes credentials', severity: 'error' });
                    return;
                  }
                  window.location.href = '/api/huawei/auth';
                }}
                disabled={!huaweiCreds?.clientId}
                sx={{ textTransform: 'none', flex: 1, bgcolor: GOLD, color: '#1a1a1a', '&:hover': { bgcolor: GOLD_LIGHT } }}
              >
                Connecter
              </Button>
            )}
          </Stack>
        </Stack>

        <Button
          component="a" href="https://developer.huawei.com/consumer/en/service/josp/agc/index.html"
          target="_blank" rel="noopener noreferrer" size="small"
          sx={{ textTransform: 'none', mt: 1, fontWeight: 600, fontSize: '0.75rem', color: GOLD }}
        >
          Huawei Developer Console ›
        </Button>
      </Box>

      {/* About */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), mb: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          À propos
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: tc.f(d) }}>Workout App v1.0.0</Typography>
      </Box>

      {/* Logout */}
      <Button
        variant="outlined" fullWidth
        startIcon={<SignOut size={18} weight={W} />}
        onClick={() => logout()}
        sx={{
          textTransform: 'none',
          borderColor: alpha('#ef4444', 0.3), color: '#ef4444',
          borderRadius: '14px', py: 1.2,
          '&:hover': { borderColor: '#ef4444', bgcolor: alpha('#ef4444', 0.05) },
        }}
      >
        Se déconnecter
      </Button>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
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
