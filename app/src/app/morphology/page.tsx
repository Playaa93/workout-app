'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Questionnaire } from './questionnaire';
import { Results } from './results';
import {
  getMorphoQuestions,
  getMorphoProfile,
  type MorphoQuestion,
  type MorphotypeResult,
} from './actions';
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

export default function MorphologyPage() {
  const [view, setView] = useState<ViewState>('loading');
  const [questions, setQuestions] = useState<MorphoQuestion[]>([]);
  const [result, setResult] = useState<MorphotypeResult | null>(null);

  useEffect(() => {
    async function init() {
      const existingProfile = await getMorphoProfile();

      if (existingProfile) {
        setResult({
          primary: existingProfile.primaryMorphotype as MorphotypeResult['primary'],
          secondary: existingProfile.secondaryMorphotype as MorphotypeResult['secondary'],
          scores: existingProfile.morphotypeScore as MorphotypeResult['scores'],
          strengths: existingProfile.strengths || [],
          weaknesses: existingProfile.weaknesses || [],
          recommendedExercises: existingProfile.recommendedExercises || [],
          exercisesToAvoid: existingProfile.exercisesToAvoid || [],
        });
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
          <Typography variant="h6" fontWeight={600}>Analyse Morphologique</Typography>
        </Stack>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2 }}>
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
  );
}

function IntroView({ onStart }: { onStart: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 4 }}>
      <Typography variant="h1" sx={{ mb: 3, fontSize: '4rem' }}>🧬</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Découvre ton morphotype</Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 360, lineHeight: 1.7 }}>
        Basé sur les travaux de <strong style={{ color: 'inherit' }}>Delavier</strong> et{' '}
        <strong style={{ color: 'inherit' }}>Gundill</strong>, ce questionnaire analyse ta
        morphologie pour te recommander les exercices les plus adaptés à ton corps.
      </Typography>

      <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360, mb: 4 }}>
        <InfoCard emoji="⏱️" title="2-3 minutes" description="8 questions simples" />
        <InfoCard emoji="🎯" title="Personnalisé" description="Exercices adaptés à ton corps" />
        <InfoCard emoji="💪" title="Scientifique" description="Basé sur l'anatomie fonctionnelle" />
      </Stack>

      <Button
        variant="contained"
        size="large"
        onClick={onStart}
        fullWidth
        sx={{
          maxWidth: 360,
          py: 1.5,
          background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
          },
        }}
      >
        Commencer l&apos;analyse
      </Button>
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
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">{emoji}</Typography>
          <Box>
            <Typography variant="body1" fontWeight={600}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
