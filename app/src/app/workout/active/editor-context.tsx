'use client';

import { createContext, useContext, useState, type ComponentType, type ReactNode } from 'react';
import type { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import type { MachineSetup, WorkoutSet } from '../types';

export type EditorActions = Pick<ReturnType<typeof useWorkoutMutations>,
  'addSet' | 'updateSet' | 'deleteSet' | 'updateSetNotes' | 'updateSetRestTaken' | 'endWorkoutSession' |
  'upsertExerciseNote' | 'updateSessionNotes' | 'swapTemplateExercise' | 'saveMachineSetup' | 'deleteMachineSetup'>;
export type ScopeProps = { exerciseId: string; machineId: string | null; children: ReactNode };
export const EditorContext = createContext<{ actions: EditorActions; Scope: ComponentType<ScopeProps>; onFinished?: () => void } | null>(null);
export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('Éditeur de séance indisponible');
  return ctx;
}
type Details = { previousSets: WorkoutSet[]; setups: MachineSetup[]; note: string };
export const emptyDetails: Details = { previousSets: [], setups: [], note: '' };
export const ExerciseData = createContext<Details>(emptyDetails);
const MachineSelection = createContext<{ machineId: string | null; setMachineId: (id: string | null) => void } | null>(null);
export function useExerciseData() {
  const details = useContext(ExerciseData);
  const selection = useContext(MachineSelection);
  if (!selection) throw new Error('Exercice indisponible');
  return { ...details, ...selection };
}
export function ExerciseScope({ exerciseId, children }: { exerciseId: string; children: ReactNode }) {
  const { Scope } = useEditor();
  const [machineId, setMachineId] = useState<string | null>(null);
  return <MachineSelection.Provider value={{ machineId, setMachineId }}>
    <Scope exerciseId={exerciseId} machineId={machineId}>{children}</Scope>
  </MachineSelection.Provider>;
}
