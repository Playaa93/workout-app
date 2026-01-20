'use client';

import { useState } from 'react';
import { type MorphoQuestion, type MorphotypeResult, calculateMorphotype, saveMorphoProfile } from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

type Props = {
  questions: MorphoQuestion[];
  onComplete: (result: MorphotypeResult) => void;
};

export function Questionnaire({ questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

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
      </Box>
    );
  }

  const options = currentQuestion.options as Array<{
    label: string;
    value: string;
  }>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Progress bar */}
      <Box sx={{ mb: 4 }}>
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
              background: 'linear-gradient(90deg, #6750a4 0%, #9a67ea 100%)',
              borderRadius: 4,
            },
          }}
        />
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
                    bgcolor: 'rgba(103,80,164,0.15)',
                    border: 2,
                    borderColor: 'primary.main',
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

        {/* Measurement input for measurement type questions */}
        {currentQuestion.questionType === 'measurement' && (
          <MeasurementInput
            question={currentQuestion}
            value={answers[currentQuestion.questionKey]}
            onChange={(value) => handleAnswer(value)}
          />
        )}
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

function MeasurementInput({
  question,
  value,
  onChange,
}: {
  question: MorphoQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const options = question.options as {
    unit: string;
    ranges: Array<{ label: string; value: string }>;
  };

  return (
    <Stack spacing={1.5}>
      {options.ranges.map((range) => (
        <Card
          key={range.value}
          sx={{
            ...(value === range.value && {
              bgcolor: 'rgba(103,80,164,0.15)',
              border: 2,
              borderColor: 'primary.main',
            }),
          }}
        >
          <CardActionArea onClick={() => onChange(range.value)} sx={{ p: 2 }}>
            <Typography variant="body1">{range.label}</Typography>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
