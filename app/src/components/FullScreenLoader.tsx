'use client'

import Box from '@mui/material/Box'
import { GOLD, GOLD_GRAD_START, GOLD_GRAD_END } from '@/lib/design-tokens'

export default function FullScreenLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2.5,
      }}
    >
      <Box
        component="svg"
        width={56}
        height={56}
        viewBox="0 0 512 512"
        sx={{
          animation: 'graal-pulse 1.8s ease-in-out infinite',
          '@keyframes graal-pulse': {
            '0%, 100%': { opacity: 0.55, transform: 'scale(1)' },
            '50%': { opacity: 1, transform: 'scale(1.06)' },
          },
        }}
      >
        <defs>
          <linearGradient id="gold-fsl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD_GRAD_START} />
            <stop offset="100%" stopColor={GOLD_GRAD_END} />
          </linearGradient>
        </defs>
        <polygon
          points="256,80 396,148 396,364 256,432 116,364 116,148"
          fill="none"
          stroke="url(#gold-fsl)"
          strokeWidth="6"
        />
        <path d="M216 190 h80 l-10 76 c-2 18-16 28-30 28s-28-10-30-28Z" fill="url(#gold-fsl)" />
        <rect x="248" y="294" width="16" height="28" fill="url(#gold-fsl)" />
        <rect x="228" y="318" width="56" height="8" rx="4" fill="url(#gold-fsl)" />
      </Box>
      <Box
        component="span"
        sx={{
          color: GOLD,
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Graal
      </Box>
    </Box>
  )
}
