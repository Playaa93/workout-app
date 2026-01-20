'use client';

import { useState } from 'react';
import type { MorphoQuestion, MorphotypeResult } from './types';
import { calculateMorphotype, saveMorphoProfile } from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

type Props = {
  questions: MorphoQuestion[];
  onComplete: (result: MorphotypeResult) => void;
};

const categoryInfo: Record<string, { label: string; emoji: string; color: string }> = {
  structure: { label: 'Structure', emoji: '🦴', color: '#6366f1' },
  proportions: { label: 'Proportions', emoji: '📐', color: '#3b82f6' },
  mobility: { label: 'Mobilité', emoji: '🤸', color: '#10b981' },
  insertions: { label: 'Insertions', emoji: '🧬', color: '#f59e0b' },
  metabolism: { label: 'Métabolisme', emoji: '🔥', color: '#ef4444' },
};

export function Questionnaire({ questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const category = categoryInfo[currentQuestion?.category] || categoryInfo.proportions;

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.questionKey]: value };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setIsCalculating(true);
      try {
        const result = await calculateMorphotype(newAnswers);
        await saveMorphoProfile(newAnswers, result);
        onComplete(result);
      } catch (error) {
        console.error('Error calculating morphotype:', error);
        setIsCalculating(false);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isCalculating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={64} />
        <Typography color="text.secondary">Analyse en cours...</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280, textAlign: 'center' }}>
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
        <Chip
          label={`${category.emoji} ${category.label}`}
          size="small"
          sx={{
            bgcolor: `${category.color}20`,
            color: category.color,
            fontWeight: 600,
            border: `1px solid ${category.color}40`,
          }}
        />
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentIndex + 1}/{questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${category.color} 0%, ${category.color}aa 100%)`,
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
                  bgcolor: isComplete ? categoryInfo[cat].color : isActive ? categoryInfo[cat].color : 'action.hover',
                  opacity: isComplete || isActive ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* Question */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3, lineHeight: 1.6 }}>
          {currentQuestion.questionTextFr}
        </Typography>

        {/* Options */}
        <Stack spacing={1.5}>
          {Array.isArray(options) &&
            options.map((option) => (
              <Card
                key={option.value}
                sx={{
                  ...(answers[currentQuestion.questionKey] === option.value && {
                    bgcolor: `${category.color}15`,
                    border: 2,
                    borderColor: category.color,
                  }),
                }}
              >
                <CardActionArea
                  onClick={() => handleAnswer(option.value)}
                  sx={{ p: 2 }}
                >
                  <Typography variant="body1">{option.label}</Typography>
                </CardActionArea>
              </Card>
            ))}
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        {currentIndex > 0 && (
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ px: 4 }}
          >
            Retour
          </Button>
        )}
      </Box>
    </Box>
  );
}
