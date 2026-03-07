'use client';

import { useState, useEffect, useRef } from 'react';
import type { MachineSetup, MachineSettingEntry } from '@/app/workout/types';
import { compressImage } from '@/lib/image-utils';
import { getDefaultSettings } from '@/lib/machine-settings-defaults';
import { triggerHaptic } from '@/lib/haptic';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import CameraAlt from '@mui/icons-material/CameraAlt';
import PhotoLibrary from '@mui/icons-material/PhotoLibrary';
import Add from '@mui/icons-material/Add';

type Props = {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  equipment: string[] | null;
  existingSetup?: MachineSetup | null;
  existingLabels?: string[];
  onSave: (data: {
    id?: string;
    exerciseId: string;
    machineLabel: string;
    photoBase64?: string | null;
    settings: MachineSettingEntry[];
    isDefault: boolean;
    notes?: string | null;
  }) => Promise<void>;
  onDelete?: (setupId: string) => Promise<void>;
};

export default function MachineSetupSheet({
  open,
  onClose,
  exerciseId,
  equipment,
  existingSetup,
  existingLabels = [],
  onSave,
  onDelete,
}: Props) {
  const [label, setLabel] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [settings, setSettings] = useState<MachineSettingEntry[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (existingSetup) {
        setLabel(existingSetup.machineLabel);
        setPhoto(existingSetup.photoBase64);
        setSettings([...existingSetup.settings]);
        setIsDefault(existingSetup.isDefault);
        setNotes(existingSetup.notes || '');
      } else {
        setLabel('');
        setPhoto(null);
        setSettings(getDefaultSettings(equipment, ''));
        setIsDefault(true);
        setNotes('');
      }
      setConfirmDelete(false);
    }
  }, [open, existingSetup, equipment]);

  const handlePhoto = async (file: File) => {
    try {
      const compressed = await compressImage(file, 512);
      setPhoto(compressed);
    } catch (err) {
      console.error('Photo compression error:', err);
    }
  };

  const updateSetting = (index: number, field: 'key' | 'value', val: string) => {
    setSettings(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeSetting = (index: number) => {
    setSettings(prev => prev.filter((_, i) => i !== index));
  };

  const addSetting = () => {
    setSettings(prev => [...prev, { key: '', value: '' }]);
  };

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!existingSetup && val && settings.every(s => !s.value)) {
      setSettings(getDefaultSettings(equipment, val));
    }
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const cleanSettings = settings.filter(s => s.key.trim());
      await onSave({
        id: existingSetup?.id,
        exerciseId,
        machineLabel: label.trim(),
        photoBase64: photo,
        settings: cleanSettings,
        isDefault,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error('Save machine setup error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSetup || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(existingSetup.id);
      onClose();
    } catch (err) {
      console.error('Delete machine setup error:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredLabels = existingLabels.filter(l =>
    l.toLowerCase().includes(label.toLowerCase()) && l !== existingSetup?.machineLabel
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90vh' } }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
      </Box>

      <Box sx={{ px: 2, pb: 3, overflow: 'auto' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {existingSetup ? 'Modifier la machine' : 'Configurer la machine'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>

        {/* Label */}
        <TextField
          fullWidth
          size="small"
          label="Nom de la machine"
          placeholder="Ex: Prime Leg Extension - Bodyland"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          sx={{ mb: 1 }}
        />
        {/* Label suggestions */}
        {label && filteredLabels.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            {filteredLabels.slice(0, 5).map(l => (
              <Chip
                key={l}
                label={l}
                size="small"
                variant="outlined"
                onClick={() => setLabel(l)}
                sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
              />
            ))}
          </Stack>
        )}

        {/* Photo */}
        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 0.5, display: 'block' }}>
          Photo
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {photo ? (
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={photo}
                alt="Machine"
                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2 }}
              />
              <IconButton
                size="small"
                onClick={() => setPhoto(null)}
                sx={{
                  position: 'absolute', top: -6, right: -6,
                  bgcolor: 'error.main', color: 'white',
                  width: 20, height: 20,
                  '&:hover': { bgcolor: 'error.dark' },
                }}
              >
                <Close sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CameraAlt sx={{ fontSize: 16 }} />}
                onClick={() => cameraRef.current?.click()}
                sx={{ borderStyle: 'dashed', fontSize: '0.75rem', textTransform: 'none' }}
              >
                Camera
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PhotoLibrary sx={{ fontSize: 16 }} />}
                onClick={() => galleryRef.current?.click()}
                sx={{ borderStyle: 'dashed', fontSize: '0.75rem', textTransform: 'none' }}
              >
                Galerie
              </Button>
            </>
          )}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]); e.target.value = ''; }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]); e.target.value = ''; }}
          />
        </Stack>

        {/* Settings */}
        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 0.5, display: 'block' }}>
          Reglages
        </Typography>
        <Stack spacing={1} sx={{ mb: 1 }}>
          {settings.map((s, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Reglage"
                value={s.key}
                onChange={(e) => updateSetting(i, 'key', e.target.value)}
                sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
              />
              <TextField
                size="small"
                placeholder="Valeur"
                value={s.value}
                onChange={(e) => updateSetting(i, 'value', e.target.value)}
                sx={{ width: 100, '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
              />
              <IconButton size="small" onClick={() => removeSetting(i)} sx={{ color: 'text.disabled' }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          size="small"
          startIcon={<Add sx={{ fontSize: 14 }} />}
          onClick={addSetting}
          sx={{ mb: 2, fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary' }}
        >
          Ajouter un reglage
        </Button>

        {/* Notes */}
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={1}
          maxRows={3}
          label="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
        />

        {/* Default toggle */}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
          }
          label={<Typography variant="caption">Machine par defaut pour cet exercice</Typography>}
          sx={{ mb: 2 }}
        />

        {/* Actions */}
        <Stack direction="row" spacing={1.5}>
          {existingSetup && onDelete && (
            !confirmDelete ? (
              <Button
                size="small"
                onClick={() => { triggerHaptic('light'); setConfirmDelete(true); }}
                sx={{ color: 'text.disabled', minWidth: 0 }}
              >
                <Delete fontSize="small" />
              </Button>
            ) : (
              <Button
                size="small"
                onClick={handleDelete}
                disabled={saving}
                sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Supprimer
              </Button>
            )
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim() || saving}
            sx={{
              bgcolor: 'text.primary',
              color: 'background.default',
              fontWeight: 600,
              '&:hover': { bgcolor: 'text.primary', opacity: 0.9 },
              '&:disabled': { bgcolor: 'action.disabled', color: 'text.disabled' },
            }}
          >
            {saving ? '...' : 'Sauvegarder'}
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
}
