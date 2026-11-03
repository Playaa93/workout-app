import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { readSetRest, remainingSeconds, saveSetRest, type SetRest } from '@/lib/rest-timer-storage';

type AlertPermission = NotificationPermission | 'unavailable';

function getPermission(): AlertPermission {
  if (typeof window === 'undefined' || !('Notification' in window) ||
      !('serviceWorker' in navigator) || typeof ServiceWorkerRegistration === 'undefined' ||
      !('showNotification' in ServiceWorkerRegistration.prototype)) {
    return 'unavailable';
  }
  return Notification.permission;
}

function useAlertPreference(name: string, fallback: boolean) {
  const key = `workout.rest.${name}`;
  const [enabled, setEnabled] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === 'true';
    } catch { return fallback; }
  });
  const update = (value: boolean) => {
    setEnabled(value);
    try { localStorage.setItem(key, String(value)); } catch { /* Session-only preference. */ }
  };
  return [enabled, update] as const;
}

export function useRestTimer(storageKey: string, accountAllowsNotifications: boolean, canResumeSet: (id: string) => boolean) {
  const [initialRest] = useState(() => {
    const saved = readSetRest(storageKey);
    return saved && canResumeSet(saved.setId) ? saved : null;
  });
  const [remaining, setRemaining] = useState(() => remainingSeconds(initialRest));
  const [finished, setFinished] = useState(initialRest !== null && remaining === 0);
  const currentRest = useRef(remaining > 0 ? initialRest : null);
  const [sound, setSound] = useAlertPreference('sound', false);
  const [vibration, setVibration] = useAlertPreference('vibration', true);
  const [allowNotification, saveNotification] = useAlertPreference('notification', true);
  const [permission, setPermission] = useState(getPermission);
  const notifications = accountAllowsNotifications && allowNotification && permission === 'granted';
  const audio = useRef<HTMLAudioElement | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const delegatedEnd = useRef(0);
  const isRunning = remaining > 0;

  // Only the owning hidden tab delegates its deadline. A new message replaces
  // the previous one, including when the worker first becomes ready mid-rest.
  const syncNotification = useCallback(() => {
    const worker = registration.current?.active;
    if (!worker) return;
    const deadline = currentRest.current?.endTime ?? 0;
    const shouldArm = accountAllowsNotifications && allowNotification && getPermission() === 'granted' &&
      document.visibilityState === 'hidden' && deadline > Date.now();
    const endTime = shouldArm ? deadline : 0;
    if (delegatedEnd.current === endTime) return;
    worker.postMessage({
      type: 'REST_TIMER_DEADLINE',
      endTime,
      sessionId: new URLSearchParams(location.search).get('id'),
    });
    delegatedEnd.current = endTime;
  }, [accountAllowsNotifications, allowNotification]);
  const syncOnReady = useEffectEvent(syncNotification);

  useEffect(() => {
    // An expired or invalid saved rest is consumed once, without replaying feedback.
    if (!currentRest.current) saveSetRest(storageKey, null);
    let mounted = true;
    const onControllerChange = () => {
      delegatedEnd.current = 0;
      syncOnReady();
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then((reg) => {
        if (mounted) {
          registration.current = reg;
          syncOnReady();
        }
      }).catch(() => {});
    }
    return () => {
      mounted = false;
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      if (delegatedEnd.current) registration.current?.active?.postMessage({ type: 'REST_TIMER_DEADLINE', endTime: 0 });
      delegatedEnd.current = 0;
      registration.current = null;
      audio.current?.pause();
    };
  }, [storageKey]);

  const tick = useEffectEvent((playFeedback: boolean) => {
    const rest = currentRest.current;
    if (!rest || document.visibilityState !== 'visible') return;
    const seconds = remainingSeconds(rest);
    setRemaining(seconds);
    if (seconds > 0) return;
    currentRest.current = null;
    saveSetRest(storageKey, null);
    setFinished(true);
    if (!playFeedback) return;
    if (vibration && 'vibrate' in navigator) navigator.vibrate([150, 80, 150]);
    if (sound) {
      audio.current ??= new Audio('/sounds/beep.wav');
      audio.current.volume = 0.7;
      audio.current.play().catch(() => {});
    }
  });

  useEffect(() => {
    if (!isRunning) return;
    let active = true;
    let acquiring = false;
    let lock: WakeLockSentinel | undefined;
    const keepScreenOn = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' ||
          !currentRest.current || acquiring || (lock && !lock.released)) return;
      acquiring = true;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (!active) await lock.release();
      } catch { /* A wake lock is optional. */ }
      finally { acquiring = false; }
    };
    let interval: ReturnType<typeof setInterval> | undefined;
    const onVisibility = () => {
      clearInterval(interval);
      tick(false);
      syncNotification();
      if (document.visibilityState === 'visible' && currentRest.current) {
        void keepScreenOn();
        interval = setInterval(() => tick(true), 250);
      }
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [isRunning, syncNotification, permission]);

  const setRest = useCallback((rest: SetRest | null) => {
    currentRest.current = rest;
    saveSetRest(storageKey, rest);
    syncNotification();
    setRemaining(remainingSeconds(rest));
    setFinished(false);
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
  }, [storageKey, syncNotification]);
  const stop = () => setRest(null);
  const start = (setId: string, duration: number) => {
    setRest(duration > 0 ? { setId, duration, endTime: Date.now() + duration * 1000 } : null);
  };
  const adjust = (delta: number) => {
    const rest = currentRest.current;
    if (!rest || rest.endTime <= Date.now()) return;
    const duration = Math.max(0, rest.duration + delta);
    const endTime = rest.endTime + delta * 1000;
    setRest(endTime > Date.now() ? { ...rest, duration, endTime } : null);
    return { setId: rest.setId, duration };
  };

  const setNotifications = async (enabled: boolean) => {
    let current = getPermission();
    if (enabled && !accountAllowsNotifications) return;
    if (enabled && current === 'default') {
      try { current = await Notification.requestPermission(); }
      catch { current = 'unavailable'; }
    }
    setPermission(current);
    saveNotification(enabled && current === 'granted');
  };

  return {
    remaining, isRunning, finished, sound, vibration, notifications, permission,
    accountAllowsNotifications, setSound, setVibration, setNotifications, start, stop, adjust,
    refreshPermission: () => setPermission(getPermission()),
  };
}
