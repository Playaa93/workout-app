import { useRestTimer } from './useRestTimer';
import { useUserSettings } from '@/powersync/queries/profile-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';

export function useSetRestTimer(storageKey: string, canResumeSet: (id: string) => boolean) {
  const { data: settings, isLoading } = useUserSettings();
  const { updateSetRestTaken } = useWorkoutMutations();
  const { start, stop, adjust, ...timer } = useRestTimer(storageKey, !isLoading && settings[0]?.notifications_enabled !== 0, canResumeSet);

  const adjustForSet = (delta: number) => {
    const adjusted = adjust(delta);
    if (adjusted) void updateSetRestTaken(adjusted.setId, adjusted.duration);
  };

  return { ...timer, startForSet: start, stopForSet: stop, adjustForSet };
}
