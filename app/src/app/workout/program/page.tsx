'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Check from '@mui/icons-material/Check';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 12 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>Générer un programme</Typography>
        </Stack>
      </Paper>

      {/* Stepper */}
      <Box sx={{ px: 2, py: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
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
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" fullWidth onClick={handleBack}>
            {activeStep === 0 ? 'Annuler' : 'Retour'}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNext}
            disabled={isNextDisabled || isGenerating || isSaving}
            sx={{
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)' },
            }}
          >
            {isGenerating ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
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
      </Paper>
    </Box>
  );
}

// Step 1: Goal Selection
function GoalStep({ selected, onSelect }: { selected: ProgramGoal; onSelect: (goal: ProgramGoal) => void }) {
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
      <Typography variant="subtitle1" textAlign="center" fontWeight={600} sx={{ mb: 1 }}>
        Objectif
      </Typography>
      {goals.map((goal) => (
        <Card
          key={goal}
          onClick={() => onSelect(goal)}
          sx={{
            cursor: 'pointer',
            border: 2,
            borderColor: selected === goal ? 'primary.main' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.2rem">{icons[goal]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {GOAL_LABELS[goal]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {GOAL_DESCRIPTIONS[goal]}
                </Typography>
              </Box>
              {selected === goal && <Check color="primary" fontSize="small" />}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

// Step 2: Approach Selection
function ApproachStep({ selected, onSelect }: { selected: ProgramApproach; onSelect: (approach: ProgramApproach) => void }) {
  const approaches: ProgramApproach[] = ['leverage_strengths', 'fix_weaknesses', 'balanced'];
  const icons: Record<ProgramApproach, string> = {
    leverage_strengths: '🚀',
    fix_weaknesses: '🎯',
    balanced: '⚖️',
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" textAlign="center" fontWeight={600} sx={{ mb: 1 }}>
        Approche morpho
      </Typography>
      {approaches.map((approach) => (
        <Card
          key={approach}
          onClick={() => onSelect(approach)}
          sx={{
            cursor: 'pointer',
            border: 2,
            borderColor: selected === approach ? 'primary.main' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.5rem">{icons[approach]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {APPROACH_LABELS[approach]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {APPROACH_DESCRIPTIONS[approach]}
                </Typography>
              </Box>
              {selected === approach && <Check color="primary" fontSize="small" />}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

// Step 3: Split Selection
function SplitStep({ selected, onSelect }: { selected: ProgramSplit; onSelect: (split: ProgramSplit) => void }) {
  const splits: ProgramSplit[] = ['full_body', 'upper_lower', 'ppl', 'bro_split'];
  const icons: Record<ProgramSplit, string> = {
    full_body: '🔄',
    ppl: '💪',
    upper_lower: '↕️',
    bro_split: '📅',
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" textAlign="center" fontWeight={600} sx={{ mb: 1 }}>
        Split
      </Typography>
      {splits.map((split) => (
        <Card
          key={split}
          onClick={() => onSelect(split)}
          sx={{
            cursor: 'pointer',
            border: 2,
            borderColor: selected === split ? 'primary.main' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography fontSize="1.2rem">{icons[split]}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {SPLIT_LABELS[split]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  min {SPLIT_MIN_DAYS[split]} jours
                </Typography>
              </Box>
              {selected === split && <Check color="primary" fontSize="small" />}
            </Stack>
          </CardContent>
        </Card>
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
  const minDays = SPLIT_MIN_DAYS[config.split];
  const maxDays = 7;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" textAlign="center" fontWeight={600}>
        Fréquence
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h2" textAlign="center" sx={{ mb: 1 }}>
            {config.daysPerWeek}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
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
            sx={{ px: 2 }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

// Step 5: Preview
function PreviewStep({ program }: { program: GeneratedProgram }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" textAlign="center" sx={{ mb: 1 }}>
        Ton programme personnalisé
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
        <Chip label={GOAL_LABELS[program.config.goal]} color="primary" variant="outlined" size="small" />
        <Chip label={APPROACH_LABELS[program.config.approach]} color="secondary" variant="outlined" size="small" />
        <Chip label={SPLIT_LABELS[program.config.split]} variant="outlined" size="small" />
        <Chip label={`${program.config.daysPerWeek}j/sem`} variant="outlined" size="small" />
      </Stack>

      {program.workouts.map((workout, idx) => (
        <Card key={idx}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <FitnessCenter color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
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
                        <Typography variant="body2" fontWeight={500}>
                          {ex.exerciseName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ex.sets} × {ex.reps} • {ex.restSeconds}s repos
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                  {ex.notes.length > 0 && (
                    <Typography variant="caption" color="info.main" sx={{ display: 'block', ml: 5, mt: 0.5 }}>
                      💡 {ex.notes[0]}
                    </Typography>
                  )}
                  {exIdx < workout.exercises.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
