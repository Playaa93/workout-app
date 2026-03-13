'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { tc, card, GOLD } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import { triggerHaptic } from './shared';
import type { NutritionProfileData, NutritionGoal, ActivityLevel } from './shared';

const GOALS: { value: NutritionGoal; label: string; desc: string; adj: number }[] = [
  { value: 'bulk', label: 'Prise de masse', desc: 'Surplus calorique', adj: 300 },
  { value: 'maintain', label: 'Maintenance', desc: 'Équilibre énergétique', adj: 0 },
  { value: 'cut', label: 'Sèche', desc: 'Déficit calorique', adj: -400 },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string; mult: number }[] = [
  { value: 'sedentary', label: 'Sédentaire', desc: 'Bureau, peu de mouvement', mult: 1.2 },
  { value: 'light', label: 'Légèrement actif', desc: '1-2x sport/sem', mult: 1.375 },
  { value: 'moderate', label: 'Modérément actif', desc: '3-4x sport/sem', mult: 1.55 },
  { value: 'active', label: 'Actif', desc: '5-6x sport/sem', mult: 1.725 },
  { value: 'very_active', label: 'Très actif', desc: '2x/jour ou travail physique', mult: 1.9 },
];

export default function SettingsView({
  profile,
  onSave,
  onClose,
}: {
  profile: NutritionProfileData | null;
  onSave: (data: {
    goal: NutritionGoal;
    activityLevel: ActivityLevel;
    height: number;
    weight: number;
    age: number;
    isMale: boolean;
  }) => void;
  onClose: () => void;
}) {
  const { t, d } = useThemeTokens();

  const [goal, setGoal] = useState<NutritionGoal>(profile?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'moderate',
  );
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [isMale, setIsMale] = useState(profile?.isMale ?? true);

  const isValid = height && weight && age;

  // Live TDEE preview
  const preview = useMemo(() => {
    if (!height || !weight || !age) return null;
    const h = parseFloat(height), w = parseFloat(weight), a = parseInt(age);
    if (!h || !w || !a) return null;
    const bmr = isMale ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const mult = ACTIVITY_LEVELS.find(l => l.value === activityLevel)?.mult ?? 1.55;
    const adj = GOALS.find(g => g.value === goal)?.adj ?? 0;
    const tdee = Math.round(bmr * mult);
    const target = Math.round(tdee + adj);
    return { tdee, target };
  }, [height, weight, age, isMale, activityLevel, goal]);

  const handleSave = () => {
    if (!isValid) return;
    triggerHaptic('medium');
    onSave({
      goal,
      activityLevel,
      height: parseFloat(height),
      weight: parseFloat(weight),
      age: parseInt(age),
      isMale,
    });
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pt: 0.5, pb: 12 }}>
        <Stack spacing={2.5}>

          {/* Live preview hero */}
          {preview && (
            <Box sx={card(t, { p: 2.5, textAlign: 'center' })}>
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
                Objectif journalier
              </Typography>
              <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, color: GOLD, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {preview.target}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: tc.m(t), mt: 0.5 }}>
                kcal/jour · Dépense estimée {preview.tdee}
              </Typography>
            </Box>
          )}

          {/* Goal */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(t), mb: 1 }}>
              Objectif
            </Typography>
            <Stack spacing={0.75}>
              {GOALS.map((g) => {
                const selected = goal === g.value;
                return (
                  <Box
                    key={g.value}
                    onClick={() => { triggerHaptic('light'); setGoal(g.value); }}
                    sx={card(t, {
                      p: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderColor: selected ? GOLD : undefined,
                      transition: 'all 0.2s ease',
                    })}
                  >
                    <Stack direction="row" alignItems="stretch">
                      {/* Gold accent bar */}
                      <Box sx={{
                        width: 4,
                        bgcolor: selected ? GOLD : 'transparent',
                        borderRadius: '4px 0 0 4px',
                        transition: 'background-color 0.2s ease',
                      }} />
                      <Box sx={{ py: 1.5, px: 2, flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: selected ? GOLD : tc.h(t) }}>
                              {g.label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: tc.f(t), mt: 0.2 }}>
                              {g.desc}
                            </Typography>
                          </Box>
                          <Typography sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: selected ? GOLD : tc.f(t),
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {g.adj > 0 ? '+' : ''}{g.adj}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Body info card */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(t), mb: 1 }}>
              Mes infos
            </Typography>
            <Box sx={card(t, { p: 2 })}>
              <Stack spacing={2}>
                {/* Gender segmented */}
                <Stack
                  direction="row"
                  sx={{
                    bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                    borderRadius: '12px',
                    p: 0.4,
                  }}
                >
                  {[true, false].map((male) => {
                    const selected = isMale === male;
                    return (
                      <Box
                        key={String(male)}
                        onClick={() => { triggerHaptic('light'); setIsMale(male); }}
                        sx={{
                          flex: 1,
                          py: 0.8,
                          textAlign: 'center',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          bgcolor: selected ? (d ? alpha('#ffffff', 0.1) : '#ffffff') : 'transparent',
                          boxShadow: selected ? (d ? 'none' : '0 1px 4px rgba(0,0,0,0.08)') : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: selected ? 700 : 500, color: selected ? tc.h(t) : tc.m(t) }}>
                          {male ? 'Homme' : 'Femme'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>

                {/* Numeric fields */}
                <Stack direction="row" spacing={1.5}>
                  {[
                    { label: 'Âge', value: age, onChange: setAge, unit: 'ans' },
                    { label: 'Taille', value: height, onChange: setHeight, unit: 'cm' },
                    { label: 'Poids', value: weight, onChange: setWeight, unit: 'kg' },
                  ].map((field) => (
                    <Box key={field.label} sx={{ flex: 1, textAlign: 'center' }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="input"
                          type="number"
                          inputMode="decimal"
                          value={field.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                          sx={{
                            width: '100%',
                            py: 1.5,
                            px: 1,
                            textAlign: 'center',
                            borderRadius: '14px',
                            border: '1px solid',
                            borderColor: field.value ? (d ? alpha('#ffffff', 0.12) : alpha('#000000', 0.1)) : (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04)),
                            bgcolor: 'transparent',
                            color: tc.h(t),
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            fontVariantNumeric: 'tabular-nums',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            '&:focus': { borderColor: GOLD },
                            '&::placeholder': { color: tc.f(t), fontWeight: 400, fontSize: '0.8rem' },
                            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            MozAppearance: 'textfield',
                          }}
                          placeholder="—"
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.55rem', color: tc.f(t), mt: 0.5 }}>
                        {field.label} ({field.unit})
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Activity Level */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(t), mb: 1 }}>
              Activité
            </Typography>
            <Box sx={card(t, { overflow: 'hidden' })}>
              {ACTIVITY_LEVELS.map((level, i) => {
                const selected = activityLevel === level.value;
                return (
                  <Box
                    key={level.value}
                    onClick={() => { triggerHaptic('light'); setActivityLevel(level.value); }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      bgcolor: selected ? alpha(GOLD, 0.06) : 'transparent',
                      borderBottom: i < ACTIVITY_LEVELS.length - 1 ? '1px solid' : 'none',
                      borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {/* Radio dot */}
                      <Box sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selected ? GOLD : d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'border-color 0.2s ease',
                      }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: selected ? GOLD : 'transparent',
                          transition: 'background-color 0.2s ease',
                        }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: selected ? 600 : 500, color: selected ? GOLD : tc.h(t) }}>
                          {level.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
                          {level.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Tip */}
          <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), textAlign: 'center', lineHeight: 1.6, px: 2 }}>
            Ces infos servent à estimer tes besoins. C&apos;est une base de départ, pas un objectif strict.
          </Typography>
        </Stack>
      </Box>

      {/* Save button — sticky */}
      <Box sx={{
        position: 'sticky',
        bottom: 0,
        p: 2,
        pt: 1.5,
        background: d
          ? `linear-gradient(transparent, rgba(10,10,9,0.95) 30%)`
          : `linear-gradient(transparent, rgba(243,241,236,0.95) 30%)`,
      }}>
        <Box
          onClick={handleSave}
          sx={{
            py: 1.5,
            textAlign: 'center',
            bgcolor: !isValid ? (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)) : GOLD,
            color: !isValid ? tc.f(t) : '#1a1715',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: !isValid ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            ...(isValid && {
              boxShadow: `0 4px 16px ${alpha(GOLD, 0.3)}`,
              '&:active': { transform: 'scale(0.97)' },
            }),
          }}
        >
          Enregistrer
        </Box>
      </Box>
    </Box>
  );
}
