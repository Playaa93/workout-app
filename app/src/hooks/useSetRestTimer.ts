import { useRestTimer } from './useRestTimer';

export function useSetRestTimer(storageKey: string, canResumeSet: (id: string) => boolean,
  notificationsAllowed: boolean, updateSetRestTaken: (id: string, seconds: number) => Promise<void>) {
  const { start, stop, adjust, ...timer } = useRestTimer(storageKey, notificationsAllowed, canResumeSet);

  const adjustForSet = (delta: number) => {
    const adjusted = adjust(delta);
    if (adjusted) void updateSetRestTaken(adjusted.setId, adjusted.duration);
  };

  return { ...timer, startForSet: start, stopForSet: stop, adjustForSet };
}
