'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grow from '@mui/material/Grow';
import {
  ClockCounterClockwise,
  House,
  Trophy,
  Barbell,
} from '@phosphor-icons/react';
import { GOLD, GOLD_CONTRAST, GOLD_LIGHT, W, tc, card, surfaceBg } from '@/lib/design-tokens';
import { alpha } from '@mui/material/styles';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity } from '@/db/schema';
import { useDark } from '@/hooks/useDark';
import FullScreenLoader from '@/components/FullScreenLoader';

function SummaryContent() {
  const searchParams = useSearchParams();
  const d = useDark();

  const type = searchParams.get('type') || 'strength';
  const xp = parseInt(searchParams.get('xp') || '0');
  const volume = parseFloat(searchParams.get('volume') || '0');
  const duration = parseInt(searchParams.get('duration') || '0');
  const prs = parseInt(searchParams.get('prs') || '0');

  // Cardio params
  const activity = searchParams.get('activity') as CardioActivity | null;
  const distanceM = parseFloat(searchParams.get('distance') || '0');
  const pace = parseInt(searchParams.get('pace') || '0');
  const calories = parseInt(searchParams.get('calories') || '0');

  const isCardio = type === 'cardio';
  const activityInfo = isCardio && activity ? CARDIO_ACTIVITIES[activity] : null;
  const isEmpty = duration === 0 && volume === 0 && prs === 0;
  const isMinimal = duration > 0 && xp === 0 && volume === 0 && prs === 0;
  const noXpEarned = isEmpty || isMinimal;

  const volumeDisplay = volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: surfaceBg(d),
        textAlign: 'center',
      }}
    >
      {/* Header */}
      <Grow in timeout={500}>
        <Box sx={{ mb: 4 }}>
          {isEmpty ? (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                💤
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(d) }}>
                Séance annulée
              </Typography>
              <Typography sx={{ color: tc.m(d) }}>
                Aucun exercice effectué, pas d&apos;XP cette fois
              </Typography>
            </>
          ) : isMinimal ? (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                🤏
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(d) }}>
                Séance trop courte
              </Typography>
              <Typography sx={{ color: tc.m(d) }}>
                Ajoute des exercices la prochaine fois pour gagner de l&apos;XP
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                {isCardio && activityInfo ? activityInfo.emoji : '🎉'}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(d) }}>
                {isCardio ? 'Séance cardio terminée !' : 'Séance terminée !'}
              </Typography>
              <Typography sx={{ color: tc.m(d) }}>
                Bravo, continue comme ça
              </Typography>
            </>
          )}
        </Box>
      </Grow>

      {noXpEarned ? (
        /* Empty/minimal session: motivational tips */
        <Grow in timeout={700}>
          <Box
            sx={{
              ...card(d),
              mb: 3,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <Box sx={{ py: 3, px: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                <Barbell weight={W} size={22} color={GOLD} />
                <Typography variant="body1" fontWeight={600} sx={{ color: tc.h(d) }}>
                  Pour gagner de l&apos;XP :
                </Typography>
              </Stack>
              <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: tc.m(d) }}>
                  &#x2022; Ajoute au moins 1 exercice et fais une série
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(d) }}>
                  &#x2022; +50 XP de base par séance complétée
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(d) }}>
                  &#x2022; +10 XP par tonne de volume soulevé
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(d) }}>
                  &#x2022; +25 XP par record personnel battu
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Grow>
      ) : (
        <>
          {/* Stats Grid */}
          <Grow in timeout={700}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                width: '100%',
                maxWidth: 360,
                mb: 4,
              }}
            >
              <StatCard icon="⏱️" label="Durée" value={`${duration} min`} />
              {isCardio ? (
                <>
                  <StatCard icon="📏" label="Distance" value={distanceM > 0 ? formatDistance(distanceM) : '—'} />
                  <StatCard icon="🏃" label="Allure moy" value={pace > 0 ? formatPace(pace) : '—'} />
                  <StatCard icon="🔥" label="Calories" value={calories > 0 ? `${calories} kcal` : '—'} />
                </>
              ) : (
                <>
                  <StatCard icon="🏋️" label="Volume" value={volumeDisplay} />
                  <StatCard icon="⭐" label="XP gagné" value={`+${xp}`} highlight />
                  {prs > 0 && (
                    <StatCard icon="🏆" label="Records" value={prs.toString()} highlight />
                  )}
                </>
              )}
            </Box>
          </Grow>

          {/* XP Card (only if XP earned) */}
          {xp > 0 && (
            <Grow in timeout={900}>
              <Box
                sx={{
                  ...card(d, {
                    background: d
                      ? `linear-gradient(135deg, ${alpha(GOLD, 0.18)} 0%, ${alpha(GOLD, 0.08)} 100%)`
                      : `linear-gradient(135deg, ${alpha(GOLD, 0.15)} 0%, ${alpha(GOLD, 0.06)} 100%)`,
                    borderColor: alpha(GOLD, 0.35),
                  }),
                  mb: 3,
                  width: '100%',
                  maxWidth: 360,
                }}
              >
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: GOLD }}>
                    Expérience gagnée
                  </Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: GOLD }}>
                    +{xp} XP
                  </Typography>
                </Box>
              </Box>
            </Grow>
          )}

          {/* PR Celebration (strength only) */}
          {!isCardio && prs > 0 && (
            <Grow in timeout={1100}>
              <Box
                sx={{
                  ...card(d, {
                    background: d
                      ? `linear-gradient(135deg, ${alpha(GOLD_LIGHT, 0.2)} 0%, ${alpha(GOLD, 0.12)} 100%)`
                      : `linear-gradient(135deg, ${alpha(GOLD_LIGHT, 0.25)} 0%, ${alpha(GOLD, 0.15)} 100%)`,
                    borderColor: alpha(GOLD, 0.4),
                  }),
                  mb: 3,
                  width: '100%',
                  maxWidth: 360,
                }}
              >
                <Box sx={{ textAlign: 'center', py: 2.5, px: 2 }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <Trophy weight={W} size={22} color={GOLD} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: GOLD }}>
                      {prs === 1 ? 'Nouveau record personnel !' : `${prs} nouveaux records !`}
                    </Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ mt: 1 }}>🏆🔥</Typography>
                </Box>
              </Box>
            </Grow>
          )}
        </>
      )}

      {/* Actions */}
      <Grow in timeout={noXpEarned ? 900 : 1300}>
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360, mt: noXpEarned ? 1 : 0 }}>
          <Button
            component={Link}
            href="/workout"
            variant="contained"
            size="large"
            startIcon={noXpEarned ? <Barbell weight={W} size={20} /> : <ClockCounterClockwise weight={W} size={20} />}
            sx={{
              py: 1.5,
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              color: GOLD_CONTRAST,
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              },
            }}
          >
            {noXpEarned ? 'Nouvelle séance' : 'Voir l\'historique'}
          </Button>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="large"
            startIcon={<House weight={W} size={20} />}
            sx={{
              py: 1.5,
              borderColor: alpha(GOLD, 0.4),
              color: tc.h(d),
              '&:hover': {
                borderColor: GOLD,
                bgcolor: alpha(GOLD, 0.06),
              },
            }}
          >
            Retour à l&apos;accueil
          </Button>
        </Stack>
      </Grow>
    </Box>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={<FullScreenLoader />}
    >
      <SummaryContent />
    </Suspense>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const dark = useDark();
  return (
    <Box
      sx={{
        ...card(dark, highlight ? {
          background: dark
            ? `${alpha(GOLD, 0.12)}`
            : `${alpha(GOLD, 0.08)}`,
          borderColor: alpha(GOLD, 0.3),
        } : undefined),
      }}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{icon}</Typography>
        <Typography variant="caption" sx={{ color: tc.m(dark) }}>{label}</Typography>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: highlight ? GOLD : tc.h(dark) }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
