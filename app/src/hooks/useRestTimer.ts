import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

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

export function useRestTimer(accountAllowsNotifications: boolean) {
  const [remaining, setRemaining] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sound, setSound] = useAlertPreference('sound', false);
  const [vibration, setVibration] = useAlertPreference('vibration', true);
  const [allowNotification, saveNotification] = useAlertPreference('notification', true);
  const [permission, setPermission] = useState(getPermission);
  const notifications = accountAllowsNotifications && allowNotification && permission === 'granted';
  const deadline = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const delegatedEnd = useRef(0);
  const isRunning = remaining > 0;

  // Only the owning hidden tab delegates its deadline. A new message replaces
  // the previous one, including when the worker first becomes ready mid-rest.
  const syncNotification = useCallback(() => {
    const worker = registration.current?.active;
    if (!worker) return;
    const shouldArm = accountAllowsNotifications && allowNotification && getPermission() === 'granted' &&
      document.visibilityState === 'hidden' && deadline.current > Date.now();
    const endTime = shouldArm ? deadline.current : 0;
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
  }, []);

  const tick = useEffectEvent((playFeedback: boolean) => {
    if (!deadline.current || document.visibilityState !== 'visible') return;
    const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
    setRemaining(seconds);
    if (seconds > 0) return;
    deadline.current = 0;
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
          !deadline.current || acquiring || (lock && !lock.released)) return;
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
      if (document.visibilityState === 'visible' && deadline.current) {
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

  const setDeadline = useCallback((end: number) => {
    deadline.current = end;
    syncNotification();
    setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    setFinished(false);
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
  }, [syncNotification]);
  const stop = useCallback(() => setDeadline(0), [setDeadline]);
  const start = (duration = 90) => setDeadline(duration > 0 ? Date.now() + duration * 1000 : 0);
  const adjust = (delta: number) => {
    if (!deadline.current) return;
    const end = deadline.current + delta * 1000;
    setDeadline(end > Date.now() ? end : 0);
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

export type RestTimerState = ReturnType<typeof useRestTimer>;
