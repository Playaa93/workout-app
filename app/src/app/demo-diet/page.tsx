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
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Add from '@mui/icons-material/Add'
import Settings from '@mui/icons-material/Settings'
import Search from '@mui/icons-material/Search'
import QrCodeScanner from '@mui/icons-material/QrCodeScanner'
import CameraAlt from '@mui/icons-material/CameraAlt'
import Bolt from '@mui/icons-material/Bolt'
import Restaurant from '@mui/icons-material/Restaurant'
import FreeBreakfast from '@mui/icons-material/FreeBreakfast'
import LunchDining from '@mui/icons-material/LunchDining'
import DinnerDining from '@mui/icons-material/DinnerDining'
import Icecream from '@mui/icons-material/Icecream'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import Home from '@mui/icons-material/Home'
import Person from '@mui/icons-material/Person'
import TrendingUp from '@mui/icons-material/TrendingUp'
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment'
import Close from '@mui/icons-material/Close'
import Star from '@mui/icons-material/Star'
import Schedule from '@mui/icons-material/Schedule'
import EmojiEvents from '@mui/icons-material/EmojiEvents'
import Link from 'next/link'

// =========================================================
// Mock data nutrition
// =========================================================
const MOCK_PROFILE = {
  targetCalories: 2400,
  targetProtein: 180,
  targetCarbs: 240,
  targetFat: 80,
}
const MOCK_TODAY = {
  calories: 1650,
  protein: 125,
  carbs: 165,
  fat: 52,
  workoutBurned: 380,
}
const MOCK_ENTRIES = [
  { id: 1, name: 'Flocons d\'avoine + banane', calories: 420, protein: 15, carbs: 72, fat: 8, mealType: 'breakfast', time: '08:15' },
  { id: 2, name: 'Whey protéine (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5, mealType: 'breakfast', time: '08:20' },
  { id: 3, name: 'Poulet grillé + riz', calories: 650, protein: 52, carbs: 65, fat: 18, mealType: 'lunch', time: '12:30' },
  { id: 4, name: 'Yaourt grec + amandes', calories: 220, protein: 18, carbs: 12, fat: 14, mealType: 'snack', time: '16:00' },
  { id: 5, name: 'Saumon + légumes', calories: 240, protein: 16, carbs: 13, fat: 10.5, mealType: 'dinner', time: '19:45' },
]
const MOCK_WEEK = [
  { day: 'Lun', calories: 2350, target: 2400 },
  { day: 'Mar', calories: 2100, target: 2400 },
  { day: 'Mer', calories: 2500, target: 2400 },
  { day: 'Jeu', calories: 2280, target: 2400 },
  { day: 'Ven', calories: 1900, target: 2400 },
  { day: 'Sam', calories: 2650, target: 2400 },
  { day: 'Dim', calories: 1650, target: 2400 },
]

const MEAL_TYPES = {
  breakfast: { label: 'Petit-déj', icon: FreeBreakfast, color: '#ff9800' },
  lunch: { label: 'Déjeuner', icon: LunchDining, color: '#4caf50' },
  dinner: { label: 'Dîner', icon: DinnerDining, color: '#7c3aed' },
  snack: { label: 'Snack', icon: Icecream, color: '#e91e63' },
}

// =========================================================
// VARIANT SELECTOR
// =========================================================
export default function DemoDietPage() {
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
            NUTRITION - DEMO VISUELS
          </Typography>
        </Box>
        <Tabs
          value={variant}
          onChange={(_, v) => setVariant(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem' },
            '& .Mui-selected': { color: '#fff' },
            '& .MuiTabs-indicator': { bgcolor: '#fff' },
          }}
        >
          <Tab label="G: Ring + FAB" />
          <Tab label="H: Diary + Sheet" />
          <Tab label="I: Compact + Nav" />
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1 }}>
        {variant === 0 && <VariantG />}
        {variant === 1 && <VariantH />}
        {variant === 2 && <VariantI />}
      </Box>
    </Box>
  )
}

// =========================================================
// VARIANTE G - "RING DASHBOARD + FAB SPEED DIAL"
// Grand ring circulaire calories, 3 mini-rings macros,
// Timeline repas, FAB central avec speed dial
// Inspiré de Cronometer / YAZIO / MyNetDiary
// =========================================================
function VariantG() {
  const [fabOpen, setFabOpen] = useState(false)
  const caloriesLeft = MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned - MOCK_TODAY.calories
  const calProgress = MOCK_TODAY.calories / (MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned)

  return (
    <Box sx={{ pb: 12 }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Nutrition</Typography>
          <Chip
            icon={<LocalFireDepartment sx={{ fontSize: 14 }} />}
            label={`+${MOCK_TODAY.workoutBurned} brûlées`}
            size="small"
            sx={{ bgcolor: 'rgba(255,152,0,0.12)', color: '#ff9800', fontWeight: 600, fontSize: '0.7rem', height: 26 }}
          />
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Settings fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2.5, pb: 4 }}>
        <Stack spacing={2.5}>
          {/* === CALORIE RING === */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(103,80,164,0.08) 0%, rgba(63,81,181,0.04) 100%)',
            border: 1, borderColor: 'divider',
          }}>
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ position: 'relative', width: 180, height: 180, mx: 'auto', mb: 2 }}>
                {/* Background ring */}
                <svg viewBox="0 0 180 180" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
                  <circle
                    cx="90" cy="90" r="78"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${calProgress * 490} 490`}
                    transform="rotate(-90 90 90)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                {/* Center text */}
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.65rem' }}>
                    Restant
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                    {caloriesLeft}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">kcal</Typography>
                </Box>
              </Box>

              {/* Macro bars below ring */}
              <Stack direction="row" spacing={2} sx={{ px: 1 }}>
                <MacroBar label="Protéines" current={MOCK_TODAY.protein} target={MOCK_PROFILE.targetProtein} color="#3b82f6" unit="g" />
                <MacroBar label="Glucides" current={MOCK_TODAY.carbs} target={MOCK_PROFILE.targetCarbs} color="#f59e0b" unit="g" />
                <MacroBar label="Lipides" current={MOCK_TODAY.fat} target={MOCK_PROFILE.targetFat} color="#ef4444" unit="g" />
              </Stack>
            </CardContent>
          </Card>

          {/* === MEAL TIMELINE === */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Aujourd&apos;hui
            </Typography>
            <Stack spacing={1}>
              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
                const meal = MEAL_TYPES[mealType]
                const entries = MOCK_ENTRIES.filter(e => e.mealType === mealType)
                const mealCals = entries.reduce((s, e) => s + e.calories, 0)
                const MealIcon = meal.icon

                return (
                  <Card key={mealType}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: `${meal.color}18` }}>
                          <MealIcon sx={{ fontSize: 20, color: meal.color }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={600}>{meal.label}</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {mealCals > 0 ? `${mealCals} kcal` : '--'}
                            </Typography>
                          </Stack>
                          {entries.length > 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {entries.map(e => e.name).join(' · ')}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              Aucun aliment
                            </Typography>
                          )}
                        </Box>
                        <IconButton size="small" sx={{ color: meal.color }}>
                          <Add sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          </Box>

          {/* === WEEKLY CHART === */}
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">Cette semaine</Typography>
                <Chip
                  icon={<TrendingUp sx={{ fontSize: 14 }} />}
                  label="Moy: 2 204 kcal"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 24 }}
                />
              </Stack>
              <Box sx={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 0.75, px: 0.5 }}>
                {MOCK_WEEK.map((d, i) => {
                  const pct = Math.min(d.calories / 3000, 1)
                  const isOver = d.calories > d.target
                  const isToday = i === 6
                  return (
                    <Box key={d.day} sx={{ flex: 1, textAlign: 'center' }}>
                      <Box sx={{
                        height: `${pct * 60}px`,
                        bgcolor: isToday ? 'primary.main' : isOver ? 'rgba(239,68,68,0.3)' : 'action.hover',
                        borderRadius: 0.75,
                        mb: 0.5,
                        border: isToday ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                      }} />
                      <Typography variant="caption" sx={{
                        fontSize: '0.6rem',
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? 'primary.main' : 'text.secondary',
                      }}>
                        {d.day}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
              {/* Target line label */}
              <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.55rem' }}>
                  Objectif : {MOCK_PROFILE.targetCalories} kcal/j
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* === FAB SPEED DIAL === */}
      {fabOpen && (
        <Box
          onClick={() => setFabOpen(false)}
          sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)',
            zIndex: 199, backdropFilter: 'blur(4px)',
          }}
        />
      )}
      <Box sx={{ position: 'fixed', bottom: 80, right: 20, zIndex: 200 }}>
        {fabOpen && (
          <Stack spacing={1.5} sx={{ mb: 1.5, alignItems: 'flex-end' }}>
            <SpeedDialItem icon={<Search />} label="Chercher" color="#3b82f6" />
            <SpeedDialItem icon={<QrCodeScanner />} label="Scanner" color="#10b981" />
            <SpeedDialItem icon={<CameraAlt />} label="Photo IA" color="#f59e0b" />
            <SpeedDialItem icon={<Bolt />} label="Rapide" color="#ef4444" />
            <SpeedDialItem icon={<Restaurant />} label="Envie de..." color="#ec4899" />
          </Stack>
        )}
        <Fab
          onClick={() => setFabOpen(!fabOpen)}
          sx={{
            width: 56, height: 56,
            background: fabOpen
              ? 'linear-gradient(135deg, #ef4444, #f97316)'
              : 'linear-gradient(135deg, #6750a4, #9a67ea)',
            color: 'white',
            boxShadow: fabOpen
              ? '0 4px 16px rgba(239,68,68,0.4)'
              : '0 4px 16px rgba(103,80,164,0.4)',
            transition: 'all 0.3s ease',
            transform: fabOpen ? 'rotate(45deg)' : 'none',
          }}
        >
          <Add sx={{ fontSize: 28 }} />
        </Fab>
      </Box>

      {/* === BOTTOM NAV (3 tabs) === */}
      <BottomNav3 active="diet" />
    </Box>
  )
}

// =========================================================
// VARIANTE H - "DIARY SEGMENTÉ + BOTTOM SHEET"
// Contrôle segmenté Jour/Semaine/Mois en haut,
// Slots repas cards horizontales avec progress par repas,
// Bottom sheet pull-up pour les options d'ajout
// Inspiré de Lifesum / MacroFactor
// =========================================================
function VariantH() {
  const [segment, setSegment] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMeal, setSheetMeal] = useState<string>('breakfast')
  const caloriesLeft = MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned - MOCK_TODAY.calories

  const openSheet = (mealType: string) => {
    setSheetMeal(mealType)
    setSheetOpen(true)
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header with segmented control */}
      <Box sx={{
        px: 2.5, pt: 2, pb: 2,
        background: 'linear-gradient(180deg, rgba(103,80,164,0.08) 0%, transparent 100%)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>Journal</Typography>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Settings fontSize="small" />
          </IconButton>
        </Stack>

        {/* Segmented control */}
        <Box sx={{
          display: 'flex', bgcolor: 'action.hover', borderRadius: 2, p: 0.5,
        }}>
          {['Aujourd\'hui', 'Semaine', 'Mois'].map((label, i) => (
            <Box
              key={label}
              onClick={() => setSegment(i)}
              sx={{
                flex: 1, py: 1, textAlign: 'center', borderRadius: 1.5,
                bgcolor: segment === i ? 'background.paper' : 'transparent',
                boxShadow: segment === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="caption" fontWeight={segment === i ? 700 : 500} sx={{
                color: segment === i ? 'text.primary' : 'text.secondary',
                fontSize: '0.75rem',
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 2.5 }}>
        <Stack spacing={2}>
          {/* Summary ribbon */}
          <Card sx={{
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            color: 'white', borderRadius: 3,
          }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" justifyContent="space-around" alignItems="center">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>Consommé</Typography>
                  <Typography variant="h5" fontWeight={800}>{MOCK_TODAY.calories}</Typography>
                </Box>
                <Box sx={{ width: 60, height: 60, position: 'relative' }}>
                  <svg viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                    <circle
                      cx="30" cy="30" r="25"
                      fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${(MOCK_TODAY.calories / (MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned)) * 157} 157`}
                      transform="rotate(-90 30 30)"
                    />
                  </svg>
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                      {Math.round((MOCK_TODAY.calories / (MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned)) * 100)}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>Restant</Typography>
                  <Typography variant="h5" fontWeight={800}>{caloriesLeft}</Typography>
                </Box>
              </Stack>

              {/* Macro pills */}
              <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'center' }}>
                <MacroPill label="P" value={MOCK_TODAY.protein} target={MOCK_PROFILE.targetProtein} color="#93c5fd" />
                <MacroPill label="G" value={MOCK_TODAY.carbs} target={MOCK_PROFILE.targetCarbs} color="#fcd34d" />
                <MacroPill label="L" value={MOCK_TODAY.fat} target={MOCK_PROFILE.targetFat} color="#fca5a5" />
              </Stack>
            </CardContent>
          </Card>

          {/* Workout bonus chip */}
          <Card sx={{ bgcolor: 'rgba(255,152,0,0.08)', border: 1, borderColor: 'rgba(255,152,0,0.2)' }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FitnessCenter sx={{ fontSize: 20, color: '#ff9800' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                    Séance aujourd&apos;hui
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    +{MOCK_TODAY.workoutBurned} kcal ajoutées à ton objectif
                  </Typography>
                </Box>
                <Chip label={`+${MOCK_TODAY.workoutBurned}`} size="small" sx={{
                  bgcolor: 'rgba(255,152,0,0.15)', color: '#ff9800', fontWeight: 700, fontSize: '0.75rem',
                }} />
              </Stack>
            </CardContent>
          </Card>

          {/* Meal slots with individual progress */}
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
            const meal = MEAL_TYPES[mealType]
            const entries = MOCK_ENTRIES.filter(e => e.mealType === mealType)
            const mealCals = entries.reduce((s, e) => s + e.calories, 0)
            const mealTarget = Math.round(MOCK_PROFILE.targetCalories * (mealType === 'snack' ? 0.1 : 0.3))
            const MealIcon = meal.icon

            return (
              <Card key={mealType}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  {/* Meal header */}
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: entries.length > 0 ? 1.5 : 0 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: `${meal.color}15` }}>
                      <MealIcon sx={{ fontSize: 22, color: meal.color }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{meal.label}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((mealCals / mealTarget) * 100, 100)}
                          sx={{
                            flex: 1, height: 4, borderRadius: 2,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { bgcolor: meal.color, borderRadius: 2 },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', minWidth: 60, textAlign: 'right' }}>
                          {mealCals}/{mealTarget}
                        </Typography>
                      </Stack>
                    </Box>
                    <IconButton size="small" onClick={() => openSheet(mealType)} sx={{
                      bgcolor: `${meal.color}12`, color: meal.color,
                      '&:hover': { bgcolor: `${meal.color}20` },
                    }}>
                      <Add sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Stack>

                  {/* Entries */}
                  {entries.length > 0 && (
                    <Stack spacing={0.5} sx={{ pl: 7 }}>
                      {entries.map((entry) => (
                        <Stack key={entry.id} direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                              {entry.name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              {entry.time}
                            </Typography>
                            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                              {entry.calories}
                            </Typography>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Box>

      {/* === BOTTOM SHEET === */}
      {sheetOpen && (
        <>
          <Box
            onClick={() => setSheetOpen(false)}
            sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', zIndex: 199, backdropFilter: 'blur(4px)' }}
          />
          <Paper sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            borderRadius: '20px 20px 0 0',
            maxWidth: 500, mx: 'auto',
            animation: 'slide-up 0.3s ease-out',
          }}>
            {/* Handle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5 }}>
              <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.hover' }} />
            </Box>

            <Box sx={{ px: 3, pt: 1.5, pb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Ajouter - {MEAL_TYPES[sheetMeal as keyof typeof MEAL_TYPES]?.label}
                </Typography>
                <IconButton size="small" onClick={() => setSheetOpen(false)}>
                  <Close fontSize="small" />
                </IconButton>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <SheetAction icon={<Search />} label="Chercher" desc="Base de données" color="#3b82f6" />
                <SheetAction icon={<QrCodeScanner />} label="Scanner" desc="Code-barres" color="#10b981" />
                <SheetAction icon={<CameraAlt />} label="Photo IA" desc="Reconnaissance" color="#f59e0b" />
                <SheetAction icon={<Bolt />} label="Rapide" desc="Estimation" color="#ef4444" />
              </Box>

              {/* Recent foods */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2.5, mb: 1 }}>
                Récemment ajoutés
              </Typography>
              <Stack spacing={0.5}>
                {MOCK_ENTRIES.slice(0, 3).map(e => (
                  <Card key={e.id} variant="outlined">
                    <CardActionArea>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{e.name}</Typography>
                          <Typography variant="caption" fontWeight={600}>{e.calories} kcal</Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Paper>
        </>
      )}

      {/* === BOTTOM NAV (4 tabs Material 3 pill) === */}
      <BottomNav4Pill active="journal" />
    </Box>
  )
}

// =========================================================
// VARIANTE I - "COMPACT BANNER + NAV 5 ITEMS INTÉGRÉE"
// Bannière compacte gradient, cartes repas avec détail macro,
// Nav bottom 5 items avec "+" central intégré,
// Chips d'actions horizontaux, streak/gamification
// Inspiré de Noom / MyFitnessPal 2025
// =========================================================
function VariantI() {
  const caloriesLeft = MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned - MOCK_TODAY.calories
  const pctUsed = Math.round((MOCK_TODAY.calories / (MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned)) * 100)

  return (
    <Box sx={{ pb: 12 }}>
      {/* Header minimal */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>Nutrition</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Dimanche 16 février
            </Typography>
          </Box>
          {/* Streak badge */}
          <Chip
            icon={<EmojiEvents sx={{ fontSize: 14, color: '#eab308' }} />}
            label="5j streak"
            size="small"
            sx={{ bgcolor: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 600, fontSize: '0.7rem', height: 26 }}
          />
        </Stack>
      </Box>

      <Box sx={{ px: 2.5 }}>
        <Stack spacing={2}>
          {/* === COMPACT BANNER === */}
          <Card sx={{
            background: 'linear-gradient(135deg, #6750a4 0%, #7c3aed 50%, #9a67ea 100%)',
            color: 'white', borderRadius: 3, overflow: 'visible',
          }}>
            <CardContent sx={{ py: 2.5, px: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* Mini ring */}
                <Box sx={{ width: 70, height: 70, position: 'relative', flexShrink: 0 }}>
                  <svg viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle
                      cx="35" cy="35" r="30"
                      fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(pctUsed / 100) * 188} 188`}
                      transform="rotate(-90 35 35)"
                    />
                  </svg>
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.85rem' }}>
                      {pctUsed}%
                    </Typography>
                  </Box>
                </Box>

                {/* Stats */}
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>Mangé</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>{MOCK_TODAY.calories}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>Objectif</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>{MOCK_PROFILE.targetCalories + MOCK_TODAY.workoutBurned}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>Restant</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1, color: '#a5f3fc' }}>{caloriesLeft}</Typography>
                    </Box>
                  </Stack>

                  {/* Inline macro bars */}
                  <Stack direction="row" spacing={0.75}>
                    {[
                      { label: 'P', cur: MOCK_TODAY.protein, max: MOCK_PROFILE.targetProtein, color: '#93c5fd' },
                      { label: 'G', cur: MOCK_TODAY.carbs, max: MOCK_PROFILE.targetCarbs, color: '#fcd34d' },
                      { label: 'L', cur: MOCK_TODAY.fat, max: MOCK_PROFILE.targetFat, color: '#fca5a5' },
                    ].map(m => (
                      <Box key={m.label} sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.55rem', opacity: 0.7 }}>{m.label}</Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.55rem', opacity: 0.7 }}>{m.cur}/{m.max}</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((m.cur / m.max) * 100, 100)}
                          sx={{
                            height: 3, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 2 },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* === QUICK ACTION CHIPS (horizontal scroll) === */}
          <Stack direction="row" spacing={1} sx={{ overflow: 'auto', pb: 0.5, mx: -0.5, px: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
            <ActionChip icon={<Schedule sx={{ fontSize: 16 }} />} label="Récent" />
            <ActionChip icon={<Star sx={{ fontSize: 16 }} />} label="Favoris" />
            <ActionChip icon={<Search sx={{ fontSize: 16 }} />} label="Chercher" />
            <ActionChip icon={<QrCodeScanner sx={{ fontSize: 16 }} />} label="Scanner" />
            <ActionChip icon={<CameraAlt sx={{ fontSize: 16 }} />} label="Photo IA" />
            <ActionChip icon={<Restaurant sx={{ fontSize: 16 }} />} label="Envies" />
          </Stack>

          {/* === MEAL CARDS with detailed macro === */}
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
            const meal = MEAL_TYPES[mealType]
            const entries = MOCK_ENTRIES.filter(e => e.mealType === mealType)
            const mealCals = entries.reduce((s, e) => s + e.calories, 0)
            const mealP = entries.reduce((s, e) => s + e.protein, 0)
            const mealC = entries.reduce((s, e) => s + e.carbs, 0)
            const mealF = entries.reduce((s, e) => s + e.fat, 0)
            const MealIcon = meal.icon

            return (
              <Card key={mealType} sx={{ overflow: 'visible' }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${meal.color}20, ${meal.color}08)`,
                    }}>
                      <MealIcon sx={{ fontSize: 22, color: meal.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{meal.label}</Typography>
                      {entries.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {entries.length} aliment{entries.length > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {mealCals > 0 ? `${mealCals}` : '0'} <Typography component="span" variant="caption" color="text.secondary">kcal</Typography>
                      </Typography>
                      {mealCals > 0 && (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.25 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#3b82f6' }}>P{mealP}</Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#f59e0b' }}>G{mealC}</Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#ef4444' }}>L{mealF}</Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>

                  {/* Entries list */}
                  {entries.length > 0 && (
                    <Stack spacing={0.75} sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                      {entries.map((entry) => (
                        <Stack key={entry.id} direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: meal.color, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ flex: 1, fontSize: '0.75rem' }}>{entry.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                            {entry.calories} kcal
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}

                  {entries.length === 0 && (
                    <Box sx={{ mt: 1, py: 1.5, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Appuie sur + pour ajouter
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* === AI SUGGESTION CARD === */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.06) 100%)',
            border: 1, borderColor: 'rgba(16,185,129,0.2)',
          }}>
            <CardContent sx={{ py: 2, px: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(16,185,129,0.15)' }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>💡</Typography>
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                    Suggestion du jour
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Il te reste {caloriesLeft} kcal et {MOCK_PROFILE.targetProtein - MOCK_TODAY.protein}g de protéines.
                    Un filet de poulet (200g) + légumes serait idéal pour ton dîner.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* === BOTTOM NAV 5 items with central "+" === */}
      <BottomNav5Central active="nutrition" />
    </Box>
  )
}

// =========================================================
// Shared Components
// =========================================================

function MacroBar({ label, current, target, color, unit }: {
  label: string; current: number; target: number; color: string; unit: string;
}) {
  return (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min((current / target) * 100, 100)}
        sx={{
          height: 6, borderRadius: 3, my: 0.5,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
        {current}<Typography component="span" variant="caption" color="text.secondary">/{target}{unit}</Typography>
      </Typography>
    </Box>
  )
}

function MacroPill({ label, value, target, color }: {
  label: string; value: number; target: number; color: string;
}) {
  return (
    <Box sx={{
      bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 1.5, py: 0.5,
      display: 'flex', alignItems: 'center', gap: 0.75,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        {label} {value}/{target}g
      </Typography>
    </Box>
  )
}

function SpeedDialItem({ icon, label, color }: {
  icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor: 'background.paper', fontWeight: 600, fontSize: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', height: 32,
        }}
      />
      <Fab size="small" sx={{
        width: 44, height: 44,
        bgcolor: color, color: 'white',
        boxShadow: `0 2px 12px ${color}60`,
        '&:hover': { bgcolor: color },
      }}>
        {icon}
      </Fab>
    </Stack>
  )
}

function SheetAction({ icon, label, desc, color }: {
  icon: React.ReactNode; label: string; desc: string; color: string;
}) {
  return (
    <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { borderColor: color, bgcolor: `${color}08` } }}>
      <CardActionArea>
        <CardContent sx={{ py: 2, textAlign: 'center' }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: `${color}15`, mx: 'auto', mb: 1 }}>
            <Box sx={{ color }}>{icon}</Box>
          </Avatar>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{desc}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function ActionChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Chip
      icon={<Box sx={{ display: 'flex', color: 'inherit' }}>{icon}</Box>}
      label={label}
      variant="outlined"
      size="small"
      sx={{
        fontWeight: 600, fontSize: '0.75rem', height: 32,
        cursor: 'pointer', flexShrink: 0,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    />
  )
}

// =========================================================
// Bottom Navigation Variants
// =========================================================

/** Variante G: 3 tabs (Home, Diet actif, Profile) */
function BottomNav3({ active }: { active: string }) {
  const items = [
    { key: 'home', label: 'Accueil', icon: <Home /> },
    { key: 'diet', label: 'Nutrition', icon: <Restaurant /> },
    { key: 'profile', label: 'Profil', icon: <Person /> },
  ]

  return (
    <Paper elevation={8} sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      borderRadius: '16px 16px 0 0', maxWidth: 500, mx: 'auto',
    }}>
      <Stack direction="row" sx={{ height: 64 }}>
        {items.map(item => (
          <Box key={item.key} sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 0.25,
            cursor: 'pointer', color: active === item.key ? 'primary.main' : 'text.secondary',
          }}>
            <Box sx={{
              p: 0.5, borderRadius: 3,
              bgcolor: active === item.key ? 'rgba(103,80,164,0.12)' : 'transparent',
              px: active === item.key ? 2 : 0.5,
              transition: 'all 0.2s',
            }}>
              {item.icon}
            </Box>
            <Typography variant="caption" fontWeight={active === item.key ? 700 : 500} sx={{ fontSize: '0.6rem' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

/** Variante H: 4 tabs Material 3 avec pill indicateur */
function BottomNav4Pill({ active }: { active: string }) {
  const items = [
    { key: 'home', label: 'Accueil', icon: <Home /> },
    { key: 'journal', label: 'Journal', icon: <Restaurant /> },
    { key: 'workout', label: 'Training', icon: <FitnessCenter /> },
    { key: 'profile', label: 'Profil', icon: <Person /> },
  ]

  return (
    <Paper elevation={8} sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      borderRadius: '16px 16px 0 0', maxWidth: 500, mx: 'auto',
    }}>
      <Stack direction="row" sx={{ height: 64 }}>
        {items.map(item => {
          const isActive = active === item.key
          return (
            <Box key={item.key} sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 0.25,
              cursor: 'pointer', color: isActive ? 'primary.main' : 'text.secondary',
              position: 'relative',
            }}>
              {/* Pill indicator Material 3 */}
              <Box sx={{
                p: 0.5, borderRadius: 4,
                bgcolor: isActive ? 'rgba(103,80,164,0.12)' : 'transparent',
                px: isActive ? 2.5 : 0.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {item.icon}
              </Box>
              <Typography variant="caption" fontWeight={isActive ? 700 : 500} sx={{ fontSize: '0.6rem' }}>
                {item.label}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

/** Variante I: 5 tabs avec "+" central intégré */
function BottomNav5Central({ active }: { active: string }) {
  const items = [
    { key: 'home', label: 'Accueil', icon: <Home />, isCenter: false },
    { key: 'nutrition', label: 'Nutrition', icon: <Restaurant />, isCenter: false },
    { key: 'add', label: '', icon: <Add />, isCenter: true },
    { key: 'workout', label: 'Training', icon: <FitnessCenter />, isCenter: false },
    { key: 'profile', label: 'Profil', icon: <Person />, isCenter: false },
  ]

  return (
    <Paper elevation={8} sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      borderRadius: '16px 16px 0 0', maxWidth: 500, mx: 'auto',
    }}>
      <Stack direction="row" sx={{ height: 64 }} alignItems="center">
        {items.map(item => {
          if (item.isCenter) {
            return (
              <Box key={item.key} sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <Fab size="medium" sx={{
                  width: 48, height: 48, mt: -3,
                  background: 'linear-gradient(135deg, #6750a4, #9a67ea)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(103,80,164,0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #7f67be, #bb86fc)' },
                }}>
                  <Add sx={{ fontSize: 26 }} />
                </Fab>
              </Box>
            )
          }

          const isActive = active === item.key
          return (
            <Box key={item.key} sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 0.25,
              cursor: 'pointer', color: isActive ? 'primary.main' : 'text.secondary',
            }}>
              {item.icon}
              <Typography variant="caption" fontWeight={isActive ? 700 : 500} sx={{ fontSize: '0.55rem' }}>
                {item.label}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}
