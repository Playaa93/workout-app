'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRecentSessions, startWorkoutSession, type WorkoutSession } from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import PlayArrow from '@mui/icons-material/PlayArrow';
import AccessTime from '@mui/icons-material/AccessTime';
import Scale from '@mui/icons-material/Scale';

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getRecentSessions();
      setSessions(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const sessionId = await startWorkoutSession();
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsStarting(false);
    }
  };

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
            Entraînement
          </Typography>
        </Stack>
      </Paper>

      {/* Start Workout Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleStartWorkout}
          disabled={isStarting}
          startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <FitnessCenter />}
          sx={{
            py: 2,
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
            },
          }}
        >
          {isStarting ? 'Démarrage...' : 'Nouvelle séance'}
        </Button>
      </Box>

      {/* Recent Sessions */}
      <Box sx={{ flex: 1, px: 2, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Historique
        </Typography>

        {isLoading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : sessions.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 2 }}>🏃</Typography>
              <Typography color="text.secondary">
                Aucune séance pour l&apos;instant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Commence ta première séance !
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const date = new Date(session.startedAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isComplete = !!session.endedAt;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;

  return (
    <Card>
      {!isComplete ? (
        <CardActionArea component={Link} href={`/workout/active?id=${session.id}`}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                  {formattedDate}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formattedTime}
                </Typography>
              </Box>
              <Chip
                label="En cours"
                size="small"
                sx={{
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  fontWeight: 500,
                }}
              />
            </Stack>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              sx={{ mt: 2 }}
            >
              Reprendre
            </Button>
          </CardContent>
        </CardActionArea>
      ) : (
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                {formattedDate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formattedTime}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Durée</Typography>
                <Typography variant="body2" fontWeight={600}>{session.durationMinutes} min</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Scale sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Volume</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      )}
    </Card>
  );
}
