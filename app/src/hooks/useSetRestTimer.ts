import { useEffect, useRef, useCallback } from 'react';
import { useRestTimer, type RestTimerState } from './useRestTimer';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';

export interface SetRestTimerState extends RestTimerState {
  /** Start the timer for a specific set */
  startForSet: (setId: string, duration: number) => void;
  /** Adjust timer and persist rest_taken for the tracked set */
  adjustForSet: (deltaSeconds: number) => void;
  /** Stop timer and clear set tracking */
  stopForSet: () => void;
}

export function useSetRestTimer(): SetRestTimerState {
  const timer = useRestTimer();
  const mutations = useWorkoutMutations();
  const setIdRef = useRef<string | null>(null);
  const restDurationRef = useRef(0);

  // Clear set tracking when timer stops (natural finish or manual stop)
  useEffect(() => {
    if (!timer.isRunning) {
      setIdRef.current = null;
    }
  }, [timer.isRunning]);

  const startForSet = useCallback((setId: string, duration: number) => {
    setIdRef.current = setId;
    restDurationRef.current = duration;
    timer.start(duration);
  }, [timer]);

  const adjustForSet = useCallback((deltaSeconds: number) => {
    timer.adjust(deltaSeconds);
    if (setIdRef.current) {
      restDurationRef.current = Math.max(0, restDurationRef.current + deltaSeconds);
      mutations.updateSetRestTaken(setIdRef.current, restDurationRef.current);
    }
  }, [timer, mutations]);

  const stopForSet = useCallback(() => {
    timer.stop();
    setIdRef.current = null;
  }, [timer]);

  return {
    ...timer,
    startForSet,
    adjustForSet,
    stopForSet,
  };
}
