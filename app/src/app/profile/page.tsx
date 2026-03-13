'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useThemeTokens } from '@/hooks/useDark';
import {
  getGroqApiKey,
  saveGroqApiKey,
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
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { logout } from '@/lib/auth-actions';
import { triggerHaptic } from '@/lib/haptic';
import { calculateLevel, xpReasonLabel } from '@/lib/xp-utils';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
import { GOLD, GOLD_LIGHT, tc, card, surfaceBg } from '@/lib/design-tokens';
import { DARK_THEMES, THEME_PRESETS, THEME_FAMILIES, ALL_FAMILY_IDS, type ThemeId } from '@/lib/theme-presets';
import { useThemeFamily, type ThemeMode } from '@/hooks/useThemeFamily';
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
  const { t, d } = useThemeTokens();

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
    return xpRows.map((row: any) => ({
      id: row.id, amount: row.amount, reason: row.reason, createdAt: row.created_at,
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(t) }}>
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(t) }}>

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
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: tc.h(t) }}>
              {profile?.displayName || 'Guerrier'}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label={`Niv. ${gamification?.currentLevel ?? 1}`} size="small" sx={{
                bgcolor: GOLD, color: '#1a1a1a', fontWeight: 700, fontSize: '0.6rem', height: 20,
              }} />
              <Stack direction="row" alignItems="center" spacing={0.3}>
                <Lightning size={14} weight={W} color={GOLD} />
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(t) }}>
                  {(gamification?.totalXp ?? 0).toLocaleString()} XP
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <Box
            onClick={() => handleTabChange(3)}
            sx={{ cursor: 'pointer', p: 0.5, color: tc.f(t), display: 'flex', '&:active': { opacity: 0.5 } }}
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
          <Typography sx={{ fontSize: '0.55rem', color: tc.f(t), mt: 0.3, textAlign: 'right' }}>
            {gamification?.xpProgress ?? 0}% vers niv. {(gamification?.currentLevel ?? 1) + 1}
          </Typography>
        </Box>
      </Box>

      {/* ── Streak + Morpho row ── */}
      <Stack direction="row" spacing={1} sx={{ px: 2.5, mt: 0.5 }}>
        <Box sx={card(t, { flex: 1, p: 1.5 })}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Flame size={24} weight={W} color="#ff9800" />
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tc.h(t), lineHeight: 1 }}>
                {gamification?.currentStreak ?? 0}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(t) }}>jours streak</Typography>
            </Box>
          </Stack>
        </Box>
        <Box
          component={Link}
          href="/morphology"
          sx={card(t, {
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
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tc.h(t) }}>
                {morphoProfile ? morphoInfo.title : 'Morphotype'}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(t) }}>
                {morphoProfile ? 'Mon morphotype' : 'Découvrir'}
              </Typography>
            </Box>
            <CaretRight size={16} weight="bold" color={tc.f(t)} />
          </Stack>
        </Box>
      </Stack>

      {/* ── Actions grid 2x2 ── */}
      <Box sx={{ px: 2.5, mt: 2.5 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
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
              sx={card(t, {
                p: 2, cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.15s ease',
                '&:active': { transform: 'scale(0.96)', bgcolor: d ? alpha('#fff', 0.1) : alpha('#000', 0.03) },
              })}
            >
              <Box sx={{ mb: 1.5, display: 'flex' }}>
                <item.Icon size={30} weight={W} color={item.accent} />
              </Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: tc.h(t) }}>{item.label}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), mt: 0.2 }}>{item.sub}</Typography>
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
                color: tab === i ? tc.h(t) : tc.f(t),
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Tab content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pt: 2, pb: 12 }}>
        {tab === 0 && <OverviewTab stats={stats} unlockedAchievements={achievements.filter((a) => a.unlockedAt)} totalCount={achievements.length} t={t} />}
        {tab === 1 && <AchievementsTab achievements={achievements} t={t} />}
        {tab === 2 && <HistoryTab transactions={recentXp} t={t} />}
        {tab === 3 && <SettingsTab />}
      </Box>

      <BottomNav />
    </Box>
  );
}

/* ── Overview tab (mini stats + recent achievements) ── */
function OverviewTab({ stats, unlockedAchievements, totalCount, t }: {
  stats: StatsData | null; unlockedAchievements: AchievementData[]; totalCount: number; t: ThemeId;
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
          <Box key={s.label} sx={card(t, { flex: 1, py: 1.5, textAlign: 'center' })}>
            <Box sx={{ mb: 0.3, display: 'flex', justifyContent: 'center', color: GOLD }}>
              <s.Icon size={18} weight={W} />
            </Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(t), lineHeight: 1 }}>{s.val}</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tc.f(t), mt: 0.3 }}>{s.label}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Recent achievements */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
          Derniers succès
        </Typography>
        {unlockedAchievements.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Star size={32} weight={W} color={tc.f(t)} />
            <Typography sx={{ fontSize: '0.8rem', color: tc.f(t), mt: 1 }}>
              Aucun succès débloqué pour l&apos;instant
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {unlockedAchievements
              .slice(0, 3)
              .map((a) => (
                <Box key={a.id} sx={card(t, { p: 1.5 })}>
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
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(t) }}>{a.nameFr}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: tc.f(t) }}>{a.descriptionFr}</Typography>
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

function AchievementsTab({ achievements, t }: { achievements: AchievementData[]; t: ThemeId }) {
  const d = DARK_THEMES.has(t);

  return (
    <Stack spacing={3}>
      {CATEGORIES.map((category) => {
        const catAch = achievements.filter((a) => a.category === category);
        if (catAch.length === 0) return null;

        return (
          <Box key={category}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: categoryColors[category] || GOLD }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                    sx={card(t, {
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
                        color: unlocked ? GOLD : tc.f(t),
                      }}>
                        {secret ? <Lock size={18} weight={W} /> : <Star size={18} weight={W} />}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(t) }}>
                          {secret ? '???' : a.nameFr}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
                          {secret ? 'Succès secret' : a.descriptionFr}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`+${a.xpReward}`}
                          size="small"
                          sx={unlocked
                            ? { bgcolor: alpha(GOLD, 0.1), color: GOLD, fontWeight: 700, fontSize: '0.6rem', height: 20 }
                            : { bgcolor: d ? alpha('#fff', 0.06) : alpha('#000', 0.04), color: tc.f(t), fontSize: '0.6rem', height: 20 }
                          }
                        />
                        {unlocked && (
                          <Typography sx={{ fontSize: '0.55rem', color: tc.f(t), mt: 0.3 }}>
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
function HistoryTab({ transactions, t }: { transactions: XpTransactionData[]; t: ThemeId }) {
  return (
    <Box>
      {transactions.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <TrendUp size={36} weight={W} color={tc.f(t)} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.m(t), mt: 1, mb: 0.5 }}>
            Pas encore d&apos;XP
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: tc.f(t) }}>
            Commence à t&apos;entraîner pour gagner de l&apos;XP !
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {transactions.map((tx) => (
            <Box key={tx.id} sx={card(t, { p: 1.5 })}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(t) }}>{xpReasonLabel(tx.reason)}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: tc.f(t) }}>
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

/* ── Settings tab ── */
function SettingsTab() {
  const { family, mode, setFamily, setMode, t, d, mounted } = useThemeFamily();
  const [groqKey, setGroqKey] = useState('');
  const [groqKeyLoaded, setGroqKeyLoaded] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [savingGroqKey, setSavingGroqKey] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    getGroqApiKey().then((key) => {
      if (key) setGroqKey(key);
      setGroqKeyLoaded(true);
    });
  }, []);

  const handleSaveGroqKey = async () => {
    setSavingGroqKey(true);
    try {
      await saveGroqApiKey(groqKey.trim());
      setSnackbar({ open: true, message: 'Clé sauvegardée', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setSavingGroqKey(false);
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
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), mb: 1.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Apparence
        </Typography>

        {/* Mode selector — Système / Jour / Nuit */}
        <Box sx={{
          display: 'flex', borderRadius: '10px', overflow: 'hidden', mb: 1.5,
          border: '1px solid', borderColor: alpha(tc.f(t), 0.12),
          bgcolor: alpha(tc.f(t), 0.04),
        }}>
          {([
            { value: 'system' as ThemeMode, label: 'Auto', Icon: Monitor },
            { value: 'light' as ThemeMode, label: 'Jour', Icon: Sun },
            { value: 'dark' as ThemeMode, label: 'Nuit', Icon: Moon },
          ]).map((opt) => {
            const sel = mode === opt.value;
            return (
              <Box
                key={opt.value}
                onClick={() => { triggerHaptic('light'); setMode(opt.value); }}
                sx={{
                  flex: 1, py: 0.8, cursor: 'pointer', textAlign: 'center',
                  bgcolor: sel ? alpha(GOLD, 0.15) : 'transparent',
                  borderRight: opt.value !== 'dark' ? `1px solid ${alpha(tc.f(t), 0.08)}` : 'none',
                  transition: 'all 0.2s ease',
                  '&:active': { opacity: 0.7 },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <opt.Icon size={14} weight={sel ? 'fill' : W} color={sel ? GOLD : tc.f(t)} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: sel ? 700 : 500, color: sel ? GOLD : tc.m(t) }}>
                    {opt.label}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>

        {/* Palette grid — 4 families, each showing light+dark preview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {ALL_FAMILY_IDS.map((fam) => {
            const def = THEME_FAMILIES[fam];
            const sel = family === fam;
            const lightP = THEME_PRESETS[def.light];
            const darkP = THEME_PRESETS[def.dark];
            return (
              <Box
                key={fam}
                onClick={() => { triggerHaptic('light'); setFamily(fam); }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: sel ? GOLD : alpha(tc.f(t), 0.12),
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {/* Split preview: light | dark side by side */}
                <Box sx={{ display: 'flex', height: 52 }}>
                  {/* Light half */}
                  <Box sx={{
                    flex: 1, bgcolor: lightP.previewBg, position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  }}>
                    <Box sx={{ width: '60%', height: 6, borderRadius: '3px', bgcolor: lightP.previewCard, border: '0.5px solid', borderColor: alpha('#000', 0.06) }} />
                    <Box sx={{ width: '45%', height: 6, borderRadius: '3px', bgcolor: lightP.previewCard, border: '0.5px solid', borderColor: alpha('#000', 0.06) }} />
                    <Box sx={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', bgcolor: GOLD }} />
                  </Box>
                  {/* Divider */}
                  <Box sx={{ width: '1px', bgcolor: alpha(tc.f(t), 0.1) }} />
                  {/* Dark half */}
                  <Box sx={{
                    flex: 1, bgcolor: darkP.previewBg, position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  }}>
                    <Box sx={{ width: '60%', height: 6, borderRadius: '3px', bgcolor: darkP.previewCard }} />
                    <Box sx={{ width: '45%', height: 6, borderRadius: '3px', bgcolor: darkP.previewCard }} />
                    <Box sx={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', bgcolor: GOLD }} />
                  </Box>
                </Box>
                {/* Label */}
                <Box sx={{
                  py: 0.6, textAlign: 'center',
                  bgcolor: sel ? alpha(GOLD, 0.08) : 'transparent',
                  borderTop: '1px solid', borderColor: alpha(tc.f(t), 0.06),
                }}>
                  <Typography sx={{
                    fontSize: '0.7rem', fontWeight: sel ? 700 : 500,
                    color: sel ? GOLD : tc.h(t), lineHeight: 1.2,
                  }}>
                    {def.label}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Intelligence IA */}
      <Box sx={card(t, { p: 2 })}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Lightning size={20} weight={W} color={GOLD} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Intelligence IA
          </Typography>
          {groqKey && (
            <Chip label="Configuré" size="small" sx={{
              height: 20, fontSize: '0.55rem', fontWeight: 600,
              bgcolor: alpha(GOLD, 0.12), color: GOLD, border: 'none',
            }} />
          )}
        </Stack>
        <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), mb: 1.5 }}>
          Clé API Groq pour la reconnaissance photo et l{"'"}estimation nutritionnelle.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small" fullWidth placeholder="gsk_..."
            type={showGroqKey ? 'text' : 'password'}
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            disabled={!groqKeyLoaded}
            sx={GOLD_FIELD_SX}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Key size={16} weight={W} color={tc.f(t)} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowGroqKey(!showGroqKey)} edge="end">
                      {showGroqKey ? <EyeSlash size={14} weight={W} /> : <Eye size={14} weight={W} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained" size="small"
            onClick={handleSaveGroqKey}
            disabled={savingGroqKey || !groqKey.trim()}
            sx={{
              textTransform: 'none', minWidth: 'auto', px: 2,
              bgcolor: GOLD, color: '#1a1a1a', fontWeight: 600,
              '&:hover': { bgcolor: GOLD_LIGHT },
              '&.Mui-disabled': { bgcolor: alpha(GOLD, 0.3), color: alpha('#1a1a1a', 0.4) },
            }}
          >
            {savingGroqKey ? <CircularProgress size={16} sx={{ color: '#1a1a1a' }} /> : 'OK'}
          </Button>
        </Stack>
        <Button
          component="a" href="https://console.groq.com/keys"
          target="_blank" rel="noopener noreferrer" size="small"
          sx={{ textTransform: 'none', mt: 1, fontWeight: 600, fontSize: '0.7rem', color: GOLD }}
        >
          Obtenir une clé gratuite ›
        </Button>
      </Box>

      {/* About */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(t), mb: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          À propos
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: tc.f(t) }}>Workout App v1.0.0</Typography>
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
