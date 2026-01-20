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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import Collapse from '@mui/material/Collapse';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Add from '@mui/icons-material/Add';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Close from '@mui/icons-material/Close';

type TabValue = 'overview' | 'history' | 'photos';

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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton component={Link} href="/" size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>Mensurations</Typography>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v as TabValue)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Tab label="Aperçu" value="overview" />
        <Tab label="Historique" value="history" />
        <Tab label="Photos" value="photos" />
      </Tabs>

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

      {/* Add Button */}
      <Fab
        color="primary"
        onClick={() => setShowAddForm(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
        }}
      >
        <Add />
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
        <Button
          variant="contained"
          onClick={() => setShowUpload(true)}
          sx={{ background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)' }}
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
    <Stack spacing={3}>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setShowUpload(true)}
        sx={{ py: 1.5, borderStyle: 'dashed' }}
        startIcon={<Add />}
      >
        Ajouter une photo
      </Button>

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
      <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>Ajouter une photo</Typography>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Photo Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Type de photo</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {(['front', 'back', 'side_left', 'side_right'] as const).map((type) => (
              <Chip
                key={type}
                label={type === 'front' ? 'Face' : type === 'back' ? 'Dos' : type === 'side_left' ? 'Côté G' : 'Côté D'}
                onClick={() => setPhotoType(type)}
                color={photoType === type ? 'primary' : 'default'}
                variant={photoType === type ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
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

        {/* Submit Button */}
        {previewUrl && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isUploading}
            sx={{
              mt: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            }}
          >
            {isUploading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

// Add Measurement Form
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
  const [activeSection, setActiveSection] = useState<'essential' | 'upper' | 'lower'>('essential');

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
      <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>Nouvelle mesure</Typography>
          </Stack>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={isSubmitting || !data.weight}
            sx={{ background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)' }}
          >
            {isSubmitting ? '...' : 'Enregistrer'}
          </Button>
        </Stack>
      </Paper>

      {/* Section Tabs */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1}>
          {(['essential', 'upper', 'lower'] as const).map((section) => (
            <Chip
              key={section}
              label={section === 'essential' ? 'Essentiel' : section === 'upper' ? 'Haut' : 'Bas'}
              onClick={() => setActiveSection(section)}
              color={activeSection === section ? 'primary' : 'default'}
              variant={activeSection === section ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeSection === 'essential' && (
          <Stack spacing={2}>
            <MeasureInput
              label="Poids"
              unit="kg"
              value={data.weight}
              onChange={(v) => updateField('weight', v)}
              placeholder={lastMeasurement?.weight || ''}
            />
            <MeasureInput
              label="Masse grasse"
              unit="%"
              value={data.bodyFatPercentage}
              onChange={(v) => updateField('bodyFatPercentage', v)}
              placeholder={lastMeasurement?.bodyFatPercentage || ''}
            />
            <MeasureInput
              label="Tour de taille"
              unit="cm"
              value={data.waist}
              onChange={(v) => updateField('waist', v)}
              placeholder={lastMeasurement?.waist || ''}
            />
            <MeasureInput
              label="Tour de poitrine"
              unit="cm"
              value={data.chest}
              onChange={(v) => updateField('chest', v)}
              placeholder={lastMeasurement?.chest || ''}
            />
          </Stack>
        )}

        {activeSection === 'upper' && (
          <Stack spacing={2}>
            <MeasureInput
              label="Cou"
              unit="cm"
              value={data.neck}
              onChange={(v) => updateField('neck', v)}
              placeholder={lastMeasurement?.neck || ''}
            />
            <MeasureInput
              label="Épaules"
              unit="cm"
              value={data.shoulders}
              onChange={(v) => updateField('shoulders', v)}
              placeholder={lastMeasurement?.shoulders || ''}
            />
            <MeasureInput
              label="Hanches"
              unit="cm"
              value={data.hips}
              onChange={(v) => updateField('hips', v)}
              placeholder={lastMeasurement?.hips || ''}
            />
            <Stack direction="row" spacing={2}>
              <MeasureInput
                label="Bras gauche"
                unit="cm"
                value={data.leftArm}
                onChange={(v) => updateField('leftArm', v)}
                placeholder={lastMeasurement?.leftArm || ''}
              />
              <MeasureInput
                label="Bras droit"
                unit="cm"
                value={data.rightArm}
                onChange={(v) => updateField('rightArm', v)}
                placeholder={lastMeasurement?.rightArm || ''}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <MeasureInput
                label="Avant-bras G"
                unit="cm"
                value={data.leftForearm}
                onChange={(v) => updateField('leftForearm', v)}
                placeholder={lastMeasurement?.leftForearm || ''}
              />
              <MeasureInput
                label="Avant-bras D"
                unit="cm"
                value={data.rightForearm}
                onChange={(v) => updateField('rightForearm', v)}
                placeholder={lastMeasurement?.rightForearm || ''}
              />
            </Stack>
          </Stack>
        )}

        {activeSection === 'lower' && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <MeasureInput
                label="Cuisse gauche"
                unit="cm"
                value={data.leftThigh}
                onChange={(v) => updateField('leftThigh', v)}
                placeholder={lastMeasurement?.leftThigh || ''}
              />
              <MeasureInput
                label="Cuisse droite"
                unit="cm"
                value={data.rightThigh}
                onChange={(v) => updateField('rightThigh', v)}
                placeholder={lastMeasurement?.rightThigh || ''}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <MeasureInput
                label="Mollet gauche"
                unit="cm"
                value={data.leftCalf}
                onChange={(v) => updateField('leftCalf', v)}
                placeholder={lastMeasurement?.leftCalf || ''}
              />
              <MeasureInput
                label="Mollet droit"
                unit="cm"
                value={data.rightCalf}
                onChange={(v) => updateField('rightCalf', v)}
                placeholder={lastMeasurement?.rightCalf || ''}
              />
            </Stack>
          </Stack>
        )}

        {/* Notes */}
        <TextField
          label="Notes (optionnel)"
          multiline
          rows={3}
          value={data.notes || ''}
          onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Comment tu te sens ?"
          fullWidth
          sx={{ mt: 3 }}
        />
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
