'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useBackHandler, dismissAllOverlays } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeTokens } from '@/hooks/useDark';
import { useAuth } from '@/powersync/auth-context';
import { useCardioSession, useCardioIntervals } from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import type { CardioActivity } from '@/db/schema';
import { CARDIO_ACTIVITIES, formatPace, formatDistance, calculatePace } from '@/lib/cardio-utils';
import { GOLD, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, dialogPaperSx, goldBtnSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { ArrowLeft } from '@phosphor-icons/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Link from 'next/link';

function CardioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();

  // PowerSync reactive queries
  const { data: sessionRows, isLoading: sessionLoading } = useCardioSession(sessionId);
  const { data: intervalRows, isLoading: intervalsLoading } = useCardioIntervals(sessionId);

  // Map session row
  const session = useMemo(() => {
    const s = sessionRows?.[0];
    if (!s || !s.started_at) return null;
    return {
      id: s.id,
      cardioActivity: (s.cardio_activity || 'other') as CardioActivity,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    };
  }, [sessionRows]);

  // Map interval rows
  const intervals = useMemo(() => {
    if (!intervalRows) return [];
    return intervalRows.map((i) => ({
      id: i.id,
      intervalNumber: i.interval_number || 0,
      durationSeconds: i.duration_seconds || 0,
      distanceMeters: i.distance_meters || '0',
      paceSecondsPerKm: i.pace_seconds_per_km || 0,
      heartRate: i.heart_rate || 0,
    }));
  }, [intervalRows]);

  const isLoading = sessionLoading || intervalsLoading;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0); // in km (display unit)
  const [avgHr, setAvgHr] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useBackHandler(showEndConfirm, () => setShowEndConfirm(false), 'cardio-end');

  // Split tracking
  const [splitStartTime, setSplitStartTime] = useState(0); // seconds at split start
  const [splitStartDistance, setSplitStartDistance] = useState(0); // km at split start

  // Restore split tracking state from intervals
  useEffect(() => {
    if (intervals.length > 0) {
      const totalSplitDuration = intervals.reduce((sum, i) => sum + (i.durationSeconds || 0), 0);
      const totalSplitDistance = intervals.reduce((sum, i) => sum + parseFloat(i.distanceMeters || '0'), 0);
      setSplitStartTime(totalSplitDuration);
      setSplitStartDistance(totalSplitDistance / 1000);
    }
  }, [intervals]);

  // Elapsed time counter
  useEffect(() => {
    if (!session?.startedAt) return;
    const startTime = new Date(session.startedAt).getTime();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Live pace calculation
  const distanceMeters = distance * 1000;
  const livePace = distanceMeters > 0 ? calculatePace(elapsedSeconds, distanceMeters) : 0;

  const handleDistanceChange = (delta: number) => {
    setDistance((prev) => Math.max(0, +(prev + delta).toFixed(1)));
  };

  const handleAddSplit = async () => {
    if (!sessionId || !session) return;

    const splitDuration = elapsedSeconds - splitStartTime;
    const splitDistance = distance - splitStartDistance;
    const splitDistanceMeters = splitDistance * 1000;
    const splitPace = splitDistanceMeters > 0
      ? calculatePace(splitDuration, splitDistanceMeters)
      : 0;

    const intervalNumber = intervals.length + 1;

    await mutations.addCardioInterval(sessionId, {
      intervalNumber,
      durationSeconds: splitDuration,
      distanceMeters: splitDistanceMeters,
      paceSecondsPerKm: splitPace,
      heartRate: avgHr || undefined,
    });

    setSplitStartTime(elapsedSeconds);
    setSplitStartDistance(distance);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      const result = await mutations.endCardioSession(sessionId, {
        distanceMeters: distanceMeters,
        avgHeartRate: avgHr || undefined,
        perceivedDifficulty: undefined,
      });
      dismissAllOverlays();
      const activity = session?.cardioActivity || 'other';
      router.push(
        `/workout/summary?sessionId=${sessionId}&type=cardio&activity=${activity}&duration=${result.duration}&distance=${result.distanceMeters}&pace=${result.avgPaceSecondsPerKm}&calories=${result.caloriesBurned}&xp=${result.xpEarned}`
      );
    } catch (error) {
      console.error('Error ending cardio session:', error);
      setIsEnding(false);
    }
  };

  if (!sessionId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(t) }}>
        <Typography sx={{ color: tc.m(t) }}>Session invalide</Typography>
      </Box>
    );
  }

  if (isLoading || !session) {
    return <FullScreenLoader />;
  }

  const activityInfo = CARDIO_ACTIVITIES[session.cardioActivity];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(t) }}>
      {/* Header */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderBottom: '1px solid',
          borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: panelBg(t),
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton component={Link} href="/workout" size="small" sx={{ color: tc.m(t) }}>
              <ArrowLeft size={20} weight={W} />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(t) }}>
              {activityInfo.emoji} {activityInfo.label}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowEndConfirm(true)}
            sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: 'error.light', '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' }, boxShadow: 'none' }}
          >
            Terminer
          </Button>
        </Stack>
      </Box>

      {/* Main Timer */}
      <Box sx={{ textAlign: 'center', pt: 5, pb: 3 }}>
        <Typography
          sx={{
            fontSize: '4rem',
            fontWeight: 200,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em',
            color: GOLD,
          }}
        >
          {formatTime(elapsedSeconds)}
        </Typography>
      </Box>

      {/* Live Stats */}
      <Box
        sx={{
          mx: 2.5,
          ...card(t, { overflow: 'hidden' }),
        }}
      >
        <Stack direction="row" spacing={0}>
          <Box sx={{ flex: 1, py: 1.5, textAlign: 'center', borderRight: '1px solid', borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: tc.h(t) }}>
              {distance > 0 ? formatDistance(distanceMeters) : '\u2014'}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
              Distance
            </Typography>
          </Box>
          <Box sx={{ flex: 1, py: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: tc.h(t) }}>
              {livePace > 0 ? formatPace(livePace) : '\u2014'}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
              Allure
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Distance Input */}
      <Box sx={{ px: 2.5, mt: 3 }}>
        <Box sx={card(t, { p: 2 })}>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 1.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: tc.m(t) }}>
            Distance (km)
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <Typography
              onClick={() => handleDistanceChange(-1)}
              sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              −1
            </Typography>
            <Typography
              onClick={() => handleDistanceChange(-0.1)}
              sx={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              −0.1
            </Typography>
            <Typography
              sx={{ fontSize: '2.5rem', fontWeight: 600, minWidth: 80, textAlign: 'center', color: tc.h(t) }}
            >
              {distance.toFixed(1)}
            </Typography>
            <Typography
              onClick={() => handleDistanceChange(0.1)}
              sx={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              +0.1
            </Typography>
            <Typography
              onClick={() => handleDistanceChange(1)}
              sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              +1
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Heart Rate (optional) */}
      <Box sx={{ px: 2.5, mt: 2 }}>
        <Box sx={card(t, { p: 2 })}>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 1.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: tc.m(t) }}>
            FC moy (bpm) — optionnel
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <Typography
              onClick={() => setAvgHr((prev) => Math.max(0, prev - 5))}
              sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              −5
            </Typography>
            <Typography
              sx={{ fontSize: '2rem', fontWeight: 600, minWidth: 60, textAlign: 'center', color: avgHr > 0 ? tc.h(t) : tc.f(t) }}
            >
              {avgHr > 0 ? avgHr : '\u2014'}
            </Typography>
            <Typography
              onClick={() => setAvgHr((prev) => Math.min(220, prev + 5))}
              sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 }, color: tc.h(t) }}
            >
              +5
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Splits */}
      <Box sx={{ px: 2.5, mt: 3, flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: tc.m(t) }}>
            Splits
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={handleAddSplit}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: tc.h(t), fontSize: '0.75rem' }}
          >
            + Split
          </Button>
        </Stack>

        {intervals.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: tc.f(t) }}>
            Appuie sur &quot;Split&quot; pour enregistrer un intervalle
          </Typography>
        ) : (
          <Box sx={card(t)}>
            <Stack>
              {intervals.map((interval, idx) => (
                <Box key={interval.id} sx={{ px: 2, py: 1.5, ...(idx > 0 ? { borderTop: '1px solid', borderColor: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' } : {}) }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: tc.h(t) }}>
                      Split {interval.intervalNumber}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {interval.distanceMeters && parseFloat(interval.distanceMeters) > 0 && (
                        <Typography variant="body2" sx={{ color: tc.m(t) }}>
                          {formatDistance(parseFloat(interval.distanceMeters))}
                        </Typography>
                      )}
                      {interval.paceSecondsPerKm && interval.paceSecondsPerKm > 0 && (
                        <Typography variant="body2" sx={{ color: tc.m(t) }}>
                          {formatPace(interval.paceSecondsPerKm)}
                        </Typography>
                      )}
                      {interval.durationSeconds && (
                        <Typography variant="body2" sx={{ color: tc.f(t) }}>
                          {formatTime(interval.durationSeconds)}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* End Session CTA */}
      <Box sx={{ p: 2.5, pb: 4 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => setShowEndConfirm(true)}
          sx={{
            py: 2,
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD} 100%)`,
            color: GOLD_CONTRAST,
            boxShadow: `0 4px 20px rgba(212, 175, 55, 0.4)`,
            '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, #c9a432 100%)` },
          }}
        >
          Terminer la séance
        </Button>
      </Box>

      {/* End Confirmation Dialog */}
      <Dialog
        open={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { ...dialogPaperSx(t), backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: tc.h(t) }}>Terminer la séance cardio ?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: tc.m(t) }}>
            {formatTime(elapsedSeconds)} — {distance > 0 ? formatDistance(distanceMeters) : 'Aucune distance'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowEndConfirm(false)}
            variant="outlined"
            sx={{ borderColor: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: tc.h(t) }}
          >
            Continuer
          </Button>
          <Button
            onClick={handleEndSession}
            disabled={isEnding}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD} 100%)`,
              color: GOLD_CONTRAST,
              '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, #c9a432 100%)` },
            }}
          >
            {isEnding ? 'Fin...' : 'Terminer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function CardioPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return <FullScreenLoader />;
  }
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <CardioContent />
    </Suspense>
  );
}
