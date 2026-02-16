'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import QrCodeScanner from '@mui/icons-material/QrCodeScanner';
import CameraAlt from '@mui/icons-material/CameraAlt';
import Bolt from '@mui/icons-material/Bolt';
import { MEAL_CONFIG, triggerHaptic } from './shared';
import type { MealType, FoodEntryData } from './shared';

export type SheetAction = 'search' | 'scanner' | 'photo' | 'quick' | 'cravings';

function SheetActionCard({
  icon,
  label,
  desc,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ cursor: 'pointer', '&:hover': { borderColor: color, bgcolor: `${color}08` } }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ py: 2, textAlign: 'center' }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: `${color}15`, mx: 'auto', mb: 1 }}>
            <Box sx={{ color }}>{icon}</Box>
          </Avatar>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {desc}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
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
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          borderRadius: '20px 20px 0 0',
          maxWidth: 500,
          mx: 'auto',
          animation: 'slide-up 0.3s ease-out',
          '@keyframes slide-up': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.hover' }} />
        </Box>

        <Box sx={{ px: 3, pt: 1.5, pb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Ajouter - {meal.label}
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <SheetActionCard
              icon={<Search />}
              label="Chercher"
              desc="Base de données"
              color="#3b82f6"
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('search');
              }}
            />
            <SheetActionCard
              icon={<QrCodeScanner />}
              label="Scanner"
              desc="Code-barres"
              color="#10b981"
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('scanner');
              }}
            />
            <SheetActionCard
              icon={<CameraAlt />}
              label="Photo IA"
              desc="Reconnaissance"
              color="#f59e0b"
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('photo');
              }}
            />
            <SheetActionCard
              icon={<Bolt />}
              label="Rapide"
              desc="Estimation"
              color="#ef4444"
              onClick={() => {
                triggerHaptic('light');
                onSelectAction('quick');
              }}
            />
          </Box>

          {recentFoods.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2.5, mb: 1 }}>
                Récemment ajoutés
              </Typography>
              <Stack spacing={0.5}>
                {recentFoods.slice(0, 5).map((entry) => (
                  <Card key={entry.id} variant="outlined">
                    <CardActionArea
                      onClick={() => {
                        triggerHaptic('light');
                        onQuickReAdd(entry);
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {entry.customName || 'Aliment'}
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {entry.calories
                              ? `${Math.round(parseFloat(entry.calories))} kcal`
                              : '--'}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Paper>
    </>
  );
}
