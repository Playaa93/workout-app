'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Questionnaire } from './questionnaire';
import { Results } from './results';
import type { MorphoQuestion, MorphotypeResult } from './types';
import { getMorphoQuestions, getMorphoProfile } from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';

type ViewState = 'loading' | 'intro' | 'questionnaire' | 'results';

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

export default function MorphologyPage() {
  const [view, setView] = useState<ViewState>('loading');
  const [questions, setQuestions] = useState<MorphoQuestion[]>([]);
  const [result, setResult] = useState<MorphotypeResult | null>(null);

  useEffect(() => {
    async function init() {
      const existingProfile = await getMorphoProfile();

      if (existingProfile) {
        const scoreData = existingProfile.morphotypeScore as {
          ecto: number;
          meso: number;
          endo: number;
          globalType?: MorphotypeResult['globalType'];
          structure?: MorphotypeResult['structure'];
          proportions?: MorphotypeResult['proportions'];
          mobility?: MorphotypeResult['mobility'];
          insertions?: MorphotypeResult['insertions'];
          metabolism?: MorphotypeResult['metabolism'];
        };

        // If we have the new format with all segments, use it directly
        if (scoreData.structure && scoreData.mobility && scoreData.metabolism) {
          // Recalculate from stored answers to get full recommendations
          const answers = existingProfile.questionnaireResponses as Record<string, string>;
          if (answers && Object.keys(answers).length > 0) {
            const { calculateMorphotype } = await import('./actions');
            const recalculatedResult = await calculateMorphotype(answers);
            setResult(recalculatedResult);
          } else {
            // Build result from stored data
            setResult({
              globalType: scoreData.globalType || 'balanced',
              structure: scoreData.structure,
              proportions: scoreData.proportions || {
                torsoLength: (existingProfile.torsoProportion as 'short' | 'medium' | 'long') || 'medium',
                armLength: (existingProfile.armProportion as 'short' | 'medium' | 'long') || 'medium',
                femurLength: (existingProfile.legProportion as 'short' | 'medium' | 'long') || 'medium',
                kneeValgus: 'none',
              },
              mobility: scoreData.mobility,
              insertions: scoreData.insertions || { biceps: 'medium', calves: 'medium', chest: 'medium' },
              metabolism: scoreData.metabolism,
              squat: { exercise: 'Squat', advantages: [], disadvantages: [], variants: [], tips: [] },
              deadlift: { exercise: 'Soulevé de terre', advantages: [], disadvantages: [], variants: [], tips: [] },
              bench: { exercise: 'Développé couché', advantages: [], disadvantages: [], variants: [], tips: [] },
              curls: { exercise: 'Curls biceps', advantages: [], disadvantages: [], variants: [], tips: [] },
              mobilityWork: [],
              primary: existingProfile.primaryMorphotype as MorphotypeResult['primary'],
              secondary: null,
              scores: { ecto: scoreData.ecto || 0, meso: scoreData.meso || 0, endo: scoreData.endo || 0 },
              strengths: existingProfile.strengths || [],
              weaknesses: existingProfile.weaknesses || [],
              recommendedExercises: existingProfile.recommendedExercises || [],
              exercisesToAvoid: existingProfile.exercisesToAvoid || [],
            });
          }
        } else {
          // Old format - prompt to retake the questionnaire
          const qs = await getMorphoQuestions();
          setQuestions(qs);
          setView('intro');
          return;
        }
        setView('results');
      } else {
        const qs = await getMorphoQuestions();
        setQuestions(qs);
        setView('intro');
      }
    }

    init();
  }, []);

  const handleStartQuestionnaire = async () => {
    if (questions.length === 0) {
      const qs = await getMorphoQuestions();
      setQuestions(qs);
    }
    setView('questionnaire');
  };

  const handleComplete = (morphoResult: MorphotypeResult) => {
    setResult(morphoResult);
    setView('results');
  };

  const handleRetake = async () => {
    const qs = await getMorphoQuestions();
    setQuestions(qs);
    setResult(null);
    setView('intro');
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
            Analyse Morphologique
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
        {view === 'loading' && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <CircularProgress />
          </Box>
        )}

        {view === 'intro' && <IntroView onStart={handleStartQuestionnaire} />}

        {view === 'questionnaire' && questions.length > 0 && (
          <Questionnaire questions={questions} onComplete={handleComplete} />
        )}

        {view === 'results' && result && (
          <Results result={result} onRetake={handleRetake} />
        )}
        </Box>
      </Box>
    </Box>
  );
}

function IntroView({ onStart }: { onStart: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 4 }}>
      <Typography variant="h1" sx={{ mb: 3, fontSize: '4rem' }}>🧬</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Analyse Morpho-Anatomique</Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 360, lineHeight: 1.7 }}>
        Basé sur les travaux de <strong style={{ color: 'inherit' }}>Delavier</strong>,{' '}
        <strong style={{ color: 'inherit' }}>Gundill</strong> et{' '}
        <strong style={{ color: 'inherit' }}>Rudy Coia</strong>, ce questionnaire analyse tes
        proportions et insertions musculaires pour des recommandations vraiment personnalisées.
      </Typography>

      <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360, mb: 4 }}>
        <InfoCard emoji="⏱️" title="3-4 minutes" description="16 questions précises" />
        <InfoCard emoji="📐" title="Proportions" description="Torse, bras, fémurs, valgus" />
        <InfoCard emoji="🤸" title="Mobilité" description="Chevilles, poignets, souplesse" />
        <InfoCard emoji="🏋️" title="Exercices" description="Squat, deadlift, bench, curls" />
      </Stack>

      <Box
        onClick={() => {
          triggerHaptic('light');
          onStart();
        }}
        sx={{
          maxWidth: 360,
          width: '100%',
          py: 1.5,
          textAlign: 'center',
          bgcolor: 'text.primary',
          color: 'background.default',
          borderRadius: 2,
          fontWeight: 600,
          cursor: 'pointer',
          '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
        }}
      >
        Commencer l&apos;analyse
      </Box>
    </Box>
  );
}

function InfoCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>{emoji}</Typography>
        <Typography variant="body1" fontWeight={600}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
}
