'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, Plus, DotsSixVertical, Trash, X, Check } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const EXERCISES = [
  { name: 'L-Fly poulie', muscle: 'Épaules', sets: 3, reps: '15', rest: '1:00' },
  { name: 'Face pull', muscle: 'Épaules', sets: 3, reps: '15', rest: '1:00' },
  { name: 'Pull over poulie haute', muscle: 'Dos', sets: 3, reps: '15', rest: '1:00' },
]

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888', inputBorder: 'rgba(0,0,0,0.1)' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c', inputBorder: 'rgba(255,255,255,0.1)' },
}
type T = typeof TK.light

// ════════════════════════════════════════════════════════════════
// A — LIVE DETAIL
// La page ressemble au programme detail qu'on a fait, mais
// en mode édition. Les stats se calculent live, le nom est un
// input inline, les exercices sont dans la même card à dividers.
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const totalSets = EXERCISES.reduce((s, e) => s + e.sets, 0)

  return (
    <Box>
      {/* Header — same as detail page */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Box sx={{
          flex: 1, borderBottom: `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`,
          pb: 0.3,
        }}>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>
            Reprise Upper Body
          </Typography>
        </Box>
        <Check size={20} weight="bold" color={GOLD} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Stats summary — auto-calculated, same layout as detail */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {[
              { v: '60', u: 'min', l: 'Durée' },
              { v: String(EXERCISES.length), u: '', l: 'Exercices' },
              { v: String(totalSets), u: '', l: 'Séries' },
            ].map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2.5 } : undefined}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
                  {s.v}<Typography component="span" sx={{ fontSize: '0.55rem', color: tk.f, fontWeight: 500 }}>{s.u}</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Muscles — auto from exercises */}
        <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>Épaules · Dos</Typography>

        {/* Exercise list — same layout as detail page but editable */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography sx={lblSx}>{EXERCISES.length} exercices</Typography>
          </Stack>
          {EXERCISES.map((ex, i) => (
            <Stack key={ex.name} direction="row" alignItems="center" sx={{ py: 1, ...(i < EXERCISES.length - 1 ? sep : {}) }}>
              <DotsSixVertical size={14} weight={W} color={tk.f} style={{ marginRight: 4, cursor: 'grab', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tk.f, width: 14, flexShrink: 0 }}>{i + 1}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }} noWrap>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{ex.sets} × {ex.reps} · repos {ex.rest} · {ex.muscle}</Typography>
              </Box>
              <Trash size={14} weight={W} color={tk.f} style={{ cursor: 'pointer', flexShrink: 0 }} />
            </Stack>
          ))}
        </Box>

        {/* Add */}
        <Box sx={{
          border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          borderRadius: '14px', py: 2, textAlign: 'center', cursor: 'pointer',
        }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.8}>
            <Plus size={16} weight={W} color={tk.f} />
            <Typography sx={{ fontSize: '0.72rem', color: tk.f, fontWeight: 500 }}>Ajouter un exercice</Typography>
          </Stack>
        </Box>

        {/* Save — matches detail CTA style */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Sauvegarder</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — INLINE EDIT CARDS
// Chaque exercice est une mini-card éditable inline avec
// sets/reps/repos en mini-champs. Le nom est un input transparent.
// Hevy-style: édition directe sans dialog.
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const miniInput = { bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.025), border: '1px solid', borderColor: tk.inputBorder, borderRadius: '8px', px: 1, py: 0.6, textAlign: 'center' as const }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Nouveau programme</Typography>
        <Check size={20} weight="bold" color={GOLD} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Name input — transparent, big, inline */}
        <Box sx={{ ...cellSx, p: 2 }}>
          <Box sx={{ borderBottom: `1px solid ${tk.inputBorder}`, pb: 0.5, mb: 1 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tk.h }}>Reprise Upper Body</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>Description (optionnel)</Typography>
        </Box>

        <Typography sx={lblSx}>{EXERCISES.length} exercices</Typography>

        {/* Each exercise — inline editable card */}
        {EXERCISES.map((ex, i) => (
          <Box key={ex.name} sx={{ ...cellSx, p: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1.2 }}>
              <DotsSixVertical size={14} weight={W} color={tk.f} style={{ marginRight: 6, cursor: 'grab' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tk.h }} noWrap>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{ex.muscle}</Typography>
              </Box>
              <X size={14} weight={W} color={tk.f} style={{ cursor: 'pointer' }} />
            </Stack>
            <Stack direction="row" spacing={0.8}>
              {[
                { v: String(ex.sets), l: 'Séries' },
                { v: ex.reps, l: 'Reps' },
                { v: ex.rest, l: 'Repos' },
              ].map((f) => (
                <Box key={f.l} sx={{ ...miniInput, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.h, lineHeight: 1.2 }}>{f.v}</Typography>
                  <Typography sx={{ fontSize: '0.38rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.2 }}>{f.l}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}

        {/* Add */}
        <Box sx={{
          border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          borderRadius: '14px', py: 2, textAlign: 'center', cursor: 'pointer',
        }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.8}>
            <Plus size={16} weight={W} color={tk.f} />
            <Typography sx={{ fontSize: '0.72rem', color: tk.f, fontWeight: 500 }}>Ajouter un exercice</Typography>
          </Stack>
        </Box>

        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Sauvegarder</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — COMPACT TABLE BUILDER
// Le nom en haut, puis un tableau compact d'exercices avec
// colonnes alignées (comme le design C du detail page).
// Ajout en bas. Stats auto-calculées en bento.
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const totalSets = EXERCISES.reduce((s, e) => s + e.sets, 0)

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Nouveau programme</Typography>
        <Check size={20} weight="bold" color={GOLD} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Name */}
        <Box sx={{ ...cellSx, p: 2 }}>
          <Box sx={{ borderBottom: `1px solid ${tk.inputBorder}`, pb: 0.5 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tk.h }}>Reprise Upper Body</Typography>
          </Box>
        </Box>

        {/* Auto stats bento */}
        <Stack direction="row" spacing={1}>
          {[
            { v: String(EXERCISES.length), l: 'Exercices' },
            { v: String(totalSets), l: 'Séries' },
            { v: '60min', l: 'Durée est.' },
          ].map((s) => (
            <Box key={s.l} sx={{ ...cellSx, flex: 1, py: 1.2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ fontSize: '0.38rem', color: tk.f, mt: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Exercise table */}
        <Box sx={{ ...cellSx, overflow: 'hidden' }}>
          <Stack direction="row" sx={{ px: 2, py: 0.8, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Exercice</Typography>
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 50, textAlign: 'center' }}>Sets</Typography>
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 40, textAlign: 'center' }}>Repos</Typography>
            <Box sx={{ width: 20 }} />
          </Stack>
          {EXERCISES.map((ex, i) => (
            <Stack key={ex.name} direction="row" alignItems="center" sx={{ px: 2, py: 1, ...(i < EXERCISES.length - 1 ? sep : {}) }}>
              <DotsSixVertical size={12} weight={W} color={tk.f} style={{ marginRight: 6, cursor: 'grab', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }} noWrap>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.42rem', color: tk.f }}>{ex.muscle}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tk.m, width: 50, textAlign: 'center' }}>{ex.sets}×{ex.reps}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: tk.f, width: 40, textAlign: 'center' }}>{ex.rest}</Typography>
              <Trash size={12} weight={W} color={tk.f} style={{ cursor: 'pointer', flexShrink: 0 }} />
            </Stack>
          ))}
        </Box>

        {/* Add */}
        <Box sx={{
          border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          borderRadius: '14px', py: 2, textAlign: 'center', cursor: 'pointer',
        }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.8}>
            <Plus size={16} weight={W} color={tk.f} />
            <Typography sx={{ fontSize: '0.72rem', color: tk.f, fontWeight: 500 }}>Ajouter un exercice</Typography>
          </Stack>
        </Box>

        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Sauvegarder</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoProgramCreatePage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Live Detail', desc: 'Ressemble exactement à la page detail en mode édition. Stats auto-calculées en haut, nom inline éditable, exercices dans la même card à dividers. Check doré pour sauver.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Inline Edit', desc: 'Chaque exercice dans sa propre card avec sets/reps/repos en mini-inputs éditables inline. Style Hevy — édition directe sans dialogs.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Table Builder', desc: 'Stats auto en bento 3 cols, exercices en tableau compact avec colonnes alignées, drag handles, delete. Dense et pro.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Créer programme — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page création — cohérente avec detail</Typography>
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
