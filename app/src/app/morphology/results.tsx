'use client';

import { useState } from 'react';
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
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { alpha } from '@mui/material/styles';
import { CaretDown, Star, Warning } from '@phosphor-icons/react';
import { GOLD, W, tc, card, surfaceBg } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';

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

export function Results({ result, onRetake }: Props) {
  const { t, d } = useThemeTokens();
  const [tab, setTab] = useState(0);
  const globalInfo = getGlobalDescription(result);
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase' as const };
  const sepSx = { borderBottom: '1px solid', borderColor: d ? alpha('#fff', 0.05) : alpha('#000', 0.05) };
  const tabs = ['Profil', 'Exercices', 'Corrections'];

  return (
    <Stack spacing={1.5}>
      {/* Hero */}
      <Box sx={card(t, { p: 2.5, textAlign: 'center' })}>
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tc.h(t), lineHeight: 1, letterSpacing: '-0.03em' }}>{globalInfo.title}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: tc.f(t), mt: 0.3 }}>{globalInfo.subtitle}</Typography>
      </Box>

      {/* Tabs */}
      <Stack direction="row">
        {tabs.map((tabLabel, i) => (
          <Box key={tabLabel} onClick={() => setTab(i)} sx={{
            flex: 1, textAlign: 'center', py: 1, cursor: 'pointer',
            borderBottom: '2px solid', borderColor: tab === i ? GOLD : 'transparent',
          }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tab === i ? tc.h(t) : tc.f(t), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tabLabel}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Tab: Profil */}
      {tab === 0 && (
        <>
          {/* Structure & Proportions */}
          <Box sx={card(t, { p: 2.5 })}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Structure & proportions</Typography>
            {[
              { l: 'Ossature', v: result.structure.frameSize },
              { l: 'Épaules', v: result.structure.shoulderToHip },
              { l: 'Cage tho.', v: result.structure.ribcageDepth },
              { l: 'Torse', v: result.proportions.torsoLength },
              { l: 'Bras', v: result.proportions.armLength },
              { l: 'Fémurs', v: result.proportions.femurLength },
              { l: 'Valgus genou', v: result.proportions.kneeValgus },
            ].map((item, i, arr) => (
              <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, ...(i < arr.length - 1 ? sepSx : {}) }}>
                <Typography sx={{ fontSize: '0.68rem', color: tc.m(t) }}>{item.l}</Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: tc.h(t) }}>{segmentLabels[item.v] || item.v}</Typography>
              </Stack>
            ))}
          </Box>

          {/* Mobilité */}
          <Box sx={card(t, { p: 2.5 })}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Mobilité</Typography>
            <Stack direction="row" justifyContent="space-around" textAlign="center">
              {[
                { l: 'Chevilles', v: result.mobility.ankleDorsiflexion, warn: result.mobility.ankleDorsiflexion === 'limited' },
                { l: 'Ischio-jamb.', v: result.mobility.posteriorChain, warn: result.mobility.posteriorChain === 'limited' },
                { l: 'Poignets', v: result.mobility.wristMobility, warn: result.mobility.wristMobility !== 'none' },
              ].map((m) => (
                <Box key={m.l}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: m.warn ? '#f97316' : tc.h(t) }}>{segmentLabels[m.v] || m.v}</Typography>
                  <Typography sx={{ fontSize: '0.42rem', color: tc.f(t), mt: 0.2, textTransform: 'uppercase' }}>{m.l}</Typography>
                  {m.warn && <Warning size={12} weight={W} color="#f97316" style={{ marginTop: 2 }} />}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Points forts + faibles */}
          <Stack direction="row" spacing={1.2}>
            {result.strengths.length > 0 && (
              <Box sx={card(t, { flex: 1, p: 2 })}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.8 }}>
                  <Star size={12} weight={W} color={GOLD} />
                  <Typography sx={lblSx}>Points forts</Typography>
                </Stack>
                {result.strengths.map((s) => (
                  <Typography key={s} sx={{ fontSize: '0.65rem', color: tc.m(t), mb: 0.4, lineHeight: 1.4 }}>+ {s}</Typography>
                ))}
              </Box>
            )}
            {result.weaknesses.length > 0 && (
              <Box sx={card(t, { flex: 1, p: 2 })}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.8 }}>
                  <Warning size={12} weight={W} color="#f97316" />
                  <Typography sx={lblSx}>À travailler</Typography>
                </Stack>
                {result.weaknesses.map((w) => (
                  <Typography key={w} sx={{ fontSize: '0.65rem', color: tc.m(t), mb: 0.4, lineHeight: 1.4 }}>- {w}</Typography>
                ))}
              </Box>
            )}
          </Stack>

          {/* Description */}
          <Typography sx={{ fontSize: '0.65rem', color: tc.m(t), fontStyle: 'italic', lineHeight: 1.5 }}>
            {globalInfo.description}
          </Typography>
        </>
      )}

      {/* Tab: Exercices */}
      {tab === 1 && (
        <>
          <ExerciseCard recommendation={result.squat} />
          <ExerciseCard recommendation={result.deadlift} />
          <ExerciseCard recommendation={result.bench} />
          <ExerciseCard recommendation={result.curls} />
        </>
      )}

      {/* Tab: Corrections */}
      {tab === 2 && (
        <>
          {result.mobilityWork.length > 0 && (
            <Box sx={card(t, { p: 2.5 })}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Travail correctif</Typography>
              <Stack spacing={1.5}>
                {result.mobilityWork.map((work) => (
                  <MobilityWorkItem key={work.area} work={work} />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={card(t, { p: 2.5 })}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Potentiel musculaire</Typography>
            <Stack spacing={1.5}>
              <InsertionBar label="Biceps" potential={result.insertions.biceps} />
              <InsertionBar label="Mollets" potential={result.insertions.calves} />
              <InsertionBar label="Pectoraux" potential={result.insertions.chest} />
            </Stack>
          </Box>
        </>
      )}

      {/* Actions */}
      <Box
        component={Link}
        href="/workout/program"
        sx={{
          display: 'block', textAlign: 'center', py: 1.5, borderRadius: '14px',
          bgcolor: tc.h(t), color: surfaceBg(t),
          fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
          '&:active': { opacity: 0.85 },
        }}
      >
        Générer mon programme
      </Box>
      <Stack direction="row" spacing={1}>
        <Box
          component={Link}
          href="/"
          sx={{
            flex: 1, display: 'block', textAlign: 'center', py: 1.2, borderRadius: '14px',
            border: '1px solid', borderColor: d ? alpha('#fff', 0.1) : alpha('#000', 0.08), color: tc.m(t),
            fontWeight: 600, fontSize: '0.72rem', textDecoration: 'none',
          }}
        >
          Accueil
        </Box>
        <Box
          role="button"
          tabIndex={0}
          onClick={onRetake}
          sx={{
            flex: 1, textAlign: 'center', py: 1.2, borderRadius: '14px',
            border: '1px solid', borderColor: d ? alpha('#fff', 0.1) : alpha('#000', 0.08), color: tc.m(t),
            fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer',
          }}
        >
          Refaire
        </Box>
      </Stack>
    </Stack>
  );
}

function InsertionBar({ label, potential }: { label: string; potential: InsertionPotential }) {
  const { t, d } = useThemeTokens();
  const valueMap: Record<InsertionPotential, number> = { high: 100, medium: 60, low: 30 };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
        <Typography sx={{ fontSize: '0.7rem', color: tc.m(t) }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: tc.h(t) }}>{insertionLabels[potential]}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={valueMap[potential]}
        sx={{
          height: 3, borderRadius: 2,
          bgcolor: alpha(GOLD, 0.1),
          '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
        }}
      />
    </Box>
  );
}

function ExerciseCard({ recommendation }: { recommendation: ExerciseRecommendation }) {
  const { t, d } = useThemeTokens();
  const subLbl = { fontSize: '0.55rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.08em', textTransform: 'uppercase' as const };
  const hasContent =
    recommendation.advantages.length > 0 ||
    recommendation.disadvantages.length > 0 ||
    recommendation.variants.length > 0 ||
    recommendation.tips.length > 0;

  if (!hasContent) return null;

  return (
    <Accordion
      disableGutters
      defaultExpanded={false}
      sx={{
        '&:before': { display: 'none' },
        ...card(t),
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<CaretDown size={16} weight={W} style={{ color: tc.f(t) }} />}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: tc.h(t) }}>{recommendation.exercise}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 1 }}>
        <Stack spacing={1.5}>
          {recommendation.advantages.length > 0 && (
            <Box>
              <Typography sx={subLbl}>Avantages</Typography>
              <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                {recommendation.advantages.map((adv) => (
                  <Typography key={adv} sx={{ fontSize: '0.7rem', color: tc.m(t), lineHeight: 1.4 }}>• {adv}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.disadvantages.length > 0 && (
            <Box>
              <Typography sx={subLbl}>À considérer</Typography>
              <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                {recommendation.disadvantages.map((dis) => (
                  <Typography key={dis} sx={{ fontSize: '0.7rem', color: tc.m(t), lineHeight: 1.4 }}>• {dis}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          {recommendation.variants.length > 0 && (
            <Box>
              <Typography sx={subLbl}>Variantes recommandées</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: tc.m(t), mt: 0.5, lineHeight: 1.4 }}>
                {recommendation.variants.join(' · ')}
              </Typography>
            </Box>
          )}

          {recommendation.tips.length > 0 && (
            <Box>
              <Typography sx={subLbl}>Conseils</Typography>
              <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                {recommendation.tips.map((tip) => (
                  <Typography key={tip} sx={{ fontSize: '0.7rem', color: tc.m(t), lineHeight: 1.4 }}>• {tip}</Typography>
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
  const { t, d } = useThemeTokens();
  const priorityLabels: Record<string, string> = {
    high: 'Prioritaire',
    medium: 'Recommandé',
    low: 'Optionnel',
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: tc.h(t) }}>{work.area}</Typography>
        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: work.priority === 'high' ? '#f97316' : GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {priorityLabels[work.priority]}
        </Typography>
      </Stack>
      <Stack spacing={0.3}>
        {work.exercises.map((ex) => (
          <Typography key={ex} sx={{ fontSize: '0.65rem', color: tc.m(t), lineHeight: 1.4 }}>• {ex}</Typography>
        ))}
      </Stack>
    </Box>
  );
}
