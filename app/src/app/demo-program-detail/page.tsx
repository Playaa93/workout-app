'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, Play, PencilSimple, Info, Timer, Barbell, CaretRight, Flame } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const PROGRAM = {
  name: 'Reprise upper Body',
  muscles: ['Épaules', 'Dos', 'Pectoraux', 'Bras'],
  duration: 60,
  description: null as string | null,
}
const EXERCISES = [
  { name: 'L-Fly poulie', sets: 3, reps: '15', rest: 60, muscle: 'Épaules' },
  { name: 'Face pull', sets: 3, reps: '15', rest: 60, muscle: 'Épaules' },
  { name: 'Pull over poulie haute', sets: 3, reps: '15', rest: 60, muscle: 'Dos' },
  { name: 'Tirage vertical poulie haute', sets: 3, reps: '12-15', rest: 90, muscle: 'Dos' },
  { name: 'Écarté poulie basse', sets: 3, reps: '12-15', rest: 90, muscle: 'Pectoraux' },
  { name: 'Élévation latérale assis', sets: 3, reps: '12-20', rest: 90, muscle: 'Épaules' },
  { name: 'Curl pupitre machine', sets: 3, reps: '12-20', rest: 90, muscle: 'Bras' },
]
const LAST_SESSION = { date: 'dim. 15 mars', volume: '165kg', duration: '45min' }

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

function fmtRest(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` }

// ════════════════════════════════════════════════════════════════
// A — ENRICHED INFO
// Même layout mais enrichi : résumé stats en haut (durée, exos,
// volume estimé), groupes musculaires, dernière perf, CTA inversé
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }} noWrap>{PROGRAM.name}</Typography>
        <PencilSimple size={18} weight={W} color={tk.f} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Stats summary card */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {[
              { v: `~${PROGRAM.duration}`, u: 'min', l: 'Durée' },
              { v: String(EXERCISES.length), u: '', l: 'Exercices' },
              { v: String(EXERCISES.reduce((s, e) => s + e.sets, 0)), u: '', l: 'Séries' },
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

        {/* Muscles */}
        <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>
          {PROGRAM.muscles.join(' · ')}
        </Typography>

        {/* Last session */}
        <Box sx={{ ...cellSx, px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Flame size={14} weight={W} color={tk.f} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tk.h }}>Dernière séance</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{LAST_SESSION.date} · {LAST_SESSION.volume} · {LAST_SESSION.duration}</Typography>
            </Box>
            <CaretRight size={14} weight={W} color={tk.f} />
          </Stack>
        </Box>

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Play size={16} weight="fill" color={tk.bg} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Démarrer la séance</Typography>
          </Stack>
        </Box>

        {/* Exercise list */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>{EXERCISES.length} exercices</Typography>
          {EXERCISES.map((ex, i) => (
            <Stack key={ex.name} direction="row" alignItems="center" sx={{ py: 1, ...(i < EXERCISES.length - 1 ? sep : {}) }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tk.f, width: 16, flexShrink: 0 }}>{i + 1}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }} noWrap>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{ex.sets} × {ex.reps} · repos {fmtRest(ex.rest)}</Typography>
              </Box>
              <Info size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — MUSCLE GROUPED
// Exercices groupés par muscle au lieu d'une liste plate.
// Chaque groupe a son propre header. CTA sticky.
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  // Group by muscle
  const groups = new Map<string, typeof EXERCISES>()
  for (const ex of EXERCISES) {
    if (!groups.has(ex.muscle)) groups.set(ex.muscle, [])
    groups.get(ex.muscle)!.push(ex)
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }} noWrap>{PROGRAM.name}</Typography>
        <PencilSimple size={18} weight={W} color={tk.f} />
      </Stack>
      <Typography sx={{ fontSize: '0.6rem', color: tk.f, mb: 2, ml: 3.5 }}>
        {PROGRAM.muscles.join(' · ')} · ~{PROGRAM.duration} min · {EXERCISES.length} exos
      </Typography>

      <Stack spacing={1.5}>
        {/* Muscle groups */}
        {Array.from(groups.entries()).map(([muscle, exos]) => (
          <Box key={muscle} sx={{ ...cellSx, p: 2.5 }}>
            <Typography sx={{ ...lblSx, mb: 1 }}>{muscle} — {exos.length} exo{exos.length > 1 ? 's' : ''}</Typography>
            {exos.map((ex, i) => (
              <Stack key={ex.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < exos.length - 1 ? sep : {}) }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }} noWrap>{ex.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{ex.sets} × {ex.reps} · repos {fmtRest(ex.rest)}</Typography>
                </Box>
                <Info size={14} weight={W} color={tk.f} />
              </Stack>
            ))}
          </Box>
        ))}

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Play size={16} weight="fill" color={tk.bg} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Démarrer la séance</Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — COMPACT TABLE
// Exercices en tableau compact : nom | sets×reps | repos.
// Header avec muscles en chips text. Stats en bento.
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }} noWrap>{PROGRAM.name}</Typography>
        <PencilSimple size={18} weight={W} color={tk.f} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Bento stats */}
        <Stack direction="row" spacing={1}>
          {[
            { v: `${EXERCISES.length}`, l: 'Exercices' },
            { v: `${EXERCISES.reduce((s, e) => s + e.sets, 0)}`, l: 'Séries totales' },
            { v: `~${PROGRAM.duration}min`, l: 'Durée estimée' },
          ].map((s) => (
            <Box key={s.l} sx={{ ...cellSx, flex: 1, p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ fontSize: '0.4rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</Typography>
            </Box>
          ))}
        </Stack>

        <Typography sx={{ fontSize: '0.6rem', color: tk.f }}>{PROGRAM.muscles.join(' · ')}</Typography>

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Play size={16} weight="fill" color={tk.bg} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Démarrer la séance</Typography>
          </Stack>
        </Box>

        {/* Compact exercise table */}
        <Box sx={{ ...cellSx, overflow: 'hidden' }}>
          {/* Table header */}
          <Stack direction="row" sx={{ px: 2, py: 1, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>Exercice</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', width: 55, textAlign: 'center' }}>Sets</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', width: 50, textAlign: 'right' }}>Repos</Typography>
          </Stack>
          {EXERCISES.map((ex, i) => (
            <Stack key={ex.name} direction="row" alignItems="center" sx={{
              px: 2, py: 1.2, ...(i < EXERCISES.length - 1 ? sep : {}),
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }} noWrap>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f }}>{ex.muscle}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tk.m, width: 55, textAlign: 'center' }}>
                {ex.sets}×{ex.reps}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: tk.f, width: 50, textAlign: 'right' }}>
                {fmtRest(ex.rest)}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoProgramDetailPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Enriched Info', desc: 'Stats résumé en haut (durée, exos, séries), dernière séance, muscles inline, exercices en liste plate dans une card.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Muscle Grouped', desc: 'Exercices groupés par muscle (Épaules, Dos, Pectoraux, Bras). Chaque groupe a sa propre card avec header.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Compact Table', desc: 'Stats en bento 3 colonnes, exercices en tableau compact avec colonnes (exercice | sets | repos). Dense et scannable.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Programme — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Détail programme — mobile-first</Typography>
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
