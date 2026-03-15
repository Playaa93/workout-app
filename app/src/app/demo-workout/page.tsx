'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, CaretRight, Plus, Lightning } from '@phosphor-icons/react'

// ── Mock data ───────────────────────────────────────────────────
const TEMPLATES = [
  { id: '1', name: 'Reprise upper Body', muscles: ['Épaules', 'Dos', 'Pectoraux', 'Bras'] },
  { id: '2', name: 'Reprise lower Body', muscles: ['Dos', 'Abdos', 'Jambes'] },
]
const SESSIONS = [
  { id: '1', name: 'Reprise Upper Body', date: 'dim. 15 mars', exercises: ['L-Fly poulie'], muscles: ['Épaules'], stats: '1 exo · 0min · 165kg · 1 kcal' },
  { id: '2', name: 'Reprise Upper Body', date: 'ven. 13 mars', exercises: ['L-Fly poulie'], muscles: ['Épaules'], stats: '1 exo · 1min · 150kg · 9 kcal' },
]
const IN_PROGRESS = { id: 'ip1', label: 'Séance en cours', since: '16:45' }

const W = 'light' as const
const GOLD = '#d4af37'

// ── Theme tokens ────────────────────────────────────────────────
const TK = {
  light: {
    bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)',
    h: '#1a1715', m: '#7a7468', f: '#a09888',
  },
  dark: {
    bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)',
    h: '#f5f0e6', m: '#9a9488', f: '#6b655c',
  },
}
type T = typeof TK.light

// ════════════════════════════════════════════════════════════════
// A — MINIMAL ALIGNED
// Même style que la home: bold typo, cards subtiles, CTA inversé,
// labels uppercase, tout dans des cards, pas d'icônes superflues
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', mb: 2.5 }}>
        Entraînement
      </Typography>

      <Stack spacing={1.5}>
        {/* CTA */}
        <Button fullWidth sx={{
          py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
          bgcolor: tk.h, color: tk.bg, textTransform: 'none',
        }}>
          + Nouvelle séance
        </Button>

        {/* In-progress */}
        <Box sx={{ ...cellSx, p: 2, borderColor: alpha(GOLD, 0.3) }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD, boxShadow: `0 0 8px ${alpha(GOLD, 0.5)}` }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{IN_PROGRESS.label}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>Depuis {IN_PROGRESS.since}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: GOLD }}>Reprendre</Typography>
          </Stack>
        </Box>

        {/* Programmes */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography sx={lblSx}>Programmes</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600 }}>+ Créer</Typography>
          </Stack>
          {TEMPLATES.map((tpl, i) => (
            <Stack key={tpl.id} direction="row" alignItems="center" sx={{
              py: 1, ...(i < TEMPLATES.length - 1 ? sep : {}),
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{tpl.name}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.2 }}>{tpl.muscles.join(' · ')}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>

        {/* Récent */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Récent</Typography>
          {SESSIONS.map((s, i) => (
            <Stack key={s.id} direction="row" alignItems="center" sx={{
              py: 1, ...(i < SESSIONS.length - 1 ? sep : {}),
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }} noWrap>{s.name}</Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: tk.f, flexShrink: 0 }}>{s.date}</Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.5rem', color: tk.m, mt: 0.2 }}>{s.exercises.join(' · ')}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.15 }}>{s.stats}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — SECTION TABS
// Programmes et Historique dans 2 onglets, CTA sticky,
// header avec compteur
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const [tab, setTab] = useState<'programmes' | 'historique'>('programmes')
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em' }}>
          Entraînement
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 500 }}>
          2 séances ce mois
        </Typography>
      </Stack>

      {/* In-progress */}
      <Box sx={{ ...cellSx, p: 2, mb: 1.5, borderColor: alpha(GOLD, 0.3) }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD, boxShadow: `0 0 8px ${alpha(GOLD, 0.5)}` }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{IN_PROGRESS.label}</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>Depuis {IN_PROGRESS.since}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: GOLD }}>Reprendre</Typography>
        </Stack>
      </Box>

      {/* Tabs */}
      <Stack direction="row" sx={{ mb: 2 }}>
        {(['programmes', 'historique'] as const).map((t) => (
          <Box key={t} onClick={() => setTab(t)} sx={{
            flex: 1, textAlign: 'center', py: 1, cursor: 'pointer',
            borderBottom: '2px solid', borderColor: tab === t ? GOLD : 'transparent',
            transition: 'border-color 0.2s',
          }}>
            <Typography sx={{
              fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: tab === t ? tk.h : tk.f,
            }}>
              {t}
            </Typography>
          </Box>
        ))}
      </Stack>

      {tab === 'programmes' ? (
        <Stack spacing={1}>
          {TEMPLATES.map((tpl) => (
            <Box key={tpl.id} sx={{ ...cellSx, p: 2 }}>
              <Stack direction="row" alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tk.h }}>{tpl.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.2 }}>{tpl.muscles.join(' · ')}</Typography>
                </Box>
                <CaretRight size={14} weight={W} color={tk.f} />
              </Stack>
            </Box>
          ))}
          <Box sx={{
            border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
            borderRadius: '14px', py: 2, textAlign: 'center', cursor: 'pointer',
          }}>
            <Typography sx={{ fontSize: '0.7rem', color: tk.f, fontWeight: 500 }}>+ Créer un programme</Typography>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1}>
          {SESSIONS.map((s) => (
            <Box key={s.id} sx={{ ...cellSx, p: 2 }}>
              <Stack direction="row" alignItems="center">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }} noWrap>{s.name}</Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: tk.f, flexShrink: 0 }}>{s.date}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.2 }}>{s.stats}</Typography>
                </Box>
                <CaretRight size={14} weight={W} color={tk.f} />
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 3 }}>
        <Button fullWidth startIcon={<Plus size={16} weight="bold" />} sx={{
          py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
          bgcolor: tk.h, color: tk.bg, textTransform: 'none',
          boxShadow: `0 4px 20px ${alpha('#000', 0.15)}`,
        }}>
          Nouvelle séance
        </Button>
      </Box>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — COMPACT GRID
// Programmes en grille 2 colonnes, 2 quick actions (libre + cardio),
// dense
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', mb: 2 }}>
        Entraînement
      </Typography>

      <Stack spacing={1.5}>
        {/* Quick actions */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" spacing={1}>
            <Button fullWidth startIcon={<Lightning size={16} weight={W} />} sx={{
              py: 1.3, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
              bgcolor: tk.h, color: tk.bg, textTransform: 'none', flex: 1,
            }}>
              Séance libre
            </Button>
            <Button fullWidth sx={{
              py: 1.3, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
              bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
              color: tk.m, textTransform: 'none', flex: 1,
            }}>
              Cardio
            </Button>
          </Stack>
        </Box>

        {/* In-progress */}
        <Box sx={{ ...cellSx, p: 2, borderColor: alpha(GOLD, 0.3) }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD, boxShadow: `0 0 8px ${alpha(GOLD, 0.5)}` }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{IN_PROGRESS.label}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>Depuis {IN_PROGRESS.since}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: GOLD }}>Reprendre</Typography>
          </Stack>
        </Box>

        {/* Programmes — 2 col grid */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={lblSx}>Programmes</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600 }}>+ Créer</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {TEMPLATES.map((tpl) => (
              <Box key={tpl.id} sx={{ ...cellSx, p: 2 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: tk.h, mb: 0.3 }}>{tpl.name}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, lineHeight: 1.3 }}>{tpl.muscles.join(' · ')}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Récent */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Récent</Typography>
          {SESSIONS.map((s, i) => (
            <Stack key={s.id} direction="row" alignItems="center" sx={{
              py: 0.8, ...(i < SESSIONS.length - 1 ? sep : {}),
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }} noWrap>{s.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f, flexShrink: 0 }}>{s.date}</Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.48rem', color: tk.m, mt: 0.15 }}>{s.muscles.join(' · ')}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.1 }}>{s.stats}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
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

export default function DemoWorkoutPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Minimal Aligned', desc: 'Même style que la home refaite. CTA inversé, labels uppercase, tout dans des cards subtiles. Cohérence totale.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Section Tabs', desc: 'Programmes et Historique dans 2 onglets. CTA en bas. Moins de scroll, plus de focus.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Compact Grid', desc: 'Programmes en grille 2 colonnes, 2 quick actions (libre + cardio) au lieu d\'un seul CTA. Dense.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Workout — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page entraînement — mobile-first</Typography>
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
