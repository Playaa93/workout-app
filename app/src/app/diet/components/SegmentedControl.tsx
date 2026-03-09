'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc } from '@/lib/design-tokens';

export type Segment = 'today' | 'week' | 'month';

const LABELS: Record<Segment, string> = {
  today: "Aujourd'hui",
  week: 'Semaine',
  month: 'Mois',
};

export default function SegmentedControl({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (v: Segment) => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';
  const segments: Segment[] = ['today', 'week', 'month'];

  return (
    <Stack
      direction="row"
      sx={{
        bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
        borderRadius: '12px',
        p: 0.4,
      }}
    >
      {segments.map((seg) => (
        <Box
          key={seg}
          onClick={() => onChange(seg)}
          sx={{
            flex: 1,
            py: 0.8,
            textAlign: 'center',
            borderRadius: '10px',
            bgcolor: value === seg ? (d ? alpha('#ffffff', 0.1) : '#ffffff') : 'transparent',
            boxShadow: value === seg ? (d ? 'none' : '0 1px 4px rgba(0,0,0,0.08)') : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: value === seg ? 700 : 500,
              color: value === seg ? tc.h(d) : tc.m(d),
            }}
          >
            {LABELS[seg]}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
