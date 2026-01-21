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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import Collapse from '@mui/material/Collapse';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Add from '@mui/icons-material/Add';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Close from '@mui/icons-material/Close';

type TabValue = 'overview' | 'history' | 'photos';

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [latest, setLatest] = useState<MeasurementData | null>(null);
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

  const handleTabChange = (tab: TabValue) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            component={Link}
            href="/"
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Mensurations
          </Typography>
          <Box sx={{ width: 32 }} /> {/* Spacer for centering */}
        </Stack>
      </Box>

      {/* Tabs - text style */}
      <Box sx={{ px: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="center" spacing={3}>
          {([
            { key: 'overview', label: 'Aperçu' },
            { key: 'history', label: 'Historique' },
            { key: 'photos', label: 'Photos' },
          ] as const).map((tab) => (
            <Typography
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'text.primary' : 'text.disabled',
                transition: 'all 0.15s ease',
                '&:active': { opacity: 0.5 },
              }}
            >
              {tab.label}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2, pb: 12 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab latest={latest} summary={summary} />}
            {activeTab === 'history' && <HistoryTab measurements={measurements} onDelete={handleDeleteMeasurement} />}
            {activeTab === 'photos' && <PhotosTab photos={photos} onRefresh={loadData} />}
          </>
        )}
      </Box>

      {/* Add Button - minimal style */}
      <Fab
        onClick={() => {
          triggerHaptic('light');
          setShowAddForm(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          border: 1,
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'background.paper',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
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

// Overview Tab
function OverviewTab({
  latest,
  summary,
}: {
  latest: MeasurementData | null;
  summary: Awaited<ReturnType<typeof getProgressSummary>> | null;
}) {
  if (!latest) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>📏</Typography>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Aucune mesure</Typography>
        <Typography color="text.secondary">Ajoute ta première mesure pour suivre ta progression</Typography>
      </Box>
    );
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatChange = (value: number | null, unit: string, inverse = false) => {
    if (value === null) return null;
    const isPositive = inverse ? value < 0 : value > 0;
    const sign = value > 0 ? '+' : '';
    return (
      <Typography
        component="span"
        color={isPositive ? 'success.main' : value < 0 ? 'error.main' : 'text.secondary'}
      >
        {sign}{value.toFixed(1)}{unit}
      </Typography>
    );
  };

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        Dernière mesure : {formatDate(latest.measuredAt)}
      </Typography>

      {/* Progress Summary */}
      {summary && summary.totalMeasurements >= 2 && (
        <Card
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(103,80,164,0.2) 0%, rgba(63,81,181,0.15) 100%)'
              : 'linear-gradient(135deg, rgba(103,80,164,0.15) 0%, rgba(63,81,181,0.1) 100%)',
            border: 1,
            borderColor: 'primary.main',
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Progression ({summary.daysSinceFirst} jours)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {summary.weightChange !== null && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Poids</Typography>
                  <Typography variant="body1" fontWeight={500}>{formatChange(summary.weightChange, 'kg', true)}</Typography>
                </Box>
              )}
              {summary.waistChange !== null && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Tour de taille</Typography>
                  <Typography variant="body1" fontWeight={500}>{formatChange(summary.waistChange, 'cm', true)}</Typography>
                </Box>
              )}
              {summary.chestChange !== null && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Poitrine</Typography>
                  <Typography variant="body1" fontWeight={500}>{formatChange(summary.chestChange, 'cm')}</Typography>
                </Box>
              )}
              {summary.armChange !== null && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Bras (moy.)</Typography>
                  <Typography variant="body1" fontWeight={500}>{formatChange(summary.armChange, 'cm')}</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Current Stats */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Mesures actuelles</Typography>

        {/* Weight & Body Fat */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2 }}>
          <MeasureCard label="Poids" value={latest.weight} unit="kg" icon="⚖️" />
          <MeasureCard label="Masse grasse" value={latest.bodyFatPercentage} unit="%" icon="📊" />
        </Box>

        {/* Upper Body */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Haut du corps</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              <MiniMeasure label="Cou" value={latest.neck} />
              <MiniMeasure label="Épaules" value={latest.shoulders} />
              <MiniMeasure label="Poitrine" value={latest.chest} />
              <MiniMeasure label="Bras G" value={latest.leftArm} />
              <MiniMeasure label="Bras D" value={latest.rightArm} />
              <MiniMeasure label="Av-bras G" value={latest.leftForearm} />
              <MiniMeasure label="Av-bras D" value={latest.rightForearm} />
              <MiniMeasure label="Taille" value={latest.waist} />
              <MiniMeasure label="Hanches" value={latest.hips} />
            </Box>
          </CardContent>
        </Card>

        {/* Lower Body */}
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Bas du corps</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <MiniMeasure label="Cuisse G" value={latest.leftThigh} />
              <MiniMeasure label="Cuisse D" value={latest.rightThigh} />
              <MiniMeasure label="Mollet G" value={latest.leftCalf} />
              <MiniMeasure label="Mollet D" value={latest.rightCalf} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Weight Chart */}
      {summary && summary.totalMeasurements >= 2 && <WeightChart />}
    </Stack>
  );
}

function MeasureCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string | null;
  unit: string;
  icon: string;
}) {
  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6">{icon}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Stack>
        <Typography variant="h5" fontWeight={700}>
          {value ? `${value}${unit}` : '--'}
        </Typography>
      </CardContent>
    </Card>
  );
}

function MiniMeasure({ label, value }: { label: string; value: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ? `${value}cm` : '--'}</Typography>
    </Box>
  );
}

// Weight Chart
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
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Évolution du poids</Typography>
        <Stack direction="row" spacing={0.5} sx={{ height: 128, alignItems: 'flex-end' }}>
          {data.map((point, i) => {
            const height = ((point.value - min) / range) * 100;
            return (
              <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'primary.main',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    height: `${height}%`,
                    transition: 'height 0.3s ease',
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {point.date.split('-')[2]}
                </Typography>
              </Box>
            );
          })}
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">{min.toFixed(1)}kg</Typography>
          <Typography variant="caption" color="text.secondary">{max.toFixed(1)}kg</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

// History Tab
function HistoryTab({
  measurements,
  onDelete,
}: {
  measurements: MeasurementData[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (measurements.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
        Aucun historique
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {measurements.map((m) => {
        const date = new Date(m.measuredAt);
        const isExpanded = expanded === m.id;

        return (
          <Card key={m.id}>
            <CardActionArea
              onClick={() => setExpanded(isExpanded ? null : m.id)}
              sx={{ p: 2 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {m.weight ? `${m.weight}kg` : ''}{' '}
                    {m.chest ? `• Poitrine ${m.chest}cm` : ''}
                  </Typography>
                </Box>
                <ExpandMore
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: 'text.secondary',
                  }}
                />
              </Stack>
            </CardActionArea>

            <Collapse in={isExpanded}>
              <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                  <MiniMeasure label="Poids" value={m.weight} />
                  <MiniMeasure label="% Gras" value={m.bodyFatPercentage} />
                  <MiniMeasure label="Cou" value={m.neck} />
                  <MiniMeasure label="Épaules" value={m.shoulders} />
                  <MiniMeasure label="Poitrine" value={m.chest} />
                  <MiniMeasure label="Taille" value={m.waist} />
                  <MiniMeasure label="Hanches" value={m.hips} />
                  <MiniMeasure label="Bras G" value={m.leftArm} />
                  <MiniMeasure label="Bras D" value={m.rightArm} />
                  <MiniMeasure label="Cuisse G" value={m.leftThigh} />
                  <MiniMeasure label="Cuisse D" value={m.rightThigh} />
                  <MiniMeasure label="Mollet G" value={m.leftCalf} />
                </Box>
                {m.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {m.notes}
                  </Typography>
                )}
                <Button
                  size="small"
                  color="error"
                  onClick={() => onDelete(m.id)}
                >
                  Supprimer
                </Button>
              </Box>
            </Collapse>
          </Card>
        );
      })}
    </Stack>
  );
}

// Photos Tab
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
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>📸</Typography>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Aucune photo</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Prends des photos pour suivre ta transformation
        </Typography>
        <Box
          onClick={() => {
            triggerHaptic('light');
            setShowUpload(true);
          }}
          sx={{
            py: 1.5,
            px: 4,
            textAlign: 'center',
            bgcolor: 'text.primary',
            color: 'background.default',
            borderRadius: 2,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-block',
            '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
          }}
        >
          Ajouter une photo
        </Box>
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
    <Stack spacing={3}>
      <Box
        onClick={() => {
          triggerHaptic('light');
          setShowUpload(true);
        }}
        sx={{
          py: 2,
          textAlign: 'center',
          border: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 2,
          color: 'text.secondary',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          '&:active': { bgcolor: 'action.hover' },
        }}
      >
        <Add sx={{ fontSize: 20 }} />
        Ajouter une photo
      </Box>

      {Object.entries(photosByDate).map(([date, datePhotos]) => (
        <Box key={date}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{date}</Typography>
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
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    textTransform: 'capitalize',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {showUpload && (
        <PhotoUploadModal
          onClose={() => setShowUpload(false)}
          onUpload={onRefresh}
        />
      )}
    </Stack>
  );
}

// Photo Upload Modal
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!previewUrl) return;
    setIsUploading(true);

    try {
      const { addProgressPhoto } = await import('./actions');
      await addProgressPhoto(previewUrl, photoType);
      onUpload();
      onClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'background.default',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <Close sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Ajouter une photo
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Photo Type Selection - text style */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 1.5, display: 'block', textAlign: 'center' }}>
            Type de photo
          </Typography>
          <Stack direction="row" justifyContent="center" spacing={3}>
            {([
              { key: 'front', label: 'Face' },
              { key: 'back', label: 'Dos' },
              { key: 'side_left', label: 'Côté G' },
              { key: 'side_right', label: 'Côté D' },
            ] as const).map((type) => (
              <Typography
                key={type.key}
                onClick={() => {
                  triggerHaptic('light');
                  setPhotoType(type.key);
                }}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: photoType === type.key ? 600 : 400,
                  color: photoType === type.key ? 'text.primary' : 'text.disabled',
                  transition: 'all 0.15s ease',
                  '&:active': { opacity: 0.5 },
                }}
              >
                {type.label}
              </Typography>
            ))}
          </Stack>
        </Box>

        {/* Preview / Upload Area */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewUrl ? (
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '3/4' }}>
              <Box
                component="img"
                src={previewUrl}
                alt="Preview"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
              />
              <IconButton
                onClick={() => setPreviewUrl(null)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          ) : (
            <Box
              component="label"
              sx={{
                width: '100%',
                maxWidth: 280,
                aspectRatio: '3/4',
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Typography variant="h2" sx={{ mb: 1 }}>📷</Typography>
              <Typography color="text.secondary">Touche pour choisir</Typography>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </Box>
          )}
        </Box>

        {/* Submit Button - minimal */}
        {previewUrl && (
          <Box
            onClick={handleSubmit}
            sx={{
              mt: 2,
              py: 1.5,
              textAlign: 'center',
              bgcolor: isUploading ? 'action.disabled' : 'text.primary',
              color: 'background.default',
              borderRadius: 2,
              fontWeight: 600,
              cursor: isUploading ? 'default' : 'pointer',
              '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
            }}
          >
            {isUploading ? 'Enregistrement...' : 'Enregistrer'}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Add Measurement Form - Minimalist single scroll
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
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'background.default',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            onClick={onClose}
            sx={{ cursor: 'pointer', color: 'text.secondary', '&:active': { opacity: 0.5 } }}
          >
            Annuler
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Nouvelle mesure
          </Typography>
          <Typography
            onClick={handleSubmit}
            sx={{
              cursor: isSubmitting || !data.weight ? 'default' : 'pointer',
              fontWeight: 600,
              color: isSubmitting || !data.weight ? 'text.disabled' : 'primary.main',
              '&:active': { opacity: 0.5 },
            }}
          >
            {isSubmitting ? '...' : 'OK'}
          </Typography>
        </Stack>
      </Box>

      {/* Content - single scroll */}
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

          {/* Calculator - collapsible */}
          <Box
            onClick={() => {
              triggerHaptic('light');
              setShowCalculator(!showCalculator);
            }}
            sx={{
              py: 1,
              color: 'text.secondary',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:active': { opacity: 0.5 },
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
                      <Box
                        key={g}
                        onClick={() => { setIsMale(g === 'Homme'); setCalculatedBf(null); }}
                        sx={{
                          flex: 1, py: 0.75, textAlign: 'center', borderRadius: 1,
                          fontSize: '0.85rem', cursor: 'pointer', border: 1,
                          fontWeight: (g === 'Homme' ? isMale : !isMale) ? 600 : 400,
                          bgcolor: (g === 'Homme' ? isMale : !isMale) ? 'primary.main' : 'transparent',
                          color: (g === 'Homme' ? isMale : !isMale) ? 'primary.contrastText' : 'text.secondary',
                          borderColor: (g === 'Homme' ? isMale : !isMale) ? 'primary.main' : 'divider',
                        }}
                      >
                        {g}
                      </Box>
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

                  <Box
                    onClick={canCalculate ? calculateNavyBodyFat : undefined}
                    sx={{
                      py: 1.5, textAlign: 'center', borderRadius: 1,
                      fontWeight: 600, cursor: canCalculate ? 'pointer' : 'default',
                      bgcolor: canCalculate ? 'text.primary' : 'action.disabled',
                      color: 'background.default',
                      '&:active': canCalculate ? { opacity: 0.8 } : {},
                    }}
                  >
                    {calculatedBf !== null ? `${calculatedBf}% - Appliqué ✓` : 'Calculer'}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Collapse>

          {/* More measurements - collapsible */}
          <Box
            onClick={() => {
              triggerHaptic('light');
              setShowMore(!showMore);
            }}
            sx={{
              py: 1,
              color: 'text.secondary',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:active': { opacity: 0.5 },
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

