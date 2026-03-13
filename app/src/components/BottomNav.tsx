'use client';

import { usePathname } from 'next/navigation';
import { useThemeTokens } from '@/hooks/useDark';
import { GOLD, W } from '@/lib/design-tokens';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { House, ForkKnife, Barbell, User } from '@phosphor-icons/react';
import Link from 'next/link';

const NAV_ITEMS = [
  { key: 'home', label: 'Accueil', Icon: House, href: '/' },
  { key: 'workout', label: 'Training', Icon: Barbell, href: '/workout' },
  { key: 'journal', label: 'Journal', Icon: ForkKnife, href: '/diet' },
  { key: 'profile', label: 'Profil', Icon: User, href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t, d: isDark } = useThemeTokens();

  const activeKey = NAV_ITEMS.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )?.key;

  return (
    <>
      <Box sx={{ height: 88 }} />
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        maxWidth: 500, mx: 'auto', p: 1.5, pt: 0,
      }}>
        <Box sx={{
          borderRadius: '22px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          bgcolor: isDark ? alpha('#1c1a14', 0.7) : alpha('#ffffff', 0.75),
          border: '1px solid',
          borderColor: isDark ? alpha(GOLD, 0.15) : alpha(GOLD, 0.2),
          boxShadow: isDark
            ? `0 -4px 30px rgba(0,0,0,0.5), 0 0 1px ${alpha(GOLD, 0.2)}, inset 0 1px 0 ${alpha('#ffffff', 0.06)}`
            : `0 -4px 30px rgba(0,0,0,0.06), 0 0 1px ${alpha(GOLD, 0.3)}, inset 0 1px 0 ${alpha('#ffffff', 0.7)}`,
          overflow: 'hidden',
        }}>
          <Stack direction="row" sx={{ height: 64 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = activeKey === item.key;
              const Icon = item.Icon;
              return (
                <Box
                  key={item.key}
                  component={Link}
                  href={item.href}
                  sx={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 0.4,
                    cursor: 'pointer', textDecoration: 'none',
                  }}
                >
                  <Box sx={{
                    px: isActive ? 2.5 : 1, py: 0.6,
                    borderRadius: '12px',
                    bgcolor: isActive ? alpha(GOLD, 0.15) : 'transparent',
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      size={21}
                      weight={W}
                      color={isActive ? GOLD : isDark ? '#6b6560' : '#9a9490'}
                      style={isActive ? { filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.5)})` } : undefined}
                    />
                  </Box>
                  <Typography sx={{
                    fontSize: '0.58rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? GOLD : isDark ? '#6b6560' : '#9a9490',
                    letterSpacing: 0.2,
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </>
  );
}
