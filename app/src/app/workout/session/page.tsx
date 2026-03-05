'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSessionDetail, type ActiveSession, type WorkoutSet } from '../actions';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity } from '@/db/schema';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import FitnessCenter from '@mui/icons-material/FitnessCenter';

function SessionDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('id');
  const [data, setData] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    getSessionDetail(sessionId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Séance introuvable</Typography>
      </Box>
    );
  }

  const { session, sets } = data;
  const date = new Date(session.startedAt);
  const isCardio = session.sessionType === 'cardio';
  const activityInfo = isCardio && session.cardioActivity
    ? CARDIO_ACTIVITIES[session.cardioActivity as CardioActivity]
    : null;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
  const distanceM = session.distanceMeters ? parseFloat(session.distanceMeters) : 0;
  const mins = session.durationMinutes || 0;

  // Group sets by exercise
  const setsByExercise = new Map<string, WorkoutSet[]>();
  sets.forEach((set) => {
    const existing = setsByExercise.get(set.exerciseId) || [];
    setsByExercise.set(set.exerciseId, [...existing, set]);
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => router.back()} size="small">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isCardio && activityInfo
                ? `${activityInfo.emoji} ${activityInfo.label}`
                : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {mins > 0 && ` · ${mins >= 60 ? `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}` : `${mins}min`}`}
            </Typography>
          </Box>
        </Stack>

        {/* Stats bar */}
        <Card sx={{ mb: 2 }}>
          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
            {isCardio ? (
              <>
                <StatBox label="Distance" value={distanceM > 0 ? formatDistance(distanceM) : '—'} />
                <StatBox label="Allure" value={session.avgPaceSecondsPerKm ? formatPace(session.avgPaceSecondsPerKm) : '—'} />
                <StatBox label="kcal" value={session.caloriesBurned != null ? String(session.caloriesBurned) : '—'} />
              </>
            ) : (
              <>
                <StatBox label="Volume" value={volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`} />
                <StatBox label="Séries" value={String(sets.filter(s => !s.isWarmup).length)} />
                {session.caloriesBurned != null && session.caloriesBurned > 0 && (
                  <StatBox label="kcal" value={String(session.caloriesBurned)} />
                )}
              </>
            )}
          </Stack>
        </Card>
      </Box>

      {/* Exercise details */}
      <Box sx={{ px: 2, pb: 4 }}>
        <Stack spacing={2}>
          {Array.from(setsByExercise.entries()).map(([exerciseId, exSets]) => {
            const exercise = data.exercises.get(exerciseId);
            const workingSets = exSets.filter(s => !s.isWarmup);
            const exVolume = workingSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);

            return (
              <Card key={exerciseId}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FitnessCenter sx={{ fontSize: 18, color: 'text.disabled' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {exercise?.nameFr || exSets[0]?.exerciseName || 'Exercice'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {exVolume > 0 && `${exVolume.toLocaleString()}kg`}
                    </Typography>
                  </Stack>

                  {exSets.map((set) => (
                    <Stack
                      key={set.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 26, height: 26, borderRadius: '50%',
                            bgcolor: 'action.hover',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 500,
                          }}
                        >
                          {set.isWarmup ? 'W' : set.setNumber}
                        </Box>
                        <Typography variant="body2">
                          <Typography component="span" fontWeight={500}>{set.reps}</Typography>
                          <Typography component="span" color="text.secondary" sx={{ mx: 0.5 }}>×</Typography>
                          <Typography component="span" fontWeight={500}>{set.weight}kg</Typography>
                        </Typography>
                        {set.rpe && (
                          <Typography variant="caption" color="text.secondary">RPE {set.rpe}</Typography>
                        )}
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {set.restTaken && (
                          <Typography variant="caption" color="text.disabled">
                            {Math.floor(set.restTaken / 60)}:{(set.restTaken % 60).toString().padStart(2, '0')}
                          </Typography>
                        )}
                        {set.isPr && (
                          <Chip
                            icon={<EmojiEvents sx={{ fontSize: 14 }} />}
                            label="PR"
                            size="small"
                            color="warning"
                            sx={{ height: 22, fontWeight: 600, fontSize: '0.65rem' }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {session.notes && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body2">{session.notes}</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, py: 1.5, textAlign: 'center' }}>
      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function SessionDetailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      }
    >
      <SessionDetailContent />
    </Suspense>
  );
}
