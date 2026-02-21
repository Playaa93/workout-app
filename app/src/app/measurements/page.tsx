'use client';

import { useState, useEffect } from 'react';
import {
  getMeasurements,
  getLatestMeasurement,
  getProgressSummary,
  getProgressPhotos,
  addMeasurement,
  updateMeasurement,
  deleteMeasurement,
  deletePhoto,
  updatePhotoType,
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
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FileDownload from '@mui/icons-material/FileDownload';
import TableChart from '@mui/icons-material/TableChart';
import DataObject from '@mui/icons-material/DataObject';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BottomNav from '@/components/BottomNav';

// Format decimal: remove trailing zeros (110.00 → 110, 34.20 → 34.2, 82.75 → 82.75)
const fmt = (val: string | null | undefined): string => {
  if (!val) return '--';
  return parseFloat(val).toString();
};

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
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementData | null>(null);
  const [showExport, setShowExport] = useState(false);

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

  const handleUpdateMeasurement = async (data: MeasurementInput) => {
    if (!editingMeasurement) return;
    await updateMeasurement(editingMeasurement.id, data);
    await loadData();
    setEditingMeasurement(null);
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
            onClick={() => { triggerHaptic('light'); setShowExport(true); }}
            disabled={measurements.length === 0}
          >
            <FileDownload fontSize="small" />
          </IconButton>
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
                onAddMeasurement={() => { triggerHaptic('light'); setShowAddForm(true); }}
                onEditLatest={() => { if (latest) { triggerHaptic('light'); setEditingMeasurement(latest); } }}
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

      {/* Edit Form Modal */}
      {editingMeasurement && (
        <AddMeasurementForm
          lastMeasurement={null}
          editingMeasurement={editingMeasurement}
          onSubmit={handleUpdateMeasurement}
          onClose={() => setEditingMeasurement(null)}
        />
      )}

      {/* Export Drawer */}
      <ExportDrawer
        open={showExport}
        onClose={() => setShowExport(false)}
        measurements={measurements}
      />
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
  onAddMeasurement,
  onEditLatest,
}: {
  latest: MeasurementData | null;
  previous: MeasurementData | null;
  summary: Awaited<ReturnType<typeof getProgressSummary>> | null;
  onGoToPhotos: () => void;
  onGoToHistory: () => void;
  onAddMeasurement: () => void;
  onEditLatest: () => void;
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
          onClick={onAddMeasurement}
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
    { label: 'Fesses', field: 'glutes' },
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
          <CardActionArea onClick={onEditLatest}>
            <CardContent sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Poids actuel
              </Typography>
              <Typography variant="h2" fontWeight={800} sx={{ my: 1, lineHeight: 1 }}>
                {fmt(latest.weight)}
                <Typography component="span" variant="h5" color="text.secondary" fontWeight={400}> kg</Typography>
              </Typography>
              {weightChange !== null && (
                <TrendBadge value={weightChange} unit=" kg" inverse />
              )}
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                {formattedDate} · Toucher pour modifier
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Sparkline / Weight Chart */}
        {summary && summary.totalMeasurements >= 2 && <WeightChart />}

        {/* Body composition - 2 cards */}
        <Stack direction="row" spacing={1.5}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Masse grasse</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>
                {latest.bodyFatPercentage ? `${fmt(latest.bodyFatPercentage)}%` : '--'}
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
                {latest.waist ? `${fmt(latest.waist)} cm` : '--'}
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
        {fmt(value)} {unit}
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
            { label: 'Poids', value: m.weight ? `${fmt(m.weight)} kg` : null },
            { label: '% Gras', value: m.bodyFatPercentage ? `${fmt(m.bodyFatPercentage)}%` : null },
            { label: 'Cou', value: m.neck ? `${fmt(m.neck)} cm` : null },
            { label: 'Épaules', value: m.shoulders ? `${fmt(m.shoulders)} cm` : null },
            { label: 'Poitrine', value: m.chest ? `${fmt(m.chest)} cm` : null },
            { label: 'Taille', value: m.waist ? `${fmt(m.waist)} cm` : null },
            { label: 'Hanches', value: m.hips ? `${fmt(m.hips)} cm` : null },
            { label: 'Bras G', value: m.leftArm ? `${fmt(m.leftArm)} cm` : null },
            { label: 'Bras D', value: m.rightArm ? `${fmt(m.rightArm)} cm` : null },
            { label: 'Cuisse G', value: m.leftThigh ? `${fmt(m.leftThigh)} cm` : null },
            { label: 'Cuisse D', value: m.rightThigh ? `${fmt(m.rightThigh)} cm` : null },
            { label: 'Mollet G', value: m.leftCalf ? `${fmt(m.leftCalf)} cm` : null },
            { label: 'Mollet D', value: m.rightCalf ? `${fmt(m.rightCalf)} cm` : null },
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
                      {m.weight ? `${fmt(m.weight)} kg` : ''}{m.waist ? ` · Taille ${fmt(m.waist)} cm` : ''}
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
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(false);

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    await deletePhoto(selectedPhoto.id);
    setDeleteDialogOpen(false);
    setSelectedPhoto(null);
    onRefresh();
  };

  const handleChangeType = async (newType: 'front' | 'back' | 'side_left' | 'side_right') => {
    if (!selectedPhoto) return;
    await updatePhotoType(selectedPhoto.id, newType);
    setEditingType(false);
    setSelectedPhoto(null);
    onRefresh();
  };

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
                  onClick={() => { triggerHaptic('light'); setSelectedPhoto(photo); }}
                  sx={{
                    aspectRatio: '3/4',
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
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

      {/* Photo actions drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={!!selectedPhoto && !editingType}
        onClose={() => setSelectedPhoto(null)}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
        </Box>
        {selectedPhoto && (
          <Box sx={{ px: 1, pb: 2 }}>
            <Stack direction="row" spacing={2} sx={{ px: 1.5, pb: 1.5 }} alignItems="center">
              <Box sx={{
                width: 56, height: 75, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0,
              }}>
                <Box
                  component="img"
                  src={selectedPhoto.photoUrl}
                  alt={selectedPhoto.photoType}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {selectedPhoto.photoType.replace('_', ' ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedPhoto.takenAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Stack>

            <ListItemButton
              onClick={() => setEditingType(true)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Edit sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Changer le type de pose"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Delete sx={{ color: '#f44336' }} />
              </ListItemIcon>
              <ListItemText
                primary="Supprimer la photo"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: '#f44336' }}
              />
            </ListItemButton>
          </Box>
        )}
      </SwipeableDrawer>

      {/* Change type drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={editingType}
        onClose={() => { setEditingType(false); setSelectedPhoto(null); }}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
        </Box>
        <Box sx={{ px: 1.5, pb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 0.5, pb: 1.5 }}>
            Type de pose
          </Typography>
          {([
            { key: 'front', label: 'Face' },
            { key: 'back', label: 'Dos' },
            { key: 'side_left', label: 'Côté gauche' },
            { key: 'side_right', label: 'Côté droit' },
          ] as const).map((type) => (
            <ListItemButton
              key={type.key}
              onClick={() => handleChangeType(type.key)}
              selected={selectedPhoto?.photoType === type.key}
              sx={{ borderRadius: 2 }}
            >
              <ListItemText
                primary={type.label}
                primaryTypographyProps={{
                  fontWeight: selectedPhoto?.photoType === type.key ? 700 : 500,
                  fontSize: '0.9rem',
                }}
              />
              {selectedPhoto?.photoType === type.key && (
                <Typography variant="caption" color="primary">actuel</Typography>
              )}
            </ListItemButton>
          ))}
        </Box>
      </SwipeableDrawer>

      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedPhoto(null); }}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Supprimer la photo ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedPhoto(null); }} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleDeletePhoto} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
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
  editingMeasurement,
  onSubmit,
  onClose,
}: {
  lastMeasurement: MeasurementData | null;
  editingMeasurement?: MeasurementData | null;
  onSubmit: (data: MeasurementInput) => void;
  onClose: () => void;
}) {
  const isEditing = !!editingMeasurement;
  const source = editingMeasurement || lastMeasurement;

  const parseField = (val: string | null | undefined): number | undefined =>
    val ? parseFloat(val) : undefined;

  const [data, setData] = useState<MeasurementInput>(
    isEditing && editingMeasurement
      ? {
          height: parseField(editingMeasurement.height),
          weight: parseField(editingMeasurement.weight),
          bodyFatPercentage: parseField(editingMeasurement.bodyFatPercentage),
          neck: parseField(editingMeasurement.neck),
          shoulders: parseField(editingMeasurement.shoulders),
          chest: parseField(editingMeasurement.chest),
          leftArm: parseField(editingMeasurement.leftArm),
          rightArm: parseField(editingMeasurement.rightArm),
          leftForearm: parseField(editingMeasurement.leftForearm),
          rightForearm: parseField(editingMeasurement.rightForearm),
          waist: parseField(editingMeasurement.waist),
          abdomen: parseField(editingMeasurement.abdomen),
          hips: parseField(editingMeasurement.hips),
          glutes: parseField(editingMeasurement.glutes),
          leftThigh: parseField(editingMeasurement.leftThigh),
          rightThigh: parseField(editingMeasurement.rightThigh),
          leftCalf: parseField(editingMeasurement.leftCalf),
          rightCalf: parseField(editingMeasurement.rightCalf),
          wrist: parseField(editingMeasurement.wrist),
          ankle: parseField(editingMeasurement.ankle),
          notes: editingMeasurement.notes || undefined,
        }
      : {
          weight: lastMeasurement?.weight ? parseFloat(lastMeasurement.weight) : undefined,
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasExtraFields = isEditing && !!(data.neck || data.shoulders || data.leftArm || data.rightArm || data.hips || data.glutes || data.leftThigh || data.rightThigh || data.leftCalf || data.rightCalf);
  const [showMore, setShowMore] = useState(hasExtraFields);
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
            {isEditing ? 'Modifier la mesure' : 'Nouvelle mesure'}
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
          <Stack direction="row" spacing={2}>
            <MeasureInput
              label="Poids"
              unit="kg"
              value={data.weight}
              onChange={(v) => updateField('weight', v)}
              placeholder={lastMeasurement?.weight || '80'}
              tip="Le matin au réveil, après les toilettes, avant de manger. Toujours dans les mêmes conditions."
            />
            <MeasureInput
              label="Taille"
              unit="cm"
              value={data.height}
              onChange={(v) => updateField('height', v)}
              placeholder={lastMeasurement?.height || '175'}
              tip="Pieds nus, le matin (on est plus grand le matin qu'en fin de journée). Dos droit contre un mur."
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <MeasureInput
              label="Tour de taille"
              unit="cm"
              value={data.waist}
              onChange={(v) => updateField('waist', v)}
              placeholder={lastMeasurement?.waist || ''}
              tip="Au niveau du nombril, debout détendu. Ne pas rentrer le ventre. Mesurer après une expiration normale."
            />
            <MeasureInput
              label="Poitrine"
              unit="cm"
              value={data.chest}
              onChange={(v) => updateField('chest', v)}
              placeholder={lastMeasurement?.chest || ''}
              tip="Au niveau des tétons, bras le long du corps. Ruban horizontal, ne pas gonfler la poitrine."
            />
          </Stack>

          <MeasureInput
            label="Masse grasse"
            unit="%"
            value={data.bodyFatPercentage}
            onChange={(v) => updateField('bodyFatPercentage', v)}
            placeholder={lastMeasurement?.bodyFatPercentage || ''}
            tip="Utilise une balance impédancemètre ou le calculateur Navy ci-dessous. Mesure le matin à jeun pour plus de fiabilité."
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
                <MeasureInput label="Cou" unit="cm" value={data.neck} onChange={(v) => updateField('neck', v)} placeholder=""
                  tip="Au milieu du cou, sous la pomme d'Adam. Ruban bien horizontal, ne pas serrer." />
                <MeasureInput label="Épaules" unit="cm" value={data.shoulders} onChange={(v) => updateField('shoulders', v)} placeholder=""
                  tip="Au point le plus large des épaules (deltoïdes). Bras détendus le long du corps. Demande de l'aide pour bien placer le ruban." />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Bras G" unit="cm" value={data.leftArm} onChange={(v) => updateField('leftArm', v)} placeholder=""
                  tip="Au point le plus épais du biceps, bras fléchi à 90° et contracté. Toujours mesurer au même degré de contraction." />
                <MeasureInput label="Bras D" unit="cm" value={data.rightArm} onChange={(v) => updateField('rightArm', v)} placeholder=""
                  tip="Au point le plus épais du biceps, bras fléchi à 90° et contracté. Toujours mesurer au même degré de contraction." />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Av-bras G" unit="cm" value={data.leftForearm} onChange={(v) => updateField('leftForearm', v)} placeholder=""
                  tip="Au point le plus large de l'avant-bras, environ 3 cm sous le coude. Bras tendu, poing fermé sans serrer." />
                <MeasureInput label="Av-bras D" unit="cm" value={data.rightForearm} onChange={(v) => updateField('rightForearm', v)} placeholder=""
                  tip="Au point le plus large de l'avant-bras, environ 3 cm sous le coude. Bras tendu, poing fermé sans serrer." />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Hanches" unit="cm" value={data.hips} onChange={(v) => updateField('hips', v)} placeholder=""
                  tip="Au niveau des os de la hanche (crête iliaque). Ruban bien horizontal." />
                <MeasureInput label="Fesses" unit="cm" value={data.glutes} onChange={(v) => updateField('glutes', v)} placeholder=""
                  tip="Au point le plus large des fessiers, pieds joints. Ruban horizontal, sans comprimer." />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Cuisse G" unit="cm" value={data.leftThigh} onChange={(v) => updateField('leftThigh', v)} placeholder=""
                  tip="Au point le plus épais de la cuisse, environ 15 cm sous le pli de l'aine. Debout, poids réparti sur les deux pieds." />
                <MeasureInput label="Cuisse D" unit="cm" value={data.rightThigh} onChange={(v) => updateField('rightThigh', v)} placeholder=""
                  tip="Au point le plus épais de la cuisse, environ 15 cm sous le pli de l'aine. Debout, poids réparti sur les deux pieds." />
              </Stack>
              <Stack direction="row" spacing={2}>
                <MeasureInput label="Mollet G" unit="cm" value={data.leftCalf} onChange={(v) => updateField('leftCalf', v)} placeholder=""
                  tip="Au point le plus large du mollet. Debout, poids réparti sur les deux pieds, jambe détendue." />
                <MeasureInput label="Mollet D" unit="cm" value={data.rightCalf} onChange={(v) => updateField('rightCalf', v)} placeholder=""
                  tip="Au point le plus large du mollet. Debout, poids réparti sur les deux pieds, jambe détendue." />
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
// Export Drawer
// =========================================================
const EXPORT_FIELDS: { key: keyof MeasurementData; label: string; unit: string }[] = [
  { key: 'height', label: 'Taille', unit: 'cm' },
  { key: 'weight', label: 'Poids', unit: 'kg' },
  { key: 'bodyFatPercentage', label: 'Masse grasse', unit: '%' },
  { key: 'neck', label: 'Cou', unit: 'cm' },
  { key: 'shoulders', label: 'Épaules', unit: 'cm' },
  { key: 'chest', label: 'Poitrine', unit: 'cm' },
  { key: 'waist', label: 'Tour de taille', unit: 'cm' },
  { key: 'hips', label: 'Hanches', unit: 'cm' },
  { key: 'glutes', label: 'Fesses', unit: 'cm' },
  { key: 'leftArm', label: 'Bras G', unit: 'cm' },
  { key: 'rightArm', label: 'Bras D', unit: 'cm' },
  { key: 'leftForearm', label: 'Avant-bras G', unit: 'cm' },
  { key: 'rightForearm', label: 'Avant-bras D', unit: 'cm' },
  { key: 'leftThigh', label: 'Cuisse G', unit: 'cm' },
  { key: 'rightThigh', label: 'Cuisse D', unit: 'cm' },
  { key: 'leftCalf', label: 'Mollet G', unit: 'cm' },
  { key: 'rightCalf', label: 'Mollet D', unit: 'cm' },
  { key: 'notes', label: 'Notes', unit: '' },
];

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ExportDrawer({
  open,
  onClose,
  measurements,
}: {
  open: boolean;
  onClose: () => void;
  measurements: MeasurementData[];
}) {
  const exportJSON = () => {
    const data = measurements.map((m) => {
      const row: Record<string, string | number | null> = {
        date: formatDate(m.measuredAt),
      };
      for (const f of EXPORT_FIELDS) {
        const raw = m[f.key] as string | null;
      row[f.label] = raw ? parseFloat(raw) : null;
      }
      return row;
    });
    downloadFile(
      JSON.stringify(data, null, 2),
      `mensurations_${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
    triggerHaptic('medium');
    onClose();
  };

  const exportExcel = () => {
    const sep = ';';
    const headers = ['Date', ...EXPORT_FIELDS.map((f) => f.unit ? `${f.label} (${f.unit})` : f.label)];
    const rows = measurements.map((m) => {
      const cells = [formatDate(m.measuredAt)];
      for (const f of EXPORT_FIELDS) {
        const val = m[f.key] as string | null;
        cells.push(val != null ? fmt(val) : '');
      }
      return cells.join(sep);
    });
    // BOM for Excel UTF-8 detection
    const bom = '\uFEFF';
    const csv = bom + headers.join(sep) + '\n' + rows.join('\n');
    downloadFile(
      csv,
      `mensurations_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8'
    );
    triggerHaptic('medium');
    onClose();
  };

  const exportPDF = () => {
    const usedFields = EXPORT_FIELDS.filter((f) =>
      measurements.some((m) => m[f.key] != null)
    );

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Mensurations</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #6750a4; color: white; padding: 8px 10px; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
  tr:nth-child(even) td { background: #f8f6ff; }
  tr:hover td { background: #ece6ff; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>Mensurations</h1>
<p class="subtitle">${measurements.length} mesure${measurements.length > 1 ? 's' : ''} &middot; Export du ${formatDate(new Date())}</p>
<table>
<thead><tr><th>Date</th>${usedFields.map((f) => `<th>${f.label}${f.unit ? ` (${f.unit})` : ''}</th>`).join('')}</tr></thead>
<tbody>
${measurements.map((m) => `<tr><td>${formatDate(m.measuredAt)}</td>${usedFields.map((f) => { const v = m[f.key] as string | null; return `<td>${v != null ? fmt(v) : '-'}</td>`; }).join('')}</tr>`).join('\n')}
</tbody>
</table>
<p class="footer">Généré depuis l'app Workout</p>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    triggerHaptic('medium');
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
      </Box>
      <Box sx={{ px: 1, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          Exporter les mensurations
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, display: 'block', mb: 1 }}>
          {measurements.length} mesure{measurements.length > 1 ? 's' : ''}
        </Typography>

        <ListItemButton onClick={exportExcel} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <TableChart sx={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText
            primary="Excel / CSV"
            secondary="Fichier .csv compatible Excel, Google Sheets"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </ListItemButton>

        <ListItemButton onClick={exportJSON} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DataObject sx={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText
            primary="JSON"
            secondary="Format brut pour traitement de données"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </ListItemButton>

        <ListItemButton onClick={exportPDF} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PictureAsPdf sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText
            primary="PDF"
            secondary="Tableau imprimable via le navigateur"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </ListItemButton>
      </Box>
    </SwipeableDrawer>
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
  tip,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  tip?: string;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '0'}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {tip && (
                <IconButton
                  size="small"
                  onClick={() => { triggerHaptic('light'); setShowTip(!showTip); }}
                  sx={{ mr: -0.5, p: 0.5 }}
                >
                  <InfoOutlined sx={{ fontSize: 18, color: showTip ? 'primary.main' : 'text.disabled' }} />
                </IconButton>
              )}
              <Typography color="text.secondary">{unit}</Typography>
            </InputAdornment>
          ),
          inputProps: { step: '0.1' },
        }}
      />
      <Collapse in={showTip}>
        <Box sx={{
          mt: 0.5, px: 1.5, py: 1,
          bgcolor: 'rgba(103,80,164,0.08)',
          borderRadius: 1.5,
          borderLeft: '3px solid',
          borderColor: 'primary.main',
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
            {tip}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
