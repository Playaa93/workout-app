'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Button from '@mui/material/Button'
import Link from 'next/link'

// ─── Mock data ───────────────────────────────────────────────────────
const MOCK = {
  globalType: 'longiligne' as const,
  subtitle: 'torse long, bras longs, fémurs courts',
  description: 'Tes proportions te donnent un avantage naturel au soulevé de terre. Le développé couché demandera plus d\'adaptation.',
  structure: { frameSize: 'fine', shoulderToHip: 'wide', ribcageDepth: 'narrow' },
  proportions: { torsoLength: 'long', armLength: 'long', femurLength: 'short', kneeValgus: 'slight' },
  mobility: { ankleDorsiflexion: 'limited', posteriorChain: 'average', wristMobility: 'slight' },
  insertions: { biceps: 'high' as const, calves: 'low' as const, chest: 'medium' as const },
  squat: {
    exercise: 'Squat',
    advantages: ['Fémurs courts = biomécanique idéale'],
    disadvantages: ['Mobilité cheville limitée'],
    variants: ['Squat barre avec talonnettes', 'Hack squat (machine guidée)', 'Squat gobelet sur cales'],
    tips: ['Talonnettes obligatoires', 'Travailler la dorsiflexion quotidiennement'],
  },
  mobilityWork: [
    { area: 'Chevilles (dorsiflexion)', priority: 'high' as const, exercises: ['Genou au mur (5min/jour)', 'Squat en position basse (30s holds)'] },
    { area: 'Poignets', priority: 'medium' as const, exercises: ['Échauffement poignets avant exercices de poussée', 'Rotations de poignets'] },
  ],
  strengths: ['Soulevé de terre : bras longs avantageux', 'Squat : fémurs courts = position idéale', 'Fort potentiel biceps'],
  weaknesses: ['Développé couché : bras longs = grande amplitude', 'Chevilles raides = squat limité', 'Ossature fine = prise de masse plus lente'],
}

const segmentLabels: Record<string, string> = {
  short: 'Court', medium: 'Moyen', long: 'Long', narrow: 'Étroit', wide: 'Large',
  fine: 'Fine', large: 'Large', none: 'Aucun', slight: 'Léger', pronounced: 'Prononcé',
  limited: 'Limitée', average: 'Moyenne', good: 'Bonne',
}

// ─── Page ────────────────────────────────────────────────────────────
export default function DemoMorphoPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ textAlign: 'center', pt: 2, pb: 1, color: 'text.secondary' }}>
          Choisis un style visuel
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="A. Monochrome" />
          <Tab label="B. Duo subtil" />
          <Tab label="C. Ultra-minimal" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, pb: 12, maxWidth: 480, mx: 'auto' }}>
        {tab === 0 && <OptionA />}
        {tab === 1 && <OptionB />}
        {tab === 2 && <OptionC />}

        <Button component={Link} href="/" variant="outlined" fullWidth sx={{ mt: 3 }}>
          Retour accueil
        </Button>
      </Box>
    </Box>
  )
}

// =====================================================================
// OPTION A : Monochrome Purple
// Tout en nuances de violet (couleur brand). Pas d'autres teintes.
// Hiérarchie par opacité et poids typographique.
// =====================================================================
function OptionA() {
  const accent = '#bb86fc'

  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        1 seule couleur (violet brand) + neutres. Hiérarchie par typographie et opacité.
      </Typography>

      {/* Hero Card */}
      <Card sx={{ bgcolor: `${accent}12`, border: `1px solid ${accent}30` }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>🦒</Typography>
          <Typography variant="h5" fontWeight={700} color="text.primary">Longiligne</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {MOCK.subtitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            {MOCK.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Structure */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Structure osseuse
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            {[
              { label: 'Ossature', value: MOCK.structure.frameSize },
              { label: 'Épaules', value: MOCK.structure.shoulderToHip },
              { label: 'Cage tho.', value: MOCK.structure.ribcageDepth },
            ].map((s) => (
              <Box key={s.label} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{segmentLabels[s.value]}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Proportions avec warnings */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Proportions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              { label: 'Torse', value: 'long', warn: false },
              { label: 'Bras', value: 'long', warn: false },
              { label: 'Fémurs', value: 'short', warn: false },
              { label: 'Valgus genou', value: 'slight', warn: true },
            ].map((s) => (
              <Box key={s.label} sx={{
                p: 1.5, borderRadius: 2, textAlign: 'center',
                bgcolor: s.warn ? `${accent}10` : 'action.hover',
                border: s.warn ? `1px solid ${accent}40` : 'none',
              }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: s.warn ? accent : 'text.primary' }}>
                  {segmentLabels[s.value]}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ textAlign: 'center', pt: 1 }}>
        Recommandations par exercice
      </Typography>
      <Accordion defaultExpanded sx={{
        '&:before': { display: 'none' }, boxShadow: 1,
        borderRadius: '12px !important', overflow: 'hidden',
      }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
          borderLeft: `4px solid ${accent}`,
          bgcolor: `${accent}08`,
        }}>
          <Typography fontWeight={600}>{MOCK.squat.exercise}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: accent }}>Avantages</Typography>
              {MOCK.squat.advantages.map((a) => (
                <Typography key={a} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {a}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary">A considérer</Typography>
              {MOCK.squat.disadvantages.map((d) => (
                <Typography key={d} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {d}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: accent }}>Variantes recommandées</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {MOCK.squat.variants.map((v) => (
                  <Chip key={v} label={v} size="small" sx={{ bgcolor: `${accent}15`, color: 'text.primary', fontWeight: 500 }} />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary">Conseils</Typography>
              {MOCK.squat.tips.map((t) => (
                <Typography key={t} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {t}</Typography>
              ))}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Travail correctif */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Travail correctif
          </Typography>
          <Stack spacing={1.5}>
            {MOCK.mobilityWork.map((w) => (
              <Box key={w.area} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, borderLeft: `3px solid ${accent}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{w.area}</Typography>
                  <Typography variant="caption" sx={{ color: accent, fontWeight: 600 }}>
                    {w.priority === 'high' ? 'Prioritaire' : 'Recommandé'}
                  </Typography>
                </Stack>
                {w.exercises.map((e) => (
                  <Typography key={e} variant="caption" color="text.secondary" display="block">• {e}</Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Insertions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Potentiel musculaire
          </Typography>
          <Stack spacing={1.5}>
            {[
              { label: 'Biceps', potential: MOCK.insertions.biceps, value: 100 },
              { label: 'Mollets', potential: MOCK.insertions.calves, value: 30 },
              { label: 'Pectoraux', potential: MOCK.insertions.chest, value: 60 },
            ].map((ins) => (
              <Box key={ins.label}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{ins.label}</Typography>
                  <Typography variant="body2" sx={{ color: accent, fontWeight: 500 }}>
                    {ins.potential === 'high' ? 'Fort' : ins.potential === 'medium' ? 'Moyen' : 'Limité'}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={ins.value} sx={{
                  height: 6, borderRadius: 3, bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 3, opacity: ins.value / 100 },
                }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Points forts / à travailler */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points forts</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {MOCK.strengths.map((s) => (
              <Chip key={s} label={s} size="small" sx={{ bgcolor: `${accent}12`, color: 'text.primary', fontWeight: 500 }} />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points à travailler</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {MOCK.weaknesses.map((w) => (
              <Chip key={w} label={w} size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 500 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}


// =====================================================================
// OPTION B : Duo subtil (Purple + Ambre)
// Violet pour le positif/principal, ambre désaturé pour les alertes.
// Règle 60-30-10 stricte.
// =====================================================================
function OptionB() {
  const primary = '#bb86fc'
  const warn = '#ffb74d'

  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        2 couleurs max : violet (positif) + ambre (alertes). Règle 60-30-10.
      </Typography>

      {/* Hero Card */}
      <Card sx={{ background: `linear-gradient(135deg, ${primary}20 0%, ${primary}08 100%)`, border: `1px solid ${primary}25` }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>🦒</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: primary }}>Longiligne</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {MOCK.subtitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            {MOCK.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Structure */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Structure osseuse
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            {[
              { label: 'Ossature', value: MOCK.structure.frameSize },
              { label: 'Épaules', value: MOCK.structure.shoulderToHip },
              { label: 'Cage tho.', value: MOCK.structure.ribcageDepth },
            ].map((s) => (
              <Box key={s.label} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{segmentLabels[s.value]}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Proportions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Proportions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              { label: 'Torse', value: 'long', warn: false },
              { label: 'Bras', value: 'long', warn: false },
              { label: 'Fémurs', value: 'short', warn: false },
              { label: 'Valgus genou', value: 'slight', warn: true },
            ].map((s) => (
              <Box key={s.label} sx={{
                p: 1.5, borderRadius: 2, textAlign: 'center',
                bgcolor: s.warn ? `${warn}10` : 'action.hover',
                border: s.warn ? `1px solid ${warn}35` : 'none',
              }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: s.warn ? warn : 'text.primary' }}>
                  {segmentLabels[s.value]}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ textAlign: 'center', pt: 1 }}>
        Recommandations par exercice
      </Typography>
      <Accordion defaultExpanded sx={{
        '&:before': { display: 'none' }, boxShadow: 1,
        borderRadius: '12px !important', overflow: 'hidden',
      }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
          borderLeft: `4px solid ${primary}`,
          bgcolor: `${primary}08`,
        }}>
          <Typography fontWeight={600}>{MOCK.squat.exercise}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: primary }}>
                Avantages
              </Typography>
              {MOCK.squat.advantages.map((a) => (
                <Typography key={a} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {a}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: warn }}>
                A considérer
              </Typography>
              {MOCK.squat.disadvantages.map((d) => (
                <Typography key={d} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {d}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ color: primary }}>
                Variantes recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {MOCK.squat.variants.map((v) => (
                  <Chip key={v} label={v} size="small" sx={{ bgcolor: `${primary}15`, color: 'text.primary', fontWeight: 500 }} />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary">Conseils</Typography>
              {MOCK.squat.tips.map((t) => (
                <Typography key={t} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {t}</Typography>
              ))}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Travail correctif */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Travail correctif
          </Typography>
          <Stack spacing={1.5}>
            {MOCK.mobilityWork.map((w) => (
              <Box key={w.area} sx={{
                p: 1.5, bgcolor: 'action.hover', borderRadius: 2,
                borderLeft: `3px solid ${w.priority === 'high' ? warn : primary}`,
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{w.area}</Typography>
                  <Chip
                    label={w.priority === 'high' ? 'Prioritaire' : 'Recommandé'}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.7rem',
                      bgcolor: w.priority === 'high' ? `${warn}20` : `${primary}15`,
                      color: w.priority === 'high' ? warn : primary,
                    }}
                  />
                </Stack>
                {w.exercises.map((e) => (
                  <Typography key={e} variant="caption" color="text.secondary" display="block">• {e}</Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Insertions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Potentiel musculaire
          </Typography>
          <Stack spacing={1.5}>
            {[
              { label: 'Biceps', potential: MOCK.insertions.biceps, value: 100, potLabel: 'Fort' },
              { label: 'Mollets', potential: MOCK.insertions.calves, value: 30, potLabel: 'Limité' },
              { label: 'Pectoraux', potential: MOCK.insertions.chest, value: 60, potLabel: 'Moyen' },
            ].map((ins) => (
              <Box key={ins.label}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{ins.label}</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{
                    color: ins.potential === 'low' ? warn : primary,
                  }}>
                    {ins.potLabel}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={ins.value} sx={{
                  height: 6, borderRadius: 3, bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: ins.potential === 'low' ? warn : primary,
                    borderRadius: 3,
                  },
                }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Points forts */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points forts</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {MOCK.strengths.map((s) => (
              <Chip key={s} label={s} size="small" sx={{
                bgcolor: `${primary}12`, color: 'text.primary',
                border: `1px solid ${primary}30`, fontWeight: 500,
              }} />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Points à travailler */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points à travailler</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {MOCK.weaknesses.map((w) => (
              <Chip key={w} label={w} size="small" sx={{
                bgcolor: `${warn}10`, color: 'text.secondary',
                border: `1px solid ${warn}25`, fontWeight: 500,
              }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}


// =====================================================================
// OPTION C : Ultra-minimal
// Aucune couleur sauf le CTA. Tout repose sur la typographie,
// les bordures fines et les niveaux d'élévation.
// =====================================================================
function OptionC() {
  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Zéro couleur dans le contenu. Hiérarchie 100% typographique et structurelle.
      </Typography>

      {/* Hero Card */}
      <Card sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>🦒</Typography>
          <Typography variant="h5" fontWeight={700}>Longiligne</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            {MOCK.subtitle}
          </Typography>
          <Box sx={{ width: 40, height: 2, bgcolor: 'divider', mx: 'auto', my: 1.5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {MOCK.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Structure */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Structure osseuse
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            {[
              { label: 'Ossature', value: MOCK.structure.frameSize },
              { label: 'Épaules', value: MOCK.structure.shoulderToHip },
              { label: 'Cage tho.', value: MOCK.structure.ribcageDepth },
            ].map((s) => (
              <Box key={s.label} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{segmentLabels[s.value]}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Proportions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Proportions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              { label: 'Torse', value: 'long', warn: false },
              { label: 'Bras', value: 'long', warn: false },
              { label: 'Fémurs', value: 'short', warn: false },
              { label: 'Valgus genou', value: 'slight', warn: true },
            ].map((s) => (
              <Box key={s.label} sx={{
                p: 1.5, borderRadius: 2, textAlign: 'center',
                bgcolor: 'action.hover',
                border: s.warn ? '1px dashed' : 'none',
                borderColor: 'text.disabled',
              }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {segmentLabels[s.value]} {s.warn && '⚠'}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ textAlign: 'center', pt: 1 }}>
        Recommandations par exercice
      </Typography>
      <Accordion defaultExpanded sx={{
        '&:before': { display: 'none' }, boxShadow: 1,
        borderRadius: '12px !important', overflow: 'hidden',
      }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
          <Typography fontWeight={600}>{MOCK.squat.exercise}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Avantages
              </Typography>
              {MOCK.squat.advantages.map((a) => (
                <Typography key={a} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {a}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                A considérer
              </Typography>
              {MOCK.squat.disadvantages.map((d) => (
                <Typography key={d} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {d}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Variantes recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {MOCK.squat.variants.map((v) => (
                  <Chip key={v} label={v} size="small" variant="outlined" sx={{ fontWeight: 500, borderColor: 'divider', color: 'text.primary' }} />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Conseils
              </Typography>
              {MOCK.squat.tips.map((t) => (
                <Typography key={t} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {t}</Typography>
              ))}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Travail correctif */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Travail correctif
          </Typography>
          <Stack spacing={1.5}>
            {MOCK.mobilityWork.map((w) => (
              <Box key={w.area} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{w.area}</Typography>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {w.priority === 'high' ? 'Prioritaire' : 'Recommandé'}
                  </Typography>
                </Stack>
                {w.exercises.map((e) => (
                  <Typography key={e} variant="caption" color="text.secondary" display="block">• {e}</Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Insertions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>
            Potentiel musculaire
          </Typography>
          <Stack spacing={1.5}>
            {[
              { label: 'Biceps', value: 100, potLabel: 'Fort' },
              { label: 'Mollets', value: 30, potLabel: 'Limité' },
              { label: 'Pectoraux', value: 60, potLabel: 'Moyen' },
            ].map((ins) => (
              <Box key={ins.label}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{ins.label}</Typography>
                  <Typography variant="body2" fontWeight={500} color="text.primary">{ins.potLabel}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={ins.value} sx={{
                  height: 6, borderRadius: 3, bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: 'text.secondary', borderRadius: 3 },
                }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Points forts */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points forts</Typography>
          <Stack spacing={0.5}>
            {MOCK.strengths.map((s) => (
              <Typography key={s} variant="body2" color="text.secondary">+ {s}</Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Points à travailler */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, textAlign: 'center' }}>Points à travailler</Typography>
          <Stack spacing={0.5}>
            {MOCK.weaknesses.map((w) => (
              <Typography key={w} variant="body2" color="text.secondary">- {w}</Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
