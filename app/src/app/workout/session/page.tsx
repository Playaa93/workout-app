'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ActiveSession, WorkoutSet, Exercise, MachineSettingEntry } from '../types';
import { useAuth } from '@/powersync/auth-context';
import { useSessionDetail, useSessionSets, useExercises, useExerciseNote, useMachineSetupById } from '@/powersync/queries/workout-queries';
import { parseJsonArray } from '@/powersync/helpers';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity } from '@/db/schema';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Delete from '@mui/icons-material/Delete';
import MoreVert from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import EditNote from '@mui/icons-material/EditNote';
import Settings from '@mui/icons-material/Settings';
import FileDownload from '@mui/icons-material/FileDownload';
import Description from '@mui/icons-material/Description';
import DataObject from '@mui/icons-material/DataObject';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import { downloadFile, fmtDateFR, fmtTimeFR, formatDuration, escapeHtml, writeExcelFile, openPrintableHtml } from '@/lib/export-utils';

function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function SessionExportDrawer({ open, onClose, data }: { open: boolean; onClose: () => void; data: ActiveSession }) {
  const { session, sets } = data;
  const dateStr = fmtDateFR(session.startedAt);
  const slug = dateStr.replace(/\//g, '-');

  const exportExcel = () => {
    const headers = [
      'Date', 'Heure', 'Type', 'Durée (min)', 'Volume total (kg)',
      'Calories (kcal)', 'Exercice', 'Série', 'Reps', 'Poids (kg)',
      'RPE', 'Échauffement', 'Record', 'Notes',
    ];
    const base: (string | number | null)[] = [
      dateStr, fmtTimeFR(session.startedAt),
      session.sessionType === 'cardio' ? 'Cardio' : 'Musculation',
      session.durationMinutes ?? null,
      session.totalVolume ? parseFloat(session.totalVolume) : null,
      session.caloriesBurned ?? null,
    ];
    const sessionNotes = session.notes || '';
    const rows: (string | number | null)[][] = [];
    if (sets.length === 0) {
      rows.push([...base, '', null, null, null, null, '', '', sessionNotes]);
    } else {
      for (const set of sets) {
        const ex = data.exercises.get(set.exerciseId);
        const note = [sessionNotes, set.notes].filter(Boolean).join(' | ');
        rows.push([
          ...base, ex?.nameFr || set.exerciseName || '', set.setNumber,
          set.reps ?? null, set.weight ? parseFloat(set.weight) : null, set.rpe ?? null,
          set.isWarmup ? 'Oui' : 'Non', set.isPr ? 'Oui' : 'Non', note || null,
        ]);
      }
    }
    writeExcelFile(headers, rows, 'Séance', `seance_${slug}.xlsx`);
    onClose();
  };

  const exportJSON = () => {
    const exerciseMap = new Map<string, { nom: string; series: { serie: number; reps: number | null; poids: string | null; rpe: number | null; echauffement: boolean; record: boolean }[] }>();
    for (const set of sets) {
      const ex = data.exercises.get(set.exerciseId);
      if (!exerciseMap.has(set.exerciseId)) {
        exerciseMap.set(set.exerciseId, { nom: ex?.nameFr || set.exerciseName || '', series: [] });
      }
      exerciseMap.get(set.exerciseId)!.series.push({
        serie: set.setNumber,
        reps: set.reps,
        poids: set.weight,
        rpe: set.rpe,
        echauffement: !!set.isWarmup,
        record: !!set.isPr,
        ...(set.notes ? { notes: set.notes } : {}),
      });
    }
    const out = {
      date: dateStr,
      heure: fmtTimeFR(session.startedAt),
      type: session.sessionType || 'strength',
      duree: session.durationMinutes,
      volume: session.totalVolume ? parseFloat(session.totalVolume) : 0,
      calories: session.caloriesBurned,
      notes: session.notes || undefined,
      exercices: Array.from(exerciseMap.values()),
    };
    downloadFile(JSON.stringify(out, null, 2), `seance_${slug}.json`, 'application/json');
    onClose();
  };

  const exportPDF = () => {
    const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
    const setsByEx = new Map<string, WorkoutSet[]>();
    sets.forEach(s => {
      if (!setsByEx.has(s.exerciseId)) setsByEx.set(s.exerciseId, []);
      setsByEx.get(s.exerciseId)!.push(s);
    });
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Séance du ${dateStr}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
  .stats { display: flex; gap: 24px; margin-bottom: 20px; }
  .stat { font-size: 13px; }
  .stat strong { font-size: 18px; display: block; }
  h2 { font-size: 15px; margin: 16px 0 6px; border-bottom: 2px solid #6750a4; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
  th { background: #f3f0ff; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
  .pr { color: #ff9800; font-weight: 600; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>Séance du ${dateStr}</h1>
<p class="subtitle">${fmtTimeFR(session.startedAt)}${session.durationMinutes ? ` · ${formatDuration(session.durationMinutes)}` : ''}</p>
<div class="stats">
  ${volume > 0 ? `<div class="stat"><strong>${volume.toFixed(0)} kg</strong>Volume</div>` : ''}
  ${sets.length > 0 ? `<div class="stat"><strong>${sets.filter(s => !s.isWarmup).length}</strong>Séries</div>` : ''}
  ${session.caloriesBurned ? `<div class="stat"><strong>${session.caloriesBurned}</strong>kcal</div>` : ''}
</div>
${Array.from(setsByEx.entries()).map(([exId, exSets]) => {
  const ex = data.exercises.get(exId);
  return `<h2>${escapeHtml(ex?.nameFr || exSets[0]?.exerciseName || 'Exercice')}</h2>
<table>
<thead><tr><th>#</th><th>Reps</th><th>Poids</th><th>RPE</th><th></th></tr></thead>
<tbody>
${exSets.map(s => `<tr><td>${s.isWarmup ? 'W' : s.setNumber}</td><td>${s.reps || '-'}</td><td>${s.weight ? s.weight + ' kg' : '-'}</td><td>${s.rpe || '-'}</td><td>${s.isPr ? '<span class="pr">PR</span>' : ''}</td></tr>${s.notes ? `<tr><td colspan="5" style="border-bottom:none;padding:0 8px 4px;font-size:11px;font-style:italic;color:#888">${escapeHtml(s.notes)}</td></tr>` : ''}`).join('\n')}
</tbody>
</table>`;
}).join('\n')}
${session.notes ? `<p style="margin-top:12px;font-size:13px;"><strong>Notes :</strong> ${escapeHtml(session.notes)}</p>` : ''}
<p class="footer">Généré depuis l'app Workout</p>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;
    openPrintableHtml(html);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
      </Box>
      <Box sx={{ px: 1, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          Exporter cette séance
        </Typography>
        <ListItemButton onClick={exportExcel} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><Description sx={{ color: '#4caf50' }} /></ListItemIcon>
          <ListItemText primary="Excel (.xlsx)" secondary="Fichier Excel avec colonnes formatées" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
        </ListItemButton>
        <ListItemButton onClick={exportJSON} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><DataObject sx={{ color: '#ff9800' }} /></ListItemIcon>
          <ListItemText primary="JSON" secondary="Format brut pour traitement de données" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
        </ListItemButton>
        <ListItemButton onClick={exportPDF} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><PictureAsPdf sx={{ color: '#f44336' }} /></ListItemIcon>
          <ListItemText primary="PDF" secondary="Fiche détaillée imprimable" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
        </ListItemButton>
      </Box>
    </SwipeableDrawer>
  );
}

function SessionDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('id') ?? '';
  const mutations = useWorkoutMutations();
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDelete = async () => {
    await mutations.deleteSession(sessionId);
    setDeleteOpen(false);
    router.replace('/workout');
  };

  const { data: sessionRows, isLoading: sessionLoading } = useSessionDetail(sessionId);
  const { data: setRows, isLoading: setsLoading } = useSessionSets(sessionId);
  const { data: exerciseRows, isLoading: exLoading } = useExercises();

  const data = useMemo<ActiveSession | null>(() => {
    if (!sessionRows?.length) return null;
    const s = sessionRows[0];

    const exercises = new Map<string, Exercise>();
    for (const e of exerciseRows ?? []) {
      exercises.set(e.id, {
        id: e.id,
        nameFr: e.name_fr ?? '',
        nameEn: e.name_en ?? null,
        muscleGroup: e.muscle_group ?? '',
        primaryMuscles: parseJsonArray(e.primary_muscles),
        secondaryMuscles: parseJsonArray(e.secondary_muscles),
        equipment: parseJsonArray(e.equipment),
        difficulty: (e as Record<string, unknown>).difficulty as string | null ?? null,
      });
    }

    const sets: WorkoutSet[] = (setRows ?? []).map((r) => ({
      id: r.id,
      exerciseId: r.exercise_id ?? '',
      exerciseName: (r as Record<string, unknown>).exercise_name as string ?? '',
      setNumber: r.set_number ?? 0,
      reps: r.reps ?? null,
      weight: r.weight ?? null,
      rpe: r.rpe ?? null,
      isWarmup: !!r.is_warmup,
      isPr: !!r.is_pr,
      restTaken: r.rest_taken ?? null,
      notes: r.notes || null,
      machineSetupId: r.machine_setup_id ?? null,
    }));

    return {
      session: {
        id: s.id,
        startedAt: new Date(s.started_at!),
        endedAt: s.ended_at ? new Date(s.ended_at) : null,
        durationMinutes: s.duration_minutes ?? null,
        totalVolume: s.total_volume ?? null,
        caloriesBurned: s.calories_burned ?? null,
        notes: s.notes ?? null,
        sessionType: (s.session_type as 'strength' | 'cardio' | null) ?? null,
        cardioActivity: s.cardio_activity ?? null,
        distanceMeters: s.distance_meters ?? null,
        avgPaceSecondsPerKm: s.avg_pace_seconds_per_km ?? null,
        avgSpeedKmh: s.avg_speed_kmh ?? null,
      },
      sets,
      exercises,
    };
  }, [sessionRows, setRows, exerciseRows]);

  const loading = sessionLoading || setsLoading || exLoading;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Séance introuvable</Typography>
      </Box>
    );
  }

  const { session, sets } = data;
  const date = new Date(session.startedAt);
  const isCardio = session.sessionType === 'cardio';
  const activityInfo = isCardio && session.cardioActivity
    ? CARDIO_ACTIVITIES[session.cardioActivity as CardioActivity]
    : null;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
  const distanceM = session.distanceMeters ? parseFloat(session.distanceMeters) : 0;
  const mins = session.durationMinutes || 0;

  // Group sets by exercise
  const setsByExercise = new Map<string, WorkoutSet[]>();
  sets.forEach((set) => {
    const group = setsByExercise.get(set.exerciseId);
    if (group) group.push(set);
    else setsByExercise.set(set.exerciseId, [set]);
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => router.back()} size="small">
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {isCardio && activityInfo
                  ? `${activityInfo.emoji} ${activityInfo.label}`
                  : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {mins > 0 && ` · ${formatDuration(mins)}`}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180 } } }}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); setExportOpen(true); }}>
              <FileDownload sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
              Exporter
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); setDeleteOpen(true); }} sx={{ color: 'error.main' }}>
              <Delete sx={{ fontSize: 18, mr: 1.5 }} />
              Supprimer
            </MenuItem>
          </Menu>
        </Stack>

        {/* Stats bar */}
        <Card sx={{ mb: 2 }}>
          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
            {isCardio ? (
              <>
                <StatBox label="Distance" value={distanceM > 0 ? formatDistance(distanceM) : '—'} />
                <StatBox label="Allure" value={session.avgPaceSecondsPerKm ? formatPace(session.avgPaceSecondsPerKm) : '—'} />
                <StatBox label="kcal" value={session.caloriesBurned != null ? String(session.caloriesBurned) : '—'} />
              </>
            ) : (
              <>
                <StatBox label="Volume" value={volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`} />
                <StatBox label="Séries" value={String(sets.filter(s => !s.isWarmup).length)} />
                {session.caloriesBurned != null && session.caloriesBurned > 0 && (
                  <StatBox label="kcal" value={String(session.caloriesBurned)} />
                )}
              </>
            )}
          </Stack>
        </Card>
      </Box>

      {/* Exercise details */}
      <Box sx={{ px: 2, pb: 4 }}>
        <Stack spacing={2}>
          {Array.from(setsByExercise.entries()).map(([exerciseId, exSets]) => {
            const exercise = data.exercises.get(exerciseId);
            const workingSets = exSets.filter(s => !s.isWarmup);
            const exVolume = workingSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);

            return (
              <Card key={exerciseId}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FitnessCenter sx={{ fontSize: 18, color: 'text.disabled' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {exercise?.nameFr || exSets[0]?.exerciseName || 'Exercice'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {exVolume > 0 && `${exVolume.toLocaleString()}kg`}
                    </Typography>
                  </Stack>
                  <ExerciseNoteReadonly exerciseId={exerciseId} />
                  {/* Show machine setup from first set that has one */}
                  {(() => {
                    const machineId = exSets.find(s => s.machineSetupId)?.machineSetupId;
                    return machineId ? <MachineSetupReadonly machineSetupId={machineId} /> : null;
                  })()}

                  {exSets.map((set) => (
                    <Box key={set.id} sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box
                            sx={{
                              width: 26, height: 26, borderRadius: '50%',
                              bgcolor: 'action.hover',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 500,
                            }}
                          >
                            {set.isWarmup ? 'W' : set.setNumber}
                          </Box>
                          <Typography variant="body2">
                            <Typography component="span" fontWeight={500}>{set.reps}</Typography>
                            <Typography component="span" color="text.secondary" sx={{ mx: 0.5 }}>×</Typography>
                            <Typography component="span" fontWeight={500}>{set.weight}kg</Typography>
                          </Typography>
                          {set.rpe && (
                            <Typography variant="caption" color="text.secondary">RPE {set.rpe}</Typography>
                          )}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {set.restTaken && (
                            <Typography variant="caption" color="text.disabled">
                              {formatRestTime(set.restTaken)}
                            </Typography>
                          )}
                          {set.isPr && (
                            <Chip
                              icon={<EmojiEvents sx={{ fontSize: 14 }} />}
                              label="PR"
                              size="small"
                              color="warning"
                              sx={{ height: 22, fontWeight: 600, fontSize: '0.65rem' }}
                            />
                          )}
                        </Stack>
                      </Stack>
                      {set.notes && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pl: 5, mt: 0.25 }}>
                          <EditNote sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', lineHeight: 1.3 }}>
                            {set.notes}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        <SessionNotesEditor sessionId={session.id} initialNotes={session.notes || ''} />
      </Box>

      <SessionExportDrawer open={exportOpen} onClose={() => setExportOpen(false)} data={data} />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}>
        <DialogTitle>Supprimer la séance ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible. Toutes les données de cette séance seront perdues.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, py: 1.5, textAlign: 'center' }}>
      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

function MachineSetupReadonly({ machineSetupId }: { machineSetupId: string }) {
  const { data: rows } = useMachineSetupById(machineSetupId);
  const setup = rows?.[0];
  if (!setup) return null;

  const settings: MachineSettingEntry[] = parseJsonArray(setup.settings);
  const filledSettings = settings.filter(s => s.value);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        mb: 0.75, py: 0.5, px: 1,
        borderLeft: 2, borderColor: 'info.main',
        borderRadius: '0 4px 4px 0', bgcolor: 'action.hover',
      }}
    >
      {setup.photo_base64 && (
        <Box
          component="img"
          src={setup.photo_base64}
          alt=""
          sx={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0 }}
        />
      )}
      <Settings sx={{ fontSize: 12, color: 'info.main', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.2, display: 'block', fontSize: '0.65rem' }} noWrap>
          {setup.machine_label}
        </Typography>
        {filledSettings.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.55rem', lineHeight: 1.2 }}>
            {filledSettings.map(s => `${s.key}: ${s.value}`).join(' · ')}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function ExerciseNoteReadonly({ exerciseId }: { exerciseId: string }) {
  const { data: noteRows } = useExerciseNote(exerciseId);
  const note = noteRows?.[0]?.notes;
  if (!note) return null;
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={0.75}
      sx={{
        mb: 1, py: 0.5, px: 1,
        borderLeft: 2, borderColor: 'primary.main',
        borderRadius: '0 4px 4px 0', bgcolor: 'action.hover',
      }}
    >
      <EditNote sx={{ fontSize: 14, color: 'primary.main', mt: 0.125, flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
        {note}
      </Typography>
    </Stack>
  );
}

function SessionNotesEditor({ sessionId, initialNotes }: { sessionId: string; initialNotes: string }) {
  const mutations = useWorkoutMutations();
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);

  // Sync from external changes (e.g. PowerSync remote sync)
  useEffect(() => { if (!editing) setNotes(initialNotes); }, [initialNotes, editing]);

  const handleSave = () => {
    const trimmed = notes.trim();
    if (trimmed !== initialNotes) {
      mutations.updateSessionNotes(sessionId, trimmed || null);
    }
    setEditing(false);
  };

  if (!editing && !notes.trim()) {
    return (
      <Card
        variant="outlined"
        onClick={() => setEditing(true)}
        sx={{
          mt: 2, cursor: 'pointer', py: 1.5,
          borderStyle: 'dashed', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
          '&:active': { bgcolor: 'action.hover' },
        }}
      >
        <EditNote sx={{ fontSize: 18, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          Ajouter une note de séance
        </Typography>
      </Card>
    );
  }

  if (!editing) {
    return (
      <Card sx={{ mt: 2, cursor: 'pointer' }} onClick={() => setEditing(true)}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
            <EditNote sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>Note de séance</Typography>
          </Stack>
          <Typography variant="body2" sx={{ pl: 3 }}>{notes}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
          <EditNote sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>Note de séance</Typography>
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          size="small"
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSave}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
            '& .MuiInputBase-input': { fontSize: '0.85rem' },
          }}
        />
      </CardContent>
    </Card>
  );
}

export default function SessionDetailPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      }
    >
      <SessionDetailContent />
    </Suspense>
  );
}
