'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDark } from '@/hooks/useDark';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx, goldOutlinedBtnSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Check, Barbell } from '@phosphor-icons/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import {
  generateProgram,
  saveProgramAsTemplates,
  type GeneratedProgram,
} from './actions';
import {
  type ProgramGoal,
  type ProgramApproach,
  type ProgramSplit,
  type ProgramConfig,
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
  APPROACH_LABELS,
  APPROACH_DESCRIPTIONS,
  SPLIT_LABELS,
  SPLIT_MIN_DAYS,
} from './constants';
import { MorphoScoreBadge } from '@/components/workout/MorphoTipsPanel';

const STEPS = ['Objectif', 'Approche', 'Split', 'Fréquence', 'Preview'];

export default function ProgramGeneratorPage() {
  const router = useRouter();
  const d = useDark();
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<ProgramConfig>({
    goal: 'hypertrophy',
    approach: 'balanced',
    split: 'ppl',
    daysPerWeek: 4,
  });
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = useCallback(async () => {
    if (activeStep === STEPS.length - 2) {
      // Generate program before preview
      setIsGenerating(true);
      try {
        const program = await generateProgram(config);
        setGeneratedProgram(program);
        setActiveStep((prev) => prev + 1);
      } catch (error) {
        console.error('Error generating program:', error);
      } finally {
        setIsGenerating(false);
      }
    } else if (activeStep === STEPS.length - 1) {
      // Save program
      if (!generatedProgram) return;
      setIsSaving(true);
      try {
        await saveProgramAsTemplates(generatedProgram);
        router.push('/workout?saved=true');
      } catch (error) {
        console.error('Error saving program:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  }, [activeStep, config, generatedProgram, router]);

  const handleBack = () => {
    if (activeStep === 0) {
      router.back();
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const isNextDisabled = activeStep === 3 && config.daysPerWeek < SPLIT_MIN_DAYS[config.split];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(d), pb: 12 }}>
      {/* Header */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
        bgcolor: panelBg(d),
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={handleBack}>
            <ArrowLeft weight={W} size={22} color={tc.h(d)} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: tc.h(d) }}>Générer un programme</Typography>
        </Stack>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 2, py: 3 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            '& .MuiStepIcon-root.Mui-active': { color: GOLD },
            '& .MuiStepIcon-root.Mui-completed': { color: GOLD },
            '& .MuiStepLabel-label': { color: tc.f(d), fontSize: '0.75rem' },
            '& .MuiStepLabel-label.Mui-active': { color: GOLD },
            '& .MuiStepLabel-label.Mui-completed': { color: tc.m(d) },
            '& .MuiStepConnector-line': { borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1) },
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2 }}>
        {activeStep === 0 && (
          <GoalStep
            selected={config.goal}
            onSelect={(goal) => setConfig((prev) => ({ ...prev, goal }))}
          />
        )}
        {activeStep === 1 && (
          <ApproachStep
            selected={config.approach}
            onSelect={(approach) => setConfig((prev) => ({ ...prev, approach }))}
          />
        )}
        {activeStep === 2 && (
          <SplitStep
            selected={config.split}
            onSelect={(split) => setConfig((prev) => ({ ...prev, split, daysPerWeek: Math.max(prev.daysPerWeek, SPLIT_MIN_DAYS[split]) }))}
          />
        )}
        {activeStep === 3 && (
          <FrequencyStep
            config={config}
            onChange={(daysPerWeek) => setConfig((prev) => ({ ...prev, daysPerWeek }))}
          />
        )}
        {activeStep === 4 && generatedProgram && (
          <PreviewStep program={generatedProgram} />
        )}
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          bgcolor: panelBg(d),
          zIndex: 10,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleBack}
            sx={{ ...goldOutlinedBtnSx, color: tc.m(d) }}
          >
            {activeStep === 0 ? 'Annuler' : 'Retour'}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNext}
            disabled={isNextDisabled || isGenerating || isSaving}
            sx={goldBtnSx}
          >
            {isGenerating ? (
              <CircularProgress size={24} sx={{ color: GOLD_CONTRAST }} />
            ) : isSaving ? (
              'Sauvegarde...'
            ) : activeStep === STEPS.length - 1 ? (
              'Sauvegarder'
            ) : activeStep === STEPS.length - 2 ? (
              'Générer'
            ) : (
              'Suivant'
            )}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

// Step 1: Goal Selection
function GoalStep({ selected, onSelect }: { selected: ProgramGoal; onSelect: (goal: ProgramGoal) => void }) {
  const d = useDark();
  const goals: ProgramGoal[] = ['strength', 'hypertrophy', 'metabolic', 'powerbuilding', 'athletic', 'recomposition'];
  const icons: Record<ProgramGoal, string> = {
    strength: '🏋️',
    hypertrophy: '💪',
    metabolic: '🔥',
    powerbuilding: '⚡',
    athletic: '🎯',
    recomposition: '🔄',
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" textAlign="center" sx={{ fontWeight: 600, mb: 1, color: tc.h(d) }}>
        Objectif
      </Typography>
      {goals.map((goal) => (
        <Box
          key={goal}
          onClick={() => onSelect(goal)}
          sx={{
            ...card(d),
            cursor: 'pointer',
            border: '2px solid',
            borderColor: selected === goal ? GOLD : (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
            transition: 'all 0.2s',
          }}
        >
          <Box sx={{ py: 1, px: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.2rem">{icons[goal]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, color: tc.h(d) }}>
                  {GOAL_LABELS[goal]}
                </Typography>
                <Typography variant="caption" sx={{ color: tc.m(d) }}>
                  {GOAL_DESCRIPTIONS[goal]}
                </Typography>
              </Box>
              {selected === goal && <Check weight="bold" size={18} color={GOLD} />}
            </Stack>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

// Step 2: Approach Selection
function ApproachStep({ selected, onSelect }: { selected: ProgramApproach; onSelect: (approach: ProgramApproach) => void }) {
  const d = useDark();
  const approaches: ProgramApproach[] = ['leverage_strengths', 'fix_weaknesses', 'balanced'];
  const icons: Record<ProgramApproach, string> = {
    leverage_strengths: '🚀',
    fix_weaknesses: '🎯',
    balanced: '⚖️',
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" textAlign="center" sx={{ fontWeight: 600, mb: 1, color: tc.h(d) }}>
        Approche morpho
      </Typography>
      {approaches.map((approach) => (
        <Box
          key={approach}
          onClick={() => onSelect(approach)}
          sx={{
            ...card(d),
            cursor: 'pointer',
            border: '2px solid',
            borderColor: selected === approach ? GOLD : (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
            transition: 'all 0.2s',
          }}
        >
          <Box sx={{ py: 1.5, px: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.5rem">{icons[approach]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, color: tc.h(d) }}>
                  {APPROACH_LABELS[approach]}
                </Typography>
                <Typography variant="caption" sx={{ color: tc.m(d) }}>
                  {APPROACH_DESCRIPTIONS[approach]}
                </Typography>
              </Box>
              {selected === approach && <Check weight="bold" size={18} color={GOLD} />}
            </Stack>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

// Step 3: Split Selection
function SplitStep({ selected, onSelect }: { selected: ProgramSplit; onSelect: (split: ProgramSplit) => void }) {
  const d = useDark();
  const splits: ProgramSplit[] = ['full_body', 'upper_lower', 'ppl', 'bro_split'];
  const icons: Record<ProgramSplit, string> = {
    full_body: '🔄',
    ppl: '💪',
    upper_lower: '↕️',
    bro_split: '📅',
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" textAlign="center" sx={{ fontWeight: 600, mb: 1, color: tc.h(d) }}>
        Split
      </Typography>
      {splits.map((split) => (
        <Box
          key={split}
          onClick={() => onSelect(split)}
          sx={{
            ...card(d),
            cursor: 'pointer',
            border: '2px solid',
            borderColor: selected === split ? GOLD : (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
            transition: 'all 0.2s',
          }}
        >
          <Box sx={{ py: 1, px: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.2rem">{icons[split]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, color: tc.h(d) }}>
                  {SPLIT_LABELS[split]}
                </Typography>
                <Typography variant="caption" sx={{ color: tc.m(d) }}>
                  min {SPLIT_MIN_DAYS[split]} jours
                </Typography>
              </Box>
              {selected === split && <Check weight="bold" size={18} color={GOLD} />}
            </Stack>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

// Step 4: Frequency Selection
function FrequencyStep({
  config,
  onChange,
}: {
  config: ProgramConfig;
  onChange: (days: number) => void;
}) {
  const d = useDark();
  const minDays = SPLIT_MIN_DAYS[config.split];
  const maxDays = 7;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" textAlign="center" sx={{ fontWeight: 600, color: tc.h(d) }}>
        Fréquence
      </Typography>

      <Box sx={card(d, { p: 3 })}>
        <Typography variant="h2" textAlign="center" sx={{ mb: 1, color: GOLD }}>
          {config.daysPerWeek}
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 2, color: tc.m(d) }}>
          jours / semaine
        </Typography>
        <Slider
          value={config.daysPerWeek}
          onChange={(_, value) => onChange(value as number)}
          min={minDays}
          max={maxDays}
          step={1}
          marks={Array.from(
            { length: maxDays - minDays + 1 },
            (_, i) => ({
              value: minDays + i,
              label: `${minDays + i}`,
            })
          )}
          sx={{
            px: 2,
            color: GOLD,
            '& .MuiSlider-markLabel': { color: tc.f(d) },
            '& .MuiSlider-thumb': { bgcolor: GOLD },
            '& .MuiSlider-track': { bgcolor: GOLD },
            '& .MuiSlider-rail': { bgcolor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12) },
          }}
        />
      </Box>
    </Stack>
  );
}

// Step 5: Preview
function PreviewStep({ program }: { program: GeneratedProgram }) {
  const d = useDark();

  return (
    <Stack spacing={2}>
      <Typography variant="h6" textAlign="center" sx={{ mb: 1, color: tc.h(d) }}>
        Ton programme personnalisé
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
        <Chip label={GOAL_LABELS[program.config.goal]} variant="outlined" size="small" sx={{ color: GOLD, borderColor: alpha(GOLD, 0.4) }} />
        <Chip label={APPROACH_LABELS[program.config.approach]} variant="outlined" size="small" sx={{ color: tc.m(d), borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12) }} />
        <Chip label={SPLIT_LABELS[program.config.split]} variant="outlined" size="small" sx={{ color: tc.m(d), borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12) }} />
        <Chip label={`${program.config.daysPerWeek}j/sem`} variant="outlined" size="small" sx={{ color: tc.m(d), borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12) }} />
      </Stack>

      {program.workouts.map((workout, idx) => (
        <Box key={idx} sx={card(d, { p: 2 })}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Barbell weight={W} size={22} color={GOLD} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(d) }}>
              {workout.name}
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            {workout.exercises.map((ex, exIdx) => (
              <Box key={exIdx}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <MorphoScoreBadge score={ex.morphoScore} size="small" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: tc.h(d) }}>
                        {ex.exerciseName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: tc.m(d) }}>
                        {ex.sets} × {ex.reps} • {ex.restSeconds}s repos
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
                {ex.notes.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', ml: 5, mt: 0.5, fontStyle: 'italic', color: tc.f(d) }}>
                    {ex.notes[0]}
                  </Typography>
                )}
                {exIdx < workout.exercises.length - 1 && (
                  <Box sx={{ mt: 1.5, borderTop: '1px solid', borderColor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.06) }} />
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
