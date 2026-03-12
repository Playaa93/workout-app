'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { X, MagnifyingGlass, Barcode, Camera, Lightning } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, card, panelBg, GOLD, W } from '@/lib/design-tokens';
import { MEAL_CONFIG, triggerHaptic } from './shared';
import type { MealType, FoodEntryData } from './shared';

export type SheetAction = 'search' | 'scanner' | 'photo' | 'quick' | 'cravings';

function SheetActionCard({
  icon,
  label,
  desc,
  d,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  d: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={card(d, {
        cursor: 'pointer',
        p: 2,
        textAlign: 'center',
        transition: 'all 0.2s ease',
        '&:hover': { borderColor: alpha(GOLD, 0.3) },
      })}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: alpha(GOLD, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1,
          color: GOLD,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d) }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', color: tc.f(d) }}>
        {desc}
      </Typography>
    </Box>
  );
}

export default function AddEntryBottomSheet({
  open,
  mealType,
  recentFoods,
  onClose,
  onSelectAction,
  onQuickReAdd,
}: {
  open: boolean;
  mealType: MealType;
  recentFoods: FoodEntryData[];
  onClose: () => void;
  onSelectAction: (action: SheetAction) => void;
  onQuickReAdd: (entry: FoodEntryData) => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';

  if (!open) return null;

  const meal = MEAL_CONFIG[mealType];

  return (
    <>
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.4)',
          zIndex: 199,
          backdropFilter: 'blur(4px)',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          borderRadius: '20px 20px 0 0',
          maxWidth: 500,
          mx: 'auto',
          bgcolor: panelBg(d),
          animation: 'slide-up 0.3s ease-out',
          '@keyframes slide-up': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }} />
        </Box>

        <Box sx={{ px: 3, pt: 1.5, pb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d) }}>
              Ajouter - {meal.label}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: tc.f(d) }}>
              <X size={20} weight={W} />
            </IconButton>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <SheetActionCard
              icon={<MagnifyingGlass size={24} weight={W} />}
              label="Chercher"
              desc="Base de données"
              d={d}
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('search');
              }}
            />
            <SheetActionCard
              icon={<Barcode size={24} weight={W} />}
              label="Scanner"
              desc="Code-barres"
              d={d}
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('scanner');
              }}
            />
            <SheetActionCard
              icon={<Camera size={24} weight={W} />}
              label="Photo IA"
              desc="Reconnaissance"
              d={d}
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('photo');
              }}
            />
            <SheetActionCard
              icon={<Lightning size={24} weight={W} />}
              label="Rapide"
              desc="Estimation"
              d={d}
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('quick');
              }}
            />
          </Box>

          {recentFoods.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.m(d), mt: 2.5, mb: 1 }}>
                Récemment ajoutés
              </Typography>
              <Box sx={card(d, { overflow: 'hidden' })}>
                {recentFoods.slice(0, 5).map((entry, i, arr) => (
                  <Box
                    key={entry.id}
                    onClick={() => {
                      triggerHaptic('light');
                      onQuickReAdd(entry);
                    }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
                      borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                      '&:hover': { bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02) },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(d) }}>
                        {entry.customName || 'Aliment'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.m(d) }}>
                        {entry.calories
                          ? `${Math.round(parseFloat(entry.calories))} kcal`
                          : '--'}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
