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
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { alpha } from '@mui/material/styles';
import { CaretDown } from '@phosphor-icons/react';
import { GOLD, GOLD_CONTRAST, GOLD_LIGHT, W, tc, card } from '@/lib/design-tokens';
import { useDark } from '@/hooks/useDark';

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
  const d = useDark();
  const globalInfo = getGlobalDescription(result);

  return (
    <Stack spacing={2.5}>
      {/* Main Result Card */}
      <Box sx={{ ...card(d), py: 3, textAlign: 'center', px: 2 }}>
        <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>{globalInfo.emoji}</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: tc.h(d) }}>{globalInfo.title}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: tc.m(d) }}>
          {globalInfo.subtitle}
        </Typography>
        <Box sx={{ width: 40, height: 2, bgcolor: GOLD, mx: 'auto', my: 1.5, borderRadius: 1 }} />
        <Typography variant="body2" sx={{ lineHeight: 1.7, color: tc.m(d) }}>
          {globalInfo.description}
        </Typography>
      </Box>

      {/* Structure Osseuse */}
      <Box sx={{ ...card(d), p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
          Structure osseuse
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          <SegmentChip label="Ossature" value={result.structure.frameSize} />
          <SegmentChip label="Épaules" value={result.structure.shoulderToHip} />
          <SegmentChip label="Cage tho." value={result.structure.ribcageDepth} />
        </Box>
      </Box>

      {/* Proportions */}
      <Box sx={{ ...card(d), p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
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
      </Box>

      {/* Mobilité */}
      <Box sx={{ ...card(d), p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
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
      </Box>

      {/* Exercise Recommendations */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ pt: 1, textAlign: 'center', color: tc.h(d) }}>
        Recommandations par exercice
      </Typography>

      <ExerciseCard recommendation={result.squat} />
      <ExerciseCard recommendation={result.deadlift} />
      <ExerciseCard recommendation={result.bench} />
      <ExerciseCard recommendation={result.curls} />

      {/* Mobility Work */}
      {result.mobilityWork.length > 0 && (
        <Box sx={{ ...card(d), p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
            Travail correctif
          </Typography>
          <Stack spacing={1.5}>
            {result.mobilityWork.map((work) => (
              <MobilityWorkItem key={work.area} work={work} />
            ))}
          </Stack>
        </Box>
      )}

      {/* Muscle Insertions */}
      <Box sx={{ ...card(d), p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
          Potentiel musculaire
        </Typography>
        <Stack spacing={1.5}>
          <InsertionBar label="Biceps" potential={result.insertions.biceps} />
          <InsertionBar label="Mollets" potential={result.insertions.calves} />
          <InsertionBar label="Pectoraux" potential={result.insertions.chest} />
        </Stack>
      </Box>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <Box sx={{ ...card(d), p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
            Tes points forts
          </Typography>
          <Stack spacing={0.5}>
            {result.strengths.map((strength) => (
              <Typography key={strength} variant="body2" sx={{ color: tc.m(d) }}>
                + {strength}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <Box sx={{ ...card(d), p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center', color: tc.h(d) }}>
            Points à travailler
          </Typography>
          <Stack spacing={0.5}>
            {result.weaknesses.map((weakness) => (
              <Typography key={weakness} variant="body2" sx={{ color: tc.m(d) }}>
                - {weakness}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Actions */}
      <Stack spacing={1.5} sx={{ pt: 2 }}>
        <Box
          component={Link}
          href="/workout/program"
          sx={{
            display: 'block',
            textAlign: 'center',
            py: 1.5,
            bgcolor: GOLD,
            color: GOLD_CONTRAST,
            borderRadius: 2,
            fontWeight: 600,
            textDecoration: 'none',
            '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
          }}
        >
          Générer mon programme
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Box
            component={Link}
            href="/"
            sx={{
              flex: 1,
              display: 'block',
              textAlign: 'center',
              py: 1.5,
              border: `1px solid ${alpha(GOLD, 0.4)}`,
              borderRadius: 2,
              color: GOLD,
              fontWeight: 500,
              textDecoration: 'none',
              '&:active': { opacity: 0.7 },
            }}
          >
            Accueil
          </Box>
          <Box
            onClick={onRetake}
            sx={{
              py: 1.5,
              px: 3,
              border: `1px solid ${alpha(GOLD, 0.4)}`,
              borderRadius: 2,
              color: GOLD,
              fontWeight: 500,
              cursor: 'pointer',
              '&:active': { opacity: 0.7 },
            }}
          >
            Refaire
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}

function SegmentChip({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  const d = useDark();
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.03),
        borderRadius: 2,
        border: warning ? `1px dashed ${alpha(GOLD, 0.5)}` : 'none',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" display="block" sx={{ color: tc.f(d) }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color: tc.h(d) }}>
        {segmentLabels[value] || value} {warning && '⚠'}
      </Typography>
    </Box>
  );
}

function InsertionBar({ label, potential }: { label: string; potential: InsertionPotential }) {
  const d = useDark();
  const valueMap: Record<InsertionPotential, number> = {
    high: 100,
    medium: 60,
    low: 30,
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ color: tc.m(d) }}>{label}</Typography>
        <Typography variant="body2" fontWeight={500} sx={{ color: tc.h(d) }}>
          {insertionLabels[potential]}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={valueMap[potential]}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.06),
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}

function ExerciseCard({ recommendation }: { recommendation: ExerciseRecommendation }) {
  const d = useDark();
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
        ...card(d),
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<CaretDown size={20} weight={W} style={{ color: tc.m(d) }} />}
        sx={{ bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02) }}
      >
        <Typography fontWeight={600} sx={{ color: tc.h(d) }}>{recommendation.exercise}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {recommendation.advantages.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ ...sectionLabel, color: tc.h(d) }}>
                Avantages
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.advantages.map((adv) => (
                  <Typography key={adv} variant="body2" sx={{ color: tc.m(d) }}>• {adv}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.disadvantages.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ ...sectionLabel, color: tc.h(d) }}>
                A considérer
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.disadvantages.map((dis) => (
                  <Typography key={dis} variant="body2" sx={{ color: tc.m(d) }}>• {dis}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.variants.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ ...sectionLabel, color: tc.h(d) }}>
                Variantes recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {recommendation.variants.map((variant) => (
                  <Chip
                    key={variant}
                    label={variant}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      borderColor: alpha(GOLD, 0.35),
                      color: tc.h(d),
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {recommendation.tips.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ ...sectionLabel, color: tc.h(d) }}>
                Conseils
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {recommendation.tips.map((tip) => (
                  <Typography key={tip} variant="body2" sx={{ color: tc.m(d) }}>• {tip}</Typography>
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
  const d = useDark();
  const priorityLabels: Record<string, string> = {
    high: 'Prioritaire',
    medium: 'Recommandé',
    low: 'Optionnel',
  };

  return (
    <Box sx={{ p: 1.5, bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.03), borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600} sx={{ color: tc.h(d) }}>{work.area}</Typography>
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: GOLD }}>
          {priorityLabels[work.priority]}
        </Typography>
      </Stack>
      <Stack spacing={0.25}>
        {work.exercises.map((ex) => (
          <Typography key={ex} variant="caption" sx={{ color: tc.m(d) }}>• {ex}</Typography>
        ))}
      </Stack>
    </Box>
  );
}
