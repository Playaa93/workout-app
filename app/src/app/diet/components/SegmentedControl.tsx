'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

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
  const segments: Segment[] = ['today', 'week', 'month'];

  return (
    <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 2, p: 0.5 }}>
      {segments.map((seg) => (
        <Box
          key={seg}
          onClick={() => onChange(seg)}
          sx={{
            flex: 1,
            py: 1,
            textAlign: 'center',
            borderRadius: 1.5,
            bgcolor: value === seg ? 'background.paper' : 'transparent',
            boxShadow: value === seg ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Typography
            variant="caption"
            fontWeight={value === seg ? 700 : 500}
            sx={{
              color: value === seg ? 'text.primary' : 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {LABELS[seg]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
