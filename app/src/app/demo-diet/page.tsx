'use client'

import { useState } from 'react'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Add from '@mui/icons-material/Add'
import DarkMode from '@mui/icons-material/DarkMode'
import LightMode from '@mui/icons-material/LightMode'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import TrendingUp from '@mui/icons-material/TrendingUp'
import Restaurant from '@mui/icons-material/Restaurant'

// =========================================================
// Design tokens (inline for demo isolation)
// =========================================================

const GOLD = '#d4af37'
const GOLD_LIGHT = '#e8c860'

const tc = {
  h: (d: boolean) => d ? '#f5f0e6' : '#1a1715',
  m: (d: boolean) => d ? '#9a9488' : '#7a7468',
  f: (d: boolean) => d ? '#6b655c' : '#a09888',
}

const surfaceBg = (d: boolean) => d ? '#0a0a09' : '#f3f1ec'

const cardSx = (d: boolean, extra?: object) => ({
  bgcolor: d ? alpha('#ffffff', 0.07) : '#ffffff',
  borderRadius: '14px',
  border: '1px solid',
  borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
  ...extra,
})

const glassSx = (d: boolean, extra?: object) => ({
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  bgcolor: d ? alpha('#1c1a14', 0.65) : alpha('#ffffff', 0.72),
  border: '1px solid',
  borderColor: d ? alpha(GOLD, 0.12) : alpha(GOLD, 0.18),
  borderRadius: '20px',
  boxShadow: d
    ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#ffffff', 0.04)}`
    : `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${alpha('#ffffff', 0.6)}`,
  ...extra,
})

const meshBg = (d: boolean) => d
  ? `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.06)} 0%, transparent 50%), #0a0a0a`
  : `radial-gradient(ellipse at 30% 20%, ${alpha(GOLD, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${alpha(GOLD, 0.05)} 0%, transparent 50%), #f5f3ef`

// =========================================================
// Mock data
// =========================================================

const MOCK = {
  targetCalories: 2200,
  consumed: 1450,
  remaining: 750,
  pct: 66,
  protein: { cur: 95, target: 140, color: '#93c5fd' },
  carbs: { cur: 180, target: 250, color: '#fcd34d' },
  fat: { cur: 48, target: 70, color: '#fca5a5' },
  workoutBonus: 320,
}

const MEALS = [
  {
    key: 'breakfast', label: 'Petit-déjeuner', emoji: '☀️', color: '#ff9800',
    calories: 520, target: 660,
    entries: [
      { name: 'Flocons d\'avoine', time: '07:30', kcal: 280 },
      { name: 'Banane', time: '07:30', kcal: 105 },
      { name: 'Beurre de cacahuète', time: '07:32', kcal: 135 },
    ],
  },
  {
    key: 'lunch', label: 'Déjeuner', emoji: '🍽️', color: '#4caf50',
    calories: 680, target: 660,
    entries: [
      { name: 'Poulet grillé 200g', time: '12:15', kcal: 330 },
      { name: 'Riz basmati 150g', time: '12:15', kcal: 195 },
      { name: 'Salade composée', time: '12:18', kcal: 85 },
      { name: 'Huile d\'olive 1cs', time: '12:18', kcal: 70 },
    ],
  },
  {
    key: 'snack', label: 'Collation', emoji: '🍎', color: '#e91e63',
    calories: 250, target: 220,
    entries: [
      { name: 'Whey protéine', time: '16:00', kcal: 120 },
      { name: 'Pomme', time: '16:05', kcal: 80 },
      { name: 'Amandes 20g', time: '16:05', kcal: 50 },
    ],
  },
  {
    key: 'dinner', label: 'Dîner', emoji: '🌙', color: '#7c3aed',
    calories: 0, target: 660,
    entries: [],
  },
]

const WEEK_DATA = [
  { day: 'Lun', kcal: 2050 },
  { day: 'Mar', kcal: 2320 },
  { day: 'Mer', kcal: 1890 },
  { day: 'Jeu', kcal: 2180 },
  { day: 'Ven', kcal: 2400 },
  { day: 'Sam', kcal: 1750 },
  { day: 'Dim', kcal: 1450 },
]

// =========================================================
// Shared: SVG Calorie Ring
// =========================================================

function CalorieRing({ size, stroke, pct, d, label }: { size: number; stroke: number; pct: number; d: boolean; label?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GOLD} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${alpha(GOLD, 0.4)})` }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: size > 80 ? '1.1rem' : '0.75rem', fontWeight: 700, color: tc.h(d), lineHeight: 1 }}>
          {pct}%
        </Typography>
        {label && <Typography sx={{ fontSize: '0.5rem', color: tc.f(d), mt: 0.3 }}>{label}</Typography>}
      </Box>
    </Box>
  )
}

// =========================================================
// Shared: Macro pill
// =========================================================

function MacroPill({ label, cur, target, color, d }: { label: string; cur: number; target: number; color: string; d: boolean }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.65rem', color: tc.m(d), fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.65rem', color: tc.h(d), fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{cur}/{target}g</Typography>
    </Stack>
  )
}

// =========================================================
// Shared: Week bar chart
// =========================================================

function WeekChart({ d }: { d: boolean }) {
  const max = Math.max(...WEEK_DATA.map(w => w.kcal), MOCK.targetCalories)
  const avg = Math.round(WEEK_DATA.reduce((s, w) => s + w.kcal, 0) / 7)
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.m(d) }}>Cette semaine</Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TrendingUp sx={{ fontSize: 14, color: GOLD }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.h(d) }}>Moy: {avg} kcal</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ height: 120, alignItems: 'flex-end' }}>
        {WEEK_DATA.map((w, i) => {
          const h = (w.kcal / max) * 100
          const isToday = i === 6
          const isOver = w.kcal > MOCK.targetCalories
          return (
            <Box key={w.day} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tc.f(d), fontVariantNumeric: 'tabular-nums' }}>
                {w.kcal > 0 ? w.kcal : ''}
              </Typography>
              <Box sx={{
                width: '100%', maxWidth: 28, height: `${h}%`, minHeight: 4,
                borderRadius: '6px 6px 2px 2px',
                bgcolor: isToday ? GOLD : isOver ? alpha('#ef4444', 0.6) : d ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06),
                border: isToday ? `1px solid ${GOLD}` : 'none',
                transition: 'height 0.4s ease',
              }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: isToday ? 700 : 500, color: isToday ? GOLD : tc.f(d) }}>
                {w.day}
              </Typography>
            </Box>
          )
        })}
      </Stack>
      <Box sx={{ mt: 1, borderTop: '1px dashed', borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06), pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.6rem', color: tc.f(d), textAlign: 'right' }}>
          Objectif: {MOCK.targetCalories} kcal/j
        </Typography>
      </Box>
    </Box>
  )
}

// =========================================================
// Shared: Segmented control
// =========================================================

function Segments({ value, onChange, d }: { value: number; onChange: (v: number) => void; d: boolean }) {
  const labels = ['Aujourd\'hui', 'Semaine', 'Mois']
  return (
    <Stack direction="row" sx={{
      bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
      borderRadius: '12px', p: 0.4,
    }}>
      {labels.map((l, i) => (
        <Box
          key={l}
          onClick={() => onChange(i)}
          sx={{
            flex: 1, py: 0.8, textAlign: 'center', borderRadius: '10px', cursor: 'pointer',
            bgcolor: value === i ? (d ? alpha('#ffffff', 0.1) : '#ffffff') : 'transparent',
            boxShadow: value === i ? (d ? 'none' : '0 1px 4px rgba(0,0,0,0.08)') : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', fontWeight: value === i ? 700 : 500, color: value === i ? tc.h(d) : tc.m(d) }}>
            {l}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

// =========================================================
// Shared: Monthly summary
// =========================================================

function MonthlySummary({ d }: { d: boolean }) {
  const avg = Math.round(WEEK_DATA.reduce((s, w) => s + w.kcal, 0) / 7)
  return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>📊</Typography>
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d), mb: 0.5 }}>Résumé mensuel</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: tc.m(d), mb: 2 }}>Moyenne sur 7 jours</Typography>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: GOLD, lineHeight: 1 }}>{avg}</Typography>
      <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>kcal/jour en moyenne</Typography>
      <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>105</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Protéines (g)</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>210</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Glucides (g)</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>62</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Lipides (g)</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// =========================================================
// DemoNav
// =========================================================

const NAV_ITEMS = [
  { key: 'home', label: 'Accueil', active: false },
  { key: 'workout', label: 'Training', active: false },
  { key: 'journal', label: 'Journal', active: true },
  { key: 'profile', label: 'Profil', active: false },
]

function DemoNav({ isDark: d }: { isDark: boolean }) {
  return (
    <>
      <Box sx={{ height: 88 }} />
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, maxWidth: 500, mx: 'auto', p: 1.5, pt: 0 }}>
        <Box sx={{
          borderRadius: '22px',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          bgcolor: d ? alpha('#1c1a14', 0.7) : alpha('#ffffff', 0.75),
          border: '1px solid', borderColor: d ? alpha(GOLD, 0.15) : alpha(GOLD, 0.2),
          boxShadow: d
            ? `0 -4px 30px rgba(0,0,0,0.5), 0 0 1px ${alpha(GOLD, 0.2)}, inset 0 1px 0 ${alpha('#ffffff', 0.06)}`
            : `0 -4px 30px rgba(0,0,0,0.06), 0 0 1px ${alpha(GOLD, 0.3)}, inset 0 1px 0 ${alpha('#ffffff', 0.7)}`,
          overflow: 'hidden',
        }}>
          <Stack direction="row" sx={{ height: 64 }}>
            {NAV_ITEMS.map((item) => (
              <Box key={item.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
                <Box sx={{
                  px: item.active ? 2.5 : 1, py: 0.6, borderRadius: '12px',
                  bgcolor: item.active ? alpha(GOLD, 0.15) : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Restaurant sx={{ fontSize: 21, color: item.active ? GOLD : d ? '#6b6560' : '#9a9490', ...(item.active && { filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.5)})` }) }} />
                </Box>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: item.active ? 700 : 500, color: item.active ? GOLD : d ? '#6b6560' : '#9a9490', lineHeight: 1 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  )
}

// =========================================================
// Variant A: "Minimal Flat" — Apple Health-inspired
// Clean cards, inline text stats, large number focus
// =========================================================

function VariantA({ isDark: d }: { isDark: boolean }) {
  const [seg, setSeg] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(d) }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: tc.h(d), letterSpacing: '-0.02em' }}>
          Journal
        </Typography>
      </Box>

      <Box sx={{ px: 3, pb: 2 }}>
        <Segments value={seg} onChange={setSeg} d={d} />
      </Box>

      {seg === 0 && (
        <Box sx={{ px: 3 }}>
          <Stack spacing={2}>
            {/* Summary — big number + ring side by side */}
            <Box sx={cardSx(d, { p: 2.5 })}>
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <CalorieRing size={72} stroke={6} pct={MOCK.pct} d={d} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tc.h(d), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {MOCK.consumed}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.3 }}>
                    sur {MOCK.targetCalories} kcal · reste {MOCK.remaining}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <MacroPill label="Prot" cur={MOCK.protein.cur} target={MOCK.protein.target} color={MOCK.protein.color} d={d} />
                <MacroPill label="Gluc" cur={MOCK.carbs.cur} target={MOCK.carbs.target} color={MOCK.carbs.color} d={d} />
                <MacroPill label="Lip" cur={MOCK.fat.cur} target={MOCK.fat.target} color={MOCK.fat.color} d={d} />
              </Stack>
            </Box>

            {/* Workout bonus */}
            <Box sx={cardSx(d, { p: 2, borderColor: alpha(GOLD, 0.2) })}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FitnessCenter sx={{ fontSize: 18, color: GOLD }} />
                <Typography sx={{ fontSize: '0.8rem', color: tc.m(d), flex: 1 }}>Séance aujourd&apos;hui</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: GOLD }}>+{MOCK.workoutBonus} kcal</Typography>
              </Stack>
            </Box>

            {/* Meals — compact list */}
            {MEALS.map((meal) => (
              <Box key={meal.key}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1rem' }}>{meal.emoji}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d), flex: 1 }}>{meal.label}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), fontVariantNumeric: 'tabular-nums' }}>
                    {meal.calories}/{meal.target}
                  </Typography>
                  <IconButton size="small" sx={{ width: 28, height: 28, bgcolor: alpha(GOLD, 0.1) }}>
                    <Add sx={{ fontSize: 16, color: GOLD }} />
                  </IconButton>
                </Stack>
                {meal.entries.length > 0 ? (
                  <Box sx={cardSx(d, { overflow: 'hidden' })}>
                    {meal.entries.map((e, i) => (
                      <Box key={i} sx={{ px: 2, py: 1.2, borderBottom: i < meal.entries.length - 1 ? '1px solid' : 'none', borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04) }}>
                        <Stack direction="row" alignItems="center">
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(d), flex: 1 }} noWrap>{e.name}</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mr: 1.5 }}>{e.time}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.m(d), fontVariantNumeric: 'tabular-nums' }}>{e.kcal}</Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed', borderColor: d ? alpha(GOLD, 0.15) : alpha(GOLD, 0.2), borderRadius: '14px' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: tc.f(d) }}>Aucun aliment</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {seg === 1 && <Box sx={{ px: 3 }}><Box sx={cardSx(d, { p: 2.5 })}><WeekChart d={d} /></Box></Box>}
      {seg === 2 && <Box sx={{ px: 3 }}><Box sx={cardSx(d, { p: 2.5 })}><MonthlySummary d={d} /></Box></Box>}

      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Variant B: "Glass Dashboard" — Glassmorphism + data viz
// Large ring, glass cards, gradient macro bars
// =========================================================

function VariantB({ isDark: d }: { isDark: boolean }) {
  const [seg, setSeg] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', background: meshBg(d) }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: tc.h(d), letterSpacing: '-0.01em' }}>
          Journal
        </Typography>
      </Box>

      <Box sx={{ px: 3, pb: 2 }}>
        <Segments value={seg} onChange={setSeg} d={d} />
      </Box>

      {seg === 0 && (
        <Box sx={{ px: 3 }}>
          <Stack spacing={2.5}>
            {/* Hero ring — centered, large */}
            <Box sx={glassSx(d, { p: 3, textAlign: 'center' })}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CalorieRing size={110} stroke={8} pct={MOCK.pct} d={d} label="objectif" />
              </Box>
              <Stack direction="row" justifyContent="space-around">
                <Box>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: tc.h(d) }}>{MOCK.consumed}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consommé</Typography>
                </Box>
                <Box sx={{ width: 1, bgcolor: d ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06) }} />
                <Box>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: GOLD }}>{MOCK.remaining}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restant</Typography>
                </Box>
              </Stack>

              {/* Macro bars */}
              <Stack spacing={1.2} sx={{ mt: 2.5 }}>
                {[MOCK.protein, MOCK.carbs, MOCK.fat].map((m, i) => {
                  const labels = ['Protéines', 'Glucides', 'Lipides']
                  return (
                    <Box key={i}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                        <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>{labels[i]}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>{m.cur}/{m.target}g</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((m.cur / m.target) * 100, 100)}
                        sx={{
                          height: 6, borderRadius: 3,
                          bgcolor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                          '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 3 },
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
            </Box>

            {/* Workout bonus */}
            <Box sx={glassSx(d, { p: 2, borderColor: alpha(GOLD, 0.25) })}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(GOLD, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FitnessCenter sx={{ fontSize: 18, color: GOLD }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d) }}>Séance du jour</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>Calories ajoutées à ton objectif</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: GOLD }}>+{MOCK.workoutBonus}</Typography>
              </Stack>
            </Box>

            {/* Meals as glass tiles */}
            {MEALS.map((meal) => (
              <Box key={meal.key} sx={glassSx(d, { p: 2 })}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: meal.entries.length > 0 ? 1.5 : 0 }}>
                  <Typography sx={{ fontSize: '1.1rem' }}>{meal.emoji}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(d) }}>{meal.label}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((meal.calories / meal.target) * 100, 100)}
                      sx={{
                        height: 4, borderRadius: 2, mt: 0.5,
                        bgcolor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                        '& .MuiLinearProgress-bar': { bgcolor: GOLD, borderRadius: 2 },
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(d), fontVariantNumeric: 'tabular-nums' }}>
                    {meal.calories}/{meal.target}
                  </Typography>
                  <IconButton size="small" sx={{ width: 30, height: 30, bgcolor: alpha(GOLD, 0.12) }}>
                    <Add sx={{ fontSize: 16, color: GOLD }} />
                  </IconButton>
                </Stack>
                {meal.entries.map((e, i) => (
                  <Stack key={i} direction="row" alignItems="center" sx={{ pl: 4, py: 0.5 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: tc.h(d), flex: 1 }} noWrap>{e.name}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: tc.f(d), mr: 1 }}>{e.time}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(d), fontVariantNumeric: 'tabular-nums' }}>{e.kcal}</Typography>
                  </Stack>
                ))}
                {meal.entries.length === 0 && (
                  <Typography sx={{ fontSize: '0.7rem', color: tc.f(d), textAlign: 'center', py: 1 }}>Pas encore d&apos;entrées</Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {seg === 1 && <Box sx={{ px: 3 }}><Box sx={glassSx(d, { p: 2.5 })}><WeekChart d={d} /></Box></Box>}
      {seg === 2 && <Box sx={{ px: 3 }}><Box sx={glassSx(d, { p: 2.5 })}><MonthlySummary d={d} /></Box></Box>}

      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Variant C: "Editorial" — Magazine style, bold typography
// Big numbers, timeline layout, generous whitespace
// =========================================================

function VariantC({ isDark: d }: { isDark: boolean }) {
  const [seg, setSeg] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(d) }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Journal nutritionnel
        </Typography>
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tc.h(d), letterSpacing: '-0.03em', lineHeight: 1.1, mt: 0.5 }}>
          Aujourd&apos;hui
        </Typography>
      </Box>

      <Box sx={{ px: 3, pb: 2 }}>
        <Segments value={seg} onChange={setSeg} d={d} />
      </Box>

      {seg === 0 && (
        <Box sx={{ px: 3 }}>
          <Stack spacing={3}>
            {/* Hero stats — editorial grid */}
            <Stack direction="row" spacing={1.5}>
              <Box sx={cardSx(d, { flex: 2, p: 2.5 })}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Consommé
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: tc.h(d), lineHeight: 1, mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                  {MOCK.consumed}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>
                  sur {MOCK.targetCalories} kcal
                </Typography>
              </Box>
              <Box sx={cardSx(d, { flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' })}>
                <CalorieRing size={64} stroke={5} pct={MOCK.pct} d={d} />
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: GOLD, mt: 1 }}>{MOCK.remaining}</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>restant</Typography>
              </Box>
            </Stack>

            {/* Macros — 3 column grid */}
            <Stack direction="row" spacing={1}>
              {[
                { label: 'Protéines', ...MOCK.protein },
                { label: 'Glucides', ...MOCK.carbs },
                { label: 'Lipides', ...MOCK.fat },
              ].map((m) => (
                <Box key={m.label} sx={cardSx(d, { flex: 1, p: 1.5, textAlign: 'center' })}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color, mx: 'auto', mb: 0.8 }} />
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>
                    {m.cur}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>/{m.target}g</Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: tc.m(d), mt: 0.3 }}>{m.label}</Typography>
                </Box>
              ))}
            </Stack>

            {/* Workout bonus — accent stripe */}
            <Box sx={{ borderLeft: `3px solid ${GOLD}`, pl: 2, py: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(d) }}>
                +{MOCK.workoutBonus} kcal ajoutées
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>
                Séance d&apos;entraînement aujourd&apos;hui
              </Typography>
            </Box>

            {/* Meals — timeline style */}
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
                Repas du jour
              </Typography>
              <Stack spacing={0}>
                {MEALS.map((meal, mealIdx) => (
                  <Box key={meal.key} sx={{ position: 'relative', pl: 3, pb: mealIdx < MEALS.length - 1 ? 3 : 1 }}>
                    {/* Timeline line */}
                    {mealIdx < MEALS.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 5, top: 14, bottom: 0, width: 1, bgcolor: d ? alpha(GOLD, 0.15) : alpha(GOLD, 0.2) }} />
                    )}
                    {/* Timeline dot */}
                    <Box sx={{ position: 'absolute', left: 0, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: meal.calories > 0 ? GOLD : (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)), border: meal.calories > 0 ? 'none' : `1px dashed ${tc.f(d)}` }} />
                    {/* Content */}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tc.h(d), flex: 1 }}>
                        {meal.emoji} {meal.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: meal.calories > 0 ? tc.h(d) : tc.f(d), fontVariantNumeric: 'tabular-nums' }}>
                        {meal.calories > 0 ? `${meal.calories} kcal` : '—'}
                      </Typography>
                      <IconButton size="small" sx={{ width: 26, height: 26 }}>
                        <Add sx={{ fontSize: 14, color: GOLD }} />
                      </IconButton>
                    </Stack>
                    {meal.entries.map((e, i) => (
                      <Stack key={i} direction="row" alignItems="center" sx={{ py: 0.4, ml: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: tc.m(d), flex: 1 }} noWrap>{e.name}</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: tc.f(d), mr: 1 }}>{e.time}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(d), fontVariantNumeric: 'tabular-nums' }}>{e.kcal}</Typography>
                      </Stack>
                    ))}
                    {meal.entries.length === 0 && (
                      <Typography sx={{ fontSize: '0.7rem', color: tc.f(d), fontStyle: 'italic' }}>Pas encore renseigné</Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}

      {seg === 1 && <Box sx={{ px: 3 }}><Box sx={cardSx(d, { p: 2.5 })}><WeekChart d={d} /></Box></Box>}
      {seg === 2 && <Box sx={{ px: 3 }}><Box sx={cardSx(d, { p: 2.5 })}><MonthlySummary d={d} /></Box></Box>}

      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Main Page
// =========================================================

export default function DemoDietPage() {
  const [variantIndex, setVariantIndex] = useState(0)
  const [isDark, setIsDark] = useState(true)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={4} sx={{ position: 'sticky', top: 0, zIndex: 300, borderRadius: 0, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, letterSpacing: 1 }}>
              JOURNAL — BLACK & GOLD
            </Typography>
            <IconButton size="small" onClick={() => setIsDark(!isDark)} sx={{ color: 'primary.contrastText' }}>
              {isDark ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
        </Box>
        <Tabs value={variantIndex} onChange={(_, v) => setVariantIndex(v)} variant="fullWidth" sx={{
          minHeight: 36,
          '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem', minHeight: 36, py: 0 },
          '& .Mui-selected': { color: '#fff' },
          '& .MuiTabs-indicator': { bgcolor: '#fff' },
        }}>
          <Tab label="A: Minimal" />
          <Tab label="B: Glass" />
          <Tab label="C: Editorial" />
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1 }}>
        {variantIndex === 0 && <VariantA isDark={isDark} />}
        {variantIndex === 1 && <VariantB isDark={isDark} />}
        {variantIndex === 2 && <VariantC isDark={isDark} />}
      </Box>
    </Box>
  )
}
