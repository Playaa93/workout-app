'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, Camera, Plus } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const PHOTOS = [
  { id: '1', date: '15 mars', type: 'Face', color: '#8b7355' },
  { id: '2', date: '15 mars', type: 'Dos', color: '#6b5b45' },
  { id: '3', date: '8 mars', type: 'Face', color: '#9b8365' },
  { id: '4', date: '8 mars', type: 'Profil', color: '#7b6b55' },
  { id: '5', date: '1 mars', type: 'Face', color: '#ab9375' },
  { id: '6', date: '1 mars', type: 'Dos', color: '#5b4b35' },
]

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

function PhotosTabC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }

  return (
    <Stack spacing={1.5}>
      {/* Comparison: before / after */}
      <Box sx={{ ...cellSx, p: 2 }}>
        <Typography sx={{ ...lblSx, mb: 1, textAlign: 'center' }}>Transformation</Typography>
        <Stack direction="row" spacing={1}>
          <Box sx={{ flex: 1, aspectRatio: '3/4', bgcolor: PHOTOS[4].color, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 1.5 }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>1 mars</Typography>
            <Typography sx={{ fontSize: '0.45rem', color: alpha('#fff', 0.7) }}>110.5 kg</Typography>
          </Box>
          <Box sx={{ flex: 1, aspectRatio: '3/4', bgcolor: PHOTOS[0].color, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 1.5 }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>15 mars</Typography>
            <Typography sx={{ fontSize: '0.45rem', color: alpha('#fff', 0.7) }}>109.1 kg</Typography>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>-0.9kg</Typography>
            <Typography sx={{ fontSize: '0.4rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Poids</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>-0.3%</Typography>
            <Typography sx={{ fontSize: '0.4rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Body fat</Typography>
          </Box>
        </Stack>
      </Box>

      {/* All photos grid */}
      <Box>
        <Typography sx={{ ...lblSx, mb: 1 }}>Toutes les photos</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.8 }}>
          {PHOTOS.map((p) => (
            <Box key={p.id} sx={{
              ...cellSx, aspectRatio: '3/4', bgcolor: p.color, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 1,
            }}>
              <Typography sx={{ fontSize: '0.5rem', fontWeight: 600, color: '#fff' }}>{p.type}</Typography>
              <Typography sx={{ fontSize: '0.4rem', color: alpha('#fff', 0.7) }}>{p.date}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
          <Camera size={16} weight={W} color={tk.bg} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Ajouter une photo</Typography>
        </Stack>
      </Box>
    </Stack>
  )
}

export default function DemoMeasurementsV2Page() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'
  const [tab, setTab] = useState(2)
  const tabs = ['Aperçu', 'Historique', 'Photos']

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>Tab Photos — Design C</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: tk.m }}>Seul le tab Photos change. Aperçu + Historique inchangés.</Typography>
          </Box>
          <Box onClick={() => setMode(isDark ? 'light' : 'dark')} sx={{ cursor: 'pointer', color: tk.m }}>
            {isDark ? <Sun size={20} weight={W} /> : <Moon size={20} weight={W} />}
          </Box>
        </Stack>

        {/* Simulated page */}
        <Box sx={{ border: '2px solid', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1), borderRadius: '28px', p: 2, bgcolor: tk.bg }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ArrowLeft size={20} weight={W} color={tk.h} />
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Mensurations</Typography>
            <Plus size={18} weight={W} color={tk.f} />
          </Stack>

          {/* Tabs */}
          <Stack direction="row" sx={{ mb: 2 }}>
            {tabs.map((t, i) => (
              <Box key={t} onClick={() => setTab(i)} sx={{
                flex: 1, textAlign: 'center', py: 1, cursor: 'pointer',
                borderBottom: '2px solid', borderColor: tab === i ? GOLD : 'transparent',
              }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tab === i ? tk.h : tk.f, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</Typography>
              </Box>
            ))}
          </Stack>

          {/* Tab content */}
          {tab === 0 && (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: tk.f }}>Aperçu — inchangé (stats actuels)</Typography>
            </Box>
          )}
          {tab === 1 && (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: tk.f }}>Historique — inchangé (liste des mesures)</Typography>
            </Box>
          )}
          {tab === 2 && <PhotosTabC tk={tk} isDark={isDark} />}
        </Box>
      </Box>
    </Box>
  )
}
