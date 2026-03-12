'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { X, MagnifyingGlass, Camera, Barcode } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, panelBg, GOLD, W } from '@/lib/design-tokens';
import { MEAL_CONFIG, triggerHaptic } from './shared';
import type { MealType, FoodEntryData } from './shared';

export type SheetAction = 'search' | 'scanner' | 'photo' | 'cravings';

const MAIN_ACTIONS = [
  { action: 'search' as const, Icon: MagnifyingGlass, label: 'Chercher' },
  { action: 'photo' as const, Icon: Camera, label: 'Photo IA' },
];

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

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.inset = '';
      body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

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
          zIndex: 1300,
          backdropFilter: 'blur(4px)',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1301,
          borderRadius: '20px 20px 0 0',
          maxWidth: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
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

        <Box sx={{ px: 3, pt: 1.5, pb: 'calc(env(safe-area-inset-bottom, 16px) + 48px)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d) }}>
              Ajouter - {meal.label}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: tc.f(d) }}>
              <X size={20} weight={W} />
            </IconButton>
          </Stack>

          {/* Two main actions */}
          <Stack direction="row" spacing={1.5} sx={{ mb: recentFoods.length > 0 ? 2 : 0 }}>
            {MAIN_ACTIONS.map(({ action, Icon, label }) => (
              <Box
                key={action}
                onClick={() => { triggerHaptic('light'); onSelectAction(action); }}
                sx={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 1.5,
                  cursor: 'pointer', py: 1.5, px: 2, borderRadius: '14px',
                  bgcolor: alpha(GOLD, 0.06),
                  border: '1px solid',
                  borderColor: alpha(GOLD, 0.12),
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: alpha(GOLD, 0.1), borderColor: alpha(GOLD, 0.25) },
                }}
              >
                <Box sx={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  bgcolor: alpha(GOLD, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: GOLD,
                }}>
                  <Icon size={20} weight={W} />
                </Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d) }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Scanner — secondary link */}
          <Box
            onClick={() => { triggerHaptic('light'); onSelectAction('scanner'); }}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
              cursor: 'pointer', py: 0.8,
              '&:hover': { opacity: 0.7 },
            }}
          >
            <Barcode size={14} weight={W} color={tc.f(d)} />
            <Typography sx={{ fontSize: '0.7rem', color: tc.f(d) }}>
              Scanner un code-barres
            </Typography>
          </Box>

          {/* Recent foods */}
          {recentFoods.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.f(d), mt: 1.5, mb: 1, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Récemment ajoutés
              </Typography>
              {recentFoods.slice(0, 5).map((entry, i, arr) => (
                <Box
                  key={entry.id}
                  onClick={() => { triggerHaptic('light'); onQuickReAdd(entry); }}
                  sx={{
                    px: 1.5, py: 1,
                    cursor: 'pointer',
                    borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
                    borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                    borderRadius: i === 0 ? '8px 8px 0 0' : i === arr.length - 1 ? '0 0 8px 8px' : 0,
                    '&:hover': { bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02) },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(d) }}>
                      {entry.customName || 'Aliment'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(d) }}>
                      {entry.calories ? `${Math.round(parseFloat(entry.calories))} kcal` : '--'}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
