'use client';

import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Home from '@mui/icons-material/Home';
import Restaurant from '@mui/icons-material/Restaurant';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Person from '@mui/icons-material/Person';
import Link from 'next/link';

const NAV_ITEMS = [
  { key: 'home', label: 'Accueil', icon: <Home />, href: '/' },
  { key: 'journal', label: 'Journal', icon: <Restaurant />, href: '/diet' },
  { key: 'workout', label: 'Training', icon: <FitnessCenter />, href: '/workout' },
  { key: 'profile', label: 'Profil', icon: <Person />, href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const activeKey = NAV_ITEMS.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )?.key;

  return (
    <>
    {/* Spacer to prevent content from hiding behind fixed nav */}
    <Box sx={{ height: 80 }} />
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderRadius: '16px 16px 0 0',
        maxWidth: 500,
        mx: 'auto',
      }}
    >
      <Stack direction="row" sx={{ height: 64 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <Box
              key={item.key}
              component={Link}
              href={item.href}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                cursor: 'pointer',
                color: isActive ? 'primary.main' : 'text.secondary',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: 4,
                  bgcolor: isActive ? 'rgba(103,80,164,0.12)' : 'transparent',
                  px: isActive ? 2.5 : 0.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {item.icon}
              </Box>
              <Typography
                variant="caption"
                fontWeight={isActive ? 700 : 500}
                sx={{ fontSize: '0.6rem' }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
    </>
  );
}
