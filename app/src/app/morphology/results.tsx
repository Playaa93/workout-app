'use client';

import Link from 'next/link';
import type {
  MorphotypeResult,
  InsertionPotential,
  ExerciseRecommendation,
  MobilityWork,
} from './types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type Props = {
  result: MorphotypeResult;
  onRetake: () => void;
};

// Function to generate dynamic description based on actual proportions
function getGlobalDescription(result: MorphotypeResult): { emoji: string; title: string; subtitle: string; description: string; gradient: string } {
  const { torsoLength, armLength, femurLength } = result.proportions;

  const baseInfo: Record<string, { emoji: string; title: string; gradient: string }> = {
    longiligne: { emoji: '🦒', title: 'Longiligne', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
    breviligne: { emoji: '🦍', title: 'Bréviligne', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
    balanced: { emoji: '⚖️', title: 'Équilibré', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' },
  };

  const base = baseInfo[result.globalType];

  // Build dynamic description based on actual segments
  const segments: string[] = [];
  if (torsoLength === 'long') segments.push('torse long');
  if (torsoLength === 'short') segments.push('torse court');
  if (armLength === 'long') segments.push('bras longs');
  if (armLength === 'short') segments.push('bras courts');
  if (femurLength === 'long') segments.push('fémurs longs');
  if (femurLength === 'short') segments.push('fémurs courts');

  const subtitle = segments.length > 0 ? segments.join(', ') : 'Proportions moyennes';

  // Generate description based on actual advantages
  const advantages: string[] = [];
  const challenges: string[] = [];

  if (armLength === 'long') advantages.push('soulevé de terre');
  if (armLength === 'short') advantages.push('développé couché');
  if (femurLength === 'short') advantages.push('squat');
  if (femurLength === 'long') challenges.push('squat profond');
  if (armLength === 'long') challenges.push('développé couché');

  let description = '';
  if (advantages.length > 0) {
    description += `Tes proportions te donnent un avantage naturel au ${advantages.join(' et ')}.`;
  }
  if (challenges.length > 0) {
    description += ` Le ${challenges.join(' et le ')} demandera plus d'adaptation.`;
  }
  if (!description) {
    description = 'Tes proportions équilibrées te permettent de performer sur tous les mouvements. Adapte ta technique selon tes sensations.';
  }

  return { ...base, subtitle, description: description.trim() };
}

const insertionLabels: Record<InsertionPotential, { label: string; color: string }> = {
  high: { label: 'Fort potentiel', color: '#10b981' },
  medium: { label: 'Potentiel moyen', color: '#f59e0b' },
  low: { label: 'Potentiel limité', color: '#ef4444' },
};

const segmentLabels: Record<string, string> = {
  short: 'Court',
  medium: 'Moyen',
  long: 'Long',
  narrow: 'Étroit',
  wide: 'Large',
  fine: 'Fine',
  large: 'Large',
  none: 'Aucun',
  slight: 'Léger',
  pronounced: 'Prononcé',
  limited: 'Limitée',
  average: 'Moyenne',
  good: 'Bonne',
  fast: 'Rapide',
  balanced: 'Équilibré',
  slow: 'Lent',
  low: 'Faible',
  high: 'Élevée',
};

export function Results({ result, onRetake }: Props) {
  const globalInfo = getGlobalDescription(result);

  return (
    <Stack spacing={2.5}>
      {/* Main Result Card - Global Type */}
      <Card sx={{ background: globalInfo.gradient, color: 'white', overflow: 'hidden' }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: '3.5rem', mb: 1 }}>{globalInfo.emoji}</Typography>
          <Typography variant="h5" fontWeight={700}>{globalInfo.title}</Typography>
          <Typography sx={{ opacity: 0.85, mb: 2 }}>{globalInfo.subtitle}</Typography>
          <Typography sx={{ opacity: 0.9, lineHeight: 1.7 }}>{globalInfo.description}</Typography>
        </CardContent>
      </Card>

      {/* Structure Osseuse */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">🦴</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Structure osseuse</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            <SegmentChip label="Ossature" value={result.structure.frameSize} />
            <SegmentChip label="Épaules" value={result.structure.shoulderToHip} />
            <SegmentChip label="Cage tho." value={result.structure.ribcageDepth} />
          </Box>
        </CardContent>
      </Card>

      {/* Proportions */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">📐</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Proportions</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <SegmentChip label="Torse" value={result.proportions.torsoLength} />
            <SegmentChip label="Bras" value={result.proportions.armLength} />
            <SegmentChip label="Fémurs" value={result.proportions.femurLength} />
            <SegmentChip
              label="Valgus genou"
              value={result.proportions.kneeValgus}
              warning={result.proportions.kneeValgus !== 'none'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Mobilité */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">🤸</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Mobilité</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            <SegmentChip
              label="Chevilles"
              value={result.mobility.ankleDorsiflexion}
              warning={result.mobility.ankleDorsiflexion === 'limited'}
            />
            <SegmentChip
              label="Ischio-jamb."
              value={result.mobility.posteriorChain}
              warning={result.mobility.posteriorChain === 'limited'}
            />
            <SegmentChip
              label="Poignets"
              value={result.mobility.wristMobility}
              warning={result.mobility.wristMobility !== 'none'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Exercise Recommendations */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ pt: 1, textAlign: 'center' }}>
        🏋️ Recommandations par exercice
      </Typography>

      <ExerciseCard recommendation={result.squat} color="#10b981" />
      <ExerciseCard recommendation={result.deadlift} color="#f59e0b" />
      <ExerciseCard recommendation={result.bench} color="#3b82f6" />
      <ExerciseCard recommendation={result.curls} color="#8b5cf6" />

      {/* Mobility Work */}
      {result.mobilityWork.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6">🔧</Typography>
              <Typography variant="subtitle1" fontWeight={600}>Travail correctif</Typography>
            </Stack>
            <Stack spacing={1.5}>
              {result.mobilityWork.map((work) => (
                <MobilityWorkItem key={work.area} work={work} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Muscle Insertions */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">🧬</Typography>
            <Typography variant="subtitle1" fontWeight={600}>Potentiel musculaire</Typography>
          </Stack>
          <Stack spacing={1.5}>
            <InsertionBar label="Biceps" potential={result.insertions.biceps} />
            <InsertionBar label="Mollets" potential={result.insertions.calves} />
            <InsertionBar label="Pectoraux" potential={result.insertions.chest} />
          </Stack>
        </CardContent>
      </Card>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6">💪</Typography>
              <Typography variant="subtitle1" fontWeight={600}>Tes points forts</Typography>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
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
      )}

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6">🎯</Typography>
              <Typography variant="subtitle1" fontWeight={600}>Points à travailler</Typography>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
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
      )}

      {/* Actions */}
      <Stack spacing={1.5} sx={{ pt: 2 }}>
        <Button
          component={Link}
          href="/workout/program"
          variant="contained"
          size="large"
          startIcon={<span>🏋️</span>}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
            },
          }}
        >
          Générer mon programme
        </Button>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="large"
            sx={{ flex: 1, py: 1.5 }}
          >
            Accueil
          </Button>
          <Button variant="outlined" onClick={onRetake} sx={{ py: 1.5, px: 3 }}>
            Refaire
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

function SegmentChip({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: warning ? 'rgba(249,115,22,0.1)' : 'action.hover',
        borderRadius: 2,
        border: warning ? '1px solid' : 'none',
        borderColor: warning ? 'warning.main' : 'transparent',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color={warning ? 'warning.main' : 'text.primary'}>
        {segmentLabels[value] || value}
      </Typography>
    </Box>
  );
}

function InsertionBar({ label, potential }: { label: string; potential: InsertionPotential }) {
  const info = insertionLabels[potential];
  const valueMap: Record<InsertionPotential, number> = {
    high: 100,
    medium: 60,
    low: 30,
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ color: info.color }}>{info.label}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={valueMap[potential]}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: info.color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

function ExerciseCard({ recommendation, color }: { recommendation: ExerciseRecommendation; color: string }) {
  const hasContent =
    recommendation.advantages.length > 0 ||
    recommendation.disadvantages.length > 0 ||
    recommendation.variants.length > 0 ||
    recommendation.tips.length > 0;

  if (!hasContent) return null;

  return (
    <Accordion
      defaultExpanded={false}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 1,
        borderRadius: '12px !important',
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: `${color}15`,
          borderLeft: `4px solid ${color}`,
          '&:hover': { bgcolor: `${color}20` },
        }}
      >
        <Typography fontWeight={600}>{recommendation.exercise}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* Advantages */}
          {recommendation.advantages.length > 0 && (
            <Box>
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ✓ Avantages
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.advantages.map((adv) => (
                  <Typography key={adv} variant="body2" color="text.secondary">
                    • {adv}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Disadvantages */}
          {recommendation.disadvantages.length > 0 && (
            <Box>
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                ⚠ À considérer
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.disadvantages.map((dis) => (
                  <Typography key={dis} variant="body2" color="text.secondary">
                    • {dis}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Variants */}
          {recommendation.variants.length > 0 && (
            <Box>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                🎯 Variantes recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {recommendation.variants.map((variant) => (
                  <Chip
                    key={variant}
                    label={variant}
                    size="small"
                    sx={{
                      bgcolor: `${color}20`,
                      color: color,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Tips */}
          {recommendation.tips.length > 0 && (
            <Box>
              <Typography variant="caption" color="info.main" fontWeight={600}>
                💡 Conseils
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.tips.map((tip) => (
                  <Typography key={tip} variant="body2" color="text.secondary">
                    • {tip}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function MobilityWorkItem({ work }: { work: MobilityWork }) {
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
  };
  const priorityLabels: Record<string, string> = {
    high: 'Priorité haute',
    medium: 'Priorité moyenne',
    low: 'Priorité basse',
  };

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'action.hover',
        borderRadius: 2,
        borderLeft: `3px solid ${priorityColors[work.priority]}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" fontWeight={600}>{work.area}</Typography>
        <Chip
          label={priorityLabels[work.priority]}
          size="small"
          sx={{
            bgcolor: `${priorityColors[work.priority]}20`,
            color: priorityColors[work.priority],
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Stack>
      <Stack spacing={0.25}>
        {work.exercises.map((ex) => (
          <Typography key={ex} variant="caption" color="text.secondary">
            • {ex}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
