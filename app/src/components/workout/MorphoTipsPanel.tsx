'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import type { MorphotypeResult } from '@/app/morphology/types';
import {
  scoreExercise,
  getCategoryDefault,
  getScoreColor,
  getScoreLabel,
  type MorphoRecommendation,
  type ExerciseScore,
} from '@/lib/morpho-exercise-scoring';

type Props = {
  exerciseName: string;
  muscleGroup: string;
  morphotype: MorphotypeResult | null;
  morphoRecommendation?: MorphoRecommendation | null;
  expanded?: boolean;
  compact?: boolean;
};

export function MorphoTipsPanel({
  exerciseName,
  muscleGroup,
  morphotype,
  morphoRecommendation,
  expanded = false,
  compact = false,
}: Props) {
  const score = useMemo<ExerciseScore | null>(() => {
    if (!morphotype) return null;

    // Use specific recommendation or fall back to category default
    const rec = morphoRecommendation || getCategoryDefault(muscleGroup, exerciseName);
    return scoreExercise(morphotype, rec);
  }, [morphotype, morphoRecommendation, muscleGroup, exerciseName]);

  if (!score || !morphotype) {
    return null;
  }

  const scoreColor = getScoreColor(score.score);
  const scoreLabel = getScoreLabel(score.score);

  // Compact mode - just show the badge
  if (compact) {
    return (
      <MorphoScoreBadge score={score.score} size="small" />
    );
  }

  return (
    <Box>
      {/* Score Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: expanded ? 1.5 : 0 }}>
        <MorphoScoreBadge score={score.score} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Compatibilité morpho
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scoreLabel}
          </Typography>
        </Box>
      </Stack>

      {/* Expanded Details */}
      <Collapse in={expanded}>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {/* Progress Bar */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={score.score}
              color={scoreColor}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
              }}
            />
          </Box>

          {/* Advantages */}
          {score.advantages.length > 0 && (
            <Box>
              <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                ✓ Avantages pour toi
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {score.advantages.map((adv, i) => (
                  <Chip
                    key={i}
                    label={adv}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.15)',
                      color: 'success.main',
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Disadvantages */}
          {score.disadvantages.length > 0 && (
            <Box>
              <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                ⚠ Points d'attention
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {score.disadvantages.map((dis, i) => (
                  <Chip
                    key={i}
                    label={dis}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(249,115,22,0.15)',
                      color: 'warning.main',
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Modifications */}
          {score.modifications.length > 0 && (
            <Box>
              <Typography variant="caption" color="info.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                🔧 Adaptations recommandées
              </Typography>
              <Stack spacing={0.25}>
                {score.modifications.map((mod, i) => (
                  <Typography key={i} variant="caption" color="text.secondary">
                    • {mod}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Cues */}
          {score.cues.length > 0 && (
            <Box>
              <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                💡 Conseils de placement
              </Typography>
              <Stack spacing={0.25}>
                {score.cues.map((cue, i) => (
                  <Typography key={i} variant="caption" color="text.secondary">
                    • {cue}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}

// =============================================================================
// SCORE BADGE COMPONENT
// =============================================================================

type BadgeProps = {
  score: number;
  size?: 'small' | 'medium';
};

export function MorphoScoreBadge({ score, size = 'medium' }: BadgeProps) {
  const color = getScoreColor(score);
  const colorMap = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };
  const bgMap = {
    success: 'rgba(16,185,129,0.15)',
    warning: 'rgba(249,115,22,0.15)',
    error: 'rgba(239,68,68,0.15)',
  };

  const sizeStyles = size === 'small'
    ? { width: 28, height: 28, fontSize: '0.7rem' }
    : { width: 40, height: 40, fontSize: '0.85rem' };

  return (
    <Box
      sx={{
        ...sizeStyles,
        borderRadius: '50%',
        bgcolor: bgMap[color],
        border: `2px solid ${colorMap[color]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: colorMap[color],
        flexShrink: 0,
      }}
    >
      {score}
    </Box>
  );
}

// =============================================================================
// INLINE SCORE CHIP (for exercise list)
// =============================================================================

type ChipProps = {
  score: number;
  showLabel?: boolean;
};

export function MorphoScoreChip({ score, showLabel = false }: ChipProps) {
  const color = getScoreColor(score);
  const label = showLabel ? `${score} - ${getScoreLabel(score)}` : score.toString();

  return (
    <Chip
      label={label}
      size="small"
      color={color}
      sx={{
        fontWeight: 600,
        minWidth: showLabel ? 'auto' : 32,
        height: 22,
        fontSize: '0.75rem',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
