'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grow from '@mui/material/Grow';
import History from '@mui/icons-material/History';
import Home from '@mui/icons-material/Home';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity } from '@/db/schema';

function SummaryContent() {
  const searchParams = useSearchParams();

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
        bgcolor: 'background.default',
        textAlign: 'center',
      }}
    >
      {/* Celebration */}
      <Grow in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
            {isCardio && activityInfo ? activityInfo.emoji : '🎉'}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {isCardio ? 'Séance cardio terminée !' : 'Séance terminée !'}
          </Typography>
          <Typography color="text.secondary">
            Bravo, continue comme ça
          </Typography>
        </Box>
      </Grow>

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
              <StatCard icon="🔥" label="Calories" value={`${calories} kcal`} />
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

      {/* XP Card */}
      <Grow in timeout={900}>
        <Card
          sx={{
            mb: 3,
            width: '100%',
            maxWidth: 360,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(187,134,252,0.2) 0%, rgba(103,80,164,0.15) 100%)'
              : 'linear-gradient(135deg, rgba(103,80,164,0.15) 0%, rgba(187,134,252,0.1) 100%)',
            border: 1,
            borderColor: 'primary.main',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="primary.main" sx={{ mb: 0.5 }}>
              Expérience gagnée
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              +{xp} XP
            </Typography>
          </CardContent>
        </Card>
      </Grow>

      {/* PR Celebration (strength only) */}
      {!isCardio && prs > 0 && (
        <Grow in timeout={1100}>
          <Card
            sx={{
              mb: 3,
              width: '100%',
              maxWidth: 360,
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,183,77,0.2) 0%, rgba(255,152,0,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(255,183,77,0.25) 0%, rgba(255,152,0,0.2) 100%)',
              border: 1,
              borderColor: 'warning.main',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                <EmojiEvents sx={{ color: 'warning.main' }} />
                <Typography variant="body1" fontWeight={600} color="warning.main">
                  {prs === 1 ? 'Nouveau record personnel !' : `${prs} nouveaux records !`}
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ mt: 1 }}>🏆🔥</Typography>
            </CardContent>
          </Card>
        </Grow>
      )}

      {/* Actions */}
      <Grow in timeout={1300}>
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360 }}>
          <Button
            component={Link}
            href="/workout"
            variant="contained"
            size="large"
            startIcon={<History />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
              },
            }}
          >
            Voir l&apos;historique
          </Button>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="large"
            startIcon={<Home />}
            sx={{ py: 1.5 }}
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
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          <CircularProgress />
        </Box>
      }
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
  return (
    <Card
      sx={{
        ...(highlight && {
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(187,134,252,0.15)'
            : 'rgba(103,80,164,0.1)',
          border: 1,
          borderColor: 'primary.main',
        }),
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{icon}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography
          variant="h5"
          fontWeight={700}
          color={highlight ? 'primary.main' : 'text.primary'}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
