'use client'

import React, { useId, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import { Sun, Moon, CaretRight } from '@phosphor-icons/react'
import { alpha } from '@mui/material/styles'

// ── Shared mock data ────────────────────────────────────────────
const DATA = { cal: 1450, targetCal: 2925, prot: 92, targetProt: 196, carbs: 148, targetCarbs: 329, fat: 44, targetFat: 97 }

// ── Color tokens ────────────────────────────────────────────────
const GOLD = '#d4af37'
const GOLD_LIGHT = '#e8c860'

const MACRO_COLORS = {
  P: GOLD,
  G: '#4ade80',
  L: '#f97316',
}

// ── Theme tokens (simplified for demo) ──────────────────────────
const themes = {
  light: {
    bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)',
    h: '#1a1715', m: '#7a7468', f: '#a09888',
    glassBg: 'rgba(255,255,255,0.72)', glassBorder: 'rgba(212,175,55,0.18)',
  },
  dark: {
    bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)',
    h: '#f5f0e6', m: '#9a9488', f: '#6b655c',
    glassBg: 'rgba(28,26,20,0.65)', glassBorder: 'rgba(212,175,55,0.12)',
  },
}

type T = typeof themes.light

// ── Helper: SVG Arc Path ────────────────────────────────────────
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) }
  const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) }
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

// ── Theme toggle ────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <IconButton onClick={onToggle} size="small" sx={{ color: isDark ? '#f5f0e6' : '#1a1715' }}>
      {isDark ? <Sun size={18} weight="light" /> : <Moon size={18} weight="light" />}
    </IconButton>
  )
}

// ════════════════════════════════════════════════════════════════
// APPROACH A — "Macro Arcs"
// 3 semi-circular gauges + central calorie counter
// Inspired by Apple Watch rings & Cal AI
// ════════════════════════════════════════════════════════════════

function ApproachA({ theme: tk }: { theme: T }) {
  const id = useId()
  const size = 200
  const ctr = size / 2
  const rings = [
    { key: 'L', r: 72, color: MACRO_COLORS.L, cur: DATA.fat, target: DATA.targetFat, label: 'Lip' },
    { key: 'G', r: 56, color: MACRO_COLORS.G, cur: DATA.carbs, target: DATA.targetCarbs, label: 'Gluc' },
    { key: 'P', r: 40, color: MACRO_COLORS.P, cur: DATA.prot, target: DATA.targetProt, label: 'Prot' },
  ]

  return (
    <Box sx={{
      bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder,
      borderRadius: '20px', p: 2.5, cursor: 'pointer',
      transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.01)' },
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tk.m, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Nutrition
        </Typography>
        <CaretRight size={14} weight="light" color={tk.f} />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Concentric rings */}
        <Box sx={{ position: 'relative', width: size, height: size / 2 + 20, flexShrink: 0, mx: 'auto' }}>
          <svg viewBox={`0 0 ${size} ${size / 2 + 20}`} style={{ width: '100%', height: '100%' }}>
            {rings.map((ring) => {
              const startAngle = Math.PI
              const endAngleBg = 0
              const pct = Math.min(ring.cur / ring.target, 1)
              const endAngleFill = Math.PI - pct * Math.PI
              return (
                <g key={ring.key}>
                  <path
                    d={arcPath(ctr, ctr / 2 + 20, ring.r, startAngle, endAngleBg)}
                    fill="none" stroke={alpha(ring.color, 0.12)} strokeWidth={8} strokeLinecap="round"
                  />
                  {pct > 0 && (
                    <path
                      d={arcPath(ctr, ctr / 2 + 20, ring.r, startAngle, endAngleFill)}
                      fill="none" stroke={ring.color} strokeWidth={8} strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 6px ${alpha(ring.color, 0.4)})` }}
                    />
                  )}
                </g>
              )
            })}
          </svg>
          {/* Center calorie count */}
          <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
              {DATA.cal}
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 500 }}>
              / {DATA.targetCal} kcal
            </Typography>
          </Box>
        </Box>

        {/* Macro legend */}
        <Stack spacing={1.2} sx={{ flexShrink: 0 }}>
          {rings.reverse().map((ring) => (
            <Stack key={ring.key} direction="row" spacing={0.8} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ring.color, boxShadow: `0 0 6px ${alpha(ring.color, 0.5)}` }} />
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tk.h, lineHeight: 1 }}>
                  {ring.cur}g
                </Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f, lineHeight: 1.2 }}>
                  {ring.label}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// APPROACH B — "Glass Pill"
// Glassmorphism card with mini ring + stacked pill bars
// Inspired by Apple Liquid Glass 2026 trend
// ════════════════════════════════════════════════════════════════

function ApproachB({ theme: tk, isDark }: { theme: T; isDark: boolean }) {
  const gradId = useId()
  const ringSize = 72
  const sw = 6
  const r = (ringSize / 2) - sw - 2
  const circ = 2 * Math.PI * r
  const calPct = Math.min(DATA.cal / DATA.targetCal, 1)
  const ctr = ringSize / 2

  const macros = [
    { key: 'P', label: 'Protéines', cur: DATA.prot, target: DATA.targetProt, color: MACRO_COLORS.P },
    { key: 'G', label: 'Glucides', cur: DATA.carbs, target: DATA.targetCarbs, color: MACRO_COLORS.G },
    { key: 'L', label: 'Lipides', cur: DATA.fat, target: DATA.targetFat, color: MACRO_COLORS.L },
  ]

  return (
    <Box sx={{
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      bgcolor: tk.glassBg, border: '1px solid', borderColor: tk.glassBorder,
      borderRadius: '20px', p: 2, cursor: 'pointer',
      boxShadow: isDark
        ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#ffffff', 0.04)}`
        : `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${alpha('#ffffff', 0.6)}`,
      transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.01)' },
    }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Mini calorie ring */}
        <Box sx={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
          <svg viewBox={`0 0 ${ringSize} ${ringSize}`} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={GOLD} />
                <stop offset="100%" stopColor={GOLD_LIGHT} />
              </linearGradient>
            </defs>
            <circle cx={ctr} cy={ctr} r={r} fill="none" stroke={alpha(GOLD, 0.1)} strokeWidth={sw} />
            <circle cx={ctr} cy={ctr} r={r} fill="none"
              stroke={`url(#${gradId})`} strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - calPct)}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
              {DATA.cal}
            </Typography>
            <Typography sx={{ fontSize: '0.42rem', color: tk.f, fontWeight: 500, mt: 0.2 }}>
              / {DATA.targetCal}
            </Typography>
          </Box>
        </Box>

        {/* Macro pill bars */}
        <Box sx={{ flex: 1 }}>
          {macros.map((m) => {
            const pct = m.target > 0 ? Math.min((m.cur / m.target) * 100, 100) : 0
            return (
              <Stack key={m.key} direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.6, '&:last-child': { mb: 0 } }}>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: m.color, width: 10, textAlign: 'center' }}>
                  {m.key}
                </Typography>
                <Box sx={{
                  flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(m.color, 0.12), overflow: 'hidden',
                }}>
                  <Box sx={{
                    width: `${pct}%`, height: '100%', borderRadius: 3, bgcolor: m.color,
                    transition: 'width 0.6s ease-out',
                    boxShadow: `0 0 8px ${alpha(m.color, 0.3)}`,
                  }} />
                </Box>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tk.m, minWidth: 34, textAlign: 'right' }}>
                  {m.cur}/{m.target}
                </Typography>
              </Stack>
            )
          })}
        </Box>

        <CaretRight size={14} weight="light" color={tk.f} style={{ flexShrink: 0 }} />
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// APPROACH C — "Segmented Grid"
// 4 segmented cells: calories dominant + 3 compact macro cells
// Inspired by Fitbod/Garmin data-dense dashboards
// ════════════════════════════════════════════════════════════════

function ApproachC({ theme: tk, isDark }: { theme: T; isDark: boolean }) {
  const calPct = Math.min(DATA.cal / DATA.targetCal, 1)
  const remaining = DATA.targetCal - DATA.cal

  const macros = [
    { key: 'P', label: 'Prot', cur: DATA.prot, target: DATA.targetProt, color: MACRO_COLORS.P },
    { key: 'G', label: 'Gluc', cur: DATA.carbs, target: DATA.targetCarbs, color: MACRO_COLORS.G },
    { key: 'L', label: 'Lip', cur: DATA.fat, target: DATA.targetFat, color: MACRO_COLORS.L },
  ]

  return (
    <Box sx={{
      bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder,
      borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.01)' },
    }}>
      {/* Top: calorie bar full-width */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.8 }}>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
              {DATA.cal}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.f, fontWeight: 500 }}>
              kcal
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: '0.62rem', color: remaining > 0 ? MACRO_COLORS.G : '#f87171', fontWeight: 600 }}>
            {remaining > 0 ? `${remaining} restant` : `${Math.abs(remaining)} en trop`}
          </Typography>
        </Stack>
        {/* Full-width progress bar */}
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(GOLD, 0.1), overflow: 'hidden' }}>
          <Box sx={{
            width: `${calPct * 100}%`, height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
            transition: 'width 0.6s ease-out',
            boxShadow: `0 0 10px ${alpha(GOLD, 0.3)}`,
          }} />
        </Box>
      </Box>

      {/* Bottom: 3 macro cells */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        borderTop: '1px solid', borderColor: isDark ? alpha('#ffffff', 0.06) : alpha('#000', 0.05),
      }}>
        {macros.map((m, i) => {
          const pct = m.target > 0 ? Math.min((m.cur / m.target) * 100, 100) : 0
          return (
            <Box key={m.key} sx={{
              py: 1.5, px: 1.5, textAlign: 'center',
              borderRight: i < 2 ? '1px solid' : 'none',
              borderColor: isDark ? alpha('#ffffff', 0.06) : alpha('#000', 0.05),
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>
                {m.cur}
                <Typography component="span" sx={{ fontSize: '0.5rem', fontWeight: 500, color: tk.f }}>g</Typography>
              </Typography>
              <Box sx={{ mt: 0.6, mx: 'auto', width: '80%', height: 3, borderRadius: 2, bgcolor: alpha(m.color, 0.12), overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, bgcolor: m.color, transition: 'width 0.5s ease-out' }} />
              </Box>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f, fontWeight: 500, mt: 0.4 }}>
                {m.label} / {m.target}g
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoNutritionPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const tk = themes[mode]
  const isDark = mode === 'dark'

  const approaches = [
    {
      name: 'Macro Arcs',
      desc: 'Arcs concentriques semi-circulaires. Data-viz premium, style Apple Watch / Cal AI.',
      component: <ApproachA theme={tk} />,
    },
    {
      name: 'Glass Pill',
      desc: 'Glassmorphism + ring calories + barres macro empilées. Aérien, style Liquid Glass 2026.',
      component: <ApproachB theme={tk} isDark={isDark} />,
    },
    {
      name: 'Segmented Grid',
      desc: 'Calorie bar pleine largeur + grille 3 colonnes macro. Dense et lisible, style Fitbod / Garmin.',
      component: <ApproachC theme={tk} isDark={isDark} />,
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>
              Nutrition Widget
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: tk.m }}>
              3 propositions visuelles — mobile-first
            </Typography>
          </Box>
          <ThemeToggle isDark={isDark} onToggle={() => setMode(isDark ? 'light' : 'dark')} />
        </Stack>

        {/* Approaches */}
        <Stack spacing={4}>
          {approaches.map((a, i) => (
            <Box key={i}>
              <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.5 }}>
                <Typography sx={{
                  fontSize: '0.6rem', fontWeight: 700, color: GOLD,
                  bgcolor: alpha(GOLD, isDark ? 0.12 : 0.08),
                  px: 0.8, py: 0.2, borderRadius: '6px', lineHeight: 1.4,
                }}>
                  {String.fromCharCode(65 + i)}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.h }}>
                  {a.name}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.65rem', color: tk.m, mb: 1.5, lineHeight: 1.4 }}>
                {a.desc}
              </Typography>
              {a.component}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
