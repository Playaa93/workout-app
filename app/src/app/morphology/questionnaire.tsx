'use client';

import { useState } from 'react';
import type { MorphoQuestion, MorphotypeResult } from './types';
import { calculateMorphotype } from './morpho-logic';
import { useMorphologyMutations } from '@/powersync/mutations/morphology-mutations';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { GOLD, GOLD_LIGHT, W, tc, card, focusRingSx } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import { triggerHaptic } from '@/lib/haptic';

type Props = {
  questions: MorphoQuestion[];
  onComplete: (result: MorphotypeResult) => void;
};

const categoryInfo: Record<string, { label: string; emoji: string }> = {
  structure: { label: 'Structure', emoji: '🦴' },
  proportions: { label: 'Proportions', emoji: '📐' },
  mobility: { label: 'Mobilité', emoji: '🤸' },
  insertions: { label: 'Insertions', emoji: '🧬' },
  metabolism: { label: 'Métabolisme', emoji: '🔥' },
};

export function Questionnaire({ questions, onComplete }: Props) {
  const { t, d } = useThemeTokens();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const mutations = useMorphologyMutations();

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const category = categoryInfo[currentQuestion?.category] || categoryInfo.proportions;

  const handleAnswer = async (value: string) => {
    triggerHaptic('light');
    const newAnswers = { ...answers, [currentQuestion.questionKey]: value };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setIsCalculating(true);
      try {
        const result = calculateMorphotype(newAnswers);
        await mutations.saveMorphoProfile({
          primaryMorphotype: result.primary,
          secondaryMorphotype: result.secondary,
          morphotypeScore: {
            ecto: result.scores.ecto,
            meso: result.scores.meso,
            endo: result.scores.endo,
            globalType: result.globalType,
            structure: result.structure,
            proportions: result.proportions,
            mobility: result.mobility,
            insertions: result.insertions,
            metabolism: result.metabolism,
          },
          torsoProportion: result.proportions.torsoLength,
          armProportion: result.proportions.armLength,
          legProportion: result.proportions.femurLength,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          recommendedExercises: result.recommendedExercises,
          exercisesToAvoid: result.exercisesToAvoid,
          questionnaireResponses: newAnswers,
        });
        onComplete(result);
      } catch (error) {
        console.error('Error calculating morphotype:', error);
        setIsCalculating(false);
      }
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isCalculating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={64} sx={{ color: GOLD }} />
        <Typography sx={{ color: tc.m(t) }}>Analyse en cours...</Typography>
        <Typography variant="caption" sx={{ maxWidth: 280, textAlign: 'center', color: tc.f(t) }}>
          Calcul de ton morphotype, proportions et potentiel musculaire
        </Typography>
      </Box>
    );
  }

  const options = currentQuestion.options as Array<{
    label: string;
    value: string;
  }>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Category Badge */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: alpha(GOLD, 0.12),
            color: GOLD_LIGHT,
            fontWeight: 600,
            fontSize: '0.8rem',
            border: `1px solid ${alpha(GOLD, 0.25)}`,
            transition: 'all 0.3s ease',
          }}
        >
          {category.emoji} {category.label}
        </Box>
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ color: tc.m(t) }}>
            Question {currentIndex + 1}/{questions.length}
          </Typography>
          <Typography variant="body2" sx={{ color: tc.m(t) }}>
            {Math.round(progress)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 4,
            bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.06),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              borderRadius: 4,
            },
          }}
        />
        {/* Category progress dots */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, justifyContent: 'center' }}>
          {Object.keys(categoryInfo).map((cat) => {
            const catQuestions = questions.filter((q) => q.category === cat);
            const catStart = questions.findIndex((q) => q.category === cat);
            const isActive = currentQuestion.category === cat;
            const isComplete = currentIndex > catStart + catQuestions.length - 1;
            const isCurrent = currentIndex >= catStart && currentIndex < catStart + catQuestions.length;

            return (
              <Box
                key={cat}
                sx={{
                  width: isCurrent ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: isComplete ? GOLD : isActive ? GOLD_LIGHT : d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
                  opacity: isComplete ? 1 : isActive ? 0.85 : 0.4,
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* Question */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3, lineHeight: 1.6, color: tc.h(t) }}>
          {currentQuestion.questionTextFr}
        </Typography>

        {/* Options */}
        <Stack spacing={1.5}>
          {Array.isArray(options) &&
            options.map((option) => {
              const isSelected = answers[currentQuestion.questionKey] === option.value;
              return (
                <Box
                  key={option.value}
                  role="button"
                  tabIndex={0}
                  aria-label={option.label}
                  onClick={() => handleAnswer(option.value)}
                  sx={{
                    ...card(t),
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    p: 2,
                    '&:hover': { opacity: 0.85 },
                    '&:focus-visible': focusRingSx,
                    '&:active': { opacity: 0.8 },
                    ...(isSelected && {
                      borderColor: GOLD,
                      bgcolor: alpha(GOLD, 0.08),
                    }),
                  }}
                >
                  {/* Gold accent bar on left when selected */}
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: GOLD,
                        borderRadius: '14px 0 0 14px',
                      }}
                    />
                  )}
                  <Typography variant="body1" sx={{ color: tc.h(t), pl: isSelected ? 1 : 0 }}>
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        {currentIndex > 0 && (
          <Box
            role="button"
            tabIndex={0}
            onClick={handleBack}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 4,
              py: 1,
              border: `1px solid ${alpha(GOLD, 0.4)}`,
              borderRadius: 2,
              color: GOLD,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              '&:hover': { bgcolor: alpha(GOLD, 0.08) },
              '&:focus-visible': focusRingSx,
              '&:active': { opacity: 0.7 },
            }}
          >
            Retour
          </Box>
        )}
      </Box>
    </Box>
  );
}
