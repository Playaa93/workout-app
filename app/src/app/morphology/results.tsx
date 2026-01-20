'use client';

import Link from 'next/link';
import { type MorphotypeResult } from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

type Props = {
  result: MorphotypeResult;
  onRetake: () => void;
};

const morphotypeInfo: Record<
  string,
  { emoji: string; title: string; description: string; gradient: string }
> = {
  ectomorph: {
    emoji: '🦒',
    title: 'Ectomorphe',
    description:
      'Silhouette longiligne, métabolisme rapide. Tu as naturellement du mal à prendre du poids, mais tu gardes facilement une définition musculaire.',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  },
  mesomorph: {
    emoji: '🦁',
    title: 'Mésomorphe',
    description:
      'Le morphotype athlétique par excellence. Tu prends du muscle facilement et tu as une bonne force naturelle.',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  },
  endomorph: {
    emoji: '🐻',
    title: 'Endomorphe',
    description:
      'Silhouette plus large, métabolisme lent. Tu as une grande force naturelle et tu prends du muscle facilement, mais le cardio est ton ami.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
  },
};

export function Results({ result, onRetake }: Props) {
  const primary = morphotypeInfo[result.primary];
  const secondary = result.secondary ? morphotypeInfo[result.secondary] : null;

  const total = result.scores.ecto + result.scores.meso + result.scores.endo;
  const percentages = {
    ecto: total > 0 ? Math.round((result.scores.ecto / total) * 100) : 33,
    meso: total > 0 ? Math.round((result.scores.meso / total) * 100) : 33,
    endo: total > 0 ? Math.round((result.scores.endo / total) * 100) : 34,
  };

  return (
    <Stack spacing={3}>
      {/* Main Result Card */}
      <Card
        sx={{
          background: primary.gradient,
          color: 'white',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h2">{primary.emoji}</Typography>
            <Box>
              <Typography variant="h5" fontWeight={700}>{primary.title}</Typography>
              {secondary && (
                <Typography sx={{ opacity: 0.85 }}>
                  avec tendance {secondary.title.toLowerCase()}
                </Typography>
              )}
            </Box>
          </Stack>
          <Typography sx={{ opacity: 0.9, lineHeight: 1.7 }}>{primary.description}</Typography>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Répartition</Typography>
          <Stack spacing={2}>
            <ScoreBar label="Ectomorphe" value={percentages.ecto} color="#3b82f6" />
            <ScoreBar label="Mésomorphe" value={percentages.meso} color="#f59e0b" />
            <ScoreBar label="Endomorphe" value={percentages.endo} color="#10b981" />
          </Stack>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">💪</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Tes points forts</Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {result.strengths.map((strength) => (
              <Chip
                key={strength}
                label={strength}
                size="small"
                sx={{
                  bgcolor: 'rgba(16,185,129,0.15)',
                  color: 'success.main',
                  border: 1,
                  borderColor: 'success.main',
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">🎯</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Points à travailler</Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {result.weaknesses.map((weakness) => (
              <Chip
                key={weakness}
                label={weakness}
                size="small"
                sx={{
                  bgcolor: 'rgba(249,115,22,0.15)',
                  color: 'warning.main',
                  border: 1,
                  borderColor: 'warning.main',
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Recommended Exercises */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">✅</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Exercices recommandés</Typography>
          </Stack>
          <Stack spacing={1}>
            {result.recommendedExercises.map((exercise) => (
              <Stack key={exercise} direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">{exercise}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Exercises to Avoid */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">⚠️</Typography>
            <Typography variant="subtitle1" fontWeight={600}>À éviter</Typography>
          </Stack>
          <Stack spacing={1}>
            {result.exercisesToAvoid.map((exercise) => (
              <Stack key={exercise} direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{exercise}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
        <Button
          component={Link}
          href="/"
          variant="contained"
          size="large"
          sx={{
            flex: 1,
            py: 1.5,
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
            },
          }}
        >
          Commencer à s&apos;entraîner
        </Button>
        <Button
          variant="outlined"
          onClick={onRetake}
          sx={{ py: 1.5, px: 3 }}
        >
          Refaire
        </Button>
      </Stack>
    </Stack>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2">{value}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
}
