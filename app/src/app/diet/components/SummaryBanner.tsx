'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { MacroPill } from './shared';
import type { DailySummaryData, NutritionProfileData } from './shared';

export default function SummaryBanner({
  summary,
  profile,
  workoutCalories,
}: {
  summary: DailySummaryData;
  profile: NutritionProfileData | null;
  workoutCalories: number;
}) {
  const targetCals = profile?.targetCalories
    ? profile.targetCalories + workoutCalories
    : 2000;
  const consumed = Math.round(summary.totalCalories);
  const remaining = Math.max(0, targetCals - consumed);
  const pct = Math.min(Math.round((consumed / targetCals) * 100), 100);
  const circumference = 157; // 2 * PI * 25

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
        color: 'white',
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" justifyContent="space-around" alignItems="center">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
              Consommé
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {consumed}
            </Typography>
          </Box>
          <Box sx={{ width: 60, height: 60, position: 'relative' }}>
            <svg viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                transform="rotate(-90 30 30)"
              />
            </svg>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                {pct}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
              Restant
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {remaining}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'center' }}>
          <MacroPill
            label="P"
            value={Math.round(summary.totalProtein)}
            target={profile?.targetProtein ?? 150}
            color="#93c5fd"
          />
          <MacroPill
            label="G"
            value={Math.round(summary.totalCarbs)}
            target={profile?.targetCarbs ?? 250}
            color="#fcd34d"
          />
          <MacroPill
            label="L"
            value={Math.round(summary.totalFat)}
            target={profile?.targetFat ?? 70}
            color="#fca5a5"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
