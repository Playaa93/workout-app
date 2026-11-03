'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import { readSetRest, saveSetRest } from '@/lib/rest-timer-storage';
import WorkoutEditor from '../WorkoutEditor';
import { EditorContext, ExerciseData, emptyDetails, type EditorActions, type ScopeProps } from '../editor-context';
import { getEditorSession, getEditorPreferences, getExerciseDetails } from './reads';
import { changeEditorSession, finishEditorSession, saveEditorSet } from './writes';

type Snapshot = NonNullable<Awaited<ReturnType<typeof getEditorSession>>>;
type Preferences = Awaited<ReturnType<typeof getEditorPreferences>>;
const Revision = createContext(0);

function OnlineExerciseData({ exerciseId, machineId, children }: ScopeProps) {
  const revision = useContext(Revision);
  const [details, setDetails] = useState(emptyDetails);
  useEffect(() => {
    let active = true;
    getExerciseDetails(exerciseId, machineId).then(data => { if (active) setDetails(data); },
      () => { if (active) setDetails(emptyDetails); });
    return () => { active = false; };
  }, [exerciseId, machineId, revision]);
  return <ExerciseData.Provider value={details}>{children}</ExerciseData.Provider>;
}

export default function OnlineEditor({ initial, preferences, userId }: {
  initial: Snapshot; preferences: Preferences; userId: string;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const serial = useRef(0);
  const id = initial.session.id;
  // Read the saved rest deadline and alert preferences on the device.
  const storageKey = `workout.rest.v1.${userId}.${id}`;
  useEffect(() => {
    // Older links to a recorded set carried its running timer in the URL.
    const url = new URL(window.location.href);
    const saved = url.searchParams.get('saved');
    if (saved) {
      const set = initial.sets.find(s => s.id === saved);
      const endTime = set?.performedAt && set.performedAt.getTime() + (set.restTaken ?? 0) * 1000;
      if (set?.restTaken && endTime && endTime > Date.now() && !readSetRest(storageKey)) {
        saveSetRest(storageKey, { setId: set.id, endTime, duration: set.restTaken });
      }
      url.searchParams.delete('saved');
      history.replaceState(history.state, '', url);
    }
    setMounted(true);
  }, [initial, storageKey]);
  const actions = useMemo<EditorActions>(() => {
    async function update<T>(write: () => Promise<T>) {
      setError('');
      try {
        const result = await write();
        const sequence = ++serial.current;
        const next = await getEditorSession(id);
        if (!next) throw new Error('Séance indisponible');
        if (serial.current === sequence) {
          setSnapshot(next);
          setRevision(n => n + 1);
        }
        return result;
      } catch (err) {
        setError('Enregistrement à vérifier. Réessaie quand la connexion est disponible.');
        throw err;
      }
    }
    const change = (operation: Parameters<typeof changeEditorSession>[1]) => update(() => changeEditorSession(id, operation));
    return {
      addSet: (_session, exerciseId, _number, reps, weight, rpe, warmup = false, rest = 90, machine, note, submission) => update(async () => {
        const saved = await saveEditorSet(id, exerciseId, submission || crypto.randomUUID(), reps, weight, rest, warmup, rpe, machine, note);
        if (!saved) throw new Error('Série indisponible');
        return saved;
      }),
      updateSet: (setId, reps, weight) => change({ kind: 'edit-set', id: setId, reps, weight }),
      deleteSet: setId => change({ kind: 'remove-set', id: setId }),
      updateSetRestTaken: (setId, duration) => change({ kind: 'rest', id: setId, duration }),
      updateSetNotes: (setId, note) => change({ kind: 'set-note', id: setId, note }),
      updateSessionNotes: (_session, note) => change({ kind: 'session-note', note }),
      swapTemplateExercise: (_template, previous, exerciseId) => change({ kind: 'swap', previous, exerciseId }),
      upsertExerciseNote: (exerciseId, note) => change({ kind: 'exercise-note', exerciseId, note }),
      saveMachineSetup: async data => {
        const setupId = data.id || crypto.randomUUID();
        await change({ ...data, kind: 'save-machine', id: setupId });
        return setupId;
      },
      deleteMachineSetup: setupId => change({ kind: 'remove-machine', id: setupId }),
      endWorkoutSession: async () => {
        const result = await finishEditorSession(id);
        if (!result) { window.location.reload(); throw new Error('Séance déjà terminée'); }
        return result;
      },
    };
  }, [id]);

  const exercises = useMemo(() => new Map(preferences.catalog.map(ex => [ex.id, ex])), [preferences.catalog]);
  const session = useMemo(() => ({ session: snapshot.session, sets: snapshot.sets, exercises }), [snapshot, exercises]);
  if (!mounted) return <main style={{ padding: '1rem' }}>
    <p role="status">Ouverture de la séance…</p>
    <a href={`?id=${id}&simple=1`}>Continuer sans JavaScript</a>
  </main>;
  return <EditorContext.Provider value={{ actions, Scope: OnlineExerciseData, onFinished: () => window.location.reload() }}>
    <Revision.Provider value={revision}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <WorkoutEditor storageKey={storageKey} session={session} exercises={preferences.catalog}
        templateId={snapshot.session.templateId} templateExercises={snapshot.plan} morphotype={preferences.morphotype}
        notificationsAllowed={preferences.notificationsAllowed} />
    </Revision.Provider>
  </EditorContext.Provider>;
}
