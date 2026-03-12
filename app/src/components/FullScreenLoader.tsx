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
          animation: 'aurum-pulse 1.8s ease-in-out infinite',
          '@keyframes aurum-pulse': {
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
        <path
          d="M256 88 L404 424 L344 424 L298 320 L214 320 L168 424 L108 424 Z"
          fill="url(#gold-fsl)"
        />
        <path d="M256 196 L226 288 L286 288 Z" fill="#09090b" />
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
        Aurum
      </Box>
    </Box>
  )
}
