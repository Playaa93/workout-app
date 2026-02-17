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

function getGlobalDescription(result: MorphotypeResult): { emoji: string; title: string; subtitle: string; description: string } {
  const { torsoLength, armLength, femurLength } = result.proportions;

  const baseInfo: Record<string, { emoji: string; title: string }> = {
    longiligne: { emoji: '🦒', title: 'Longiligne' },
    breviligne: { emoji: '🦍', title: 'Bréviligne' },
    balanced: { emoji: '⚖️', title: 'Équilibré' },
  };

  const base = baseInfo[result.globalType];

  const segments: string[] = [];
  if (torsoLength === 'long') segments.push('torse long');
  if (torsoLength === 'short') segments.push('torse court');
  if (armLength === 'long') segments.push('bras longs');
  if (armLength === 'short') segments.push('bras courts');
  if (femurLength === 'long') segments.push('fémurs longs');
  if (femurLength === 'short') segments.push('fémurs courts');

  const subtitle = segments.length > 0 ? segments.join(', ') : 'Proportions moyennes';

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

const insertionLabels: Record<InsertionPotential, string> = {
  high: 'Fort',
  medium: 'Moyen',
  low: 'Limité',
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

const sectionLabel = { textTransform: 'uppercase' as const, letterSpacing: 1 };

export function Results({ result, onRetake }: Props) {
  const globalInfo = getGlobalDescription(result);

  return (
    <Stack spacing={2.5}>
      {/* Main Result Card */}
      <Card sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>{globalInfo.emoji}</Typography>
          <Typography variant="h5" fontWeight={700}>{globalInfo.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            {globalInfo.subtitle}
          </Typography>
          <Box sx={{ width: 40, height: 2, bgcolor: 'divider', mx: 'auto', my: 1.5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {globalInfo.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Structure Osseuse */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Structure osseuse
          </Typography>
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
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Proportions
          </Typography>
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
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Mobilité
          </Typography>
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
      <Typography variant="subtitle2" fontWeight={600} sx={{ pt: 1, textAlign: 'center' }}>
        Recommandations par exercice
      </Typography>

      <ExerciseCard recommendation={result.squat} />
      <ExerciseCard recommendation={result.deadlift} />
      <ExerciseCard recommendation={result.bench} />
      <ExerciseCard recommendation={result.curls} />

      {/* Mobility Work */}
      {result.mobilityWork.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
              Travail correctif
            </Typography>
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
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Potentiel musculaire
          </Typography>
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
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
              Tes points forts
            </Typography>
            <Stack spacing={0.5}>
              {result.strengths.map((strength) => (
                <Typography key={strength} variant="body2" color="text.secondary">
                  + {strength}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
              Points à travailler
            </Typography>
            <Stack spacing={0.5}>
              {result.weaknesses.map((weakness) => (
                <Typography key={weakness} variant="body2" color="text.secondary">
                  - {weakness}
                </Typography>
              ))}
            </Stack>
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
        bgcolor: 'action.hover',
        borderRadius: 2,
        border: warning ? '1px dashed' : 'none',
        borderColor: 'text.disabled',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {segmentLabels[value] || value} {warning && '⚠'}
      </Typography>
    </Box>
  );
}

function InsertionBar({ label, potential }: { label: string; potential: InsertionPotential }) {
  const valueMap: Record<InsertionPotential, number> = {
    high: 100,
    medium: 60,
    low: 30,
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {insertionLabels[potential]}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={valueMap[potential]}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: 'text.secondary', borderRadius: 3 },
        }}
      />
    </Box>
  );
}

function ExerciseCard({ recommendation }: { recommendation: ExerciseRecommendation }) {
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
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
        <Typography fontWeight={600}>{recommendation.exercise}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {recommendation.advantages.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={sectionLabel}>
                Avantages
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.advantages.map((adv) => (
                  <Typography key={adv} variant="body2" color="text.secondary">• {adv}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.disadvantages.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={sectionLabel}>
                A considérer
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.disadvantages.map((dis) => (
                  <Typography key={dis} variant="body2" color="text.secondary">• {dis}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.variants.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={sectionLabel}>
                Variantes recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {recommendation.variants.map((variant) => (
                  <Chip
                    key={variant}
                    label={variant}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500, borderColor: 'divider', color: 'text.primary' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {recommendation.tips.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={sectionLabel}>
                Conseils
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.tips.map((tip) => (
                  <Typography key={tip} variant="body2" color="text.secondary">• {tip}</Typography>
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
  const priorityLabels: Record<string, string> = {
    high: 'Prioritaire',
    medium: 'Recommandé',
    low: 'Optionnel',
  };

  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>{work.area}</Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {priorityLabels[work.priority]}
        </Typography>
      </Stack>
      <Stack spacing={0.25}>
        {work.exercises.map((ex) => (
          <Typography key={ex} variant="caption" color="text.secondary">• {ex}</Typography>
        ))}
      </Stack>
    </Box>
  );
}
