'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, GOLD, W } from '@/lib/design-tokens';
import { getLocalDateStr, addDays } from '@/lib/date-utils';
import { triggerHaptic } from './shared';

const DAY_NAMES_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function DateStrip({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';
  const today = getLocalDateStr();
  const isToday = selectedDate === today;

  const { days, monthLabel } = useMemo(() => {
    const daysList = [];
    for (let i = -3; i <= 3; i++) {
      const dayStr = addDays(selectedDate, i);
      const date = new Date(dayStr + 'T12:00:00');
      daysList.push({
        dayStr,
        dayNum: date.getDate(),
        dayName: DAY_NAMES_SHORT[date.getDay()],
      });
    }
    const center = new Date(selectedDate + 'T12:00:00');
    const yearSuffix = center.getFullYear() !== new Date().getFullYear() ? ` ${center.getFullYear()}` : '';
    return {
      days: daysList,
      monthLabel: `${MONTH_NAMES[center.getMonth()]}${yearSuffix}`,
    };
  }, [selectedDate]);

  const handlePrev = () => {
    triggerHaptic('light');
    onDateChange(addDays(selectedDate, -1));
  };

  const handleNext = () => {
    if (selectedDate >= today) return;
    triggerHaptic('light');
    onDateChange(addDays(selectedDate, 1));
  };

  const handleTapToday = () => {
    if (isToday) return;
    triggerHaptic('light');
    onDateChange(today);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(d), textAlign: 'center', mb: 0.5 }}>
        {monthLabel}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton size="small" onClick={handlePrev} sx={{ color: tc.m(d), p: 0.5 }}>
          <CaretLeft size={20} weight={W} />
        </IconButton>

        <Stack direction="row" sx={{ flex: 1, justifyContent: 'space-around' }}>
          {days.map(({ dayStr, dayNum, dayName }) => {
            const isSelected = dayStr === selectedDate;
            const isDayToday = dayStr === today;
            const isFuture = dayStr > today;

            return (
              <Box
                key={dayStr}
                onClick={() => {
                  if (isFuture) return;
                  triggerHaptic('light');
                  onDateChange(dayStr);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isFuture ? 'default' : 'pointer',
                  opacity: isFuture ? 0.3 : 1,
                  gap: 0.3,
                  py: 0.5,
                  px: 0.8,
                  borderRadius: '12px',
                  bgcolor: isSelected ? alpha(GOLD, 0.12) : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Typography sx={{
                  fontSize: '0.55rem',
                  fontWeight: 500,
                  color: isSelected ? GOLD : tc.f(d),
                  textTransform: 'capitalize',
                  lineHeight: 1,
                }}>
                  {dayName}
                </Typography>
                <Typography sx={{
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? GOLD : isDayToday ? tc.h(d) : tc.m(d),
                  lineHeight: 1,
                }}>
                  {dayNum}
                </Typography>
                {isDayToday && (
                  <Box sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: GOLD,
                  }} />
                )}
              </Box>
            );
          })}
        </Stack>

        <IconButton
          size="small"
          onClick={handleNext}
          disabled={selectedDate >= today}
          sx={{ color: selectedDate >= today ? tc.f(d) : tc.m(d), p: 0.5 }}
        >
          <CaretRight size={20} weight={W} />
        </IconButton>
      </Stack>

      {!isToday && (
        <Box
          onClick={handleTapToday}
          sx={{
            textAlign: 'center',
            mt: 0.5,
            cursor: 'pointer',
          }}
        >
          <Typography sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: GOLD,
            '&:hover': { textDecoration: 'underline' },
          }}>
            Revenir à aujourd&apos;hui
          </Typography>
        </Box>
      )}
    </Box>
  );
}
