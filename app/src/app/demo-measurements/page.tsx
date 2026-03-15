'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, Camera, TrendDown, TrendUp, CaretRight, CaretDown, Plus } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const LATEST = { date: '15 mars', weight: 109.1, bodyFat: 18.2, chest: 102, waist: 84, hips: 98, leftArm: 36, rightArm: 36.5, shoulders: 118 }
const CHANGES = { weight: -0.9, bodyFat: -0.3, chest: 1, waist: -1.5, leftArm: 0.5 }
const HISTORY = [
  { date: '15 mars 2026', weight: 109.1, bodyFat: 18.2 },
  { date: '8 mars 2026', weight: 110.0, bodyFat: 18.5 },
  { date: '1 mars 2026', weight: 110.5, bodyFat: 18.8 },
]
// Mock progress photos as colored placeholders
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

function ChangeChip({ v, tk }: { v: number; tk: T }) {
  if (v === 0) return null
  const positive = v > 0
  const green = '#4ade80'
  // For weight/fat: negative is good. For arms/chest: positive is good
  return (
    <Stack direction="row" spacing={0.2} alignItems="center">
      {positive ? <TrendUp size={10} weight={W} color={tk.m} /> : <TrendDown size={10} weight={W} color={tk.m} />}
      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tk.m }}>
        {positive ? '+' : ''}{v}
      </Typography>
    </Stack>
  )
}

// ════════════════════════════════════════════════════════════════
// A — OVERVIEW + PHOTOS GRID
// Aperçu avec stats + photos en grille 3 colonnes intégrées,
// pas de tabs séparés. Tout visible en scroll.
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Mensurations</Typography>
        <Plus size={18} weight={W} color={tk.f} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Weight + body fat hero */}
        <Stack direction="row" spacing={1.2}>
          <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tk.h, lineHeight: 1 }}>
              {LATEST.weight}<Typography component="span" sx={{ fontSize: '0.6rem', color: tk.m }}> kg</Typography>
            </Typography>
            <ChangeChip v={CHANGES.weight} tk={tk} />
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Poids</Typography>
          </Box>
          <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tk.h, lineHeight: 1 }}>
              {LATEST.bodyFat}<Typography component="span" sx={{ fontSize: '0.6rem', color: tk.m }}> %</Typography>
            </Typography>
            <ChangeChip v={CHANGES.bodyFat} tk={tk} />
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Body fat</Typography>
          </Box>
        </Stack>

        {/* Body measurements */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Mensurations</Typography>
          {[
            { l: 'Poitrine', v: LATEST.chest, c: CHANGES.chest },
            { l: 'Tour de taille', v: LATEST.waist, c: CHANGES.waist },
            { l: 'Hanches', v: LATEST.hips, c: 0 },
            { l: 'Épaules', v: LATEST.shoulders, c: 0 },
            { l: 'Bras gauche', v: LATEST.leftArm, c: CHANGES.leftArm },
            { l: 'Bras droit', v: LATEST.rightArm, c: 0 },
          ].map((m, i, arr) => (
            <Stack key={m.l} direction="row" alignItems="center" sx={{ py: 0.7, ...(i < arr.length - 1 ? sep : {}) }}>
              <Typography sx={{ fontSize: '0.72rem', color: tk.m, flex: 1 }}>{m.l}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tk.h, mr: 1 }}>{m.v} cm</Typography>
              <ChangeChip v={m.c} tk={tk} />
            </Stack>
          ))}
        </Box>

        {/* Photos grid */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={lblSx}>Photos de progression</Typography>
            <Camera size={16} weight={W} color={tk.f} />
          </Stack>
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

        {/* History */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Historique</Typography>
          {HISTORY.map((h, i) => (
            <Stack key={h.date} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < HISTORY.length - 1 ? sep : {}) }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tk.h, flex: 1 }}>{h.date}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tk.m, mr: 1.5 }}>{h.weight}kg</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>{h.bodyFat}%</Typography>
              <CaretRight size={14} weight={W} color={tk.f} style={{ marginLeft: 8 }} />
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — TABS AVEC PHOTOS TIMELINE
// 3 tabs comme l'actuel mais restyled. Photos en timeline
// chronologique au lieu de grille plate.
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const [tab, setTab] = useState(2) // Photos tab pour montrer
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const tabs = ['Aperçu', 'Historique', 'Photos']

  // Group photos by date
  const photosByDate = new Map<string, typeof PHOTOS>()
  for (const p of PHOTOS) {
    if (!photosByDate.has(p.date)) photosByDate.set(p.date, [])
    photosByDate.get(p.date)!.push(p)
  }

  return (
    <Box>
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

      <Stack spacing={1.5}>
        {/* Photos tab — timeline grouped by date */}
        {tab === 2 && (
          <>
            {Array.from(photosByDate.entries()).map(([date, photos]) => (
              <Box key={date}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tk.m, mb: 0.8 }}>{date}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8 }}>
                  {photos.map((p) => (
                    <Box key={p.id} sx={{
                      ...cellSx, aspectRatio: '3/4', bgcolor: p.color, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 1.5,
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>{p.type}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
            <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                <Camera size={16} weight={W} color={tk.bg} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Ajouter une photo</Typography>
              </Stack>
            </Box>
          </>
        )}

        {/* Aperçu tab */}
        {tab === 0 && (
          <>
            <Stack direction="row" spacing={1.2}>
              <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tk.h, lineHeight: 1 }}>{LATEST.weight}<Typography component="span" sx={{ fontSize: '0.6rem', color: tk.m }}> kg</Typography></Typography>
                <ChangeChip v={CHANGES.weight} tk={tk} />
              </Box>
              <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tk.h, lineHeight: 1 }}>{LATEST.bodyFat}<Typography component="span" sx={{ fontSize: '0.6rem', color: tk.m }}> %</Typography></Typography>
                <ChangeChip v={CHANGES.bodyFat} tk={tk} />
              </Box>
            </Stack>
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1 }}>Détails</Typography>
              {[
                { l: 'Poitrine', v: LATEST.chest },
                { l: 'Tour de taille', v: LATEST.waist },
                { l: 'Épaules', v: LATEST.shoulders },
              ].map((m, i, arr) => (
                <Stack key={m.l} direction="row" justifyContent="space-between" sx={{ py: 0.6, ...(i < arr.length - 1 ? sep : {}) }}>
                  <Typography sx={{ fontSize: '0.7rem', color: tk.m }}>{m.l}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: tk.h }}>{m.v} cm</Typography>
                </Stack>
              ))}
            </Box>
          </>
        )}

        {/* Historique tab */}
        {tab === 1 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            {HISTORY.map((h, i) => (
              <Stack key={h.date} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < HISTORY.length - 1 ? sep : {}) }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tk.h, flex: 1 }}>{h.date}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: tk.m, mr: 1.5 }}>{h.weight}kg</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>{h.bodyFat}%</Typography>
              </Stack>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — COMPARAISON PHOTOS
// Photos en vue comparaison côte à côte (avant/après),
// avec sélecteur de date. Stats compacts en dessous.
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Mensurations</Typography>
        <Camera size={18} weight={W} color={tk.f} />
      </Stack>

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
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>{CHANGES.weight}kg</Typography>
              <Typography sx={{ fontSize: '0.4rem', color: tk.f, textTransform: 'uppercase' }}>Poids</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>{CHANGES.bodyFat}%</Typography>
              <Typography sx={{ fontSize: '0.4rem', color: tk.f, textTransform: 'uppercase' }}>Body fat</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Current stats */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {[
              { v: `${LATEST.weight}`, u: 'kg', l: 'Poids' },
              { v: `${LATEST.bodyFat}`, u: '%', l: 'Body fat' },
              { v: `${LATEST.waist}`, u: 'cm', l: 'Taille' },
            ].map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
                  {s.v}<Typography component="span" sx={{ fontSize: '0.5rem', color: tk.f }}>{s.u}</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.4rem', color: tk.f, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* All photos */}
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
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoMeasurementsPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Overview + Grid', desc: 'Poids+body fat en bento, mensurations en liste, photos en grille 3 colonnes, historique. Tout en scroll, pas de tabs.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Tabs + Timeline', desc: '3 tabs restyled. Photos groupées par date en timeline (2 colonnes par date). CTA inversé en bas.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Comparaison', desc: 'Vue avant/après en haut (2 photos côte à côte avec diff poids). Stats compact en row. Grille photos en bas.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Mensurations — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page mensurations — mobile-first</Typography>
          </Box>
          <Box onClick={() => setMode(isDark ? 'light' : 'dark')} sx={{ cursor: 'pointer', color: tk.m, '&:hover': { color: tk.h } }}>
            {isDark ? <Sun size={20} weight={W} /> : <Moon size={20} weight={W} />}
          </Box>
        </Stack>

        <Stack spacing={6}>
          {approaches.map((a) => (
            <Box key={a.tag}>
              <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: GOLD, bgcolor: alpha(GOLD, isDark ? 0.12 : 0.08), px: 0.8, py: 0.2, borderRadius: '6px', lineHeight: 1.4 }}>{a.tag}</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: tk.h }}>{a.name}</Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.62rem', color: tk.m, mb: 2, lineHeight: 1.4 }}>{a.desc}</Typography>
              <Box sx={{ border: '2px solid', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1), borderRadius: '28px', p: 2, overflow: 'hidden', bgcolor: tk.bg }}>
                {a.el}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
