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

function playBeeps() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.25, 0.5].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not supported
  }
}

export function useRestTimer(): RestTimerState {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const endRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const notifRequested = useRef(false);

  // Alert on completion
  const fireAlert = useCallback(() => {
    if (vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    if (sound) playBeeps();
  }, [sound, vibration]);

  // Countdown tick — absolute time, immune to throttling
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      const r = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        setIsRunning(false);
        fireAlert();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Repos terminé !', { body: 'C\'est reparti 💪', icon: '/icon-192.png', tag: 'rest-timer' });
        }
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, fireAlert]);

  // Wake Lock — keep screen on
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

  // Re-acquire Wake Lock after visibility change (iOS releases on tab switch)
  useEffect(() => {
    if (!isRunning) return;
    const onVisChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch { /* ignored */ }
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [isRunning]);

  const start = useCallback((duration?: number) => {
    const seconds = duration || DEFAULT_REST_SECONDS;
    endRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setIsRunning(true);
    if (!notifRequested.current && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
      notifRequested.current = true;
    }
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setRemaining(0);
    endRef.current = 0;
  }, []);

  const adjust = useCallback((deltaSeconds: number) => {
    if (deltaSeconds < 0 && endRef.current - Date.now() <= Math.abs(deltaSeconds) * 1000) {
      // Would go to 0 or below — just stop
      setIsRunning(false);
      setRemaining(0);
      endRef.current = 0;
    } else {
      endRef.current += deltaSeconds * 1000;
    }
  }, []);

  return { remaining, isRunning, sound, vibration, setSound, setVibration, start, stop, adjust };
}
