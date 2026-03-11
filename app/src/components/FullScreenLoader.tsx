'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useDark } from '@/hooks/useDark'
import { GOLD, surfaceBg } from '@/lib/design-tokens'

export default function FullScreenLoader() {
  const d = useDark()
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(d) }}>
      <CircularProgress sx={{ color: GOLD }} />
    </Box>
  )
}
