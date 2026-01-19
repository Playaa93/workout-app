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

type Tab = 'overview' | 'history' | 'photos';

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-neutral-800 flex items-center gap-4">
        <a href="/" className="text-neutral-400 hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold">Mensurations</h1>
      </header>

      {/* Tabs */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex gap-2">
          {(['overview', 'history', 'photos'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {tab === 'overview' && 'Aperçu'}
              {tab === 'history' && 'Historique'}
              {tab === 'photos' && 'Photos'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab latest={latest} summary={summary} />
            )}
            {activeTab === 'history' && (
              <HistoryTab
                measurements={measurements}
                onDelete={handleDeleteMeasurement}
              />
            )}
            {activeTab === 'photos' && <PhotosTab photos={photos} onRefresh={loadData} />}
          </>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-violet-500 transition-colors"
      >
        +
      </button>

      {/* Add Form Modal */}
      {showAddForm && (
        <AddMeasurementForm
          lastMeasurement={latest}
          onSubmit={handleAddMeasurement}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </main>
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
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📏</span>
        <h2 className="text-xl font-semibold mb-2">Aucune mesure</h2>
        <p className="text-neutral-400">Ajoute ta première mesure pour suivre ta progression</p>
      </div>
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
      <span className={isPositive ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-neutral-400'}>
        {sign}{value.toFixed(1)}{unit}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Last measurement date */}
      <p className="text-neutral-400 text-sm">
        Dernière mesure : {formatDate(latest.measuredAt)}
      </p>

      {/* Progress Summary */}
      {summary && summary.totalMeasurements >= 2 && (
        <div className="p-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-xl border border-violet-500/30">
          <h3 className="font-semibold mb-3">Progression ({summary.daysSinceFirst} jours)</h3>
          <div className="grid grid-cols-2 gap-4">
            {summary.weightChange !== null && (
              <div>
                <p className="text-sm text-neutral-400">Poids</p>
                <p className="font-medium">{formatChange(summary.weightChange, 'kg', true)}</p>
              </div>
            )}
            {summary.waistChange !== null && (
              <div>
                <p className="text-sm text-neutral-400">Tour de taille</p>
                <p className="font-medium">{formatChange(summary.waistChange, 'cm', true)}</p>
              </div>
            )}
            {summary.chestChange !== null && (
              <div>
                <p className="text-sm text-neutral-400">Poitrine</p>
                <p className="font-medium">{formatChange(summary.chestChange, 'cm')}</p>
              </div>
            )}
            {summary.armChange !== null && (
              <div>
                <p className="text-sm text-neutral-400">Bras (moy.)</p>
                <p className="font-medium">{formatChange(summary.armChange, 'cm')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Stats */}
      <div className="space-y-4">
        <h3 className="font-semibold">Mesures actuelles</h3>

        {/* Weight & Body Fat */}
        <div className="grid grid-cols-2 gap-3">
          <MeasureCard label="Poids" value={latest.weight} unit="kg" icon="⚖️" />
          <MeasureCard label="Masse grasse" value={latest.bodyFatPercentage} unit="%" icon="📊" />
        </div>

        {/* Upper Body */}
        <div className="p-4 bg-neutral-900 rounded-xl">
          <h4 className="text-sm text-neutral-400 mb-3">Haut du corps</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <MiniMeasure label="Cou" value={latest.neck} />
            <MiniMeasure label="Épaules" value={latest.shoulders} />
            <MiniMeasure label="Poitrine" value={latest.chest} />
            <MiniMeasure label="Bras G" value={latest.leftArm} />
            <MiniMeasure label="Bras D" value={latest.rightArm} />
            <MiniMeasure label="Av-bras G" value={latest.leftForearm} />
            <MiniMeasure label="Av-bras D" value={latest.rightForearm} />
            <MiniMeasure label="Taille" value={latest.waist} />
            <MiniMeasure label="Hanches" value={latest.hips} />
          </div>
        </div>

        {/* Lower Body */}
        <div className="p-4 bg-neutral-900 rounded-xl">
          <h4 className="text-sm text-neutral-400 mb-3">Bas du corps</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniMeasure label="Cuisse G" value={latest.leftThigh} />
            <MiniMeasure label="Cuisse D" value={latest.rightThigh} />
            <MiniMeasure label="Mollet G" value={latest.leftCalf} />
            <MiniMeasure label="Mollet D" value={latest.rightCalf} />
          </div>
        </div>
      </div>

      {/* Weight Chart (simple) */}
      {summary && summary.totalMeasurements >= 2 && (
        <WeightChart />
      )}
    </div>
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
    <div className="p-4 bg-neutral-900 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {value ? `${value}${unit}` : '--'}
      </p>
    </div>
  );
}

function MiniMeasure({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-neutral-500 text-xs">{label}</p>
      <p className="font-medium">{value ? `${value}cm` : '--'}</p>
    </div>
  );
}

// Simple Weight Chart
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
    <div className="p-4 bg-neutral-900 rounded-xl">
      <h4 className="text-sm text-neutral-400 mb-4">Évolution du poids</h4>
      <div className="h-32 flex items-end gap-1">
        {data.map((point, i) => {
          const height = ((point.value - min) / range) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-violet-500 rounded-t transition-all"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-neutral-500">
                {point.date.split('-')[2]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-neutral-500">
        <span>{min.toFixed(1)}kg</span>
        <span>{max.toFixed(1)}kg</span>
      </div>
    </div>
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
      <div className="text-center py-12">
        <p className="text-neutral-400">Aucun historique</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {measurements.map((m) => {
        const date = new Date(m.measuredAt);
        const isExpanded = expanded === m.id;

        return (
          <div key={m.id} className="bg-neutral-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : m.id)}
              className="w-full p-4 flex justify-between items-center"
            >
              <div className="text-left">
                <p className="font-medium">
                  {date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-neutral-400">
                  {m.weight ? `${m.weight}kg` : ''}{' '}
                  {m.chest ? `• Poitrine ${m.chest}cm` : ''}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-neutral-800 pt-4">
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
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
                </div>
                {m.notes && (
                  <p className="text-sm text-neutral-400 mb-4">{m.notes}</p>
                )}
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-red-400 text-sm hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
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
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📸</span>
        <h2 className="text-xl font-semibold mb-2">Aucune photo</h2>
        <p className="text-neutral-400 mb-4">
          Prends des photos pour suivre ta transformation
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="px-6 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 transition-colors"
        >
          Ajouter une photo
        </button>
      </div>
    );
  }

  // Group photos by date
  const photosByDate = photos.reduce((acc, photo) => {
    const date = new Date(photo.takenAt).toLocaleDateString('fr-FR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, ProgressPhotoData[]>);

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowUpload(true)}
        className="w-full py-3 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors"
      >
        + Ajouter une photo
      </button>

      {Object.entries(photosByDate).map(([date, datePhotos]) => (
        <div key={date}>
          <h3 className="text-sm text-neutral-400 mb-3">{date}</h3>
          <div className="grid grid-cols-2 gap-3">
            {datePhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden relative"
              >
                <img
                  src={photo.photoUrl}
                  alt={photo.photoType}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs capitalize">
                  {photo.photoType.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showUpload && (
        <PhotoUploadModal
          onClose={() => setShowUpload(false)}
          onUpload={onRefresh}
        />
      )}
    </div>
  );
}

// Photo Upload Modal (simplified - stores URL for now)
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
      // For now, we store the data URL directly
      // In production, this would upload to a storage service
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
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <header className="px-4 py-4 border-b border-neutral-800 flex items-center gap-4">
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">Ajouter une photo</h2>
      </header>

      <div className="flex-1 p-4 flex flex-col">
        {/* Photo Type Selection */}
        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">Type de photo</p>
          <div className="grid grid-cols-4 gap-2">
            {(['front', 'back', 'side_left', 'side_right'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPhotoType(type)}
                className={`py-2 rounded-lg text-sm transition-colors ${
                  photoType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {type === 'front' && 'Face'}
                {type === 'back' && 'Dos'}
                {type === 'side_left' && 'Côté G'}
                {type === 'side_right' && 'Côté D'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview / Upload Area */}
        <div className="flex-1 flex items-center justify-center">
          {previewUrl ? (
            <div className="relative w-full max-w-xs aspect-[3/4]">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="w-full max-w-xs aspect-[3/4] border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors">
              <span className="text-4xl mb-2">📷</span>
              <span className="text-neutral-400">Touche pour choisir</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        {previewUrl && (
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold transition-colors mt-4"
          >
            {isUploading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <header className="px-4 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">Nouvelle mesure</h2>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !data.weight}
          className="px-4 py-2 bg-violet-600 rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Enregistrer'}
        </button>
      </header>

      {/* Section Tabs */}
      <div className="px-4 py-3 border-b border-neutral-800 flex gap-2">
        {(['essential', 'upper', 'lower'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeSection === section
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {section === 'essential' && 'Essentiel'}
            {section === 'upper' && 'Haut'}
            {section === 'lower' && 'Bas'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'essential' && (
          <div className="space-y-4">
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
          </div>
        )}

        {activeSection === 'upper' && (
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        )}

        {activeSection === 'lower' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-6">
          <label className="text-sm text-neutral-400 mb-2 block">Notes (optionnel)</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full px-4 py-3 bg-neutral-900 rounded-xl resize-none h-24"
            placeholder="Comment tu te sens ?"
          />
        </div>
      </div>
    </div>
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
    <div>
      <label className="text-sm text-neutral-400 mb-2 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '0'}
          className="w-full px-4 py-3 bg-neutral-900 rounded-xl pr-12"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
          {unit}
        </span>
      </div>
    </div>
  );
}
