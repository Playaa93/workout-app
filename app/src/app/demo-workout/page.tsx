'use client'

import { useState } from 'react'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ArrowBack from '@mui/icons-material/ArrowBack'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import PlayArrow from '@mui/icons-material/PlayArrow'
import Add from '@mui/icons-material/Add'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Delete from '@mui/icons-material/Delete'
import FileDownload from '@mui/icons-material/FileDownload'
import DarkMode from '@mui/icons-material/DarkMode'
import LightMode from '@mui/icons-material/LightMode'

// =========================================================
// Design tokens
// =========================================================

const GOLD = '#d4af37'
const GOLD_LIGHT = '#e8c860'

const tc = {
  h: (d: boolean) => d ? '#f5f0e6' : '#1a1715',
  m: (d: boolean) => d ? '#8a8478' : '#8a7e70',
  f: (d: boolean) => d ? '#5c574e' : '#b5ad9f',
}

const glass = (d: boolean, extra?: object) => ({
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

const MOCK_TEMPLATES = [
  { id: '1', name: 'Reprise Lower Body', muscles: ['Dos', 'Abdos', 'Jambes'] },
  { id: '2', name: 'Reprise Upper Body', muscles: ['Épaules', 'Dos', 'Pectoraux', 'Bras'] },
]

const MOCK_SESSIONS = [
  { id: 's1', date: 'Lun. 9 Mars', time: '16:23', duration: '2min', volume: '0kg', kcal: 16, type: 'strength' as const },
  { id: 's2', date: 'Dim. 8 Mars', time: '10:15', duration: '52min', volume: '8.4t', kcal: 420, type: 'strength' as const },
  { id: 's3', date: 'Ven. 6 Mars', time: '18:00', duration: '38min', volume: '0', kcal: 310, type: 'cardio' as const, activity: '🏃 Course' },
]

const MOCK_IN_PROGRESS = { id: 'ip1', startTime: '16:35' }

// =========================================================
// GlassNav (inline for demo)
// =========================================================

const NAV_ITEMS = [
  { key: 'home', label: 'Accueil', active: false },
  { key: 'workout', label: 'Training', active: true },
  { key: 'journal', label: 'Journal', active: false },
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
                  <FitnessCenter sx={{ fontSize: 21, color: item.active ? GOLD : d ? '#6b6560' : '#9a9490', ...(item.active && { filter: `drop-shadow(0 0 6px ${alpha(GOLD, 0.5)})` }) }} />
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
// Variant A: Glass Gold (matching home)
// =========================================================

function VariantA({ isDark: d }: { isDark: boolean }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: meshBg(d) }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ArrowBack sx={{ fontSize: 20, color: tc.f(d) }} />
          <Typography sx={{ flex: 1, fontSize: '1.3rem', fontWeight: 700, color: tc.h(d), letterSpacing: '-0.01em' }}>
            Entraînement
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3 }}>
        <Stack spacing={2.5}>
          {/* CTA */}
          <Box sx={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            borderRadius: '16px', p: 2.5, cursor: 'pointer',
            boxShadow: `0 4px 24px ${alpha(GOLD, 0.4)}`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Add sx={{ fontSize: 24, color: '#1a1a1a' }} />
            </Box>
            <Typography sx={{ flex: 1, fontSize: '1rem', fontWeight: 700, color: '#1a1a1a' }}>Nouvelle séance</Typography>
            <ChevronRight sx={{ color: 'rgba(0,0,0,0.3)' }} />
          </Box>

          {/* In progress */}
          <Box sx={{ ...glass(d), borderColor: alpha('#ff9800', 0.3), borderLeft: '3px solid #ff9800', p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: alpha('#ff9800', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayArrow sx={{ color: '#ff9800' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: tc.h(d) }}>Séance en cours</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>Commencée à {MOCK_IN_PROGRESS.startTime}</Typography>
              </Box>
              <Button size="small" sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px', bgcolor: '#ff9800', color: '#fff', '&:hover': { bgcolor: '#f57c00' } }}>
                Reprendre
              </Button>
              <IconButton size="small"><Delete sx={{ fontSize: 18, color: tc.f(d) }} /></IconButton>
            </Stack>
          </Box>

          {/* Programmes */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mes Programmes</Typography>
              <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.7rem', textTransform: 'none', color: GOLD, fontWeight: 600 }}>Créer</Button>
            </Stack>
            <Stack spacing={1.5}>
              {MOCK_TEMPLATES.map((t) => (
                <Box key={t.id} sx={{ ...glass(d), p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(GOLD, 0.15)}, ${alpha(GOLD, 0.05)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FitnessCenter sx={{ color: GOLD, fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: tc.h(d) }} noWrap>{t.name}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {t.muscles.map((m) => (
                          <Chip key={m} label={m} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 500, bgcolor: d ? alpha(GOLD, 0.08) : alpha(GOLD, 0.1), color: tc.m(d), border: 'none' }} />
                        ))}
                      </Stack>
                    </Box>
                    <ChevronRight sx={{ color: tc.f(d), fontSize: 20 }} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* History */}
          <Box sx={{ pb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dernières séances</Typography>
              <IconButton size="small"><FileDownload sx={{ fontSize: 18, color: tc.f(d) }} /></IconButton>
            </Stack>
            <Box sx={glass(d, { overflow: 'hidden', p: 0 })}>
              <Stack divider={<Divider sx={{ borderColor: d ? alpha(GOLD, 0.08) : alpha(GOLD, 0.12) }} />}>
                {MOCK_SESSIONS.map((s) => (
                  <Box key={s.id} sx={{ px: 2.5, py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1 }}>
                        {s.type === 'cardio' && <Typography sx={{ fontSize: '0.9rem' }}>{s.activity?.split(' ')[0]}</Typography>}
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(d), textTransform: 'capitalize' }} noWrap>
                          {s.type === 'cardio' ? s.activity?.split(' ').slice(1).join(' ') : s.date}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>{s.type === 'cardio' ? s.date : s.time}</Typography>
                        <Chip label={s.duration} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: d ? alpha(GOLD, 0.08) : alpha(GOLD, 0.1), color: tc.m(d), border: 'none' }} />
                      </Stack>
                      <ChevronRight sx={{ color: tc.f(d), fontSize: 20 }} />
                    </Stack>
                    <Stack direction="row" sx={{ mt: 1.5, bgcolor: d ? alpha('#ffffff', 0.035) : alpha('#000000', 0.025), borderRadius: '12px', overflow: 'hidden' }}>
                      <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: d ? alpha(GOLD, 0.08) : alpha(GOLD, 0.12) }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>{s.volume}</Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Volume</Typography>
                      </Box>
                      <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>{s.kcal}</Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>kcal</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Box>
      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Variant B: Dark Sport (bold, angular, high contrast)
// =========================================================

function VariantB({ isDark: d }: { isDark: boolean }) {
  const bg = d ? '#0c0c0c' : '#f2f1ef'
  const card = d ? '#161614' : '#ffffff'
  const accent = GOLD
  const accentLight = GOLD_LIGHT

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: bg }}>
      {/* Header with accent stripe */}
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: `3px solid ${accent}` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ArrowBack sx={{ fontSize: 20, color: tc.f(d) }} />
          <Typography sx={{ flex: 1, fontSize: '1.1rem', fontWeight: 900, color: tc.h(d), letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Training
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pt: 2.5 }}>
        <Stack spacing={2}>
          {/* CTA */}
          <Box sx={{
            background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
            borderRadius: '6px', p: 2.5, cursor: 'pointer',
            boxShadow: `0 4px 20px ${alpha(accent, 0.5)}`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Add sx={{ fontSize: 28, color: '#1a1a1a', fontWeight: 900 }} />
            <Typography sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 900, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nouvelle séance
            </Typography>
            <ChevronRight sx={{ color: 'rgba(0,0,0,0.3)' }} />
          </Box>

          {/* In progress */}
          <Box sx={{ bgcolor: card, borderRadius: '6px', borderLeft: `5px solid ${accent}`, p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <PlayArrow sx={{ color: accent, fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tc.h(d), textTransform: 'uppercase', letterSpacing: '0.04em' }}>Séance en cours</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>Commencée à {MOCK_IN_PROGRESS.startTime}</Typography>
              </Box>
              <Button size="small" sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: '4px', bgcolor: accent, color: '#1a1a1a', letterSpacing: '0.04em', '&:hover': { bgcolor: accentLight } }}>
                Go
              </Button>
              <IconButton size="small"><Delete sx={{ fontSize: 18, color: tc.f(d) }} /></IconButton>
            </Stack>
          </Box>

          {/* Programmes */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>Programmes</Typography>
            <Stack spacing={1}>
              {MOCK_TEMPLATES.map((t) => (
                <Box key={t.id} sx={{ bgcolor: card, borderRadius: '6px', p: 2, borderLeft: `4px solid ${d ? alpha(accent, 0.4) : alpha(accent, 0.3)}` }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <FitnessCenter sx={{ color: accent, fontSize: 22 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: tc.h(d) }} noWrap>{t.name}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {t.muscles.map((m) => (
                          <Chip key={m} label={m} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha(accent, 0.1), color: accent, border: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }} />
                        ))}
                      </Stack>
                    </Box>
                    <ChevronRight sx={{ color: tc.f(d), fontSize: 20 }} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* History */}
          <Box sx={{ pb: 3 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>Historique</Typography>
            <Box sx={{ bgcolor: card, borderRadius: '6px', overflow: 'hidden' }}>
              <Stack divider={<Divider sx={{ borderColor: d ? '#222' : '#eee' }} />}>
                {MOCK_SESSIONS.map((s) => (
                  <Box key={s.id} sx={{ px: 2, py: 1.8 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: tc.h(d) }}>{s.date}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>{s.time} · {s.duration}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: accent }}>{s.volume}</Typography>
                          <Typography sx={{ fontSize: '0.5rem', color: tc.f(d), textTransform: 'uppercase', fontWeight: 700 }}>vol</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: tc.h(d) }}>{s.kcal}</Typography>
                          <Typography sx={{ fontSize: '0.5rem', color: tc.f(d), textTransform: 'uppercase', fontWeight: 700 }}>kcal</Typography>
                        </Box>
                        <ChevronRight sx={{ color: tc.f(d), fontSize: 18 }} />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Box>
      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Variant C: Minimal Clean (airy, Apple-like)
// =========================================================

function VariantC({ isDark: d }: { isDark: boolean }) {
  const bg = d ? '#111110' : '#fafaf8'
  const card = d ? alpha('#ffffff', 0.04) : '#ffffff'
  const cardBorder = d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)
  const accent = GOLD

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: bg }}>
      {/* Header — ultra minimal */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ArrowBack sx={{ fontSize: 20, color: accent }} />
          <Typography sx={{ flex: 1, fontSize: '1.5rem', fontWeight: 700, color: tc.h(d), letterSpacing: '-0.02em' }}>
            Entraînement
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3 }}>
        <Stack spacing={2.5}>
          {/* CTA */}
          <Button fullWidth sx={{
            py: 2, borderRadius: '16px', fontSize: '0.95rem', fontWeight: 600,
            bgcolor: accent, color: '#1a1a1a', textTransform: 'none',
            '&:hover': { bgcolor: GOLD_LIGHT },
          }} startIcon={<Add />}>
            Nouvelle séance
          </Button>

          {/* In progress */}
          <Box sx={{ bgcolor: card, borderRadius: '16px', border: `1px solid ${alpha(GOLD, 0.3)}`, p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: GOLD, boxShadow: `0 0 8px ${alpha(GOLD, 0.5)}` }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: tc.h(d) }}>Séance en cours</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: tc.m(d) }}>Depuis {MOCK_IN_PROGRESS.startTime}</Typography>
              </Box>
              <Button size="small" sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '10px', bgcolor: alpha(GOLD, 0.1), color: GOLD }}>
                Reprendre
              </Button>
            </Stack>
          </Box>

          {/* Programmes */}
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.m(d), mb: 1.5 }}>Programmes</Typography>
            <Stack spacing={1}>
              {MOCK_TEMPLATES.map((t) => (
                <Box key={t.id} sx={{ bgcolor: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <FitnessCenter sx={{ color: accent, fontSize: 20 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: tc.h(d) }} noWrap>{t.name}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.3 }}>{t.muscles.join(' · ')}</Typography>
                    </Box>
                    <ChevronRight sx={{ color: tc.f(d), fontSize: 18 }} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* History */}
          <Box sx={{ pb: 3 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.m(d), mb: 1.5 }}>Récent</Typography>
            <Stack spacing={1}>
              {MOCK_SESSIONS.map((s) => (
                <Box key={s.id} sx={{ bgcolor: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, px: 2, py: 1.8 }}>
                  <Stack direction="row" alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(d) }}>{s.date}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.2 }}>{s.duration} · {s.volume} · {s.kcal} kcal</Typography>
                    </Box>
                    <ChevronRight sx={{ color: tc.f(d), fontSize: 18 }} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
      <DemoNav isDark={d} />
    </Box>
  )
}

// =========================================================
// Main Page
// =========================================================

export default function DemoWorkoutPage() {
  const [variantIndex, setVariantIndex] = useState(0)
  const [isDark, setIsDark] = useState(true)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Toolbar */}
      <Paper elevation={4} sx={{ position: 'sticky', top: 0, zIndex: 300, borderRadius: 0, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, letterSpacing: 1 }}>
              TRAINING — BLACK & GOLD
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
          <Tab label="A: Glass" />
          <Tab label="B: Bold" />
          <Tab label="C: Minimal" />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        {variantIndex === 0 && <VariantA isDark={isDark} />}
        {variantIndex === 1 && <VariantB isDark={isDark} />}
        {variantIndex === 2 && <VariantC isDark={isDark} />}
      </Box>
    </Box>
  )
}
