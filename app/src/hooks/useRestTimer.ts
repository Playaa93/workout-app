import { useState, useEffect, useCallback, useRef } from 'react';

export interface RestTimerState {
  remaining: number;
  isRunning: boolean;
  sound: boolean;
  vibration: boolean;
  setSound: (v: boolean) => void;
  setVibration: (v: boolean) => void;
  start: (duration?: number) => void;
  stop: () => void;
  adjust: (deltaSeconds: number) => void;
}

const DEFAULT_REST_SECONDS = 90;

// ── Service Worker helpers ───────────────────────────────────

function scheduleTimerNotification(endTime: number) {
  navigator.serviceWorker?.controller?.postMessage({ type: 'SCHEDULE_TIMER_NOTIFICATION', endTime });
}

function cancelTimerNotification() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'CANCEL_TIMER_NOTIFICATION' });
}

function dismissSwNotification() {
  navigator.serviceWorker?.ready.then((reg) => {
    reg.getNotifications({ tag: 'rest-timer' }).then((notifs) => {
      notifs.forEach((n) => n.close());
    });
  }).catch(() => {});
}

// ── Hook ─────────────────────────────────────────────────────

export function useRestTimer(): RestTimerState {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const endRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const notifRequested = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio helpers ──

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }, []);

  const startSilentAudioLoop = useCallback(() => {
    try {
      const audio = getAudio();
      audio.pause();
      audio.src = '/sounds/silence.wav';
      audio.loop = true;
      audio.volume = 0.01;
      audio.onended = null;
      audio.play().catch(() => {});
    } catch { /* audio not supported */ }
  }, [getAudio]);

  const stopSilentAudioLoop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.loop = false;
      audioRef.current.onended = null;
    }
  }, []);

  const playBeepAudio = useCallback(() => {
    try {
      const audio = getAudio();
      audio.pause();
      audio.src = '/sounds/beep.wav';
      audio.loop = false;
      audio.volume = 0.7;
      audio.onended = () => stopSilentAudioLoop();
      audio.play().catch(() => {});
    } catch { /* audio not supported */ }
  }, [getAudio, stopSilentAudioLoop]);

  // ── End timer (shared logic for tick + visibility catch-up) ──

  const endTimer = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    endRef.current = 0;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false);
    setRemaining(0);

    if (vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    if (sound) playBeepAudio();
    else stopSilentAudioLoop();

    dismissSwNotification();
  }, [sound, vibration, playBeepAudio, stopSilentAudioLoop]);

  // ── Countdown tick — absolute time, immune to throttling ──

  useEffect(() => {
    if (!isRunning) return;
    firedRef.current = false;
    const tick = () => {
      const r = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) endTimer();
    };
    tick();
    intervalRef.current = setInterval(tick, 250);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isRunning, endTimer]);

  // ── Visibility change: catch-up + wake lock re-acquire (single listener) ──

  useEffect(() => {
    const onVisChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Catch-up: timer expired while in background
      if (endRef.current > 0 && Date.now() >= endRef.current) {
        endTimer();
      }

      // Dismiss stale notification only if a timer was involved
      if (firedRef.current) dismissSwNotification();

      // Re-acquire wake lock (iOS releases on tab switch)
      if (isRunning && !wakeLockRef.current && 'wakeLock' in navigator) {
        try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch { /* ignored */ }
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [isRunning, endTimer]);

  // ── Wake Lock — keep screen on ──

  useEffect(() => {
    if (!isRunning) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }
    let active = true;
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          if (active) wakeLockRef.current = lock;
          else lock.release();
        }
      } catch { /* not supported or denied */ }
    };
    acquire();
    return () => { active = false; wakeLockRef.current?.release().catch(() => {}); };
  }, [isRunning]);

  // ── Start ──

  const start = useCallback((duration?: number) => {
    const seconds = duration || DEFAULT_REST_SECONDS;
    endRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setIsRunning(true);

    if (sound) startSilentAudioLoop();
    scheduleTimerNotification(endRef.current);

    if (!notifRequested.current && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
      notifRequested.current = true;
    }
  }, [sound, startSilentAudioLoop]);

  // ── Stop ──

  const stop = useCallback(() => {
    setIsRunning(false);
    setRemaining(0);
    endRef.current = 0;
    stopSilentAudioLoop();
    cancelTimerNotification();
  }, [stopSilentAudioLoop]);

  // ── Adjust ──

  const adjust = useCallback((deltaSeconds: number) => {
    if (deltaSeconds < 0 && endRef.current - Date.now() <= Math.abs(deltaSeconds) * 1000) {
      setIsRunning(false);
      setRemaining(0);
      endRef.current = 0;
      stopSilentAudioLoop();
      cancelTimerNotification();
    } else {
      endRef.current += deltaSeconds * 1000;
      scheduleTimerNotification(endRef.current);
    }
  }, [stopSilentAudioLoop]);

  return { remaining, isRunning, sound, vibration, setSound, setVibration, start, stop, adjust };
}
