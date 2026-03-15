'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'

// ── Mock data ───────────────────────────────────────────────────
const DAYS = [
  { day: 'Jeu', num: 12 }, { day: 'Ven', num: 13 }, { day: 'Sam', num: 14 },
  { day: 'Dim', num: 15, active: true }, { day: 'Lun', num: 16 }, { day: 'Mar', num: 17 }, { day: 'Mer', num: 18 },
]
const NUTRITION = { cal: 1450, targetCal: 2925, prot: 92, targetProt: 196, carbs: 148, targetCarbs: 329, fat: 44, targetFat: 97 }
const MEALS = [
  { name: 'Petit-déj', cal: 420, target: 878, color: '#ff9800', items: ['Oeufs brouillés', 'Pain complet', 'Café'] },
  { name: 'Déjeuner', cal: 680, target: 878, color: '#4caf50', items: ['Poulet grillé', 'Riz basmati', 'Salade'] },
  { name: 'Snack', cal: 200, target: 293, color: '#e91e63', items: ['Banane', 'Amandes'] },
  { name: 'Dîner', cal: 150, target: 878, color: '#2196f3', items: [] },
]

const W = 'light' as const
const GOLD = '#d4af37'
const MC = { P: GOLD, G: '#4ade80', L: '#f97316' }

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

// ── Shared date strip ───────────────────────────────────────────
function DateStrip({ tk, isDark }: { tk: T; isDark: boolean }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1.5 }}>
      <CaretLeft size={16} weight={W} color={tk.f} style={{ cursor: 'pointer' }} />
      <Stack direction="row" spacing={0.5}>
        {DAYS.map((d) => (
          <Box key={d.num} sx={{
            width: 36, textAlign: 'center', py: 0.5, borderRadius: '10px', cursor: 'pointer',
            bgcolor: d.active ? GOLD : 'transparent',
          }}>
            <Typography sx={{ fontSize: '0.5rem', color: d.active ? '#1a1715' : tk.f, fontWeight: 500 }}>{d.day}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: d.active ? '#1a1715' : tk.h, fontWeight: d.active ? 800 : 500 }}>{d.num}</Typography>
          </Box>
        ))}
      </Stack>
      <CaretRight size={16} weight={W} color={tk.f} style={{ cursor: 'pointer' }} />
    </Stack>
  )
}

// ── Shared macro bars ───────────────────────────────────────────
function MacroRow({ tk }: { tk: T }) {
  return (
    <Stack direction="row" spacing={2}>
      {[
        { k: 'Prot', v: NUTRITION.prot, t: NUTRITION.targetProt, c: MC.P },
        { k: 'Gluc', v: NUTRITION.carbs, t: NUTRITION.targetCarbs, c: MC.G },
        { k: 'Lip', v: NUTRITION.fat, t: NUTRITION.targetFat, c: MC.L },
      ].map((m) => (
        <Box key={m.k} sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.2 }}>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 500 }}>{m.k}</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.m, fontWeight: 600 }}>{m.v}/{m.t}g</Typography>
          </Stack>
          <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(m.c, 0.1), overflow: 'hidden' }}>
            <Box sx={{ width: `${Math.min((m.v / m.t) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: m.c }} />
          </Box>
        </Box>
      ))}
    </Stack>
  )
}

// ════════════════════════════════════════════════════════════════
// A — MINIMAL ALIGNED
// Même style que home+workout. Cards subtiles, labels uppercase,
// bold typo, dividers fins. Cohérence totale.
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const remaining = NUTRITION.targetCal - NUTRITION.cal

  return (
    <Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', mb: 1.5 }}>
        Journal
      </Typography>

      <DateStrip tk={tk} isDark={isDark} />

      <Stack spacing={1.5}>
        {/* Nutrition summary */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
            <Typography sx={lblSx}>Nutrition</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: remaining > 0 ? tk.m : '#f87171', fontWeight: 600 }}>
              {remaining > 0 ? `${remaining} restant` : `${Math.abs(remaining)} en trop`}
            </Typography>
          </Stack>
          {/* Big calorie number */}
          <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {NUTRITION.cal}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.f, fontWeight: 500 }}>
              / {NUTRITION.targetCal} kcal
            </Typography>
          </Stack>
          <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden', mb: 1.2 }}>
            <Box sx={{ width: `${Math.min((NUTRITION.cal / NUTRITION.targetCal) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: GOLD }} />
          </Box>
          <MacroRow tk={tk} />
        </Box>

        {/* Meals */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Repas</Typography>
          {MEALS.map((meal, i) => (
            <Stack key={meal.name} direction="row" alignItems="center" sx={{
              py: 1,
              borderBottom: i < MEALS.length - 1 ? '1px solid' : 'none',
              borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meal.color, flexShrink: 0, mr: 1.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{meal.name}</Typography>
                {meal.items.length > 0 && (
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.15 }}>{meal.items.join(' · ')}</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.65rem', color: tk.m, fontWeight: 600, mr: 1 }}>
                {meal.cal}/{meal.target}
              </Typography>
              <Plus size={14} weight={W} color={tk.f} style={{ cursor: 'pointer' }} />
            </Stack>
          ))}
        </Box>

        {/* Add meal */}
        <Box sx={{
          border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer',
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: tk.f, fontWeight: 500 }}>+ Ajouter un repas</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — PROGRESS HERO
// Grand nombre calories en hero, progress bar proéminente,
// macros en 3 colonnes sous la barre, repas en flat list
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const remaining = NUTRITION.targetCal - NUTRITION.cal
  const pct = Math.min((NUTRITION.cal / NUTRITION.targetCal) * 100, 100)

  return (
    <Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', mb: 1.5 }}>
        Journal
      </Typography>

      <DateStrip tk={tk} isDark={isDark} />

      <Stack spacing={1.5}>
        {/* Hero calorie card */}
        <Box sx={{ ...cellSx, p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3.5rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {NUTRITION.cal}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: tk.f, fontWeight: 500, mt: 0.3 }}>
            sur {NUTRITION.targetCal} kcal · {remaining > 0 ? `reste ${remaining}` : `+${Math.abs(remaining)}`}
          </Typography>
          {/* Wide progress bar */}
          <Box sx={{ mt: 2, mb: 2, height: 8, borderRadius: 4, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden' }}>
            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, bgcolor: GOLD, transition: 'width 0.5s' }} />
          </Box>
          {/* Macro columns */}
          <Stack direction="row" justifyContent="space-around">
            {[
              { k: 'Protéines', v: NUTRITION.prot, t: NUTRITION.targetProt, c: MC.P },
              { k: 'Glucides', v: NUTRITION.carbs, t: NUTRITION.targetCarbs, c: MC.G },
              { k: 'Lipides', v: NUTRITION.fat, t: NUTRITION.targetFat, c: MC.L },
            ].map((m, i) => (
              <Box key={m.k} sx={i === 1 ? { borderLeft: 1, borderRight: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), px: 2.5 } : undefined}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{m.v}g</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.k}</Typography>
                <Box sx={{ mt: 0.5, width: 40, height: 2.5, borderRadius: 2, bgcolor: alpha(m.c, 0.15), overflow: 'hidden', mx: 'auto' }}>
                  <Box sx={{ width: `${Math.min((m.v / m.t) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: m.c }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Meals — flat list, no card wrapper */}
        {MEALS.map((meal) => (
          <Box key={meal.name} sx={{ ...cellSx, px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="center">
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meal.color, mr: 1.5, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{meal.name}</Typography>
                {meal.items.length > 0 && (
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.1 }}>{meal.items.join(' · ')}</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: tk.m, fontWeight: 700 }}>{meal.cal}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f, ml: 0.3 }}>kcal</Typography>
              <Plus size={14} weight={W} color={tk.f} style={{ marginLeft: 8, cursor: 'pointer' }} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — SPLIT DASHBOARD
// Calories + macros en bento 2 colonnes, repas groupés
// dans une seule card avec progress bars par repas
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const remaining = NUTRITION.targetCal - NUTRITION.cal

  return (
    <Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', mb: 1.5 }}>
        Journal
      </Typography>

      <DateStrip tk={tk} isDark={isDark} />

      <Stack spacing={1.5}>
        {/* Bento: Calories + Macros side by side */}
        <Stack direction="row" spacing={1.2}>
          {/* Calorie cell */}
          <Box sx={{ ...cellSx, flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {NUTRITION.cal}
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 500, mt: 0.3 }}>
              / {NUTRITION.targetCal} kcal
            </Typography>
            <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min((NUTRITION.cal / NUTRITION.targetCal) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: GOLD }} />
            </Box>
            <Typography sx={{ fontSize: '0.5rem', color: remaining > 0 ? tk.m : '#f87171', fontWeight: 600, mt: 0.5 }}>
              {remaining > 0 ? `${remaining} restant` : `${Math.abs(remaining)} en trop`}
            </Typography>
          </Box>

          {/* Macro cell */}
          <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
            <Typography sx={{ ...lblSx, mb: 1 }}>Macros</Typography>
            {[
              { k: 'P', label: 'Prot', v: NUTRITION.prot, t: NUTRITION.targetProt, c: MC.P },
              { k: 'G', label: 'Gluc', v: NUTRITION.carbs, t: NUTRITION.targetCarbs, c: MC.G },
              { k: 'L', label: 'Lip', v: NUTRITION.fat, t: NUTRITION.targetFat, c: MC.L },
            ].map((m) => (
              <Box key={m.k} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '0.55rem', color: m.c, fontWeight: 700 }}>{m.label}</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tk.h }}>{m.v}g</Typography>
                </Stack>
                <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(m.c, 0.1), overflow: 'hidden', mt: 0.3 }}>
                  <Box sx={{ width: `${Math.min((m.v / m.t) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: m.c }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Stack>

        {/* Meals with mini progress */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Repas</Typography>
          {MEALS.map((meal, i) => {
            const pct = meal.target > 0 ? Math.min((meal.cal / meal.target) * 100, 100) : 0
            return (
              <Box key={meal.name} sx={{
                py: 1,
                borderBottom: i < MEALS.length - 1 ? '1px solid' : 'none',
                borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
              }}>
                <Stack direction="row" alignItems="center" sx={{ mb: 0.4 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meal.color, mr: 1.5, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h, flex: 1 }}>{meal.name}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: tk.m, fontWeight: 600, mr: 1 }}>
                    {meal.cal} kcal
                  </Typography>
                  <Plus size={14} weight={W} color={tk.f} style={{ cursor: 'pointer' }} />
                </Stack>
                <Box sx={{ height: 2.5, borderRadius: 2, bgcolor: alpha(meal.color, 0.1), overflow: 'hidden', ml: 2.5 }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, bgcolor: meal.color, transition: 'width 0.3s' }} />
                </Box>
                {meal.items.length > 0 && (
                  <Typography sx={{ fontSize: '0.48rem', color: tk.f, mt: 0.3, ml: 2.5 }}>{meal.items.join(' · ')}</Typography>
                )}
              </Box>
            )
          })}
        </Box>

        {/* Add meal */}
        <Box sx={{
          border: '1px dashed', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer',
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: tk.f, fontWeight: 500 }}>+ Ajouter un repas</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoDietPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Minimal Aligned', desc: 'Même style que home+workout. Cards subtiles, gros chiffre cal, macros inline, repas en liste avec dividers.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Progress Hero', desc: 'Calories en 3.5rem centré, large barre, macros en 3 colonnes avec dividers. Repas en cards individuelles.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Split Dashboard', desc: 'Calories + macros en bento 2 colonnes. Repas avec mini progress bars colorées par slot.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Diet — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page journal nutrition — mobile-first</Typography>
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
