'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, Flame, GearSix, Trophy, Star, Lightning, CaretRight, Lock, Barbell } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const USER = { name: 'Hazim ZUKIC', level: 9, xp: 5895, xpMax: 15300, streak: 8, morpho: 'Longiligne' }
const STATS = [
  { v: 3, l: 'PRs' }, { v: 0, l: 'Boss' }, { v: '5/16', l: 'Succès' }, { v: 2, l: 'Séances' },
]
const ACHIEVEMENTS = [
  { name: 'Semaine parfaite', desc: 'Streak de 7 jours d\'affilée', xp: 150, unlocked: true },
  { name: 'Prise de mesures', desc: 'Premières mensurations', xp: 50, unlocked: true },
  { name: 'Premier log', desc: 'Premier repas enregistré', xp: 25, unlocked: true },
  { name: 'Première séance', desc: 'Complète ta première séance', xp: 50, unlocked: false },
]
const XP_HISTORY = [
  { reason: 'Séance terminée', xp: 75, date: '15 mars' },
  { reason: 'Streak 7 jours', xp: 150, date: '14 mars' },
  { reason: 'Repas enregistré', xp: 10, date: '13 mars' },
]
const QUICK_ACTIONS = [
  { label: 'Training', sub: '2 séances' },
  { label: 'Journal', sub: '27 repas' },
  { label: 'Mesures', sub: '3 prises' },
  { label: 'Morpho', sub: USER.morpho },
]

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

// ════════════════════════════════════════════════════════════════
// A — MINIMAL ALIGNED (complet)
// Tout le contenu actuel, restyled : avatar + name, streak+morpho,
// actions rapides, tabs, stats, succès — même design system
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const [tab, setTab] = useState(0)
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const tabs = ['En bref', 'Succès', 'XP', 'Param.']

  return (
    <Box>
      {/* Header: avatar + name + gear */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(GOLD, 0.1), color: GOLD, fontSize: '1.1rem', fontWeight: 700, border: `2px solid ${GOLD}` }}>H</Avatar>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{USER.name}</Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.2 }}>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv. {USER.level}</Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tk.f }}>{USER.xp} XP</Typography>
            </Stack>
          </Box>
        </Stack>
        <GearSix size={20} weight={W} color={tk.f} />
      </Stack>

      {/* XP bar */}
      <Stack direction="row" alignItems="center" sx={{ mb: 0.3, px: 0.5 }}>
        <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{
          flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
          '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
        }} />
        <Typography sx={{ fontSize: '0.45rem', color: tk.f, ml: 1 }}>38% vers niv. 10</Typography>
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {/* Streak + Morpho side by side */}
        <Stack direction="row" spacing={1.2}>
          <Box sx={{ ...cellSx, flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Flame size={16} weight={W} color="#ff9800" />
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{USER.streak}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>jours streak</Typography>
            </Box>
          </Box>
          <Box sx={{ ...cellSx, flex: 1.3, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#7c3aed', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#7c3aed' }}>Lo</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h }}>{USER.morpho}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>Mon morphotype</Typography>
            </Box>
            <CaretRight size={14} weight={W} color={tk.f} />
          </Box>
        </Stack>

        {/* Actions rapides */}
        <Box>
          <Typography sx={{ ...lblSx, mb: 1 }}>Actions rapides</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {QUICK_ACTIONS.map((a) => (
              <Box key={a.label} sx={{ ...cellSx, p: 2, cursor: 'pointer', '&:active': { opacity: 0.85 } }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tk.h }}>{a.label}</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: tk.f, mt: 0.2 }}>{a.sub}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Tabs */}
        <Stack direction="row">
          {tabs.map((t, i) => (
            <Box key={t} onClick={() => setTab(i)} sx={{
              flex: 1, textAlign: 'center', py: 1, cursor: 'pointer',
              borderBottom: '2px solid', borderColor: tab === i ? GOLD : 'transparent',
            }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tab === i ? tk.h : tk.f, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Tab: En bref */}
        {tab === 0 && (
          <>
            {/* Stats row */}
            <Box sx={{ ...cellSx, p: 2 }}>
              <Stack direction="row" justifyContent="space-around" textAlign="center">
                {STATS.map((s, i) => (
                  <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
                    <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            {/* Succès récents */}
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Derniers succès</Typography>
              {ACHIEVEMENTS.filter(a => a.unlocked).map((a, i, arr) => (
                <Stack key={a.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < arr.length - 1 ? sep : {}) }}>
                  <Star size={14} weight={W} color={GOLD} style={{ marginRight: 8, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }}>{a.name}</Typography>
                    <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.desc}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: GOLD }}>+{a.xp}</Typography>
                </Stack>
              ))}
            </Box>
          </>
        )}

        {/* Tab: Succès */}
        {tab === 1 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Tous les succès</Typography>
            {ACHIEVEMENTS.map((a, i) => (
              <Stack key={a.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < ACHIEVEMENTS.length - 1 ? sep : {}), opacity: a.unlocked ? 1 : 0.4 }}>
                {a.unlocked ? <Star size={14} weight={W} color={GOLD} style={{ marginRight: 8 }} /> : <Lock size={14} weight={W} color={tk.f} style={{ marginRight: 8 }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }}>{a.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.desc}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: a.unlocked ? GOLD : tk.f }}>+{a.xp}</Typography>
              </Stack>
            ))}
          </Box>
        )}

        {/* Tab: XP */}
        {tab === 2 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Historique XP</Typography>
            {XP_HISTORY.map((x, i) => (
              <Stack key={i} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < XP_HISTORY.length - 1 ? sep : {}) }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{x.reason}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{x.date}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: GOLD }}>+{x.xp}</Typography>
              </Stack>
            ))}
          </Box>
        )}

        {/* Tab: Param (placeholder) */}
        {tab === 3 && (
          <Box sx={{ ...cellSx, p: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: tk.f }}>Thème, API keys, déconnexion...</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — COMPACT SECTIONS
// Pas de tabs : toutes les sections visibles en scroll.
// Actions rapides en liste au lieu de grille. Plus linéaire.
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      {/* Header compact */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(GOLD, 0.1), color: GOLD, fontSize: '1.1rem', fontWeight: 700, border: `2px solid ${GOLD}` }}>H</Avatar>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{USER.name}</Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.2 }}>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv. {USER.level}</Typography>
              <Stack direction="row" spacing={0.3} alignItems="center">
                <Flame size={10} weight={W} color="#ff9800" />
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#ff9800' }}>{USER.streak}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
        <GearSix size={20} weight={W} color={tk.f} />
      </Stack>

      <Stack spacing={1.5}>
        {/* Stats + XP bar in one card */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center" sx={{ mb: 2 }}>
            {STATS.map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: GOLD }}>Niv.{USER.level}</Typography>
            <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{
              flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
              '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
            }} />
            <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{USER.xp} XP</Typography>
          </Stack>
        </Box>

        {/* Quick actions as list */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1 }}>Raccourcis</Typography>
          {QUICK_ACTIONS.map((a, i) => (
            <Stack key={a.label} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < QUICK_ACTIONS.length - 1 ? sep : {}) }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h }}>{a.label}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.sub}</Typography>
              </Box>
              <CaretRight size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>

        {/* Succès */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Succès</Typography>
          {ACHIEVEMENTS.map((a, i) => (
            <Stack key={a.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < ACHIEVEMENTS.length - 1 ? sep : {}), opacity: a.unlocked ? 1 : 0.4 }}>
              {a.unlocked ? <Star size={14} weight={W} color={GOLD} style={{ marginRight: 8 }} /> : <Lock size={14} weight={W} color={tk.f} style={{ marginRight: 8 }} />}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{a.name}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.desc}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: a.unlocked ? GOLD : tk.f }}>+{a.xp}</Typography>
            </Stack>
          ))}
        </Box>

        {/* XP récent */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>XP récent</Typography>
          {XP_HISTORY.map((x, i) => (
            <Stack key={i} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < XP_HISTORY.length - 1 ? sep : {}) }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{x.reason}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{x.date}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: GOLD }}>+{x.xp}</Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — CARD PER SECTION
// Chaque section a sa propre card. Actions rapides en grille 2x2
// avec icônes. Streak+morpho intégrés dans le header card.
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const [tab, setTab] = useState(0)
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const tabs = ['En bref', 'Succès', 'XP', 'Param.']

  return (
    <Box>
      {/* Header card with everything */}
      <Box sx={{ ...cellSx, p: 2.5, mb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(GOLD, 0.1), color: GOLD, fontSize: '1.1rem', fontWeight: 700, border: `2px solid ${GOLD}` }}>H</Avatar>
            <Box>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{USER.name}</Typography>
              <Typography sx={{ fontSize: '0.55rem', color: tk.f, mt: 0.2 }}>
                Niv. {USER.level} · {USER.morpho} · <Typography component="span" sx={{ color: '#ff9800', fontWeight: 700 }}>{USER.streak}j streak</Typography>
              </Typography>
            </Box>
          </Stack>
          <GearSix size={20} weight={W} color={tk.f} />
        </Stack>
        {/* XP bar */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <LinearProgress variant="determinate" value={(USER.xp / USER.xpMax) * 100} sx={{
            flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
          }} />
          <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{USER.xp}/{USER.xpMax}</Typography>
        </Stack>
      </Box>

      <Stack spacing={1.5}>
        {/* Stats card */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {STATS.map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Actions rapides — grille */}
        <Box>
          <Typography sx={{ ...lblSx, mb: 1 }}>Actions rapides</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {QUICK_ACTIONS.map((a) => (
              <Box key={a.label} sx={{ ...cellSx, p: 2, cursor: 'pointer', '&:active': { opacity: 0.85 } }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: tk.h }}>{a.label}</Typography>
                <Typography sx={{ fontSize: '0.5rem', color: tk.f, mt: 0.2 }}>{a.sub}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Tabs */}
        <Stack direction="row">
          {tabs.map((t, i) => (
            <Box key={t} onClick={() => setTab(i)} sx={{
              flex: 1, textAlign: 'center', py: 1, cursor: 'pointer',
              borderBottom: '2px solid', borderColor: tab === i ? GOLD : 'transparent',
            }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tab === i ? tk.h : tk.f, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</Typography>
            </Box>
          ))}
        </Stack>

        {tab === 0 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Derniers succès</Typography>
            {ACHIEVEMENTS.filter(a => a.unlocked).map((a, i, arr) => (
              <Stack key={a.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < arr.length - 1 ? sep : {}) }}>
                <Star size={14} weight={W} color={GOLD} style={{ marginRight: 8, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{a.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.desc}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: GOLD }}>+{a.xp}</Typography>
              </Stack>
            ))}
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            {ACHIEVEMENTS.map((a, i) => (
              <Stack key={a.name} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < ACHIEVEMENTS.length - 1 ? sep : {}), opacity: a.unlocked ? 1 : 0.4 }}>
                {a.unlocked ? <Star size={14} weight={W} color={GOLD} style={{ marginRight: 8 }} /> : <Lock size={14} weight={W} color={tk.f} style={{ marginRight: 8 }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{a.name}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{a.desc}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: a.unlocked ? GOLD : tk.f }}>+{a.xp}</Typography>
              </Stack>
            ))}
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            {XP_HISTORY.map((x, i) => (
              <Stack key={i} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < XP_HISTORY.length - 1 ? sep : {}) }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.h }}>{x.reason}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tk.f }}>{x.date}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: GOLD }}>+{x.xp}</Typography>
              </Stack>
            ))}
          </Box>
        )}
        {tab === 3 && (
          <Box sx={{ ...cellSx, p: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: tk.f }}>Thème, API keys, déconnexion...</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoProfilePage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Minimal Aligned', desc: 'Tout le contenu actuel restyled : avatar+name, streak+morpho, actions rapides en grille, tabs, stats, succès. Même design system.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Scroll Complet', desc: 'Pas de tabs — tout visible en scroll. Actions rapides en liste. Stats + XP dans la même card. Plus simple.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Header Card', desc: 'Avatar + name + streak + morpho + XP dans une card header. Stats séparés. Actions rapides en grille + tabs.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Profil — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page profil complète — mobile-first</Typography>
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
