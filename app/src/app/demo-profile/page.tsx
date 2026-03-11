'use client'

import { useState } from 'react'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import {
  Barbell,
  BowlSteam,
  Ruler,
  PersonArmsSpread,
  Flame,
  Trophy,
  ShieldCheck,
  Star,
  Lightning,
  GearSix,
  CaretRight,
  House,
  User,
  Sun,
  Moon,
} from '@phosphor-icons/react'

import { GOLD, GOLD_LIGHT, tc, card, surfaceBg } from '@/lib/design-tokens'

// ── Mock Data ──
const MOCK = {
  displayName: 'Hazim ZUKIC',
  initials: 'H',
  level: 9,
  totalXp: 5485,
  xpProgress: 22,
  currentStreak: 8,
  longestStreak: 8,
  morphotype: { abbr: 'Lo', title: 'Longiligne', strengths: ['Deadlift sumo : femurs longs avantageux', 'Ossature solide = bon potentiel'] },
  stats: {
    totalWorkouts: 2,
    totalFoodEntries: 19,
    totalMeasurements: 5,
    totalPRs: 3,
    bossFightsWon: 1,
    achievements: '4/12',
  },
  recentAchievements: [
    { name: 'Premier pas', desc: '1er entrainement complete', xp: 50 },
    { name: 'Regulier', desc: '7 jours de streak', xp: 100 },
    { name: 'Gourmet', desc: '10 repas logges', xp: 75 },
  ],
}

// ── Page ──
export default function DemoProfilePage() {
  const [dark, setDark] = useState(true)
  const [weight, setWeight] = useState<'duotone' | 'regular' | 'light' | 'bold'>('duotone')
  const d = dark // isDark shorthand

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: d ? '#111' : '#eee', py: 2 }}>
      {/* Controls */}
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', px: 2 }}>
        <Box
          onClick={() => setDark(!dark)}
          sx={{
            cursor: 'pointer', color: d ? '#fff' : '#000',
            p: 0.75, borderRadius: '10px',
            bgcolor: d ? alpha('#fff', 0.08) : alpha('#000', 0.06),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            '&:active': { opacity: 0.6 },
          }}
        >
          {d ? <Sun size={18} /> : <Moon size={18} />}
        </Box>
        {(['duotone', 'regular', 'light', 'bold'] as const).map((w) => (
          <Box
            key={w}
            onClick={() => setWeight(w)}
            sx={{
              px: 1.5, py: 0.5, borderRadius: '8px', cursor: 'pointer',
              bgcolor: weight === w ? GOLD : (d ? alpha('#fff', 0.08) : alpha('#000', 0.06)),
              color: weight === w ? '#1a1a1a' : (d ? '#aaa' : '#555'),
              fontWeight: 600, fontSize: '0.65rem',
              transition: 'all 0.15s ease',
            }}
          >
            {w}
          </Box>
        ))}
      </Stack>

      {/* Phone frame */}
      <Box sx={{
        maxWidth: 390, mx: 'auto',
        borderRadius: '28px',
        overflow: 'hidden',
        border: `2px solid ${d ? '#333' : '#ccc'}`,
        boxShadow: d ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <Box sx={{ minHeight: 780, bgcolor: surfaceBg(d), display: 'flex', flexDirection: 'column' }}>

          {/* ── Header compact ── */}
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{
                  width: 52, height: 52,
                  bgcolor: d ? '#1e1c16' : '#f0ece4',
                  color: GOLD, fontSize: '1.2rem', fontWeight: 700,
                  border: `2px solid ${GOLD}`,
                  boxShadow: `0 0 20px ${alpha(GOLD, 0.2)}`,
                }}>
                  {MOCK.initials}
                </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: tc.h(d) }}>
                  {MOCK.displayName}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip label={`Niv. ${MOCK.level}`} size="small" sx={{
                    bgcolor: GOLD, color: '#1a1a1a', fontWeight: 700, fontSize: '0.6rem', height: 20,
                  }} />
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Lightning size={14} weight={weight} color={GOLD} />
                    <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>
                      {MOCK.totalXp.toLocaleString()} XP
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Box
                  sx={{ cursor: 'pointer', p: 0.5, color: tc.f(d), display: 'flex', '&:active': { opacity: 0.5 } }}
              >
                <GearSix size={22} weight={weight} />
              </Box>
            </Stack>

            {/* XP bar */}
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={MOCK.xpProgress} sx={{
                height: 4, borderRadius: 2,
                bgcolor: d ? alpha('#fff', 0.06) : alpha('#000', 0.05),
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                  borderRadius: 2,
                },
              }} />
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), mt: 0.3, textAlign: 'right' }}>
                {MOCK.xpProgress}% vers niv. {MOCK.level + 1}
              </Typography>
            </Box>
          </Box>

          {/* ── Streak + Morpho row ── */}
          <Stack direction="row" spacing={1} sx={{ px: 2.5, mt: 0.5 }}>
            <Box sx={card(d, { flex: 1, p: 1.5 })}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Flame size={24} weight={weight} color="#ff9800" />
                <Box>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: tc.h(d), lineHeight: 1 }}>
                    {MOCK.currentStreak}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>jours streak</Typography>
                </Box>
              </Stack>
            </Box>
            <Box
              sx={card(d, {
                flex: 1.5, p: 1.5, cursor: 'pointer',
                borderColor: alpha(GOLD, 0.2),
                '&:active': { transform: 'scale(0.98)' },
                transition: 'transform 0.1s ease',
              })}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  bgcolor: alpha(GOLD, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: GOLD }}>
                    {MOCK.morphotype.abbr}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tc.h(d) }}>
                    {MOCK.morphotype.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: tc.f(d) }}>Mon morphotype</Typography>
                </Box>
                <CaretRight size={16} weight="bold" color={tc.f(d)} />
              </Stack>
            </Box>
          </Stack>

          {/* ── Actions grid — 2x2 big tiles ── */}
          <Box sx={{ px: 2.5, mt: 2.5 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5 }}>
              Actions rapides
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {[
                { Icon: Barbell, label: 'Training', sub: `${MOCK.stats.totalWorkouts} seances`, accent: '#ff9800' },
                { Icon: BowlSteam, label: 'Journal', sub: `${MOCK.stats.totalFoodEntries} repas`, accent: '#4caf50' },
                { Icon: Ruler, label: 'Mesures', sub: `${MOCK.stats.totalMeasurements} prises`, accent: '#2196f3' },
                { Icon: PersonArmsSpread, label: 'Morpho', sub: MOCK.morphotype.title, accent: '#9c27b0' },
              ].map((item) => (
                <Box
                  key={item.label}
                      sx={card(d, {
                    p: 2, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:active': { transform: 'scale(0.96)', bgcolor: d ? alpha('#fff', 0.1) : alpha('#000', 0.03) },
                  })}
                >
                  <Box sx={{ mb: 1.5, display: 'flex' }}>
                    <item.Icon size={30} weight={weight} color={item.accent} />
                  </Box>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: tc.h(d) }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mt: 0.2 }}>{item.sub}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── Mini stats row ── */}
          <Box sx={{ px: 2.5, mt: 2.5 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
              En bref
            </Typography>
            <Stack direction="row" spacing={1}>
              {[
                { val: MOCK.stats.totalPRs, label: 'PRs', Icon: Trophy },
                { val: MOCK.stats.bossFightsWon, label: 'Boss', Icon: ShieldCheck },
                { val: MOCK.stats.achievements, label: 'Succes', Icon: Star },
                { val: MOCK.longestStreak, label: 'Record', Icon: Trophy },
              ].map((s) => (
                <Box key={s.label} sx={card(d, { flex: 1, py: 1.5, textAlign: 'center' })}>
                  <Box sx={{ mb: 0.3, display: 'flex', justifyContent: 'center', color: GOLD }}>
                    <s.Icon size={18} weight={weight} />
                  </Box>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d), lineHeight: 1 }}>{s.val}</Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tc.f(d), mt: 0.3 }}>{s.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* ── Recent achievements ── */}
          <Box sx={{ px: 2.5, mt: 2.5, pb: 10 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.m(d), letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
              Derniers succes
            </Typography>
            {MOCK.recentAchievements.slice(0, 2).map((a) => (
              <Box key={a.name} sx={card(d, { p: 1.5, mb: 1 })}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '8px',
                    bgcolor: alpha(GOLD, 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD,
                  }}>
                    <Star size={18} weight={weight} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(d) }}>{a.name}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>{a.desc}</Typography>
                  </Box>
                  <Chip label={`+${a.xp}`} size="small" sx={{ bgcolor: alpha(GOLD, 0.1), color: GOLD, fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                </Stack>
              </Box>
            ))}
          </Box>

          {/* ── Bottom Nav ── */}
          <Box sx={{ position: 'sticky', bottom: 0, p: 1.5, pt: 0 }}>
            <Box sx={{
              borderRadius: '22px',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              bgcolor: d ? alpha('#1c1a14', 0.85) : alpha('#ffffff', 0.85),
              border: `1px solid ${d ? alpha(GOLD, 0.12) : alpha(GOLD, 0.18)}`,
              boxShadow: d ? '0 -4px 30px rgba(0,0,0,0.4)' : '0 -4px 30px rgba(0,0,0,0.06)',
            }}>
              <Stack direction="row" sx={{ height: 56 }}>
                {[
                  { Icon: House, label: 'Accueil', active: false },
                  { Icon: Barbell, label: 'Training', active: false },
                  { Icon: BowlSteam, label: 'Journal', active: false },
                  { Icon: User, label: 'Profil', active: true },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 0.3,
                  }}>
                    <Box sx={{
                      px: item.active ? 2 : 1, py: 0.5, borderRadius: '10px',
                      bgcolor: item.active ? alpha(GOLD, 0.15) : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: item.active ? GOLD : (d ? '#6b6560' : '#9a9490'),
                    }}>
                      <item.Icon size={21} weight={item.active ? 'fill' : weight} />
                    </Box>
                    <Typography sx={{
                      fontSize: '0.55rem', fontWeight: item.active ? 700 : 500,
                      color: item.active ? GOLD : (d ? '#6b6560' : '#9a9490'),
                    }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  )
}
