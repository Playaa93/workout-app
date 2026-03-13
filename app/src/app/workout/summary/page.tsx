'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Grow from '@mui/material/Grow';
import Model from 'react-body-highlighter';
import {
  ClockCounterClockwise,
  House,
  Trophy,
  Barbell,
  Timer,
  Repeat,
  Fire,
  ClockCountdown,
  ListNumbers,
  ArrowLeft,
} from '@phosphor-icons/react';
import { GOLD, GOLD_DARK, GOLD_MID, GOLD_CONTRAST, GOLD_LIGHT, W, tc, card, meshBg } from '@/lib/design-tokens';
import { alpha } from '@mui/material/styles';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity } from '@/db/schema';
import { useThemeTokens } from '@/hooks/useDark';
import type { ThemeId } from '@/lib/theme-presets';
import FullScreenLoader from '@/components/FullScreenLoader';
import { MUSCLE_LABELS, getMappedMuscles, getBestView, buildExerciseModelData, buildGlobalModelData } from '@/lib/muscle-mapping';
import { useSessionSets, useExercises } from '@/powersync/queries/workout-queries';
import { useQuery } from '@powersync/react';
import { parseJsonArray } from '@/powersync/helpers';

// ─── Types ───────────────────────────────────────────────────────────

type ExerciseInfo = {
  id: string;
  nameFr: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleGroup: string;
};

type SetInfo = {
  setNumber: number;
  reps: number | null;
  weight: string | null;
  rpe: number | null;
  isWarmup: boolean;
  restTaken: number | null;
};

type ExerciseGroup = {
  exercise: ExerciseInfo;
  sets: SetInfo[];
};

type RecapData = {
  sessionName: string;
  date: string;
  duration: number;
  totalVolume: number;
  avgWeight: number;
  avgReps: number;
  avgRest: number;
  avgSets: number;
  exerciseGroups: ExerciseGroup[];
  allMusclesMapped: string[];
  muscleFrequency: Map<string, number>;
};

// ─── Compute Stats ───────────────────────────────────────────────────

function computeRecapData(
  groups: ExerciseGroup[],
  sessionDuration: number,
  sessionName: string,
  sessionDate: Date,
): RecapData {
  const allWorkSets = groups.flatMap(g => g.sets.filter(s => !s.isWarmup));
  const totalVolume = allWorkSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);
  const weightsNonZero = allWorkSets.filter(s => parseFloat(s.weight || '0') > 0);
  const avgWeight = weightsNonZero.length > 0
    ? weightsNonZero.reduce((sum, s) => sum + parseFloat(s.weight || '0'), 0) / weightsNonZero.length
    : 0;
  const avgReps = allWorkSets.length > 0
    ? allWorkSets.reduce((sum, s) => sum + (s.reps || 0), 0) / allWorkSets.length
    : 0;
  const restSets = allWorkSets.filter(s => s.restTaken && s.restTaken > 0);
  const avgRest = restSets.length > 0
    ? restSets.reduce((sum, s) => sum + (s.restTaken || 0), 0) / restSets.length
    : 0;

  const muscleFrequency = new Map<string, number>();
  const allMusclesSet = new Set<string>();
  for (const g of groups) {
    const workSetsCount = g.sets.filter(s => !s.isWarmup).length;
    const primary = getMappedMuscles(g.exercise.primaryMuscles);
    const secondary = getMappedMuscles(g.exercise.secondaryMuscles).filter(m => !primary.includes(m));
    for (const m of primary) {
      allMusclesSet.add(m);
      muscleFrequency.set(m, (muscleFrequency.get(m) || 0) + workSetsCount);
    }
    for (const m of secondary) {
      allMusclesSet.add(m);
      muscleFrequency.set(m, (muscleFrequency.get(m) || 0) + Math.ceil(workSetsCount * 0.5));
    }
  }

  const dateStr = sessionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    sessionName,
    date: dateStr,
    duration: sessionDuration,
    totalVolume: Math.round(totalVolume),
    avgWeight: Math.round(avgWeight * 10) / 10,
    avgReps: Math.round(avgReps * 10) / 10,
    avgRest: Math.round(avgRest),
    avgSets: groups.length > 0 ? Math.round((allWorkSets.length / groups.length) * 10) / 10 : 0,
    exerciseGroups: groups,
    allMusclesMapped: Array.from(allMusclesSet),
    muscleFrequency,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return `00:${m.toString().padStart(2, '0')}`;
}

function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}'${s.toString().padStart(2, '0')}`;
  if (m > 0) return `${m}'00`;
  return `0'${s.toString().padStart(2, '0')}`;
}

// ─── Main Content ────────────────────────────────────────────────────

function SummaryContent() {
  const searchParams = useSearchParams();
  const { t, d } = useThemeTokens();

  const sessionId = searchParams.get('sessionId');
  const type = searchParams.get('type') || 'strength';
  const xp = parseInt(searchParams.get('xp') || '0');
  const volume = parseFloat(searchParams.get('volume') || '0');
  const duration = parseInt(searchParams.get('duration') || '0');
  const prs = parseInt(searchParams.get('prs') || '0');

  // Cardio params
  const activity = searchParams.get('activity') as CardioActivity | null;
  const distanceM = parseFloat(searchParams.get('distance') || '0');
  const pace = parseInt(searchParams.get('pace') || '0');
  const calories = parseInt(searchParams.get('calories') || '0');

  const isCardio = type === 'cardio';
  const activityInfo = isCardio && activity ? CARDIO_ACTIVITIES[activity] : null;
  const isEmpty = duration === 0 && volume === 0 && prs === 0;
  const isMinimal = duration > 0 && xp === 0 && volume === 0 && prs === 0;
  const noXpEarned = isEmpty || isMinimal;

  // Load real session data for strength recap (single query with template name JOIN)
  const { data: sessionRows } = useQuery<Record<string, unknown>>(
    sessionId
      ? `SELECT ws.*, wt.name as template_name FROM workout_sessions ws LEFT JOIN workout_templates wt ON ws.template_id = wt.id WHERE ws.id = ?`
      : `SELECT * FROM workout_sessions WHERE 0`,
    sessionId ? [sessionId] : []
  );
  const { data: setRows } = useSessionSets(sessionId);
  const { data: exerciseRows } = useExercises();

  const recapData = useMemo<RecapData | null>(() => {
    if (isCardio || !sessionId || !setRows?.length || !exerciseRows?.length) return null;

    const session = sessionRows?.[0];
    const exerciseMap = new Map(exerciseRows.map(e => [e.id, e]));

    const groupMap = new Map<string, { exercise: ExerciseInfo; sets: SetInfo[] }>();
    for (const row of setRows) {
      const exId = row.exercise_id ?? '';
      if (!exId) continue;
      if (!groupMap.has(exId)) {
        const ex = exerciseMap.get(exId);
        groupMap.set(exId, {
          exercise: {
            id: exId,
            nameFr: (row as Record<string, unknown>).exercise_name as string || ex?.name_fr || 'Exercice',
            primaryMuscles: parseJsonArray(ex?.primary_muscles),
            secondaryMuscles: parseJsonArray(ex?.secondary_muscles),
            muscleGroup: ex?.muscle_group || '',
          },
          sets: [],
        });
      }
      groupMap.get(exId)!.sets.push({
        setNumber: row.set_number ?? 0,
        reps: row.reps,
        weight: row.weight,
        rpe: row.rpe,
        isWarmup: row.is_warmup === 1,
        restTaken: row.rest_taken,
      });
    }

    const exerciseGroups = Array.from(groupMap.values());
    const sessionDuration = (session?.duration_minutes as number) || duration;
    const sessionName = (session?.template_name as string) || (session?.notes as string) || 'Séance';
    const startDate = session?.started_at ? new Date(session.started_at as string) : new Date();

    return computeRecapData(exerciseGroups, sessionDuration, sessionName, startDate);
  }, [sessionId, sessionRows, setRows, exerciseRows, isCardio, duration]);

  const hasRecap = recapData && recapData.exerciseGroups.length > 0;

  // For strength sessions with recap data → full recap page
  if (!isCardio && hasRecap && !noXpEarned) {
    return (
      <StrengthRecap
        data={recapData}
        xp={xp}
        prs={prs}
        t={t}
        d={d}
      />
    );
  }

  // Fallback: original celebration screen (empty/minimal/cardio/no session data)
  return (
    <FallbackSummary
      t={t}
      d={d}
      isCardio={isCardio}
      activityInfo={activityInfo}
      xp={xp}
      volume={volume}
      duration={duration}
      prs={prs}
      distanceM={distanceM}
      pace={pace}
      calories={calories}
    />
  );
}

// ─── Strength Recap (full page) ──────────────────────────────────────

function StrengthRecap({
  data,
  xp,
  prs,
  t,
  d,
}: {
  data: RecapData;
  xp: number;
  prs: number;
  t: ThemeId;
  d: boolean;
}) {
  const globalModelData = useMemo(() => buildGlobalModelData(data.muscleFrequency), [data.muscleFrequency]);

  const accent = d ? GOLD_MID : GOLD_DARK;
  const cellBg = d ? alpha('#ffffff', 0.06) : alpha(GOLD_DARK, 0.06);
  const divider = d ? alpha(GOLD_MID, 0.12) : alpha(GOLD_DARK, 0.18);
  const highlightSecondary = d ? alpha(GOLD_MID, 0.4) : alpha(GOLD_DARK, 0.35);
  const bodyBg = d ? '#2a2822' : '#e4ddd0';
  const chipBg = d ? alpha(GOLD_MID, 0.15) : alpha(GOLD_DARK, 0.1);
  const sectionBorder = d ? alpha(GOLD_MID, 0.1) : alpha(GOLD_DARK, 0.15);
  const badgeChipSx = {
    bgcolor: alpha(GOLD, 0.15),
    color: GOLD,
    fontWeight: 700,
    fontSize: '0.7rem',
    height: 24,
    borderRadius: '8px',
    border: `1px solid ${alpha(GOLD, 0.3)}`,
  };

  return (
    <Box sx={{ background: meshBg(t), minHeight: '100dvh', pb: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" sx={{
        px: 1.5, pt: 1.5, pb: 1,
        position: 'sticky', top: 0, zIndex: 10,
        bgcolor: d ? alpha('#0a0a09', 0.85) : alpha('#f5f3ef', 0.85),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <Link href="/workout" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ color: tc.h(t), mr: 1, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} weight={W} />
          </Box>
        </Link>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: tc.h(t) }}>
          Récapitulatif de la séance
        </Typography>
      </Stack>

      {/* Session info + XP/PR badges */}
      <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: accent }}>
          {data.sessionName}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
          <Typography sx={{ fontSize: '0.75rem', color: tc.f(t) }}>
            {data.date}
          </Typography>
          {xp > 0 && (
            <Chip label={`+${xp} XP`} size="small" sx={badgeChipSx} />
          )}
          {prs > 0 && (
            <Chip
              icon={<Trophy size={14} weight="fill" color={GOLD} />}
              label={prs === 1 ? '1 PR' : `${prs} PRs`}
              size="small"
              sx={badgeChipSx}
            />
          )}
        </Stack>
      </Box>

      {/* Divider */}
      <Box sx={{ height: 1, bgcolor: divider, mx: 2, mb: 2 }} />

      {/* ── MUSCLES TRAVAILLÉS ── */}
      <Box sx={{ px: 2 }}>
        <Typography sx={{
          fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 2, color: accent, mb: 1.5,
        }}>
          Muscles travaillés
        </Typography>

        {/* Body maps */}
        <Box sx={{ ...card(t, { borderColor: sectionBorder }), p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="center" spacing={0}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', '& svg': { maxHeight: 280 } }}>
              <Model
                data={globalModelData}
                style={{ width: '100%', maxWidth: 155 }}
                highlightedColors={[highlightSecondary, accent]}
                bodyColor={bodyBg}
                type="anterior"
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', '& svg': { maxHeight: 280 } }}>
              <Model
                data={globalModelData}
                style={{ width: '100%', maxWidth: 155 }}
                highlightedColors={[highlightSecondary, accent]}
                bodyColor={bodyBg}
                type="posterior"
              />
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: accent }} />
              <Typography sx={{ fontSize: '0.65rem', color: tc.m(t) }}>Principal</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: highlightSecondary }} />
              <Typography sx={{ fontSize: '0.65rem', color: tc.m(t) }}>Secondaire</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Muscle chips */}
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          {data.allMusclesMapped.map(m => (
            <Chip key={m} label={MUSCLE_LABELS[m] || m} size="small" sx={{
              bgcolor: chipBg, color: accent,
              fontWeight: 600, fontSize: '0.75rem',
              height: 32, borderRadius: '10px',
              border: `1px solid ${alpha(accent, 0.25)}`,
            }} />
          ))}
        </Stack>
      </Box>

      {/* ── STATS GRID 2×3 ── */}
      <Box sx={{ mx: 2, mb: 3, ...card(t, { borderColor: sectionBorder }), overflow: 'hidden' }}>
        {[
          [
            { icon: <Timer size={22} weight={W} color={accent} />, val: formatDuration(data.duration), unit: '', label: 'durée de la séance' },
            { icon: <Fire size={22} weight={W} color={accent} />, val: (data.totalVolume / 1000).toFixed(2), unit: ' t.', label: 'tonnage total' },
          ],
          [
            { icon: <Barbell size={22} weight={W} color={accent} />, val: data.avgWeight.toFixed(2), unit: ' kg', label: 'poids moy.' },
            { icon: <Repeat size={22} weight={W} color={accent} />, val: data.avgReps.toFixed(2), unit: '', label: 'reps moy.' },
          ],
          [
            { icon: <ClockCountdown size={22} weight={W} color={accent} />, val: formatRest(data.avgRest), unit: ' min.', label: 'repos moy.' },
            { icon: <ListNumbers size={22} weight={W} color={accent} />, val: data.avgSets.toFixed(2), unit: '', label: 'séries moy.' },
          ],
        ].map((row, ri) => (
          <Stack key={ri} direction="row" sx={{
            borderBottom: ri < 2 ? `1px solid ${divider}` : 'none',
          }}>
            {row.map((stat, ci) => (
              <Box key={ci} sx={{
                flex: 1, px: 2, py: 1.75,
                borderRight: ci === 0 ? `1px solid ${divider}` : 'none',
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                  {stat.icon}
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: tc.h(t), lineHeight: 1 }}>
                    {stat.val}
                    {stat.unit && (
                      <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 400, color: tc.m(t) }}>
                        {stat.unit}
                      </Typography>
                    )}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.7rem', color: tc.f(t), pl: 4.5 }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        ))}
      </Box>

      {/* Divider */}
      <Box sx={{ height: 1, bgcolor: divider, mx: 2, mb: 2 }} />

      {/* ── SÉRIES PAR EXERCICE ── */}
      <Box sx={{ px: 2 }}>
        <Typography sx={{
          fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 2, color: accent, mb: 2,
        }}>
          Séries par exercice
        </Typography>

        <Stack spacing={3}>
          {data.exerciseGroups.map((g, idx) => {
            const modelData = buildExerciseModelData(g.exercise.nameFr, g.exercise.primaryMuscles, g.exercise.secondaryMuscles);
            const allM = [...getMappedMuscles(g.exercise.primaryMuscles), ...getMappedMuscles(g.exercise.secondaryMuscles)];
            const view = getBestView(allM);
            const workSets = g.sets.filter(s => !s.isWarmup);
            const vol = workSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);

            return (
              <Box key={g.exercise.id} sx={{ ...card(t, { borderColor: sectionBorder }), p: 2 }}>
                {/* Exercise header */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Box sx={{
                    width: 68, height: 68, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '& svg': { maxHeight: 64 },
                  }}>
                    <Model
                      data={modelData}
                      style={{ width: '100%' }}
                      highlightedColors={[highlightSecondary, accent]}
                      bodyColor={bodyBg}
                      type={view}
                    />
                  </Box>
                  <Box sx={{ pt: 0.25, flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: accent }}>
                      Exercice {idx + 1} sur {data.exerciseGroups.length}
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(t), lineHeight: 1.25 }}>
                      {g.exercise.nameFr}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: tc.f(t), mt: 0.25 }}>
                      {workSets.length} séries · {Math.round(vol)} kg
                    </Typography>
                  </Box>
                </Stack>

                {/* Column headers */}
                <Stack direction="row" spacing={0.75} sx={{ mb: 0.75, px: 0.25 }}>
                  {[
                    { label: 'série', w: 48 },
                    { label: 'reps' },
                    { label: 'kg' },
                    { label: 'repos' },
                  ].map((col, ci) => (
                    <Box key={ci} sx={{ ...(ci === 0 ? { width: 48, flexShrink: 0 } : { flex: 1 }), textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.65rem', color: accent, fontWeight: 500 }}>{col.label}</Typography>
                    </Box>
                  ))}
                </Stack>

                {/* Set rows — pill cells */}
                <Stack spacing={0.6}>
                  {g.sets.map(s => (
                    <Stack key={s.setNumber} direction="row" spacing={0.6}>
                      {[
                        { val: s.isWarmup ? 'W' : String(s.setNumber), w: 48 },
                        { val: s.reps != null ? String(s.reps) : '-' },
                        { val: s.weight ?? '-' },
                        { val: s.restTaken ? formatRest(s.restTaken) : '-' },
                      ].map((cell, ci) => (
                        <Box key={ci} sx={{
                          ...(ci === 0 ? { width: 48, flexShrink: 0 } : { flex: 1 }),
                          bgcolor: cellBg, borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          py: 1.1,
                        }}>
                          <Typography sx={{
                            fontSize: '0.9rem', fontWeight: s.isWarmup ? 400 : 600,
                            color: s.isWarmup ? tc.f(t) : tc.h(t),
                            fontStyle: s.isWarmup && ci === 0 ? 'italic' : 'normal',
                          }}>
                            {cell.val}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* ── Actions ── */}
      <Stack spacing={1.5} sx={{ px: 2, mt: 4 }}>
        <Button
          component={Link}
          href="/workout"
          variant="contained"
          size="large"
          startIcon={<ClockCounterClockwise weight={W} size={20} />}
          sx={{
            py: 1.5,
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            color: GOLD_CONTRAST,
            fontWeight: 600,
            borderRadius: '14px',
            '&:hover': {
              background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            },
          }}
        >
          Voir l&apos;historique
        </Button>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          size="large"
          startIcon={<House weight={W} size={20} />}
          sx={{
            py: 1.5,
            borderColor: alpha(GOLD, 0.4),
            color: tc.h(t),
            borderRadius: '14px',
            '&:hover': {
              borderColor: GOLD,
              bgcolor: alpha(GOLD, 0.06),
            },
          }}
        >
          Retour à l&apos;accueil
        </Button>
      </Stack>
    </Box>
  );
}

// ─── Fallback Summary (cardio / empty / minimal / no session data) ───

function FallbackSummary({
  t,
  d,
  isCardio,
  activityInfo,
  xp,
  volume,
  duration,
  prs,
  distanceM,
  pace,
  calories,
}: {
  t: ThemeId;
  d: boolean;
  isCardio: boolean;
  activityInfo: { emoji: string; label: string } | null;
  xp: number;
  volume: number;
  duration: number;
  prs: number;
  distanceM: number;
  pace: number;
  calories: number;
}) {
  const isEmpty = duration === 0 && volume === 0 && prs === 0;
  const isMinimal = duration > 0 && xp === 0 && volume === 0 && prs === 0;
  const noXpEarned = isEmpty || isMinimal;
  const volumeDisplay = volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: meshBg(t),
        textAlign: 'center',
      }}
    >
      {/* Header */}
      <Grow in timeout={500}>
        <Box sx={{ mb: 4 }}>
          {isEmpty ? (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                💤
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(t) }}>
                Séance annulée
              </Typography>
              <Typography sx={{ color: tc.m(t) }}>
                Aucun exercice effectué, pas d&apos;XP cette fois
              </Typography>
            </>
          ) : isMinimal ? (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                🤏
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(t) }}>
                Séance trop courte
              </Typography>
              <Typography sx={{ color: tc.m(t) }}>
                Ajoute des exercices la prochaine fois pour gagner de l&apos;XP
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h1" sx={{ mb: 2, fontSize: '4.5rem' }}>
                {isCardio && activityInfo ? activityInfo.emoji : '🎉'}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: tc.h(t) }}>
                {isCardio ? 'Séance cardio terminée !' : 'Séance terminée !'}
              </Typography>
              <Typography sx={{ color: tc.m(t) }}>
                Bravo, continue comme ça
              </Typography>
            </>
          )}
        </Box>
      </Grow>

      {noXpEarned ? (
        <Grow in timeout={700}>
          <Box sx={{ ...card(t), mb: 3, width: '100%', maxWidth: 360 }}>
            <Box sx={{ py: 3, px: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                <Barbell weight={W} size={22} color={GOLD} />
                <Typography variant="body1" fontWeight={600} sx={{ color: tc.h(t) }}>
                  Pour gagner de l&apos;XP :
                </Typography>
              </Stack>
              <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: tc.m(t) }}>
                  &#x2022; Ajoute au moins 1 exercice et fais une série
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(t) }}>
                  &#x2022; +50 XP de base par séance complétée
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(t) }}>
                  &#x2022; +10 XP par tonne de volume soulevé
                </Typography>
                <Typography variant="body2" sx={{ color: tc.m(t) }}>
                  &#x2022; +25 XP par record personnel battu
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Grow>
      ) : (
        <>
          {/* Stats Grid */}
          <Grow in timeout={700}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                width: '100%',
                maxWidth: 360,
                mb: 4,
              }}
            >
              <FallbackStatCard icon="⏱️" label="Durée" value={`${duration} min`} />
              {isCardio ? (
                <>
                  <FallbackStatCard icon="📏" label="Distance" value={distanceM > 0 ? formatDistance(distanceM) : '—'} />
                  <FallbackStatCard icon="🏃" label="Allure moy" value={pace > 0 ? formatPace(pace) : '—'} />
                  <FallbackStatCard icon="🔥" label="Calories" value={calories > 0 ? `${calories} kcal` : '—'} />
                </>
              ) : (
                <>
                  <FallbackStatCard icon="🏋️" label="Volume" value={volumeDisplay} />
                  <FallbackStatCard icon="⭐" label="XP gagné" value={`+${xp}`} highlight />
                  {prs > 0 && (
                    <FallbackStatCard icon="🏆" label="Records" value={prs.toString()} highlight />
                  )}
                </>
              )}
            </Box>
          </Grow>

          {xp > 0 && (
            <Grow in timeout={900}>
              <Box
                sx={{
                  ...card(t, {
                    background: d
                      ? `linear-gradient(135deg, ${alpha(GOLD, 0.18)} 0%, ${alpha(GOLD, 0.08)} 100%)`
                      : `linear-gradient(135deg, ${alpha(GOLD, 0.15)} 0%, ${alpha(GOLD, 0.06)} 100%)`,
                    borderColor: alpha(GOLD, 0.35),
                  }),
                  mb: 3,
                  width: '100%',
                  maxWidth: 360,
                }}
              >
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: GOLD }}>
                    Expérience gagnée
                  </Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: GOLD }}>
                    +{xp} XP
                  </Typography>
                </Box>
              </Box>
            </Grow>
          )}

          {!isCardio && prs > 0 && (
            <Grow in timeout={1100}>
              <Box
                sx={{
                  ...card(t, {
                    background: d
                      ? `linear-gradient(135deg, ${alpha(GOLD_LIGHT, 0.2)} 0%, ${alpha(GOLD, 0.12)} 100%)`
                      : `linear-gradient(135deg, ${alpha(GOLD_LIGHT, 0.25)} 0%, ${alpha(GOLD, 0.15)} 100%)`,
                    borderColor: alpha(GOLD, 0.4),
                  }),
                  mb: 3,
                  width: '100%',
                  maxWidth: 360,
                }}
              >
                <Box sx={{ textAlign: 'center', py: 2.5, px: 2 }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <Trophy weight={W} size={22} color={GOLD} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: GOLD }}>
                      {prs === 1 ? 'Nouveau record personnel !' : `${prs} nouveaux records !`}
                    </Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ mt: 1 }}>🏆🔥</Typography>
                </Box>
              </Box>
            </Grow>
          )}
        </>
      )}

      {/* Actions */}
      <Grow in timeout={noXpEarned ? 900 : 1300}>
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 360, mt: noXpEarned ? 1 : 0 }}>
          <Button
            component={Link}
            href="/workout"
            variant="contained"
            size="large"
            startIcon={noXpEarned ? <Barbell weight={W} size={20} /> : <ClockCounterClockwise weight={W} size={20} />}
            sx={{
              py: 1.5,
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              color: GOLD_CONTRAST,
              fontWeight: 600,
              borderRadius: '14px',
              '&:hover': {
                background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              },
            }}
          >
            {noXpEarned ? 'Nouvelle séance' : 'Voir l\'historique'}
          </Button>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="large"
            startIcon={<House weight={W} size={20} />}
            sx={{
              py: 1.5,
              borderColor: alpha(GOLD, 0.4),
              color: tc.h(t),
              borderRadius: '14px',
              '&:hover': {
                borderColor: GOLD,
                bgcolor: alpha(GOLD, 0.06),
              },
            }}
          >
            Retour à l&apos;accueil
          </Button>
        </Stack>
      </Grow>
    </Box>
  );
}

// ─── Fallback Stat Card ──────────────────────────────────────────────

function FallbackStatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { t, d: dark } = useThemeTokens();
  return (
    <Box
      sx={{
        ...card(t, {
          textAlign: 'center',
          py: 2,
          ...(highlight ? {
            background: dark ? alpha(GOLD, 0.12) : alpha(GOLD, 0.08),
            borderColor: alpha(GOLD, 0.3),
          } : {}),
        }),
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>{icon}</Typography>
      <Typography variant="caption" sx={{ color: tc.m(t) }}>{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: highlight ? GOLD : tc.h(t) }}>
        {value}
      </Typography>
    </Box>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────

export default function SummaryPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <SummaryContent />
    </Suspense>
  );
}
