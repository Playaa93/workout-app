'use client';

import { useState, useEffect } from 'react';
import {
  getMeasurements,
  getLatestMeasurement,
  getProgressSummary,
  getProgressPhotos,
  addMeasurement,
  deleteMeasurement,
  type MeasurementData,
  type MeasurementInput,
  type ProgressPhotoData,
} from './actions';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import ExpandMore from '@mui/icons-material/ExpandMore';
import TrendingDown from '@mui/icons-material/TrendingDown';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingFlat from '@mui/icons-material/TrendingFlat';
import CameraAlt from '@mui/icons-material/CameraAlt';
import PhotoLibrary from '@mui/icons-material/PhotoLibrary';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Straighten from '@mui/icons-material/Straighten';
import MonitorWeight from '@mui/icons-material/MonitorWeight';
import BottomNav from '@/components/BottomNav';

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

type TabValue = 'overview' | 'history' | 'photos';

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [latest, setLatest] = useState<MeasurementData | null>(null);
  const [previous, setPrevious] = useState<MeasurementData | null>(null);
  const [photos, setPhotos] = useState<ProgressPhotoData[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getProgressSummary>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadData = async () => {
    const [measurementsData, latestData, summaryData, photosData] = await Promise.all([
      getMeasurements(),
      getLatestMeasurement(),
      getProgressSummary(),
      getProgressPhotos(),
    ]);
    setMeasurements(measurementsData);
    setLatest(latestData);
    setPrevious(measurementsData.length >= 2 ? measurementsData[1] : null);
    setSummary(summaryData);
    setPhotos(photosData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMeasurement = async (data: MeasurementInput) => {
    await addMeasurement(data);
    await loadData();
    setShowAddForm(false);
  };

  const handleDeleteMeasurement = async (id: string) => {
    await deleteMeasurement(id);
    await loadData();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, pt: 2.5, pb: 1,
        background: 'linear-gradient(180deg, rgba(103,80,164,0.1) 0%, transparent 100%)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
            Mensurations
          </Typography>
          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={() => { triggerHaptic('light'); setActiveTab('photos'); }}
          >
            <CameraAlt fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 2.5, pb: 1.5, pt: 1 }}>
        <Stack direction="row" spacing={1}>
          {([
            { key: 'overview', label: 'Aperçu' },
            { key: 'history', label: 'Historique' },
            { key: 'photos', label: 'Photos' },
          ] as const).map((tab) => (
            <Chip
              key={tab.key}
              label={tab.label}
              size="small"
              onClick={() => { triggerHaptic('light'); setActiveTab(tab.key); }}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                bgcolor: activeTab === tab.key ? 'primary.main' : 'action.hover',
                color: activeTab === tab.key ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  bgcolor: activeTab === tab.key ? 'primary.main' : 'action.selected',
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, pb: 12 }}>
        {isLoading ? (
          <Box sx={{ px: 2.5 }}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
              <Stack direction="row" spacing={1.5}>
                <Skeleton variant="rounded" height={90} sx={{ flex: 1, borderRadius: 2 }} />
                <Skeleton variant="rounded" height={90} sx={{ flex: 1, borderRadius: 2 }} />
              </Stack>
            </Stack>
          </Box>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                latest={latest}
                previous={previous}
                summary={summary}
                onGoToPhotos={() => setActiveTab('photos')}
                onGoToHistory={() => setActiveTab('history')}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab measurements={measurements} onDelete={handleDeleteMeasurement} />
            )}
            {activeTab === 'photos' && (
              <PhotosTab photos={photos} onRefresh={loadData} />
            )}
          </>
        )}
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* FAB */}
      <Fab
        onClick={() => { triggerHaptic('light'); setShowAddForm(true); }}
        sx={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          background: 'linear-gradient(135deg, #6750a4, #9a67ea)', color: 'white',
          boxShadow: '0 4px 16px rgba(103,80,164,0.4)',
          '&:hover': { background: 'linear-gradient(135deg, #7f67be, #bb86fc)' },
        }}
      >
        <Add sx={{ fontSize: 28 }} />
      </Fab>

      {/* Add Form Modal */}
      {showAddForm && (
        <AddMeasurementForm
          lastMeasurement={latest}
          onSubmit={handleAddMeasurement}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </Box>
  );
}

// =========================================================
// Shared: TrendBadge
// =========================================================
function TrendBadge({ value, unit, inverse = false }: { value: number; unit: string; inverse?: boolean }) {
  const isGood = inverse ? value < 0 : value > 0;
  const color = value === 0 ? 'text.secondary' : isGood ? '#4caf50' : '#f44336';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : TrendingFlat;
  const sign = value > 0 ? '+' : '';

  return (
    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="caption" fontWeight={600} sx={{ color: 'inherit', fontSize: '0.7rem' }}>
        {sign}{value.toFixed(1)}{unit}
      </Typography>
    </Stack>
  );
}

// =========================================================
// OVERVIEW TAB - Variant D "Hero + Compact List"
// =========================================================
function OverviewTab({
  latest,
  previous,
  summary,
  onGoToPhotos,
  onGoToHistory,
}: {
  latest: MeasurementData | null;
  previous: MeasurementData | null;
  summary: Awaited<ReturnType<typeof getProgressSummary>> | null;
  onGoToPhotos: () => void;
  onGoToHistory: () => void;
}) {
  if (!latest) {
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
    );
  }

  const calcChange = (field: keyof MeasurementData): number | null => {
    if (!previous) return null;
    const latestVal = latest[field];
    const prevVal = previous[field];
    if (!latestVal || !prevVal || typeof latestVal !== 'string' || typeof prevVal !== 'string') return null;
    return parseFloat(latestVal) - parseFloat(prevVal);
  };

  const formattedDate = new Date(latest.measuredAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const weightChange = calcChange('weight');

  // Build list of available measurements
  const bodyMeasures: { label: string; field: keyof MeasurementData; inverse?: boolean }[] = [
    { label: 'Poitrine', field: 'chest' },
    { label: 'Épaules', field: 'shoulders' },
    { label: 'Cou', field: 'neck' },
    { label: 'Hanches', field: 'hips', inverse: true },
    { label: 'Bras G', field: 'leftArm' },
    { label: 'Bras D', field: 'rightArm' },
    { label: 'Av-bras G', field: 'leftForearm' },
    { label: 'Av-bras D', field: 'rightForearm' },
    { label: 'Cuisse G', field: 'leftThigh' },
    { label: 'Cuisse D', field: 'rightThigh' },
    { label: 'Mollet G', field: 'leftCalf' },
    { label: 'Mollet D', field: 'rightCalf' },
  ];

  const filledMeasures = bodyMeasures.filter((m) => latest[m.field] !== null);

  return (
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
              {latest.weight || '--'}
              <Typography component="span" variant="h5" color="text.secondary" fontWeight={400}> kg</Typography>
            </Typography>
            {weightChange !== null && (
              <TrendBadge value={weightChange} unit=" kg" inverse />
            )}
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              {formattedDate}
            </Typography>
          </CardContent>
        </Card>

        {/* Sparkline / Weight Chart */}
        {summary && summary.totalMeasurements >= 2 && <WeightChart />}

        {/* Body composition - 2 cards */}
        <Stack direction="row" spacing={1.5}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Masse grasse</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>
                {latest.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : '--'}
              </Typography>
              {calcChange('bodyFatPercentage') !== null && (
                <TrendBadge value={calcChange('bodyFatPercentage')!} unit="%" inverse />
              )}
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Tour de taille</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>
                {latest.waist ? `${latest.waist} cm` : '--'}
              </Typography>
              {calcChange('waist') !== null && (
                <TrendBadge value={calcChange('waist')!} unit=" cm" inverse />
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* All measurements - compact CSS Grid list */}
        {filledMeasures.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Toutes les mesures
            </Typography>
            <Card>
              <Stack divider={<Divider />}>
                {filledMeasures.map((m) => (
                  <ListRow
                    key={m.field}
                    label={m.label}
                    value={latest[m.field] as string}
                    unit="cm"
                    change={calcChange(m.field)}
                    inverse={m.inverse}
                  />
                ))}
              </Stack>
            </Card>
          </Box>
        )}

        {/* Quick actions */}
        <Stack direction="row" spacing={1.5}>
          <Card sx={{ flex: 1 }}>
            <CardActionArea onClick={onGoToPhotos}>
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                <CameraAlt sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={600}>Photos</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardActionArea onClick={onGoToHistory}>
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                <Straighten sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                <Typography variant="caption" fontWeight={600}>Historique</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

// =========================================================
// ListRow - CSS Grid compact row
// =========================================================
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
  );
}

// =========================================================
// Weight Chart
// =========================================================
function WeightChart() {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    import('./actions').then(({ getMeasurementHistory }) => {
      getMeasurementHistory('weight', 10).then(setData);
    });
  }, []);

  if (data.length < 2) return null;

  const min = Math.min(...data.map((d) => d.value)) - 1;
  const max = Math.max(...data.map((d) => d.value)) + 1;
  const range = max - min;

  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Évolution du poids
          </Typography>
          <Stack direction="row" spacing={1}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
              {min.toFixed(1)}kg
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
              {max.toFixed(1)}kg
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ height: 48, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
          {data.map((point, i) => {
            const height = ((point.value - min) / range) * 100;
            return (
              <Box key={i} sx={{
                flex: 1, bgcolor: i === data.length - 1 ? 'primary.main' : 'action.hover',
                borderRadius: 0.5,
                height: `${height}%`,
                minHeight: 4,
              }} />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// =========================================================
// History Tab
// =========================================================
function HistoryTab({
  measurements,
  onDelete,
}: {
  measurements: MeasurementData[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [measureToDelete, setMeasureToDelete] = useState<string | null>(null);

  if (measurements.length === 0) {
    return (
      <Box sx={{ px: 2.5, textAlign: 'center', py: 6 }}>
        <Straighten sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5, transform: 'rotate(-45deg)' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          Aucun historique
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tes mesures apparaîtront ici
        </Typography>
      </Box>
    );
  }

  const handleDeleteClick = (id: string) => {
    setMeasureToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (measureToDelete) {
      onDelete(measureToDelete);
    }
    setDeleteDialogOpen(false);
    setMeasureToDelete(null);
  };

  return (
    <Box sx={{ px: 2.5 }}>
      <Stack spacing={1.5}>
        {measurements.map((m) => {
          const date = new Date(m.measuredAt);
          const isExpanded = expanded === m.id;

          const allFields: { label: string; value: string | null }[] = [
            { label: 'Poids', value: m.weight ? `${m.weight} kg` : null },
            { label: '% Gras', value: m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : null },
            { label: 'Cou', value: m.neck ? `${m.neck} cm` : null },
            { label: 'Épaules', value: m.shoulders ? `${m.shoulders} cm` : null },
            { label: 'Poitrine', value: m.chest ? `${m.chest} cm` : null },
            { label: 'Taille', value: m.waist ? `${m.waist} cm` : null },
            { label: 'Hanches', value: m.hips ? `${m.hips} cm` : null },
            { label: 'Bras G', value: m.leftArm ? `${m.leftArm} cm` : null },
            { label: 'Bras D', value: m.rightArm ? `${m.rightArm} cm` : null },
            { label: 'Cuisse G', value: m.leftThigh ? `${m.leftThigh} cm` : null },
            { label: 'Cuisse D', value: m.rightThigh ? `${m.rightThigh} cm` : null },
            { label: 'Mollet G', value: m.leftCalf ? `${m.leftCalf} cm` : null },
            { label: 'Mollet D', value: m.rightCalf ? `${m.rightCalf} cm` : null },
          ].filter((f) => f.value !== null);

          return (
            <Card key={m.id}>
              <CardActionArea
                onClick={() => setExpanded(isExpanded ? null : m.id)}
                sx={{ px: 2.5, py: 2 }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.weight ? `${m.weight} kg` : ''}{m.waist ? ` · Taille ${m.waist} cm` : ''}
                    </Typography>
                  </Box>
                  <ExpandMore sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: 'text.secondary',
                    fontSize: 20,
                  }} />
                </Stack>
              </CardActionArea>

              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ px: 2.5, pb: 2, pt: 1.5 }}>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1.5,
                    mb: 2,
                  }}>
                    {allFields.map((f) => (
                      <Box key={f.label}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {f.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {f.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  {m.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                      {m.notes}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(m.id); }}
                    sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                  >
                    Supprimer
                  </Button>
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Supprimer la mesure ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =========================================================
// Photos Tab
// =========================================================
function PhotosTab({
  photos,
  onRefresh,
}: {
  photos: ProgressPhotoData[];
  onRefresh: () => void;
}) {
  const [showUpload, setShowUpload] = useState(false);

  if (photos.length === 0 && !showUpload) {
    return (
      <Box sx={{ px: 2.5, textAlign: 'center', py: 6 }}>
        <CameraAlt sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          Aucune photo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Prends des photos pour suivre ta transformation
        </Typography>
        <Button
          variant="contained"
          startIcon={<CameraAlt />}
          onClick={() => { triggerHaptic('light'); setShowUpload(true); }}
          sx={{
            px: 4, py: 1.5, borderRadius: 3, fontWeight: 700,
            background: 'linear-gradient(135deg, #6750a4, #9a67ea)',
          }}
        >
          Ajouter une photo
        </Button>
      </Box>
    );
  }

  const photosByDate = photos.reduce((acc, photo) => {
    const date = new Date(photo.takenAt).toLocaleDateString('fr-FR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, ProgressPhotoData[]>);

  return (
    <Box sx={{ px: 2.5 }}>
      <Stack spacing={3}>
        <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
          <CardActionArea onClick={() => { triggerHaptic('light'); setShowUpload(true); }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Add sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Ajouter une photo
                </Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>

        {Object.entries(photosByDate).map(([date, datePhotos]) => (
          <Box key={date}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1, display: 'block' }}>
              {date}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {datePhotos.map((photo) => (
                <Box
                  key={photo.id}
                  sx={{
                    aspectRatio: '3/4',
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src={photo.photoUrl}
                    alt={photo.photoType}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Chip
                    label={photo.photoType.replace('_', ' ')}
                    size="small"
                    sx={{
                      position: 'absolute', bottom: 8, left: 8,
                      bgcolor: 'rgba(0,0,0,0.7)', textTransform: 'capitalize',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>

      {showUpload && (
        <PhotoUploadModal
          onClose={() => setShowUpload(false)}
          onUpload={onRefresh}
        />
      )}
    </Box>
  );
}

// =========================================================
// Photo Upload - Bottom Sheet (2 steps)
// Step 1: Choose source (camera / gallery)
// Step 2: Preview + pose type + save
// =========================================================
function PhotoUploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: () => void;
}) {
  const [photoType, setPhotoType] = useState<'front' | 'back' | 'side_left' | 'side_right'>('front');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      triggerHaptic('medium');
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    setUploadProgress(true);
    try {
      const { addProgressPhoto } = await import('./actions');
      await addProgressPhoto(previewUrl, photoType);
      triggerHaptic('heavy');
      onUpload();
      onClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
      setUploadProgress(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setPhotoType('front');
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85vh',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 1 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
      </Box>

      {uploadProgress && <LinearProgress sx={{ mx: 2, borderRadius: 1 }} />}

      <Box sx={{ px: 2.5, pb: 3 }}>
        {!previewUrl ? (
          /* ===== Step 1: Choose source ===== */
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 0.5 }}>
              Ajouter une photo
            </Typography>

            {/* Camera button */}
            <input
              id="photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Card sx={{ bgcolor: 'action.hover' }}>
              <CardActionArea
                onClick={() => {
                  triggerHaptic('light');
                  document.getElementById('photo-camera')?.click();
                }}
                sx={{ py: 2.5, px: 2.5 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: 'rgba(103,80,164,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PhotoCamera sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>Prendre une photo</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ouvre l&apos;appareil photo
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>

            {/* Gallery button */}
            <input
              id="photo-gallery"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Card sx={{ bgcolor: 'action.hover' }}>
              <CardActionArea
                onClick={() => {
                  triggerHaptic('light');
                  document.getElementById('photo-gallery')?.click();
                }}
                sx={{ py: 2.5, px: 2.5 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: 'rgba(103,80,164,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PhotoLibrary sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>Choisir depuis la galerie</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sélectionne une photo existante
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          </Stack>
        ) : (
          /* ===== Step 2: Preview + Pose + Save ===== */
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Photo de progression
              </Typography>
              <IconButton onClick={handleReset} size="small" sx={{ color: 'text.secondary' }}>
                <Close fontSize="small" />
              </IconButton>
            </Stack>

            {/* Preview */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{
                position: 'relative',
                width: 160, height: 213,
                borderRadius: 3, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Preview"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>

            {/* Pose type selection */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1, display: 'block' }}>
                Type de pose
              </Typography>
              <Stack direction="row" spacing={1}>
                {([
                  { key: 'front', label: 'Face' },
                  { key: 'back', label: 'Dos' },
                  { key: 'side_left', label: 'Côté G' },
                  { key: 'side_right', label: 'Côté D' },
                ] as const).map((type) => (
                  <Chip
                    key={type.key}
                    label={type.label}
                    size="small"
                    onClick={() => { triggerHaptic('light'); setPhotoType(type.key); }}
                    sx={{
                      flex: 1, fontWeight: 600, fontSize: '0.75rem',
                      bgcolor: photoType === type.key ? 'primary.main' : 'action.hover',
                      color: photoType === type.key ? 'primary.contrastText' : 'text.secondary',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Save button */}
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="large"
              fullWidth
              disabled={isUploading}
              sx={{
                py: 1.5, borderRadius: 3, fontWeight: 700,
                background: 'linear-gradient(135deg, #6750a4, #9a67ea)',
              }}
            >
              {isUploading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Stack>
        )}
      </Box>
    </SwipeableDrawer>
  );
}

// =========================================================
// Add Measurement Form
// =========================================================
function AddMeasurementForm({
  lastMeasurement,
  onSubmit,
  onClose,
}: {
  lastMeasurement: MeasurementData | null;
  onSubmit: (data: MeasurementInput) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<MeasurementInput>({
    weight: lastMeasurement?.weight ? parseFloat(lastMeasurement.weight) : undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [height, setHeight] = useState('175');
  const [isMale, setIsMale] = useState(true);
  const [calculatedBf, setCalculatedBf] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!data.weight || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(data);
  };

  const updateField = (field: keyof MeasurementInput, value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: value ? parseFloat(value) : undefined,
    }));
  };

  const calculateNavyBodyFat = () => {
    const h = parseFloat(height);
    const n = data.neck;
    const w = data.waist;
    const hp = data.hips;
    if (!h || !n || !w) return;
    let bf: number;
    if (isMale) {
      if (w <= n) return;
      bf = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    } else {
      if (!hp || (w + hp) <= n) return;
      bf = 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
    }
    const rounded = Math.round(bf * 10) / 10;
    setCalculatedBf(rounded);
    updateField('bodyFatPercentage', rounded.toString());
  };

  const canCalculate = data.neck && data.waist && height && (isMale || data.hips);

  return (
    <Box sx={{
      position: 'fixed', inset: 0,
      bgcolor: 'background.default', zIndex: 1300,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>
            Annuler
          </Button>
          <Typography fontWeight={600} fontSize="1.1rem">
            Nouvelle mesure
          </Typography>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !data.weight}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isSubmitting ? '...' : 'OK'}
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2.5}>
          {/* Main metrics */}
          <MeasureInput
            label="Poids"
            unit="kg"
            value={data.weight}
            onChange={(v) => updateField('weight', v)}
            placeholder={lastMeasurement?.weight || '80'}
          />

          <Stack direction="row" spacing={2}>
            <MeasureInput
              label="Tour de taille"
              unit="cm"
              value={data.waist}
              onChange={(v) => updateField('waist', v)}
              placeholder={lastMeasurement?.waist || ''}
            />
            <MeasureInput
              label="Poitrine"
              unit="cm"
              value={data.chest}
              onChange={(v) => updateField('chest', v)}
              placeholder={lastMeasurement?.chest || ''}
            />
          </Stack>

          <MeasureInput
            label="Masse grasse"
            unit="%"
            value={data.bodyFatPercentage}
            onChange={(v) => updateField('bodyFatPercentage', v)}
            placeholder={lastMeasurement?.bodyFatPercentage || ''}
          />

          {/* Body Fat Calculator */}
          <Box
            onClick={() => { triggerHaptic('light'); setShowCalculator(!showCalculator); }}
            sx={{
              py: 1, color: 'text.secondary', fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5,
            }}
          >
            <ExpandMore sx={{ fontSize: 18, transform: showCalculator ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            Calculer ma masse grasse
          </Box>

          <Collapse in={showCalculator}>
            <Card sx={{ bgcolor: 'action.hover' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1}>
                    {['Homme', 'Femme'].map((g) => (
                      <Chip
                        key={g}
                        label={g}
                        size="small"
                        onClick={() => { setIsMale(g === 'Homme'); setCalculatedBf(null); }}
                        sx={{
                          flex: 1, fontWeight: 600,
                          bgcolor: (g === 'Homme' ? isMale : !isMale) ? 'primary.main' : 'transparent',
                          color: (g === 'Homme' ? isMale : !isMale) ? 'primary.contrastText' : 'text.secondary',
                          border: 1,
                          borderColor: (g === 'Homme' ? isMale : !isMale) ? 'primary.main' : 'divider',
                        }}
                      />
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Taille"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{ endAdornment: <Typography color="text.secondary">cm</Typography> }}
                    />
                    <TextField
                      label="Cou"
                      type="number"
                      value={data.neck || ''}
                      onChange={(e) => updateField('neck', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{ endAdornment: <Typography color="text.secondary">cm</Typography> }}
                    />
                  </Stack>

                  {!isMale && (
                    <TextField
                      label="Hanches"
                      type="number"
                      value={data.hips || ''}
                      onChange={(e) => updateField('hips', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{ endAdornment: <Typography color="text.secondary">cm</Typography> }}
                    />
                  )}

                  <Button
                    onClick={canCalculate ? calculateNavyBodyFat : undefined}
                    variant="contained"
                    fullWidth
                    disabled={!canCalculate}
                    sx={{
                      py: 1.5, borderRadius: 2, fontWeight: 700,
                      background: canCalculate ? 'linear-gradient(135deg, #6750a4, #9a67ea)' : undefined,
                    }}
                  >
                    {calculatedBf !== null ? `${calculatedBf}% - Appliqué` : 'Calculer'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Collapse>

          {/* More measurements */}
          <Box
            onClick={() => { triggerHaptic('light'); setShowMore(!showMore); }}
            sx={{
              py: 1, color: 'text.secondary', fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5,
            }}
          >
            <ExpandMore sx={{ fontSize: 18, transform: showMore ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            Plus de mesures
          </Box>

          <Collapse in={showMore}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Cou" unit="cm" value={data.neck} onChange={(v) => updateField('neck', v)} placeholder="" />
                <MeasureInput label="Épaules" unit="cm" value={data.shoulders} onChange={(v) => updateField('shoulders', v)} placeholder="" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Bras G" unit="cm" value={data.leftArm} onChange={(v) => updateField('leftArm', v)} placeholder="" />
                <MeasureInput label="Bras D" unit="cm" value={data.rightArm} onChange={(v) => updateField('rightArm', v)} placeholder="" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Hanches" unit="cm" value={data.hips} onChange={(v) => updateField('hips', v)} placeholder="" />
                <MeasureInput label="Fesses" unit="cm" value={data.glutes} onChange={(v) => updateField('glutes', v)} placeholder="" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Cuisse G" unit="cm" value={data.leftThigh} onChange={(v) => updateField('leftThigh', v)} placeholder="" />
                <MeasureInput label="Cuisse D" unit="cm" value={data.rightThigh} onChange={(v) => updateField('rightThigh', v)} placeholder="" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Mollet G" unit="cm" value={data.leftCalf} onChange={(v) => updateField('leftCalf', v)} placeholder="" />
                <MeasureInput label="Mollet D" unit="cm" value={data.rightCalf} onChange={(v) => updateField('rightCalf', v)} placeholder="" />
              </Stack>
            </Stack>
          </Collapse>

          {/* Notes */}
          <TextField
            label="Notes"
            multiline
            rows={2}
            value={data.notes || ''}
            onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optionnel"
            fullWidth
            size="small"
          />
        </Stack>
      </Box>
    </Box>
  );
}

// =========================================================
// MeasureInput
// =========================================================
function MeasureInput({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || '0'}
      fullWidth
      InputProps={{
        endAdornment: <Typography color="text.secondary">{unit}</Typography>,
        inputProps: { step: '0.1' },
      }}
    />
  );
}
