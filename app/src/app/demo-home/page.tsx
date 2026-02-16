'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import Fab from '@mui/material/Fab'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Add from '@mui/icons-material/Add'
import TrendingDown from '@mui/icons-material/TrendingDown'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingFlat from '@mui/icons-material/TrendingFlat'
import Straighten from '@mui/icons-material/Straighten'
import MonitorWeight from '@mui/icons-material/MonitorWeight'
import CameraAlt from '@mui/icons-material/CameraAlt'
import Link from 'next/link'

// =========================================================
// Mock data
// =========================================================
const MOCK_LATEST = {
  weight: '82.5', bodyFat: '18.2',
  chest: '102', waist: '84', hips: '98',
  leftArm: '36', rightArm: '36.5',
  leftThigh: '58', rightThigh: '58.5',
  shoulders: '118', neck: '39',
}
const MOCK_CHANGES = {
  weight: -1.5, bodyFat: -0.8, chest: +0.5, waist: -2.0, hips: -0.5,
  leftArm: +0.5, rightArm: +0.3, leftThigh: +1.0, rightThigh: +0.8,
}
const MOCK_LAST_DATE = '12 fév 2026'
const HAS_DATA = true

// =========================================================
// VARIANT SELECTOR
// =========================================================
export default function DemoHomePage() {
  const [variant, setVariant] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Paper
        elevation={4}
        sx={{
          position: 'sticky', top: 0, zIndex: 100, borderRadius: 0,
          bgcolor: 'primary.main', color: 'primary.contrastText',
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, letterSpacing: 1 }}>
            MESURES - HYBRIDE A+C
          </Typography>
        </Box>
        <Tabs
          value={variant}
          onChange={(_, v) => setVariant(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem' },
            '& .Mui-selected': { color: '#fff' },
            '& .MuiTabs-indicator': { bgcolor: '#fff' },
          }}
        >
          <Tab label="D: Hero + List" />
          <Tab label="E: Banner + Grouped" />
          <Tab label="F: Hero + Grid" />
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1 }}>
        {variant === 0 && <VariantD />}
        {variant === 1 && <VariantE />}
        {variant === 2 && <VariantF />}
      </Box>
    </Box>
  )
}

// =========================================================
// Shared: Trend icon helper
// =========================================================
function TrendBadge({ value, unit, inverse = false }: { value: number; unit: string; inverse?: boolean }) {
  const isGood = inverse ? value < 0 : value > 0
  const color = value === 0 ? 'text.secondary' : isGood ? '#4caf50' : '#f44336'
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : TrendingFlat
  const sign = value > 0 ? '+' : ''

  return (
    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="caption" fontWeight={600} sx={{ color: 'inherit', fontSize: '0.7rem' }}>
        {sign}{value.toFixed(1)}{unit}
      </Typography>
    </Stack>
  )
}

// =========================================================
// VARIANT D - "HERO + COMPACT LIST"
// Hero poids (de A) + sparkline + bannière résumé gradient (de C)
// + liste compacte CSS Grid pour tous les détails (de C)
// Le meilleur des deux mondes
// =========================================================
function VariantD() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Mensurations</Typography>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <CameraAlt fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {!HAS_DATA ? <EmptyState /> : (
        <Box sx={{ px: 2.5, pb: 4 }}>
          <Stack spacing={2}>
            {/* Hero Weight Card */}
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(103,80,164,0.12) 0%, rgba(63,81,181,0.06) 100%)',
              border: 1, borderColor: 'divider',
            }}>
              <CardContent sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Poids actuel
                </Typography>
                <Typography variant="h2" fontWeight={800} sx={{ my: 1, lineHeight: 1 }}>
                  {MOCK_LATEST.weight}
                  <Typography component="span" variant="h5" color="text.secondary" fontWeight={400}> kg</Typography>
                </Typography>
                <TrendBadge value={MOCK_CHANGES.weight} unit=" kg" inverse />
              </CardContent>
            </Card>

            {/* Sparkline */}
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Évolution (30j)
                </Typography>
                <Box sx={{ height: 48, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
                  {[83.5, 83.2, 83.0, 82.8, 83.1, 82.9, 82.7, 82.5].map((v, i) => (
                    <Box key={i} sx={{
                      flex: 1, bgcolor: i === 7 ? 'primary.main' : 'action.hover',
                      borderRadius: 0.5,
                      height: `${((v - 82) / 2) * 100}%`,
                      minHeight: 4,
                    }} />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Résumé body comp - 2 colonnes */}
            <Stack direction="row" spacing={1.5}>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Masse grasse</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>{MOCK_LATEST.bodyFat}%</Typography>
                  <TrendBadge value={MOCK_CHANGES.bodyFat} unit="%" inverse />
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Tour de taille</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>{MOCK_LATEST.waist} cm</Typography>
                  <TrendBadge value={MOCK_CHANGES.waist} unit=" cm" inverse />
                </CardContent>
              </Card>
            </Stack>

            {/* All measurements - compact list CSS Grid (style C) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Toutes les mesures
              </Typography>
              <Card>
                <Stack divider={<Divider />}>
                  <ListRow label="Poitrine" value={MOCK_LATEST.chest} unit="cm" change={MOCK_CHANGES.chest} />
                  <ListRow label="Épaules" value={MOCK_LATEST.shoulders} unit="cm" change={null} />
                  <ListRow label="Cou" value={MOCK_LATEST.neck} unit="cm" change={null} />
                  <ListRow label="Hanches" value={MOCK_LATEST.hips} unit="cm" change={MOCK_CHANGES.hips} inverse />
                  <ListRow label="Bras G" value={MOCK_LATEST.leftArm} unit="cm" change={MOCK_CHANGES.leftArm} />
                  <ListRow label="Bras D" value={MOCK_LATEST.rightArm} unit="cm" change={MOCK_CHANGES.rightArm} />
                  <ListRow label="Cuisse G" value={MOCK_LATEST.leftThigh} unit="cm" change={MOCK_CHANGES.leftThigh} />
                  <ListRow label="Cuisse D" value={MOCK_LATEST.rightThigh} unit="cm" change={MOCK_CHANGES.rightThigh} />
                </Stack>
              </Card>
            </Box>

            {/* Quick actions */}
            <Stack direction="row" spacing={1.5}>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Photos</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Straighten sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Historique</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Stack>
          </Stack>
        </Box>
      )}

      <AddFab />
    </Box>
  )
}

// =========================================================
// VARIANT E - "BANNER + GROUPED SECTIONS"
// Bannière gradient résumé (C) + sections groupées haut/bas (A)
// Regroupement par zone corporelle avec titres
// =========================================================
function VariantE() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Mensurations</Typography>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <CameraAlt fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {!HAS_DATA ? <EmptyState /> : (
        <Box sx={{ px: 2.5, pb: 4 }}>
          <Stack spacing={2}>
            {/* Summary gradient banner (C style) */}
            <Card sx={{
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
              color: 'white', borderRadius: 3,
            }}>
              <CardContent sx={{ py: 2.5 }}>
                <Stack direction="row" justifyContent="space-around" textAlign="center">
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{MOCK_LATEST.weight}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>kg</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color: '#81c784' }}>
                        <TrendingDown sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: 'inherit' }}>
                          -1.5
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{MOCK_LATEST.bodyFat}%</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>gras</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color: '#81c784' }}>
                        <TrendingDown sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: 'inherit' }}>
                          -0.8
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{MOCK_LATEST.waist}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>taille cm</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color: '#81c784' }}>
                        <TrendingDown sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: 'inherit' }}>
                          -2.0
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, opacity: 0.6 }}>
                  Dernière mesure : {MOCK_LAST_DATE}
                </Typography>
              </CardContent>
            </Card>

            {/* Haut du corps - grouped (A style) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Haut du corps
              </Typography>
              <Card>
                <Stack divider={<Divider />}>
                  <ListRow label="Poitrine" value={MOCK_LATEST.chest} unit="cm" change={MOCK_CHANGES.chest} />
                  <ListRow label="Épaules" value={MOCK_LATEST.shoulders} unit="cm" change={null} />
                  <ListRow label="Cou" value={MOCK_LATEST.neck} unit="cm" change={null} />
                  <ListRow label="Bras G" value={MOCK_LATEST.leftArm} unit="cm" change={MOCK_CHANGES.leftArm} />
                  <ListRow label="Bras D" value={MOCK_LATEST.rightArm} unit="cm" change={MOCK_CHANGES.rightArm} />
                </Stack>
              </Card>
            </Box>

            {/* Bas du corps - grouped */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Bas du corps
              </Typography>
              <Card>
                <Stack divider={<Divider />}>
                  <ListRow label="Hanches" value={MOCK_LATEST.hips} unit="cm" change={MOCK_CHANGES.hips} inverse />
                  <ListRow label="Cuisse G" value={MOCK_LATEST.leftThigh} unit="cm" change={MOCK_CHANGES.leftThigh} />
                  <ListRow label="Cuisse D" value={MOCK_LATEST.rightThigh} unit="cm" change={MOCK_CHANGES.rightThigh} />
                </Stack>
              </Card>
            </Box>

            {/* Quick actions */}
            <Stack direction="row" spacing={1.5}>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Photos</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Straighten sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Historique</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Stack>
          </Stack>
        </Box>
      )}

      <AddFab />
    </Box>
  )
}

// =========================================================
// VARIANT F - "HERO + MINI GRID"
// Hero poids (A) + body comp en 2 cartes + mini grid 3 colonnes
// pour les mesures corporelles. Plus visuel, moins "liste".
// =========================================================
function VariantF() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{
        px: 2.5, pt: 2.5, pb: 1,
        background: 'linear-gradient(180deg, rgba(103,80,164,0.1) 0%, transparent 100%)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Mensurations</Typography>
          <Chip label={MOCK_LAST_DATE} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 24 }} />
        </Stack>
      </Box>

      {!HAS_DATA ? <EmptyState /> : (
        <Box sx={{ px: 2.5, pb: 4 }}>
          <Stack spacing={2}>
            {/* Hero weight - plus compact que A, avec sparkline intégrée */}
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(103,80,164,0.12) 0%, rgba(63,81,181,0.06) 100%)',
              border: 1, borderColor: 'divider',
            }}>
              <CardContent sx={{ py: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Poids</Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                      {MOCK_LATEST.weight}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">kg</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>30 jours</Typography>
                      <TrendBadge value={MOCK_CHANGES.weight} unit=" kg" inverse />
                    </Stack>
                    <Box sx={{ height: 40, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
                      {[83.5, 83.2, 83.0, 82.8, 83.1, 82.9, 82.7, 82.5].map((v, i) => (
                        <Box key={i} sx={{
                          flex: 1, bgcolor: i === 7 ? 'primary.main' : 'action.hover',
                          borderRadius: 0.5,
                          height: `${((v - 82) / 2) * 100}%`,
                          minHeight: 4,
                        }} />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Body comp - 2 cards */}
            <Stack direction="row" spacing={1.5}>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Masse grasse</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>{MOCK_LATEST.bodyFat}%</Typography>
                  <TrendBadge value={MOCK_CHANGES.bodyFat} unit="%" inverse />
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Tour de taille</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>{MOCK_LATEST.waist} cm</Typography>
                  <TrendBadge value={MOCK_CHANGES.waist} unit=" cm" inverse />
                </CardContent>
              </Card>
            </Stack>

            {/* Body measurements - Mini cards grid */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Corps
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                <MiniCard label="Poitrine" value={MOCK_LATEST.chest} change={MOCK_CHANGES.chest} />
                <MiniCard label="Épaules" value={MOCK_LATEST.shoulders} change={null} />
                <MiniCard label="Cou" value={MOCK_LATEST.neck} change={null} />
                <MiniCard label="Hanches" value={MOCK_LATEST.hips} change={MOCK_CHANGES.hips} inverse />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Membres
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <MiniCard label="Bras G" value={MOCK_LATEST.leftArm} change={MOCK_CHANGES.leftArm} />
                <MiniCard label="Bras D" value={MOCK_LATEST.rightArm} change={MOCK_CHANGES.rightArm} />
                <MiniCard label="Cuisse G" value={MOCK_LATEST.leftThigh} change={MOCK_CHANGES.leftThigh} />
                <MiniCard label="Cuisse D" value={MOCK_LATEST.rightThigh} change={MOCK_CHANGES.rightThigh} />
              </Box>
            </Box>

            {/* Quick actions */}
            <Stack direction="row" spacing={1.5}>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Photos</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardActionArea>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Straighten sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Historique</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Stack>
          </Stack>
        </Box>
      )}

      <AddFab />
    </Box>
  )
}

// =========================================================
// Shared Components
// =========================================================
function EmptyState() {
  return (
    <Box sx={{ px: 2.5, pt: 6, textAlign: 'center' }}>
      <MonitorWeight sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Suis ta transformation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
        Ajoute tes mesures pour voir les changements que le miroir ne montre pas
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        sx={{
          px: 4, py: 1.5, borderRadius: 3, fontWeight: 700,
          background: 'linear-gradient(135deg, #6750a4, #9a67ea)',
        }}
      >
        Première mesure
      </Button>
    </Box>
  )
}

function AddFab() {
  return (
    <Fab sx={{
      position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
      background: 'linear-gradient(135deg, #6750a4, #9a67ea)', color: 'white',
      boxShadow: '0 4px 16px rgba(103,80,164,0.4)',
      '&:hover': { background: 'linear-gradient(135deg, #7f67be, #bb86fc)' },
    }}>
      <Add sx={{ fontSize: 28 }} />
    </Fab>
  )
}

function ListRow({ label, value, unit, change, inverse = false }: {
  label: string; value: string; unit: string; change: number | null; inverse?: boolean;
}) {
  return (
    <Box sx={{
      px: 2.5, py: 1.5,
      display: 'grid',
      gridTemplateColumns: '1fr auto 56px',
      gap: 1,
      alignItems: 'center',
    }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {value} {unit}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {change !== null ? (
          <TrendBadge value={change} unit="" inverse={inverse} />
        ) : (
          <Typography variant="caption" color="text.disabled">--</Typography>
        )}
      </Box>
    </Box>
  )
}

function MiniCard({ label, value, change, inverse = false }: {
  label: string; value: string; change: number | null; inverse?: boolean;
}) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}<Typography component="span" variant="caption" color="text.secondary"> cm</Typography>
        </Typography>
        {change !== null && (
          <Box sx={{ mt: 0.25 }}>
            <TrendBadge value={change} unit="" inverse={inverse} />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
