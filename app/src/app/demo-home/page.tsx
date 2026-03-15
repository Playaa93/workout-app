'use client'

import React, { useId, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import { alpha } from '@mui/material/styles'
import {
  Barbell, Sun, Moon, CaretRight, Flame, Trophy, Lightning,
  TrendDown, Scales, ForkKnife,
} from '@phosphor-icons/react'

// ── Mock data ───────────────────────────────────────────────────
const USER = { name: 'Hazim ZUKIC', level: 9, xp: 971, xpMax: 2562, streak: 8 }
const WEEKLY = { workouts: 2, goal: 4, totalWorkouts: 2, totalPRs: 3 }
const NUTRITION = { cal: 1450, targetCal: 2925, prot: 92, targetProt: 196, carbs: 148, targetCarbs: 329, fat: 44, targetFat: 97 }
const SESSIONS = [
  { id: '1', name: 'Reprise Upper Body', date: 'dim. 15 mars', muscles: ['Épaules'] },
  { id: '2', name: 'Reprise Upper Body', date: 'ven. 13 mars', muscles: ['Épaules'] },
]
const PRS = [
  { exercise: 'L-Fly poulie', value: 6.8, ago: "aujourd'hui" },
  { exercise: 'Dév. sol haltères', value: 53.3, ago: 'il y a 6j' },
  { exercise: 'Dév. couché barre', value: 66.7, ago: 'il y a 6j' },
]
const BODY = { weight: 109.1, diff: -0.9, bodyFat: null as number | null }

const W = 'light' as const
const GOLD = '#d4af37'
const GOLD_LIGHT = '#e8c860'
const MC = { P: GOLD, G: '#4ade80', L: '#f97316' }

// ── Theme tokens ────────────────────────────────────────────────
const TK = {
  light: {
    bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)',
    h: '#1a1715', m: '#7a7468', f: '#a09888',
    glassBg: 'rgba(255,255,255,0.72)', glassBorder: 'rgba(212,175,55,0.18)',
    glassShadow: `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${alpha('#ffffff', 0.6)}`,
    subtleBorder: 'rgba(0,0,0,0.05)',
  },
  dark: {
    bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)',
    h: '#f5f0e6', m: '#9a9488', f: '#6b655c',
    glassBg: 'rgba(28,26,20,0.65)', glassBorder: 'rgba(212,175,55,0.12)',
    glassShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#ffffff', 0.04)}`,
    subtleBorder: 'rgba(255,255,255,0.06)',
  },
}
type T = typeof TK.light

// ── Shared SVG ring ─────────────────────────────────────────────
function Ring({ size, sw, pct, color, children }: {
  size: number; sw: number; pct: number; color: string; children?: React.ReactNode
}) {
  const id = useId()
  const r = (size / 2) - sw - 2
  const circ = 2 * Math.PI * r
  const ctr = size / 2
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={GOLD_LIGHT} />
          </linearGradient>
        </defs>
        <circle cx={ctr} cy={ctr} r={r} fill="none" stroke={alpha(color, 0.12)} strokeWidth={sw} />
        <circle cx={ctr} cy={ctr} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(pct, 1))}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </Box>
  )
}

// ── Shared macro bars ───────────────────────────────────────────
function MacroBars({ tk }: { tk: T }) {
  return (
    <>
      {[
        { k: 'P', c: MC.P, cur: NUTRITION.prot, t: NUTRITION.targetProt },
        { k: 'G', c: MC.G, cur: NUTRITION.carbs, t: NUTRITION.targetCarbs },
        { k: 'L', c: MC.L, cur: NUTRITION.fat, t: NUTRITION.targetFat },
      ].map((m) => (
        <Stack key={m.k} direction="row" alignItems="center" spacing={0.7} sx={{ mb: 0.35, '&:last-child': { mb: 0 } }}>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: m.c, width: 8 }}>{m.k}</Typography>
          <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: alpha(m.c, 0.12), overflow: 'hidden' }}>
            <Box sx={{ width: `${Math.min((m.cur / m.t) * 100, 100)}%`, height: '100%', borderRadius: 3, bgcolor: m.c, transition: 'width 0.5s' }} />
          </Box>
          <Typography sx={{ fontSize: '0.5rem', color: tk.m, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{m.cur}g</Typography>
        </Stack>
      ))}
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// A — BENTO GRID
// Modular asymmetric grid. Dense, everything at a glance.
// Apple / Fitbod 2026
// ════════════════════════════════════════════════════════════════

function BentoHome({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cell = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '18px', p: 2, overflow: 'hidden' }
  const lbl = { fontSize: '0.55rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const, mb: 1 }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 42, height: 42, bgcolor: alpha(GOLD, 0.15), color: GOLD, fontSize: '1rem', fontWeight: 700, border: `2px solid ${GOLD}` }}>H</Avatar>
            <Box sx={{ position: 'absolute', top: -4, right: -8, bgcolor: '#ff9800', color: '#fff', borderRadius: '8px', px: 0.5, py: 0.1, display: 'flex', alignItems: 'center', gap: 0.2, fontSize: '0.5rem', fontWeight: 800, border: `2px solid ${tk.bg}` }}>
              <Flame size={8} weight={W} />{USER.streak}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.55rem', color: tk.f, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bonjour</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: tk.h, lineHeight: 1.2 }}>{USER.name}</Typography>
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
        {/* Ring */}
        <Box sx={{ ...cell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2.5 }}>
          <Ring size={110} sw={10} pct={WEEKLY.workouts / WEEKLY.goal} color={GOLD}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>
              {WEEKLY.workouts}<Typography component="span" sx={{ fontSize: '0.7rem', color: tk.f }}>/{WEEKLY.goal}</Typography>
            </Typography>
            <Typography sx={{ fontSize: '0.45rem', color: tk.f, fontWeight: 500, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>séances</Typography>
          </Ring>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 1.5, width: '100%' }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv.{USER.level}</Typography>
            <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` } }} />
          </Stack>
        </Box>

        {/* Stats */}
        <Box sx={cell}>
          <Typography sx={lbl}>Activité</Typography>
          {[{ v: WEEKLY.totalWorkouts, l: 'Workouts', c: GOLD }, { v: USER.streak, l: 'Streak', c: '#ff9800' }, { v: WEEKLY.totalPRs, l: 'Records', c: GOLD_LIGHT }].map((s) => (
            <Stack key={s.l} direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
              <Typography sx={{ fontSize: '0.65rem', color: tk.m, fontWeight: 500 }}>{s.l}</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: s.c }}>{s.v}</Typography>
            </Stack>
          ))}
        </Box>

        {/* Nutrition — 2 cols */}
        <Box sx={{ ...cell, gridColumn: 'span 2' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <ForkKnife size={14} weight={W} color={GOLD} />
              <Typography sx={{ ...lbl, mb: 0 }}>Nutrition</Typography>
            </Stack>
            <CaretRight size={14} weight={W} color={tk.f} />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Ring size={60} sw={5} pct={NUTRITION.cal / NUTRITION.targetCal} color={GOLD}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{NUTRITION.cal}</Typography>
              <Typography sx={{ fontSize: '0.35rem', color: tk.f }}>/{NUTRITION.targetCal}</Typography>
            </Ring>
            <Box sx={{ flex: 1 }}><MacroBars tk={tk} /></Box>
          </Stack>
        </Box>

        {/* CTA — 2 cols */}
        <Button fullWidth startIcon={<Lightning size={18} weight={W} />} sx={{ gridColumn: 'span 2', py: 1.6, borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#1a1715', textTransform: 'none', boxShadow: `0 4px 20px ${alpha(GOLD, 0.35)}` }}>
          Lancer une Séance
        </Button>

        {/* Sessions — 2 cols */}
        <Box sx={{ ...cell, gridColumn: 'span 2' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={lbl}>Dernières séances</Typography>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Voir tout</Typography>
          </Stack>
          {SESSIONS.map((s) => (
            <Stack key={s.id} direction="row" alignItems="center" sx={{ py: 0.8, borderBottom: '1px solid', borderColor: tk.subtleBorder, '&:last-child': { border: 'none', pb: 0 } }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{s.name}</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.f }}>{s.muscles.join(' · ')} · {s.date}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>

        {/* PRs */}
        <Box sx={cell}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}><Trophy size={12} weight={W} color={GOLD} /><Typography sx={{ ...lbl, mb: 0 }}>Records</Typography></Stack>
          {PRS.map((pr, i) => (
            <Box key={i} sx={{ mb: 0.6 }}>
              <Typography sx={{ fontSize: '0.6rem', color: tk.m }} noWrap>{pr.exercise}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: GOLD }}>{pr.value}<Typography component="span" sx={{ fontSize: '0.5rem', color: tk.f }}> kg</Typography></Typography>
            </Box>
          ))}
        </Box>

        {/* Body */}
        <Box sx={cell}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}><Scales size={12} weight={W} color={GOLD} /><Typography sx={{ ...lbl, mb: 0 }}>Évolution</Typography></Stack>
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{BODY.weight}<Typography component="span" sx={{ fontSize: '0.6rem', color: tk.m }}> kg</Typography></Typography>
          <Stack direction="row" spacing={0.3} alignItems="center" sx={{ mt: 0.5 }}>
            <TrendDown size={12} weight={W} color="#4ade80" />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#4ade80' }}>{BODY.diff} kg</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — GLASS FLOW
// Glassmorphism, mesh gradient, layered depth, Liquid Glass 2026
// ════════════════════════════════════════════════════════════════

function GlassHome({ tk, isDark }: { tk: T; isDark: boolean }) {
  const g = { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', bgcolor: tk.glassBg, border: '1px solid', borderColor: tk.glassBorder, borderRadius: '20px', boxShadow: tk.glassShadow }
  const meshBg = `radial-gradient(ellipse at 30% 0%, ${alpha(GOLD, isDark ? 0.12 : 0.1)} 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, ${alpha(GOLD_LIGHT, 0.06)} 0%, transparent 50%), ${tk.bg}`

  return (
    <Box sx={{ background: meshBg }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{ width: 46, height: 46, bgcolor: alpha(tk.f, 0.08), color: GOLD, fontSize: '1.1rem', fontWeight: 700, border: `2px solid ${GOLD}`, boxShadow: `0 0 16px ${alpha(GOLD, 0.3)}` }}>H</Avatar>
          <Box sx={{ position: 'absolute', top: -4, right: -8, bgcolor: '#ff9800', color: '#fff', borderRadius: '8px', px: 0.5, py: 0.1, display: 'flex', alignItems: 'center', gap: 0.2, fontSize: '0.5rem', fontWeight: 800, border: `2px solid ${tk.bg}`, boxShadow: '0 2px 8px rgba(255,152,0,0.4)' }}>
            <Flame size={8} weight={W} />{USER.streak}
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.55rem', color: tk.m, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bonjour</Typography>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: tk.h }}>{USER.name}</Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        {/* Hero ring + CTA */}
        <Box sx={{ ...g, p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Ring size={150} sw={11} pct={WEEKLY.workouts / WEEKLY.goal} color={GOLD}>
              <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{WEEKLY.workouts}<Typography component="span" sx={{ fontSize: '0.8rem', color: tk.m }}>/{WEEKLY.goal}</Typography></Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.m, fontWeight: 500, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>séances</Typography>
            </Ring>
          </Box>
          <Button fullWidth startIcon={<Barbell size={20} weight={W} />} sx={{ py: 1.6, borderRadius: '14px', fontSize: '0.9rem', fontWeight: 700, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#1a1715', textTransform: 'none', boxShadow: `0 4px 24px ${alpha(GOLD, 0.45)}` }}>
            Lancer une Séance
          </Button>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: GOLD }}>Niv. {USER.level}</Typography>
            <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` } }} />
            <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{USER.xp}/{USER.xpMax}</Typography>
          </Stack>
        </Box>

        {/* Stats row */}
        <Stack direction="row" spacing={1.2}>
          {[{ v: WEEKLY.totalWorkouts, l: 'Workouts', c: GOLD }, { v: USER.streak, l: 'Streak', c: '#ff9800' }, { v: WEEKLY.totalPRs, l: 'Records', c: GOLD_LIGHT }].map((s) => (
            <Box key={s.l} sx={{ ...g, flex: 1, py: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.m, fontWeight: 500, mt: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Nutrition */}
        <Box sx={{ ...g, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Ring size={64} sw={5} pct={NUTRITION.cal / NUTRITION.targetCal} color={GOLD}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{NUTRITION.cal}</Typography>
              <Typography sx={{ fontSize: '0.35rem', color: tk.f }}>/{NUTRITION.targetCal}</Typography>
            </Ring>
            <Box sx={{ flex: 1 }}><MacroBars tk={tk} /></Box>
            <CaretRight size={14} weight={W} color={tk.f} style={{ flexShrink: 0 }} />
          </Stack>
        </Box>

        {/* Sessions */}
        <Box sx={{ ...g, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tk.m, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dernières séances</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600 }}>Voir tout</Typography>
          </Stack>
          {SESSIONS.map((s) => (
            <Stack key={s.id} direction="row" alignItems="center" sx={{ py: 0.8, borderBottom: '1px solid', borderColor: tk.subtleBorder, '&:last-child': { border: 'none', pb: 0 } }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{s.name} <Typography component="span" sx={{ fontSize: '0.55rem', color: tk.f }}>{s.date}</Typography></Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.m }}>{s.muscles.join(' · ')}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>

        {/* PRs + Body */}
        <Stack direction="row" spacing={1.2}>
          <Box sx={{ ...g, flex: 1.2, p: 2 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}><Trophy size={12} weight={W} color={GOLD} /><Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tk.m, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Records</Typography></Stack>
            {PRS.map((pr, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', color: tk.m }} noWrap>{pr.exercise}</Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: GOLD, flexShrink: 0, ml: 1 }}>{pr.value}kg</Typography>
              </Stack>
            ))}
          </Box>
          <Box sx={{ ...g, flex: 0.8, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Scales size={16} weight={W} color={GOLD} />
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: tk.h, lineHeight: 1, mt: 0.8 }}>{BODY.weight}<Typography component="span" sx={{ fontSize: '0.55rem', color: tk.m }}> kg</Typography></Typography>
            <Stack direction="row" spacing={0.3} alignItems="center" sx={{ mt: 0.4 }}><TrendDown size={12} weight={W} color="#4ade80" /><Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#4ade80' }}>{BODY.diff} kg</Typography></Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — MINIMAL STACK
// Ultra-clean, bold typo, thin dividers, monochrome, Strong-like
// ════════════════════════════════════════════════════════════════

function MinimalHome({ tk, isDark }: { tk: T; isDark: boolean }) {
  const div = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pb: 2, mb: 2 }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ ...div, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: GOLD, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.3 }}>Bonjour</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.03em', lineHeight: 1 }}>{USER.name}</Typography>
        </Box>
        <Stack direction="row" spacing={0.3} alignItems="center" sx={{ bgcolor: alpha('#ff9800', 0.1), px: 1, py: 0.4, borderRadius: '10px' }}>
          <Flame size={12} weight={W} color="#ff9800" />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#ff9800' }}>{USER.streak}</Typography>
        </Stack>
      </Stack>

      {/* Big number */}
      <Box sx={{ textAlign: 'center', ...div }}>
        <Typography sx={{ fontSize: '4rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {WEEKLY.workouts}<Typography component="span" sx={{ fontSize: '1.2rem', color: tk.f, fontWeight: 500 }}> / {WEEKLY.goal}</Typography>
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: tk.m, fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>séances cette semaine</Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, maxWidth: 200, mx: 'auto' }}>
          <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv.{USER.level}</Typography>
          <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{ flex: 1, height: 2.5, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD } }} />
        </Stack>
      </Box>

      {/* CTA */}
      <Button fullWidth sx={{ py: 1.5, mb: 2.5, borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, bgcolor: tk.h, color: tk.bg, textTransform: 'none', '&:hover': { bgcolor: tk.h, opacity: 0.9 } }}>
        Lancer une Séance
      </Button>

      {/* Stats */}
      <Stack direction="row" justifyContent="space-around" sx={{ ...div, textAlign: 'center' }}>
        {[{ v: WEEKLY.totalWorkouts, l: 'Workouts' }, { v: USER.streak, l: 'Streak' }, { v: WEEKLY.totalPRs, l: 'Records' }].map((s, i) => (
          <Box key={s.l} sx={i === 1 ? { borderLeft: 1, borderRight: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), px: 4 } : undefined}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Nutrition — inline */}
      <Box sx={{ ...div }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nutrition</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: GOLD, fontWeight: 600 }}>{NUTRITION.cal} / {NUTRITION.targetCal} kcal</Typography>
        </Stack>
        <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden', mb: 1 }}>
          <Box sx={{ width: `${(NUTRITION.cal / NUTRITION.targetCal) * 100}%`, height: '100%', borderRadius: 2, bgcolor: GOLD }} />
        </Box>
        <Stack direction="row" spacing={2}>
          {[{ k: 'Prot', v: NUTRITION.prot, t: NUTRITION.targetProt, c: MC.P }, { k: 'Gluc', v: NUTRITION.carbs, t: NUTRITION.targetCarbs, c: MC.G }, { k: 'Lip', v: NUTRITION.fat, t: NUTRITION.targetFat, c: MC.L }].map((m) => (
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
      </Box>

      {/* Sessions */}
      <Box sx={{ ...div }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dernières séances</Typography>
          <Typography sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600 }}>Tout</Typography>
        </Stack>
        {SESSIONS.map((s) => (
          <Stack key={s.id} direction="row" alignItems="center" sx={{ py: 0.8 }}>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }}>{s.name}</Typography><Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{s.muscles.join(' · ')} · {s.date}</Typography></Box>
            <CaretRight size={14} weight={W} color={tk.f} />
          </Stack>
        ))}
      </Box>

      {/* PRs + Body */}
      <Stack direction="row" spacing={3}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>Records</Typography>
          {PRS.map((pr, i) => (
            <Stack key={i} direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
              <Typography sx={{ fontSize: '0.65rem', color: tk.m }} noWrap>{pr.exercise}</Typography>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: tk.h, ml: 1, flexShrink: 0 }}>{pr.value}kg</Typography>
            </Stack>
          ))}
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 3 }}>
          <Typography sx={{ fontSize: '0.6rem', color: tk.f, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>Poids</Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.03em' }}>{BODY.weight}</Typography>
          <Stack direction="row" spacing={0.3} alignItems="center" sx={{ mt: 0.3 }}><TrendDown size={12} weight={W} color="#4ade80" /><Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#4ade80' }}>{BODY.diff}kg</Typography></Stack>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoHomePage() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Bento Grid', desc: 'Grille modulaire asymétrique. Dense, tout visible d\'un coup d\'oeil. Style Apple / Fitbod 2026.', el: <BentoHome tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Glass Flow', desc: 'Glassmorphism + mesh gradient. Premium, aérien, profond. Style Liquid Glass 2026.', el: <GlassHome tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Minimal Stack', desc: 'Ultra-clean, bold typo, dividers fins, pas de cards. Style Strong / brutaliste.', el: <MinimalHome tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Home — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page d&apos;accueil complète — mobile-first</Typography>
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
              <Box sx={{ border: '2px solid', borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1), borderRadius: '28px', p: 2, overflow: 'hidden', bgcolor: a.tag === 'B' ? 'transparent' : tk.bg }}>
                {a.el}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
