'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, DotsThreeVertical, Trophy, NoteBlank } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const SESSION = { date: 'Dimanche 15 Mars', time: '16:45', duration: '45min', volume: 165, series: 3, kcal: 1 }
const EXERCISES = [
  {
    name: 'L-Fly poulie', volume: 165,
    sets: [
      { num: 1, reps: 11, weight: '5.00', rest: '1:30', pr: true },
      { num: 2, reps: 11, weight: '5.00', rest: '1:30', pr: true },
      { num: 3, reps: 11, weight: '5.00', rest: '1:30', pr: true },
    ],
  },
]

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

// ════════════════════════════════════════════════════════════════
// A — ENRICHED RECAP
// Stats enrichis (durée ajoutée), muscles travaillés,
// header programme si lié, exercices avec volume par exo
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ArrowLeft size={20} weight={W} color={tk.h} />
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{SESSION.date}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>{SESSION.time} · {SESSION.duration}</Typography>
          </Box>
        </Stack>
        <DotsThreeVertical size={20} weight={W} color={tk.m} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Programme source */}
        <Box sx={{ ...cellSx, px: 2, py: 1.2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GOLD, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h, flex: 1 }}>Reprise Upper Body</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: tk.f }}>Programme</Typography>
          </Stack>
        </Box>

        {/* Stats */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {[
              { v: `${SESSION.volume}kg`, l: 'Volume' },
              { v: String(SESSION.series), l: 'Séries' },
              { v: SESSION.duration, l: 'Durée' },
              { v: String(SESSION.kcal), l: 'kcal' },
            ].map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Exercises */}
        {EXERCISES.map((ex) => (
          <Box key={ex.name} sx={{ ...cellSx, p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.h }}>{ex.name}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 500 }}>{ex.volume}kg</Typography>
            </Stack>
            {ex.sets.map((set, i) => (
              <Stack key={set.num} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < ex.sets.length - 1 ? sep : {}) }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tk.f, width: 16, flexShrink: 0 }}>{set.num}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: tk.h, flex: 1 }}>
                  <Typography component="span" fontWeight={600}>{set.reps}</Typography>
                  <Typography component="span" sx={{ color: tk.f, mx: 0.5 }}>x</Typography>
                  <Typography component="span" fontWeight={600}>{set.weight}kg</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.f, mr: 1 }}>{set.rest}</Typography>
                {set.pr && (
                  <Stack direction="row" alignItems="center" spacing={0.3} sx={{ bgcolor: alpha(GOLD, 0.12), px: 0.8, py: 0.2, borderRadius: '6px' }}>
                    <Trophy size={12} weight={W} color={GOLD} />
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: GOLD }}>PR</Typography>
                  </Stack>
                )}
              </Stack>
            ))}
          </Box>
        ))}

        {/* Note */}
        <Box sx={{ ...cellSx, py: 1.5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.75}>
            <NoteBlank size={14} weight={W} color={tk.f} />
            <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>Ajouter une note de séance</Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — COMPACT TIMELINE
// Sets affichés en grille compacte (pas de lignes individuelles),
// stats en bento 2x2, header minimal
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ArrowLeft size={20} weight={W} color={tk.h} />
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{SESSION.date}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>{SESSION.time}</Typography>
          </Box>
        </Stack>
        <DotsThreeVertical size={20} weight={W} color={tk.m} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Stats bento 2x2 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {[
            { v: `${SESSION.volume}kg`, l: 'Volume' },
            { v: SESSION.duration, l: 'Durée' },
            { v: String(SESSION.series), l: 'Séries' },
            { v: String(SESSION.kcal), l: 'kcal' },
          ].map((s) => (
            <Box key={s.l} sx={{ ...cellSx, p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>

        {/* Exercises — compact table */}
        {EXERCISES.map((ex) => (
          <Box key={ex.name} sx={{ ...cellSx, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tk.h }}>{ex.name}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tk.f }}>{ex.volume}kg</Typography>
              </Stack>
            </Box>
            {/* Compact header */}
            <Stack direction="row" sx={{ px: 2, py: 0.5, borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.04) }}>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', width: 16 }}>#</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', flex: 1 }}>Reps × Poids</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', width: 35, textAlign: 'center' }}>Repos</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 600, textTransform: 'uppercase', width: 30, textAlign: 'right' }}></Typography>
            </Stack>
            {ex.sets.map((set) => (
              <Stack key={set.num} direction="row" alignItems="center" sx={{ px: 2, py: 0.8 }}>
                <Typography sx={{ fontSize: '0.6rem', color: tk.f, width: 16 }}>{set.num}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: tk.h, fontWeight: 600, flex: 1 }}>{set.reps} × {set.weight}kg</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.f, width: 35, textAlign: 'center' }}>{set.rest}</Typography>
                <Box sx={{ width: 30, textAlign: 'right' }}>
                  {set.pr && <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: GOLD }}>PR</Typography>}
                </Box>
              </Stack>
            ))}
          </Box>
        ))}

        {/* Note */}
        <Box sx={{ ...cellSx, py: 1.5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>+ Ajouter une note</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — SUMMARY FIRST
// Grand résumé visuel en haut (big number volume),
// exercices avec highlight PR, muscles tags
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const prCount = EXERCISES.reduce((sum, ex) => sum + ex.sets.filter(s => s.pr).length, 0)

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ArrowLeft size={20} weight={W} color={tk.h} />
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{SESSION.date}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>{SESSION.time} · {SESSION.duration}</Typography>
          </Box>
        </Stack>
        <DotsThreeVertical size={20} weight={W} color={tk.m} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Hero volume */}
        <Box sx={{ ...cellSx, p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {SESSION.volume}<Typography component="span" sx={{ fontSize: '0.8rem', color: tk.f, fontWeight: 500 }}>kg</Typography>
          </Typography>
          <Typography sx={{ fontSize: '0.55rem', color: tk.f, mt: 0.5 }}>volume total</Typography>

          <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>{SESSION.series}</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.08em' }}>séries</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h }}>{SESSION.kcal}</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.08em' }}>kcal</Typography>
            </Box>
            {prCount > 0 && (
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: GOLD }}>{prCount}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, textTransform: 'uppercase', letterSpacing: '0.08em' }}>PRs</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Exercises */}
        {EXERCISES.map((ex) => (
          <Box key={ex.name} sx={{ ...cellSx, p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.h }}>{ex.name}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: tk.f }}>{ex.volume}kg</Typography>
            </Stack>
            {ex.sets.map((set, i) => (
              <Stack key={set.num} direction="row" alignItems="center" sx={{
                py: 0.8, ...(i < ex.sets.length - 1 ? sep : {}),
                ...(set.pr ? { ml: -1, pl: 1, borderLeft: `2px solid ${GOLD}` } : {}),
              }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tk.f, width: 16 }}>{set.num}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: tk.h, flex: 1 }}>
                  <Typography component="span" fontWeight={600}>{set.reps}</Typography>
                  <Typography component="span" sx={{ color: tk.f, mx: 0.5 }}>x</Typography>
                  <Typography component="span" fontWeight={600}>{set.weight}kg</Typography>
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.f, mr: 1 }}>{set.rest}</Typography>
                {set.pr && <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: GOLD }}>PR</Typography>}
              </Stack>
            ))}
          </Box>
        ))}

        {/* Note */}
        <Box sx={{ ...cellSx, py: 1.5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography sx={{ fontSize: '0.65rem', color: tk.f }}>+ Ajouter une note</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoSessionDetailPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Enriched Recap', desc: 'Lien programme source, stats en row (volume|séries|durée|kcal), exercices avec dividers et badges PR. Cohérent avec le reste.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Compact Table', desc: 'Stats en bento 2x2, exercices en tableau compact avec header de colonnes (#, Reps×Poids, Repos). Dense et scannable.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Summary First', desc: 'Hero volume en 3rem centré, séries/kcal/PRs en sous-stats. Sets PR avec bordure gauche dorée. Impact visuel fort.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Session — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Détail séance — mobile-first</Typography>
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
