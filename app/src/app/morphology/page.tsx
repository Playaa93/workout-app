'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Questionnaire } from './questionnaire';
import { Results } from './results';
import type { MorphotypeResult } from './types';
import { MORPHO_QUESTIONS, calculateMorphotype } from './morpho-logic';
import { useAuth } from '@/powersync/auth-context';
import { useMorphoProfile } from '@/powersync/queries/morphology-queries';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { triggerHaptic } from '@/lib/haptic';
import BottomNav from '@/components/BottomNav';

type ViewState = 'intro' | 'questionnaire' | 'results';

export default function MorphologyPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <MorphologyContent />;
}

function MorphologyContent() {
  const { data: profileRows, isLoading: profileLoading } = useMorphoProfile();
  const [view, setView] = useState<ViewState | null>(null);
  const [result, setResult] = useState<MorphotypeResult | null>(null);

  // Compute existing result from profile data
  const existingResult = useMemo<MorphotypeResult | null>(() => {
    if (profileLoading || profileRows.length === 0) return null;
    const profile = profileRows[0];

    const scoreData = parseJson<{
      ecto: number; meso: number; endo: number;
      globalType?: MorphotypeResult['globalType'];
      structure?: MorphotypeResult['structure'];
      proportions?: MorphotypeResult['proportions'];
      mobility?: MorphotypeResult['mobility'];
      insertions?: MorphotypeResult['insertions'];
      metabolism?: MorphotypeResult['metabolism'];
    }>(profile.morphotype_score as string);

    if (!scoreData?.structure || !scoreData?.mobility || !scoreData?.metabolism) return null;

    // Recalculate from stored answers for full recommendations
    const answers = parseJson<Record<string, string>>(profile.questionnaire_responses as string);
    if (answers && Object.keys(answers).length > 0) {
      return calculateMorphotype(answers);
    }

    // Fallback: build from stored data
    const strengths = parseJsonArray<string>(profile.strengths as string);
    const weaknesses = parseJsonArray<string>(profile.weaknesses as string);
    const recommendedExercises = parseJsonArray<string>(profile.recommended_exercises as string);
    const exercisesToAvoid = parseJsonArray<string>(profile.exercises_to_avoid as string);

    return {
      globalType: scoreData.globalType || 'balanced',
      structure: scoreData.structure,
      proportions: scoreData.proportions || {
        torsoLength: (profile.torso_proportion as 'short' | 'medium' | 'long') || 'medium',
        armLength: (profile.arm_proportion as 'short' | 'medium' | 'long') || 'medium',
        femurLength: (profile.leg_proportion as 'short' | 'medium' | 'long') || 'medium',
        kneeValgus: 'none' as const,
      },
      mobility: scoreData.mobility,
      insertions: scoreData.insertions || { biceps: 'medium' as const, calves: 'medium' as const, chest: 'medium' as const },
      metabolism: scoreData.metabolism,
      squat: { exercise: 'Squat', advantages: [], disadvantages: [], variants: [], tips: [] },
      deadlift: { exercise: 'Soulevé de terre', advantages: [], disadvantages: [], variants: [], tips: [] },
      bench: { exercise: 'Développé couché', advantages: [], disadvantages: [], variants: [], tips: [] },
      curls: { exercise: 'Curls biceps', advantages: [], disadvantages: [], variants: [], tips: [] },
      mobilityWork: [],
      primary: profile.primary_morphotype as MorphotypeResult['primary'],
      secondary: null,
      scores: { ecto: scoreData.ecto || 0, meso: scoreData.meso || 0, endo: scoreData.endo || 0 },
      strengths,
      weaknesses,
      recommendedExercises,
      exercisesToAvoid,
    };
  }, [profileRows, profileLoading]);

  // Determine active view
  const activeView = view ?? (profileLoading ? null : (existingResult ? 'results' : 'intro'));
  const activeResult = result ?? existingResult;

  const handleStartQuestionnaire = () => {
    setView('questionnaire');
  };

  const handleComplete = (morphoResult: MorphotypeResult) => {
    setResult(morphoResult);
    setView('results');
  };

  const handleRetake = () => {
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
      <Box sx={{ flex: 1, p: 2, pb: 10 }}>
        <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
        {activeView === null && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <CircularProgress />
          </Box>
        )}

        {activeView === 'intro' && <IntroView onStart={handleStartQuestionnaire} />}

        {activeView === 'questionnaire' && (
          <Questionnaire questions={MORPHO_QUESTIONS} onComplete={handleComplete} />
        )}

        {activeView === 'results' && activeResult && (
          <Results result={activeResult} onRetake={handleRetake} />
        )}
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />
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
