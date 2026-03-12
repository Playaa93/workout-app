'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { GOLD } from '@/lib/design-tokens'

export default function FullScreenLoader() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: GOLD }} />
    </Box>
  )
}
