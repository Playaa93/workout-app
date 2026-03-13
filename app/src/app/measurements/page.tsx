'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/powersync/auth-context';
import {
  useMeasurements,
  useLatestMeasurement,
  useMeasurementHistory,
  useProgressPhotos,
  useFirstAndLastMeasurement,
} from '@/powersync/queries/measurement-queries';
import {
  useMeasurementMutations,
  type MeasurementInput,
} from '@/powersync/mutations/measurement-mutations';

// Types matching the camelCase convention used throughout the page
type MeasurementData = {
  id: string;
  measuredAt: string;
  height: string | null;
  weight: string | null;
  bodyFatPercentage: string | null;
  neck: string | null;
  shoulders: string | null;
  chest: string | null;
  leftArm: string | null;
  rightArm: string | null;
  leftForearm: string | null;
  rightForearm: string | null;
  waist: string | null;
  abdomen: string | null;
  hips: string | null;
  glutes: string | null;
  leftThigh: string | null;
  rightThigh: string | null;
  leftCalf: string | null;
  rightCalf: string | null;
  wrist: string | null;
  ankle: string | null;
  notes: string | null;
};

type ProgressPhotoData = {
  id: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  photoType: string;
  takenAt: string;
  measurementId: string | null;
  notes: string | null;
};

// Map SQLite snake_case rows to camelCase
function toMeasurementData(row: Record<string, any>): MeasurementData {
  return {
    id: row.id,
    measuredAt: row.measured_at,
    height: row.height,
    weight: row.weight,
    bodyFatPercentage: row.body_fat_percentage,
    neck: row.neck,
    shoulders: row.shoulders,
    chest: row.chest,
    leftArm: row.left_arm,
    rightArm: row.right_arm,
    leftForearm: row.left_forearm,
    rightForearm: row.right_forearm,
    waist: row.waist,
    abdomen: row.abdomen,
    hips: row.hips,
    glutes: row.glutes,
    leftThigh: row.left_thigh,
    rightThigh: row.right_thigh,
    leftCalf: row.left_calf,
    rightCalf: row.right_calf,
    wrist: row.wrist,
    ankle: row.ankle,
    notes: row.notes,
  };
}

function toPhotoData(row: Record<string, any>): ProgressPhotoData {
  return {
    id: row.id,
    photoUrl: row.photo_url,
    thumbnailUrl: row.thumbnail_url,
    photoType: row.photo_type,
    takenAt: row.taken_at,
    measurementId: row.measurement_id,
    notes: row.notes,
  };
}

type ProgressSummary = {
  firstDate: Date | null;
  latestDate: Date | null;
  weightChange: number | null;
  bodyFatChange: number | null;
  waistChange: number | null;
  chestChange: number | null;
};
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { alpha } from '@mui/material/styles';
import {
  ArrowLeft, Plus, X, CaretDown, TrendDown, TrendUp, Minus,
  Camera, Images, Ruler, Scales, Info, Trash, PencilSimple,
  DownloadSimple, Table, BracketsCurly, FilePdf,
} from '@phosphor-icons/react';
import BottomNav from '@/components/BottomNav';
import { useThemeTokens } from '@/hooks/useDark';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, dialogPaperSx, goldFieldSx, focusRingSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';

// Format decimal: remove trailing zeros (110.00 -> 110, 34.20 -> 34.2, 82.75 -> 82.75)
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
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return <FullScreenLoader />;
  }

  return <MeasurementsContent />;
}

function MeasurementsContent() {
  const { t, d } = useThemeTokens();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementData | null>(null);
  const [showExport, setShowExport] = useState(false);

  // PowerSync reactive queries (auto-update on local DB changes)
  const { data: rawMeasurements, isLoading: loadingMeasurements } = useMeasurements(50);
  const { data: rawLatest } = useLatestMeasurement();
  const { data: rawPhotos } = useProgressPhotos(20);
  const { first: rawFirst, latest: rawLastForSummary } = useFirstAndLastMeasurement();

  const mutations = useMeasurementMutations();

  // Map snake_case rows to camelCase
  const measurements = useMemo(() => rawMeasurements.map(toMeasurementData), [rawMeasurements]);
  const latest = useMemo(() => rawLatest.length > 0 ? toMeasurementData(rawLatest[0]) : null, [rawLatest]);
  const previous = useMemo(() => measurements.length >= 2 ? measurements[1] : null, [measurements]);
  const photos = useMemo(() => rawPhotos.map(toPhotoData), [rawPhotos]);
  const isLoading = loadingMeasurements;

  // Compute progress summary from first and last measurements
  const summary = useMemo<ProgressSummary | null>(() => {
    const first = rawFirst.data.length > 0 ? rawFirst.data[0] : null;
    const last = rawLastForSummary.data.length > 0 ? rawLastForSummary.data[0] : null;
    if (!first || !last) return null;
    const calc = (a: string | null, b: string | null) =>
      a && b ? parseFloat(b) - parseFloat(a) : null;
    return {
      firstDate: first.measured_at ? new Date(first.measured_at) : null,
      latestDate: last.measured_at ? new Date(last.measured_at) : null,
      weightChange: calc(first.weight, last.weight),
      bodyFatChange: calc(first.body_fat_percentage, last.body_fat_percentage),
      waistChange: calc(first.waist, last.waist),
      chestChange: calc(first.chest, last.chest),
    };
  }, [rawFirst.data, rawLastForSummary.data]);

  const handleAddMeasurement = async (data: MeasurementInput) => {
    await mutations.addMeasurement(data);
    setShowAddForm(false);
  };

  const handleUpdateMeasurement = async (data: MeasurementInput) => {
    if (!editingMeasurement) return;
    await mutations.updateMeasurement(editingMeasurement.id, data);
    setEditingMeasurement(null);
  };

  const handleDeleteMeasurement = async (id: string) => {
    await mutations.deleteMeasurement(id);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(t) }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: tc.m(t) }}>
            <ArrowLeft size={20} weight={W} />
          </IconButton>
          <Typography sx={{ flex: 1, fontSize: '1.5rem', fontWeight: 700, color: tc.h(t), letterSpacing: '-0.02em' }}>
            Mensurations
          </Typography>
          <IconButton
            size="small"
            sx={{ color: tc.m(t) }}
            onClick={() => { triggerHaptic('light'); setShowExport(true); }}
            disabled={measurements.length === 0}
          >
            <DownloadSimple size={20} weight={W} />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: tc.m(t) }}
            onClick={() => { triggerHaptic('light'); setActiveTab('photos'); }}
          >
            <Camera size={20} weight={W} />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 2.5, pb: 1.5, pt: 1 }}>
        <Stack direction="row" spacing={1}>
          {([
            { key: 'overview', label: 'Apercu' },
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
                bgcolor: activeTab === tab.key ? GOLD : (d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04)),
                color: activeTab === tab.key ? GOLD_CONTRAST : tc.m(t),
                '&:hover': {
                  bgcolor: activeTab === tab.key ? GOLD : (d ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)),
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
                measurementCount={measurements.length}
                onAddMeasurement={() => { triggerHaptic('light'); setShowAddForm(true); }}
                onEditLatest={() => { if (latest) { triggerHaptic('light'); setEditingMeasurement(latest); } }}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab measurements={measurements} onDelete={handleDeleteMeasurement} />
            )}
            {activeTab === 'photos' && (
              <PhotosTab photos={photos} mutations={mutations} />
            )}
          </>
        )}
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />



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
const TREND_GOOD = '#2d6a4f';
const TREND_BAD = '#e53935';

function TrendBadge({ value, unit, inverse = false }: { value: number; unit: string; inverse?: boolean }) {
  const { t, d } = useThemeTokens();
  const isGood = inverse ? value < 0 : value > 0;
  const color = value === 0 ? tc.m(t) : isGood ? TREND_GOOD : TREND_BAD;
  const Icon = value > 0 ? TrendUp : value < 0 ? TrendDown : Minus;
  const sign = value > 0 ? '+' : '';

  return (
    <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center" sx={{ color }}>
      <Icon size={16} weight={W} />
      <Typography variant="caption" fontWeight={600} sx={{ color: 'inherit', fontSize: '0.7rem' }}>
        {sign}{value.toFixed(1)}{unit}
      </Typography>
    </Stack>
  );
}

// Navy body fat estimation (returns null if missing data)
function estimateNavyBf(m: MeasurementData, isMale = true): number | null {
  const h = m.height ? parseFloat(m.height) : null;
  const n = m.neck ? parseFloat(m.neck) : null;
  const w = m.waist ? parseFloat(m.waist) : null;
  const hp = m.hips ? parseFloat(m.hips) : null;
  if (!h || !n || !w) return null;
  if (isMale) {
    if (w <= n) return null;
    return Math.round((86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76) * 10) / 10;
  }
  if (!hp || (w + hp) <= n) return null;
  return Math.round((163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387) * 10) / 10;
}

// =========================================================
// OVERVIEW TAB - Variant D "Hero + Compact List"
// =========================================================
function OverviewTab({
  latest,
  previous,
  summary,
  measurementCount,
  onAddMeasurement,
  onEditLatest,
}: {
  latest: MeasurementData | null;
  previous: MeasurementData | null;
  summary: ProgressSummary | null;
  measurementCount: number;
  onAddMeasurement: () => void;
  onEditLatest: () => void;
}) {
  const { t, d } = useThemeTokens();
  const [showNavyInfo, setShowNavyInfo] = useState(false);

  if (!latest) {
    return (
      <Box sx={{ px: 2.5, pt: 6, textAlign: 'center' }}>
        <Scales size={64} weight={W} color={tc.f(t)} style={{ marginBottom: 16 }} />
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1, color: tc.h(t) }}>
          Suis ta transformation
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, px: 2, color: tc.m(t) }}>
          Ajoute tes mesures pour voir les changements que le miroir ne montre pas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} weight={W} />}
          onClick={onAddMeasurement}
          sx={{
            px: 4, py: 1.5, borderRadius: 3, fontWeight: 700,
            bgcolor: GOLD, color: GOLD_CONTRAST,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            '&:hover': { bgcolor: GOLD_LIGHT },
          }}
        >
          Premiere mesure
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
    { label: 'Epaules', field: 'shoulders' },
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
        <Box
          sx={card(d, {
            background: `linear-gradient(135deg, ${alpha(GOLD, 0.12)}, ${alpha(GOLD, 0.06)})`,
          })}
        >
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: tc.m(t), fontWeight: 500 }}>
              Poids actuel
            </Typography>
            <Typography sx={{ fontSize: '3rem', fontWeight: 800, my: 1, lineHeight: 1, color: tc.h(t) }}>
              {fmt(latest.weight)}
              <Typography component="span" sx={{ fontSize: '1.25rem', color: tc.m(t), fontWeight: 400 }}> kg</Typography>
            </Typography>
            {weightChange !== null && (
              <TrendBadge value={weightChange} unit=" kg" inverse />
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: tc.f(t) }}>
              {formattedDate}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
              <Box
                component="button"
                onClick={() => { triggerHaptic('light'); onEditLatest(); }}
                sx={{
                  border: 'none', cursor: 'pointer',
                  outline: 'none', '&:focus-visible': focusRingSx,
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  px: 1.5, py: 0.5, borderRadius: 99,
                  bgcolor: alpha(GOLD, 0.1),
                  color: GOLD, fontSize: '0.7rem', fontWeight: 600,
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                <PencilSimple size={13} weight={W} /> Modifier
              </Box>
              <Box
                component="button"
                onClick={() => { triggerHaptic('light'); onAddMeasurement(); }}
                sx={{
                  border: 'none', cursor: 'pointer',
                  outline: 'none', '&:focus-visible': focusRingSx,
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  px: 1.5, py: 0.5, borderRadius: 99,
                  bgcolor: GOLD,
                  color: GOLD_CONTRAST, fontSize: '0.7rem', fontWeight: 600,
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                <Plus size={13} weight="bold" /> Nouvelle mesure
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Sparkline / Weight Chart */}
        {measurementCount >= 2 && <WeightChart />}

        {/* Body composition - 2 cards */}
        {(() => {
          const recorded = latest.bodyFatPercentage ? parseFloat(latest.bodyFatPercentage) : null;
          const estimated = !recorded ? estimateNavyBf(latest) : null;
          const displayBf = recorded ?? estimated;
          const bfChange = calcChange('bodyFatPercentage');
          return (
        <Stack direction="row" spacing={1.5}>
          <Box
            onClick={estimated !== null ? () => setShowNavyInfo(true) : undefined}
            sx={{
              ...card(d, { flex: 1, py: 2, textAlign: 'center' }),
              ...(estimated !== null && { cursor: 'pointer' }),
            }}
          >
            <Typography variant="caption" sx={{ color: tc.m(t) }}>Masse grasse</Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, my: 0.5, color: tc.h(t) }}>
              {displayBf !== null ? `${displayBf}%` : '--'}
            </Typography>
            {estimated !== null && (
              <Typography sx={{ fontSize: '0.6rem', color: alpha(GOLD, 0.7), textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                est. Navy ⓘ
              </Typography>
            )}
            {bfChange !== null && (
              <TrendBadge value={bfChange} unit="%" inverse />
            )}
          </Box>
          <Box sx={card(d, { flex: 1, py: 2, textAlign: 'center' })}>
            <Typography variant="caption" sx={{ color: tc.m(t) }}>Tour de taille</Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, my: 0.5, color: tc.h(t) }}>
              {latest.waist ? `${fmt(latest.waist)} cm` : '--'}
            </Typography>
            {calcChange('waist') !== null && (
              <TrendBadge value={calcChange('waist')!} unit=" cm" inverse />
            )}
          </Box>
        </Stack>
          );
        })()}

        {/* All measurements - compact CSS Grid list */}
        {filledMeasures.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: tc.m(t) }}>
              Toutes les mesures
            </Typography>
            <Box sx={card(t)}>
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
            </Box>
          </Box>
        )}

      </Stack>

      {/* Navy method explanation dialog */}
      <Dialog
        open={showNavyInfo}
        onClose={() => setShowNavyInfo(false)}
        PaperProps={{
          sx: {
            bgcolor: panelBg(t),
            borderRadius: 3,
            maxWidth: 360,
          },
        }}
      >
        <DialogTitle sx={{ color: tc.h(t), fontSize: '1rem', fontWeight: 700, pb: 0.5 }}>
          Méthode Navy (U.S. Navy)
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: tc.m(t), fontSize: '0.85rem', lineHeight: 1.6 }}>
            Cette estimation utilise la formule développée par la Marine américaine, basée sur vos mensurations :
          </DialogContentText>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {[
              { label: 'Tour de taille', value: latest.waist, unit: 'cm' },
              { label: 'Tour de cou', value: latest.neck, unit: 'cm' },
              { label: 'Taille', value: latest.height, unit: 'cm' },
            ].map((m) => (
              <Stack key={m.label} direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: '0.8rem', color: tc.m(t) }}>{m.label}</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(t) }}>
                  {m.value ? `${parseFloat(m.value)} ${m.unit}` : '--'}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Typography sx={{ mt: 2, fontSize: '0.75rem', color: tc.f(t), lineHeight: 1.5 }}>
            Précision : ±3-4% par rapport à un DEXA scan. Pour une mesure plus précise, enregistrez directement votre % de masse grasse via un impédancemètre ou un professionnel.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowNavyInfo(false)}
            sx={{ color: GOLD, fontWeight: 600, fontSize: '0.85rem' }}
          >
            Compris
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =========================================================
// ListRow - CSS Grid compact row
// =========================================================
function ListRow({ label, value, unit, change, inverse = false }: {
  label: string; value: string; unit: string; change: number | null; inverse?: boolean;
}) {
  const { t, d } = useThemeTokens();
  return (
    <Box sx={{
      px: 2.5, py: 1.5,
      display: 'grid',
      gridTemplateColumns: '1fr auto 56px',
      gap: 1,
      alignItems: 'center',
    }}>
      <Typography variant="body2" sx={{ color: tc.m(t) }}>{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: tc.h(t) }}>
        {fmt(value)} {unit}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {change !== null ? (
          <TrendBadge value={change} unit="" inverse={inverse} />
        ) : (
          <Typography variant="caption" sx={{ color: tc.f(t) }}>--</Typography>
        )}
      </Box>
    </Box>
  );
}

// =========================================================
// Weight Chart
// =========================================================
function WeightChart() {
  const { t, d } = useThemeTokens();
  const [selected, setSelected] = useState<number | null>(null);
  const { data: rawData } = useMeasurementHistory('weight', 10);

  const data = useMemo(() =>
    rawData
      .filter((r: any) => r.weight != null)
      .map((r: any) => ({ date: r.measured_at, value: parseFloat(r.weight) }))
      .reverse(),
    [rawData]
  );

  if (data.length < 2) return null;

  const min = Math.min(...data.map((p) => p.value)) - 1;
  const max = Math.max(...data.map((p) => p.value)) + 1;
  const range = max - min;
  const active = selected !== null ? data[selected] : null;

  return (
    <Box sx={card(d, { py: 2, px: 2 })}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: tc.m(t) }}>
          Évolution du poids
        </Typography>
        {active ? (
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>
            {active.value.toFixed(1)} kg · {new Date(active.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Typography>
        ) : (
          <Stack direction="row" spacing={1}>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
              {min.toFixed(1)}kg
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: tc.f(t) }}>
              {max.toFixed(1)}kg
            </Typography>
          </Stack>
        )}
      </Stack>
      <Box sx={{ height: 48, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
        {data.map((point, i) => {
          const height = ((point.value - min) / range) * 100;
          const isLast = i === data.length - 1;
          const isActive = selected === i;
          return (
            <Box
              key={i}
              onClick={() => setSelected(isActive ? null : i)}
              sx={{
                flex: 1,
                bgcolor: isActive || isLast ? GOLD : (d ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)),
                opacity: selected !== null && !isActive ? 0.4 : 1,
                borderRadius: 0.5,
                height: `${height}%`,
                minHeight: 4,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            />
          );
        })}
      </Box>
    </Box>
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
  const { t, d } = useThemeTokens();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [measureToDelete, setMeasureToDelete] = useState<string | null>(null);

  if (measurements.length === 0) {
    return (
      <Box sx={{ px: 2.5, textAlign: 'center', py: 6 }}>
        <Ruler size={48} weight={W} color={tc.f(t)} style={{ marginBottom: 12, transform: 'rotate(-45deg)' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, color: tc.h(t) }}>
          Aucun historique
        </Typography>
        <Typography variant="body2" sx={{ color: tc.m(t) }}>
          Tes mesures apparaitront ici
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
            { label: 'Epaules', value: m.shoulders ? `${fmt(m.shoulders)} cm` : null },
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
            <Box key={m.id} sx={card(t)}>
              <Box
                onClick={() => setExpanded(isExpanded ? null : m.id)}
                sx={{ px: 2.5, py: 2, cursor: 'pointer' }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ color: tc.h(t) }}>
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tc.m(t) }}>
                      {m.weight ? `${fmt(m.weight)} kg` : ''}{m.waist ? ` · Taille ${fmt(m.waist)} cm` : ''}
                    </Typography>
                  </Box>
                  <CaretDown
                    size={20}
                    weight={W}
                    color={tc.m(t)}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </Stack>
              </Box>

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
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: tc.m(t) }}>
                          {f.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums', color: tc.h(t) }}>
                          {f.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  {m.notes && (
                    <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic', color: tc.m(t) }}>
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
            </Box>
          );
        })}
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: dialogPaperSx(t) }}
      >
        <DialogTitle sx={{ color: tc.h(t) }}>Supprimer la mesure ?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: tc.m(t) }}>
            Cette action est irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: tc.m(t), textTransform: 'none' }}>Annuler</Button>
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
  mutations,
}: {
  photos: ProgressPhotoData[];
  mutations: ReturnType<typeof useMeasurementMutations>;
}) {
  const { t, d } = useThemeTokens();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(false);

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    await mutations.deletePhoto(selectedPhoto.id);
    setDeleteDialogOpen(false);
    setSelectedPhoto(null);
  };

  const handleChangeType = async (newType: 'front' | 'back' | 'side_left' | 'side_right') => {
    if (!selectedPhoto) return;
    await mutations.updatePhotoType(selectedPhoto.id, newType);
    setEditingType(false);
    setSelectedPhoto(null);
  };

  if (photos.length === 0 && !showUpload) {
    return (
      <Box sx={{ px: 2.5, textAlign: 'center', py: 6 }}>
        <Camera size={48} weight={W} color={tc.f(t)} style={{ marginBottom: 12 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, color: tc.h(t) }}>
          Aucune photo
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: tc.m(t) }}>
          Prends des photos pour suivre ta transformation
        </Typography>
        <Button
          variant="contained"
          startIcon={<Camera size={18} weight={W} />}
          onClick={() => { triggerHaptic('light'); setShowUpload(true); }}
          sx={{
            px: 4, py: 1.5, borderRadius: 3, fontWeight: 700,
            bgcolor: GOLD, color: GOLD_CONTRAST,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            '&:hover': { bgcolor: GOLD_LIGHT },
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
        <Box
          onClick={() => { triggerHaptic('light'); setShowUpload(true); }}
          sx={{
            cursor: 'pointer',
            ...card(d, { py: 2, textAlign: 'center' }),
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          <Stack alignItems="center" spacing={0.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '50%',
              bgcolor: alpha(GOLD, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={20} weight="bold" color={GOLD} />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: tc.m(t), fontWeight: 600 }}>
              Ajouter une photo
            </Typography>
          </Stack>
        </Box>

        {Object.entries(photosByDate).map(([date, datePhotos]) => (
          <Box key={date}>
            <Typography variant="caption" fontWeight={500} sx={{ mb: 1, display: 'block', color: tc.m(t) }}>
              {date}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {datePhotos.map((photo) => (
                <Box
                  key={photo.id}
                  onClick={() => { triggerHaptic('light'); setSelectedPhoto(photo); }}
                  sx={{
                    aspectRatio: '3/4',
                    bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.03),
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
                      bgcolor: alpha('#000000', 0.7), color: '#fff', textTransform: 'capitalize',
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
          onUpload={() => setShowUpload(false)}
          mutations={mutations}
        />
      )}

      {/* Photo actions drawer */}
      <Drawer
        anchor="bottom"
        open={!!selectedPhoto && !editingType}
        onClose={() => setSelectedPhoto(null)}
        PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: panelBg(t) } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }} />
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize', color: tc.h(t) }}>
                  {selectedPhoto.photoType.replace('_', ' ')}
                </Typography>
                <Typography variant="caption" sx={{ color: tc.m(t) }}>
                  {new Date(selectedPhoto.takenAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Stack>

            <ListItemButton
              onClick={() => setEditingType(true)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PencilSimple size={22} weight={W} color={GOLD} />
              </ListItemIcon>
              <ListItemText
                primary="Changer le type de pose"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: tc.h(t) }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Trash size={22} weight={W} color="#f44336" />
              </ListItemIcon>
              <ListItemText
                primary="Supprimer la photo"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: '#f44336' }}
              />
            </ListItemButton>
          </Box>
        )}
      </Drawer>

      {/* Change type drawer */}
      <Drawer
        anchor="bottom"
        open={editingType}
        onClose={() => { setEditingType(false); setSelectedPhoto(null); }}
        PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: panelBg(t) } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }} />
        </Box>
        <Box sx={{ px: 1.5, pb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 0.5, pb: 1.5, color: tc.h(t) }}>
            Type de pose
          </Typography>
          {([
            { key: 'front', label: 'Face' },
            { key: 'back', label: 'Dos' },
            { key: 'side_left', label: 'Cote gauche' },
            { key: 'side_right', label: 'Cote droit' },
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
                  color: tc.h(t),
                }}
              />
              {selectedPhoto?.photoType === type.key && (
                <Typography variant="caption" sx={{ color: GOLD }}>actuel</Typography>
              )}
            </ListItemButton>
          ))}
        </Box>
      </Drawer>

      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedPhoto(null); }}
        PaperProps={{ sx: dialogPaperSx(t) }}
      >
        <DialogTitle sx={{ color: tc.h(t) }}>Supprimer la photo ?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: tc.m(t) }}>
            Cette action est irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedPhoto(null); }} sx={{ color: tc.m(t), textTransform: 'none' }}>
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
  mutations,
}: {
  onClose: () => void;
  onUpload: () => void;
  mutations: ReturnType<typeof useMeasurementMutations>;
}) {
  const { t, d } = useThemeTokens();
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
      await mutations.addProgressPhoto(previewUrl, photoType);
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
    <Drawer
      anchor="bottom"
      open
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85vh',
          bgcolor: panelBg(t),
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 1 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }} />
      </Box>

      {uploadProgress && <LinearProgress sx={{ mx: 2, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: GOLD } }} />}

      <Box sx={{ px: 2.5, pb: 3 }}>
        {!previewUrl ? (
          /* ===== Step 1: Choose source ===== */
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 0.5, color: tc.h(t) }}>
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
            <Box
              onClick={() => {
                triggerHaptic('light');
                document.getElementById('photo-camera')?.click();
              }}
              sx={{ cursor: 'pointer', ...card(d, { py: 2.5, px: 2.5 }) }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%',
                  bgcolor: alpha(GOLD, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={24} weight={W} color={GOLD} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} sx={{ color: tc.h(t) }}>Prendre une photo</Typography>
                  <Typography variant="caption" sx={{ color: tc.m(t) }}>
                    Ouvre l&apos;appareil photo
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Gallery button */}
            <input
              id="photo-gallery"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Box
              onClick={() => {
                triggerHaptic('light');
                document.getElementById('photo-gallery')?.click();
              }}
              sx={{ cursor: 'pointer', ...card(d, { py: 2.5, px: 2.5 }) }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%',
                  bgcolor: alpha(GOLD, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Images size={24} weight={W} color={GOLD} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} sx={{ color: tc.h(t) }}>Choisir depuis la galerie</Typography>
                  <Typography variant="caption" sx={{ color: tc.m(t) }}>
                    Selectionne une photo existante
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        ) : (
          /* ===== Step 2: Preview + Pose + Save ===== */
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: tc.h(t) }}>
                Photo de progression
              </Typography>
              <IconButton onClick={handleReset} size="small" sx={{ color: tc.m(t) }}>
                <X size={18} weight={W} />
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
              <Typography variant="caption" fontWeight={500} sx={{ mb: 1, display: 'block', color: tc.m(t) }}>
                Type de pose
              </Typography>
              <Stack direction="row" spacing={1}>
                {([
                  { key: 'front', label: 'Face' },
                  { key: 'back', label: 'Dos' },
                  { key: 'side_left', label: 'Cote G' },
                  { key: 'side_right', label: 'Cote D' },
                ] as const).map((type) => (
                  <Chip
                    key={type.key}
                    label={type.label}
                    size="small"
                    onClick={() => { triggerHaptic('light'); setPhotoType(type.key); }}
                    sx={{
                      flex: 1, fontWeight: 600, fontSize: '0.75rem',
                      bgcolor: photoType === type.key ? GOLD : (d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04)),
                      color: photoType === type.key ? GOLD_CONTRAST : tc.m(t),
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
                bgcolor: GOLD, color: GOLD_CONTRAST,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                '&:hover': { bgcolor: GOLD_LIGHT },
                '&.Mui-disabled': { bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08), color: tc.f(t) },
              }}
            >
              {isUploading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Stack>
        )}
      </Box>
    </Drawer>
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
  const { t, d } = useThemeTokens();
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
          height: lastMeasurement?.height ? parseFloat(lastMeasurement.height) : undefined,
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Box sx={{
      position: 'fixed', inset: 0,
      bgcolor: surfaceBg(t), zIndex: 1300,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header — pill grab + close */}
      <Box sx={{ pt: 1.5, px: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onClose} size="small" sx={{ color: tc.m(t) }}>
            <X size={20} weight={W} />
          </IconButton>
          <Typography sx={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, color: tc.h(t) }}>
            {isEditing ? 'Modifier' : 'Nouvelle mesure'}
          </Typography>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pt: 2, pb: 4 }}>
        <Stack spacing={2.5}>

          {/* Section: Essentiels */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.f(t), textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
              Essentiels
            </Typography>
            <Stack spacing={2}>
              <MeasureInput label="Poids" unit="kg" value={data.weight} onChange={(v) => updateField('weight', v)}
                placeholder={lastMeasurement?.weight || '80'}
                tip="Le matin au reveil, apres les toilettes, avant de manger." />
              <Stack direction="row" spacing={1.5}>
                <MeasureInput label="Tour de taille" unit="cm" value={data.waist} onChange={(v) => updateField('waist', v)}
                  placeholder={lastMeasurement?.waist || ''}
                  tip="Au nombril, debout detendu, apres une expiration normale." />
                <MeasureInput label="Poitrine" unit="cm" value={data.chest} onChange={(v) => updateField('chest', v)}
                  placeholder={lastMeasurement?.chest || ''}
                  tip="Au niveau des tetons, bras le long du corps." />
              </Stack>
            </Stack>
          </Box>

          {/* Section: Mensurations detaillees */}
          <Box>
            <Box sx={{ mb: 0.5, mt: 1, height: '1px', bgcolor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06) }} />
              <Stack spacing={3} sx={{ mt: 2 }}>
                {/* General */}
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    General
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Taille" unit="cm" value={data.height} onChange={(v) => updateField('height', v)}
                        placeholder={lastMeasurement?.height || '175'}
                        tip="Pieds nus, le matin. Dos droit contre un mur." />
                      <MeasureInput label="Masse grasse" unit="%" value={data.bodyFatPercentage} onChange={(v) => updateField('bodyFatPercentage', v)}
                        placeholder={lastMeasurement?.bodyFatPercentage || ''}
                        tip="Impedancemetre ou pince. Sinon laisse vide, on estime auto." />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Cou" unit="cm" value={data.neck} onChange={(v) => updateField('neck', v)} placeholder=""
                        tip="Sous la pomme d'Adam, ruban horizontal." />
                      <MeasureInput label="Epaules" unit="cm" value={data.shoulders} onChange={(v) => updateField('shoulders', v)} placeholder=""
                        tip="Point le plus large, bras detendus." />
                    </Stack>
                  </Stack>
                </Box>

                {/* Haut du corps */}
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    Haut du corps
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Bras G" unit="cm" value={data.leftArm} onChange={(v) => updateField('leftArm', v)} placeholder=""
                        tip="Biceps contracte, bras flechi 90°." />
                      <MeasureInput label="Bras D" unit="cm" value={data.rightArm} onChange={(v) => updateField('rightArm', v)} placeholder=""
                        tip="Biceps contracte, bras flechi 90°." />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Av-bras G" unit="cm" value={data.leftForearm} onChange={(v) => updateField('leftForearm', v)} placeholder=""
                        tip="3 cm sous le coude, poing ferme." />
                      <MeasureInput label="Av-bras D" unit="cm" value={data.rightForearm} onChange={(v) => updateField('rightForearm', v)} placeholder=""
                        tip="3 cm sous le coude, poing ferme." />
                    </Stack>
                  </Stack>
                </Box>

                {/* Bas du corps */}
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    Bas du corps
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Hanches" unit="cm" value={data.hips} onChange={(v) => updateField('hips', v)} placeholder=""
                        tip="Os de la hanche, ruban horizontal." />
                      <MeasureInput label="Fesses" unit="cm" value={data.glutes} onChange={(v) => updateField('glutes', v)} placeholder=""
                        tip="Point le plus large, pieds joints." />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Cuisse G" unit="cm" value={data.leftThigh} onChange={(v) => updateField('leftThigh', v)} placeholder=""
                        tip="Point le plus epais, 15 cm sous l'aine." />
                      <MeasureInput label="Cuisse D" unit="cm" value={data.rightThigh} onChange={(v) => updateField('rightThigh', v)} placeholder=""
                        tip="Point le plus epais, 15 cm sous l'aine." />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <MeasureInput label="Mollet G" unit="cm" value={data.leftCalf} onChange={(v) => updateField('leftCalf', v)} placeholder=""
                        tip="Point le plus large, jambe detendue." />
                      <MeasureInput label="Mollet D" unit="cm" value={data.rightCalf} onChange={(v) => updateField('rightCalf', v)} placeholder=""
                        tip="Point le plus large, jambe detendue." />
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
          </Box>

          {/* Notes */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.f(t), textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
              Notes
            </Typography>
            <TextField
              multiline
              rows={2}
              value={data.notes || ''}
              onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Conditions, sensations..."
              fullWidth
              size="small"
              sx={goldFieldSx(t)}
            />
          </Box>
        </Stack>
      </Box>

      {/* Sticky CTA */}
      <Box sx={{
        px: 2.5, pb: 3, pt: 1.5, bgcolor: surfaceBg(t),
        borderTop: '1px solid',
        borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
      }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          disabled={isSubmitting || !data.weight}
          sx={{
            py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: '0.9rem',
            bgcolor: GOLD, color: GOLD_CONTRAST,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            boxShadow: `0 4px 16px ${alpha(GOLD, 0.3)}`,
            '&:hover': { bgcolor: GOLD_LIGHT },
            '&.Mui-disabled': { bgcolor: d ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06), color: tc.f(t), boxShadow: 'none' },
          }}
        >
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer la mesure'}
        </Button>
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
  { key: 'shoulders', label: 'Epaules', unit: 'cm' },
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

function formatDate(d: Date | string) {
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
  const { t, d } = useThemeTokens();

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
  th { background: ${GOLD}; color: ${GOLD_CONTRAST}; padding: 8px 10px; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
  tr:nth-child(even) td { background: #faf8f2; }
  tr:hover td { background: #f5f0e0; }
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
<p class="footer">Genere depuis l'app Workout</p>
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
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: panelBg(t) },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }} />
      </Box>
      <Box sx={{ px: 1, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 1.5, pt: 0.5, pb: 1, color: tc.h(t) }}>
          Exporter les mensurations
        </Typography>
        <Typography variant="caption" sx={{ px: 1.5, display: 'block', mb: 1, color: tc.m(t) }}>
          {measurements.length} mesure{measurements.length > 1 ? 's' : ''}
        </Typography>

        <ListItemButton onClick={exportExcel} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Table size={22} weight={W} color="#2d6a4f" />
          </ListItemIcon>
          <ListItemText
            primary="Excel / CSV"
            secondary="Fichier .csv compatible Excel, Google Sheets"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: tc.h(t) }}
            secondaryTypographyProps={{ fontSize: '0.75rem', color: tc.m(t) }}
          />
        </ListItemButton>

        <ListItemButton onClick={exportJSON} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <BracketsCurly size={22} weight={W} color="#ff9800" />
          </ListItemIcon>
          <ListItemText
            primary="JSON"
            secondary="Format brut pour traitement de donnees"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: tc.h(t) }}
            secondaryTypographyProps={{ fontSize: '0.75rem', color: tc.m(t) }}
          />
        </ListItemButton>

        <ListItemButton onClick={exportPDF} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <FilePdf size={22} weight={W} color="#f44336" />
          </ListItemIcon>
          <ListItemText
            primary="PDF"
            secondary="Tableau imprimable via le navigateur"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', color: tc.h(t) }}
            secondaryTypographyProps={{ fontSize: '0.75rem', color: tc.m(t) }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
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
  const { t, d } = useThemeTokens();
  const [focused, setFocused] = useState(false);

  return (
    <Box sx={{ flex: 1 }}>
      <TextField
        label={label}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder || '0'}
        fullWidth
        sx={goldFieldSx(t)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: tc.f(t) }}>{unit}</Typography>
            </InputAdornment>
          ),
          inputProps: { step: '0.1' },
        }}
      />
      {tip && focused && (
        <Box sx={{
          mt: 0.5, px: 1.25, py: 0.5,
          bgcolor: alpha(GOLD, 0.06),
          borderRadius: 1.5,
        }}>
          <Typography sx={{ fontSize: '0.6rem', lineHeight: 1.5, color: tc.m(t) }}>
            {tip}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
