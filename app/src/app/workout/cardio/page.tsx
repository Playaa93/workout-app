'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getCardioSession,
  addCardioInterval,
  endCardioSession,
  type CardioSessionData,
} from '../cardio-actions';
import { CARDIO_ACTIVITIES, formatPace, formatDistance, calculatePace } from '@/lib/cardio-utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

function CardioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<CardioSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0); // in km (display unit)
  const [avgHr, setAvgHr] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Split tracking
  const [splitStartTime, setSplitStartTime] = useState(0); // seconds at split start
  const [splitStartDistance, setSplitStartDistance] = useState(0); // km at split start

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    const data = await getCardioSession(sessionId);
    setSession(data);
    if (data?.intervals && data.intervals.length > 0) {
      // Restore split tracking state
      const lastInterval = data.intervals[data.intervals.length - 1];
      const totalSplitDuration = data.intervals.reduce((sum, i) => sum + (i.durationSeconds || 0), 0);
      const totalSplitDistance = data.intervals.reduce((sum, i) => sum + parseFloat(i.distanceMeters || '0'), 0);
      setSplitStartTime(totalSplitDuration);
      setSplitStartDistance(totalSplitDistance / 1000);
    }
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Elapsed time counter
  useEffect(() => {
    if (!session) return;
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

    const intervalNumber = (session.intervals?.length || 0) + 1;

    await addCardioInterval(sessionId, {
      intervalNumber,
      durationSeconds: splitDuration,
      distanceMeters: splitDistanceMeters,
      paceSecondsPerKm: splitPace,
      heartRate: avgHr || undefined,
    });

    setSplitStartTime(elapsedSeconds);
    setSplitStartDistance(distance);
    await loadSession();
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      const result = await endCardioSession(sessionId, {
        distanceMeters: distanceMeters,
        avgHeartRate: avgHr || undefined,
        perceivedDifficulty: undefined,
      });
      const activity = session?.cardioActivity || 'other';
      router.push(
        `/workout/summary?type=cardio&activity=${activity}&duration=${result.duration}&distance=${result.distanceMeters}&pace=${result.avgPaceSecondsPerKm}&calories=${result.caloriesBurned}&xp=${result.xpEarned}`
      );
    } catch (error) {
      console.error('Error ending cardio session:', error);
      setIsEnding(false);
    }
  };

  if (!sessionId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Session invalide</Typography>
      </Box>
    );
  }

  if (isLoading || !session) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  const activityInfo = CARDIO_ACTIVITIES[session.cardioActivity];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2, py: 1.5,
          borderBottom: 1, borderColor: 'divider',
          borderRadius: 0,
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton component={Link} href="/workout" size="small" sx={{ color: 'text.secondary' }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600}>
              {activityInfo.emoji} {activityInfo.label}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setShowEndConfirm(true)}
            sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: 'error.light', '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' } }}
          >
            Terminer
          </Button>
        </Stack>
      </Paper>

      {/* Main Timer */}
      <Box sx={{ textAlign: 'center', pt: 5, pb: 3 }}>
        <Typography
          sx={{
            fontSize: '4rem',
            fontWeight: 200,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          {formatTime(elapsedSeconds)}
        </Typography>
      </Box>

      {/* Live Stats */}
      <Stack
        direction="row"
        spacing={0}
        sx={{
          mx: 2.5,
          bgcolor: 'action.hover',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, py: 1.5, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {distance > 0 ? formatDistance(distanceMeters) : '—'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            Distance
          </Typography>
        </Box>
        <Box sx={{ flex: 1, py: 1.5, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {livePace > 0 ? formatPace(livePace) : '—'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            Allure
          </Typography>
        </Box>
      </Stack>

      {/* Distance Input */}
      <Box sx={{ px: 2.5, mt: 3 }}>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Distance (km)
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
              <Typography
                onClick={() => handleDistanceChange(-1)}
                sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                −1
              </Typography>
              <Typography
                onClick={() => handleDistanceChange(-0.1)}
                sx={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                −0.1
              </Typography>
              <Typography
                sx={{ fontSize: '2.5rem', fontWeight: 600, minWidth: 80, textAlign: 'center', color: 'text.primary' }}
              >
                {distance.toFixed(1)}
              </Typography>
              <Typography
                onClick={() => handleDistanceChange(0.1)}
                sx={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                +0.1
              </Typography>
              <Typography
                onClick={() => handleDistanceChange(1)}
                sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                +1
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Heart Rate (optional) */}
      <Box sx={{ px: 2.5, mt: 2 }}>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FC moy (bpm) — optionnel
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
              <Typography
                onClick={() => setAvgHr((prev) => Math.max(0, prev - 5))}
                sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                −5
              </Typography>
              <Typography
                sx={{ fontSize: '2rem', fontWeight: 600, minWidth: 60, textAlign: 'center', color: avgHr > 0 ? 'text.primary' : 'text.disabled' }}
              >
                {avgHr > 0 ? avgHr : '—'}
              </Typography>
              <Typography
                onClick={() => setAvgHr((prev) => Math.min(220, prev + 5))}
                sx={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 300, opacity: 0.4, userSelect: 'none', '&:active': { opacity: 0.6 } }}
              >
                +5
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Splits */}
      <Box sx={{ px: 2.5, mt: 3, flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Splits
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={handleAddSplit}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'divider', color: 'text.primary', fontSize: '0.75rem' }}
          >
            + Split
          </Button>
        </Stack>

        {session.intervals.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            Appuie sur "Split" pour enregistrer un intervalle
          </Typography>
        ) : (
          <Card>
            <Stack divider={<Divider />}>
              {session.intervals.map((interval) => (
                <Box key={interval.id} sx={{ px: 2, py: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      Split {interval.intervalNumber}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {interval.distanceMeters && parseFloat(interval.distanceMeters) > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          {formatDistance(parseFloat(interval.distanceMeters))}
                        </Typography>
                      )}
                      {interval.paceSecondsPerKm && interval.paceSecondsPerKm > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          {formatPace(interval.paceSecondsPerKm)}
                        </Typography>
                      )}
                      {interval.durationSeconds && (
                        <Typography variant="body2" color="text.disabled">
                          {formatTime(interval.durationSeconds)}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Card>
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
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            boxShadow: '0 4px 20px rgba(103, 80, 164, 0.4)',
          }}
        >
          Terminer la séance
        </Button>
      </Box>

      {/* End Confirmation Dialog */}
      <Dialog open={showEndConfirm} onClose={() => setShowEndConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Terminer la séance cardio ?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {formatTime(elapsedSeconds)} — {distance > 0 ? formatDistance(distanceMeters) : 'Aucune distance'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowEndConfirm(false)} variant="outlined">
            Continuer
          </Button>
          <Button
            onClick={handleEndSession}
            disabled={isEnding}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)' }}
          >
            {isEnding ? 'Fin...' : 'Terminer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function CardioPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      }
    >
      <CardioContent />
    </Suspense>
  );
}
