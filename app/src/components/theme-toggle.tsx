'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { keyframes, styled } from '@mui/material/styles';

// Animations
const sunRise = keyframes`
  from {
    transform: rotate(-45deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
`;

const moonRise = keyframes`
  from {
    transform: rotate(45deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
`;

const raysPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

// Styled animated toggle button
const AnimatedToggle = styled(IconButton)(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.04)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

// Sun Icon with animated rays
function SunIcon({ animate }: { animate: boolean }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: 22,
        height: 22,
        color: '#ffb74d',
        animation: animate ? `${sunRise} 0.4s ease-out` : 'none',
      }}
    >
      {/* Center circle */}
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="currentColor"
      />
      {/* Rays */}
      <Box
        component="g"
        sx={{
          animation: animate ? `${raysPulse} 2s ease-in-out infinite` : 'none',
        }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1="12"
            y1="2"
            x2="12"
            y2="5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </Box>
    </Box>
  );
}

// Moon Icon with crater details
function MoonIcon({ animate }: { animate: boolean }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: 20,
        height: 20,
        color: '#bb86fc',
        animation: animate ? `${moonRise} 0.4s ease-out` : 'none',
      }}
    >
      <path
        d="M12 3a9 9 0 0 0 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 0 9-9z"
        fill="currentColor"
      />
      {/* Subtle crater details */}
      <circle cx="9" cy="10" r="1.5" fill="rgba(0,0,0,0.15)" />
      <circle cx="13" cy="14" r="1" fill="rgba(0,0,0,0.1)" />
    </Box>
  );
}

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          bgcolor: 'action.hover',
        }}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setIsAnimating(true);
    setTheme(isDark ? 'light' : 'dark');
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <Tooltip
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      arrow
      placement="bottom"
    >
      <AnimatedToggle onClick={handleToggle} aria-label="Changer le thème">
        {isDark ? (
          <MoonIcon animate={isAnimating} />
        ) : (
          <SunIcon animate={isAnimating} />
        )}
      </AnimatedToggle>
    </Tooltip>
  );
}
