'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import { alpha } from '@mui/material/styles'
import { Sun, Moon, ArrowLeft, CaretDown, CaretRight, Warning, Check, Star } from '@phosphor-icons/react'

const W = 'light' as const
const GOLD = '#d4af37'

const RESULT = {
  type: 'Longiligne',
  desc: 'torse long, fémurs longs',
  tip: 'Le squat profond demandera plus d\'adaptation.',
}
const STRUCTURE = [
  { l: 'Ossature', v: 'Large' }, { l: 'Épaules', v: 'Étroit' }, { l: 'Cage tho.', v: 'Étroit' },
]
const PROPORTIONS = [
  { l: 'Torse', v: 'Long' }, { l: 'Bras', v: 'Moyen' }, { l: 'Fémurs', v: 'Long' }, { l: 'Valgus genou', v: 'Aucun' },
]
const MOBILITY = [
  { l: 'Chevilles', v: 'Moyenne', warn: false },
  { l: 'Ischio-jamb.', v: 'Limitée', warn: true },
  { l: 'Poignets', v: 'Prononcé', warn: true },
]
const EXERCISES = ['Squat', 'Soulevé de terre', 'Développé couché', 'Curls biceps']
const CORRECTIVE = [
  { title: 'Chevilles', tag: 'RECOMMANDÉ', items: ['Genou au mur (3min/jour)'] },
  { title: 'Chaîne postérieure', tag: 'PRIORITAIRE', items: ['Flexion du buste barre légère', 'Étirement ischio-jambiers'] },
]
const MUSCLE_POTENTIAL = [
  { l: 'Biceps', v: 'Limité', pct: 30 }, { l: 'Mollets', v: 'Moyen', pct: 55 }, { l: 'Pectoraux', v: 'Moyen', pct: 60 },
]
const STRENGTHS = ['Soulevé sumo : fémurs longs avantageux', 'Ossature solide = bon potentiel de masse']
const WEAKNESSES = ['Squat : fémurs longs = inclinaison du buste', 'Épaules étroites à développer']

const TK = {
  light: { bg: '#f3f1ec', cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.08)', h: '#1a1715', m: '#7a7468', f: '#a09888' },
  dark: { bg: '#0a0a09', cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.1)', h: '#f5f0e6', m: '#9a9488', f: '#6b655c' },
}
type T = typeof TK.light

// ════════════════════════════════════════════════════════════════
// A — SECTIONED CARDS
// Chaque section (structure, proportions, mobilité, etc.)
// dans sa propre card avec label uppercase. Exercices en
// liste expandable. Cohérent avec le design system.
// ════════════════════════════════════════════════════════════════

function DesignA({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Analyse Morphologique</Typography>
      </Stack>

      <Stack spacing={1.5}>
        {/* Hero result */}
        <Box sx={{ ...cellSx, p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: tk.h, letterSpacing: '-0.03em' }}>{RESULT.type}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: tk.f, mt: 0.3 }}>{RESULT.desc}</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: tk.m, mt: 1, fontStyle: 'italic' }}>{RESULT.tip}</Typography>
        </Box>

        {/* Structure */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Structure osseuse</Typography>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {STRUCTURE.map((s, i) => (
              <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2 } : undefined}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Proportions */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Proportions</Typography>
          {PROPORTIONS.map((p, i) => (
            <Stack key={p.l} direction="row" justifyContent="space-between" sx={{ py: 0.6, ...(i < PROPORTIONS.length - 1 ? sep : {}) }}>
              <Typography sx={{ fontSize: '0.7rem', color: tk.m }}>{p.l}</Typography>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: tk.h }}>{p.v}</Typography>
            </Stack>
          ))}
        </Box>

        {/* Mobilité */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Mobilité</Typography>
          <Stack direction="row" justifyContent="space-around" textAlign="center">
            {MOBILITY.map((m) => (
              <Box key={m.l}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: m.warn ? '#f97316' : tk.h, lineHeight: 1 }}>{m.v}</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tk.f, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.l}</Typography>
                {m.warn && <Warning size={12} weight={W} color="#f97316" style={{ marginTop: 2 }} />}
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Exercices */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Recommandations par exercice</Typography>
          {EXERCISES.map((ex, i) => (
            <Stack key={ex} direction="row" alignItems="center" sx={{ py: 0.8, ...(i < EXERCISES.length - 1 ? sep : {}) }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tk.h, flex: 1 }}>{ex}</Typography>
              <CaretDown size={14} weight={W} color={tk.f} />
            </Stack>
          ))}
        </Box>

        {/* Potentiel + Points forts/faibles side by side */}
        <Stack direction="row" spacing={1.2}>
          <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
              <Star size={12} weight={W} color={GOLD} />
              <Typography sx={lblSx}>Points forts</Typography>
            </Stack>
            {STRENGTHS.map((s, i) => (
              <Typography key={i} sx={{ fontSize: '0.55rem', color: tk.m, mb: 0.4, lineHeight: 1.3 }}>+ {s}</Typography>
            ))}
          </Box>
          <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
              <Warning size={12} weight={W} color="#f97316" />
              <Typography sx={lblSx}>À travailler</Typography>
            </Stack>
            {WEAKNESSES.map((w, i) => (
              <Typography key={i} sx={{ fontSize: '0.55rem', color: tk.m, mb: 0.4, lineHeight: 1.3 }}>- {w}</Typography>
            ))}
          </Box>
        </Stack>

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Générer mon programme</Typography>
        </Box>

        {/* Secondary actions */}
        <Stack direction="row" spacing={1}>
          <Box sx={{ flex: 1, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px', py: 1.2, textAlign: 'center', cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.m }}>Accueil</Typography>
          </Box>
          <Box sx={{ flex: 1, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px', py: 1.2, textAlign: 'center', cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tk.m }}>Refaire</Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// B — COMPACT DASHBOARD
// Tout sur une page compacte : hero type, bento stats,
// mobilité avec barres de progression, corrections inline
// ════════════════════════════════════════════════════════════════

function DesignB({ tk, isDark }: { tk: T; isDark: boolean }) {
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Morphologie</Typography>
      </Stack>

      <Stack spacing={1.5}>
        {/* Hero */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: tk.h, lineHeight: 1, letterSpacing: '-0.04em' }}>{RESULT.type}</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: tk.f, mt: 0.5 }}>{RESULT.desc}</Typography>
        </Box>

        {/* Bento: Structure + Proportions */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {[...STRUCTURE, ...PROPORTIONS.slice(0, 1)].map((s) => (
            <Box key={s.l} sx={{ ...cellSx, p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tk.h, lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ fontSize: '0.4rem', color: tk.f, mt: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>

        {/* Mobilité avec barres */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Mobilité</Typography>
          {MOBILITY.map((m, i) => (
            <Box key={m.l} sx={{ mb: i < MOBILITY.length - 1 ? 1.2 : 0 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                <Typography sx={{ fontSize: '0.6rem', color: tk.m, fontWeight: 500 }}>{m.l}</Typography>
                <Stack direction="row" spacing={0.3} alignItems="center">
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: m.warn ? '#f97316' : tk.h }}>{m.v}</Typography>
                  {m.warn && <Warning size={10} weight={W} color="#f97316" />}
                </Stack>
              </Stack>
              <LinearProgress variant="determinate" value={m.v === 'Moyenne' ? 55 : m.v === 'Limitée' ? 30 : 70} sx={{
                height: 3, borderRadius: 2,
                bgcolor: alpha(m.warn ? '#f97316' : GOLD, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: m.warn ? '#f97316' : GOLD },
              }} />
            </Box>
          ))}
        </Box>

        {/* Potentiel musculaire */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Potentiel musculaire</Typography>
          {MUSCLE_POTENTIAL.map((m, i) => (
            <Box key={m.l} sx={{ mb: i < MUSCLE_POTENTIAL.length - 1 ? 1 : 0 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>{m.l}</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: tk.h }}>{m.v}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={m.pct} sx={{
                height: 3, borderRadius: 2, bgcolor: alpha(GOLD, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: GOLD },
              }} />
            </Box>
          ))}
        </Box>

        {/* Corrections */}
        <Box sx={{ ...cellSx, p: 2.5 }}>
          <Typography sx={{ ...lblSx, mb: 1.5 }}>Travail correctif</Typography>
          {CORRECTIVE.map((c, i) => (
            <Box key={c.title} sx={{ py: 0.8, ...(i < CORRECTIVE.length - 1 ? sep : {}) }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tk.h }}>{c.title}</Typography>
                <Typography sx={{ fontSize: '0.45rem', fontWeight: 700, color: c.tag === 'PRIORITAIRE' ? '#f97316' : GOLD, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.tag}</Typography>
              </Stack>
              {c.items.map((item, j) => (
                <Typography key={j} sx={{ fontSize: '0.55rem', color: tk.m, ml: 1 }}>· {item}</Typography>
              ))}
            </Box>
          ))}
        </Box>

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Générer mon programme</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// C — TABS OVERVIEW
// 3 tabs : Profil, Exercices, Corrections.
// Profil = hero + stats. Exercices = recommandations.
// Corrections = travail correctif + potentiel.
// ════════════════════════════════════════════════════════════════

function DesignC({ tk, isDark }: { tk: T; isDark: boolean }) {
  const [tab, setTab] = useState(0)
  const cellSx = { bgcolor: tk.cardBg, border: '1px solid', borderColor: tk.cardBorder, borderRadius: '14px' }
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tk.f, letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sep = { borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }
  const tabs = ['Profil', 'Exercices', 'Corrections']

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ArrowLeft size={20} weight={W} color={tk.h} />
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em', flex: 1 }}>Morphologie</Typography>
      </Stack>

      {/* Hero compact */}
      <Box sx={{ ...cellSx, p: 2.5, textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: tk.h, lineHeight: 1 }}>{RESULT.type}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: tk.f, mt: 0.3 }}>{RESULT.desc}</Typography>
      </Box>

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
        {tab === 0 && (
          <>
            {/* Structure + Proportions */}
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Structure & proportions</Typography>
              {[...STRUCTURE.map(s => ({ ...s, cat: 'structure' })), ...PROPORTIONS.map(p => ({ ...p, cat: 'proportion' }))].map((item, i, arr) => (
                <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, ...(i < arr.length - 1 ? sep : {}) }}>
                  <Typography sx={{ fontSize: '0.68rem', color: tk.m }}>{item.l}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: tk.h }}>{item.v}</Typography>
                </Stack>
              ))}
            </Box>
            {/* Mobilité */}
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Mobilité</Typography>
              <Stack direction="row" justifyContent="space-around" textAlign="center">
                {MOBILITY.map((m) => (
                  <Box key={m.l}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: m.warn ? '#f97316' : tk.h }}>{m.v}</Typography>
                    <Typography sx={{ fontSize: '0.42rem', color: tk.f, mt: 0.2, textTransform: 'uppercase' }}>{m.l}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            {/* Points forts/faibles */}
            <Stack direction="row" spacing={1.2}>
              <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
                <Typography sx={{ ...lblSx, mb: 0.8 }}>Points forts</Typography>
                {STRENGTHS.map((s, i) => (
                  <Typography key={i} sx={{ fontSize: '0.52rem', color: tk.m, mb: 0.3 }}>+ {s}</Typography>
                ))}
              </Box>
              <Box sx={{ ...cellSx, flex: 1, p: 2 }}>
                <Typography sx={{ ...lblSx, mb: 0.8 }}>À travailler</Typography>
                {WEAKNESSES.map((w, i) => (
                  <Typography key={i} sx={{ fontSize: '0.52rem', color: tk.m, mb: 0.3 }}>- {w}</Typography>
                ))}
              </Box>
            </Stack>
          </>
        )}

        {tab === 1 && (
          <Box sx={{ ...cellSx, p: 2.5 }}>
            <Typography sx={{ ...lblSx, mb: 1.5 }}>Recommandations par exercice</Typography>
            {EXERCISES.map((ex, i) => (
              <Stack key={ex} direction="row" alignItems="center" sx={{ py: 1, ...(i < EXERCISES.length - 1 ? sep : {}) }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tk.h, flex: 1 }}>{ex}</Typography>
                <CaretRight size={14} weight={W} color={tk.f} />
              </Stack>
            ))}
          </Box>
        )}

        {tab === 2 && (
          <>
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Travail correctif</Typography>
              {CORRECTIVE.map((c, i) => (
                <Box key={c.title} sx={{ py: 0.8, ...(i < CORRECTIVE.length - 1 ? sep : {}) }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tk.h }}>{c.title}</Typography>
                    <Typography sx={{ fontSize: '0.45rem', fontWeight: 700, color: c.tag === 'PRIORITAIRE' ? '#f97316' : GOLD }}>{c.tag}</Typography>
                  </Stack>
                  {c.items.map((item, j) => (
                    <Typography key={j} sx={{ fontSize: '0.55rem', color: tk.m, ml: 1 }}>· {item}</Typography>
                  ))}
                </Box>
              ))}
            </Box>
            <Box sx={{ ...cellSx, p: 2.5 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Potentiel musculaire</Typography>
              {MUSCLE_POTENTIAL.map((m, i) => (
                <Stack key={m.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, ...(i < MUSCLE_POTENTIAL.length - 1 ? sep : {}) }}>
                  <Typography sx={{ fontSize: '0.68rem', color: tk.m }}>{m.l}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: tk.h }}>{m.v}</Typography>
                </Stack>
              ))}
            </Box>
          </>
        )}

        {/* CTA */}
        <Box sx={{ bgcolor: tk.h, borderRadius: '14px', py: 1.5, textAlign: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tk.bg }}>Générer mon programme</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE
// ════════════════════════════════════════════════════════════════

export default function DemoMorphologyPage() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const tk = TK[mode]
  const isDark = mode === 'dark'

  const approaches = [
    { tag: 'A', name: 'Sectioned Cards', desc: 'Chaque section dans sa card. Stats en row avec dividers. Exercices expandable. Points forts/faibles côte à côte. Cohérent.', el: <DesignA tk={tk} isDark={isDark} /> },
    { tag: 'B', name: 'Compact Dashboard', desc: 'Structure en bento, mobilité avec progress bars, potentiel musculaire avec barres, corrections inline. Dense et visuel.', el: <DesignB tk={tk} isDark={isDark} /> },
    { tag: 'C', name: 'Tabs Overview', desc: '3 tabs (Profil/Exercices/Corrections). Hero type en card. Chaque tab a ses propres cards. Moins de scroll.', el: <DesignC tk={tk} isDark={isDark} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tk.bg, transition: 'background 0.3s', py: 3, px: 2 }}>
      <Box sx={{ maxWidth: 420, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tk.h, letterSpacing: '-0.02em' }}>Morphologie — 3 Propositions</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: tk.m }}>Page résultats — mobile-first</Typography>
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
