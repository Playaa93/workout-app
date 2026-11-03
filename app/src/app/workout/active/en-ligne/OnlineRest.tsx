'use client';

import { useEffect, useState } from 'react';

export default function OnlineRest({ until, duration }: { until: number; duration: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) clearInterval(clock);
    };
    const clock = setInterval(tick, 500);
    tick();
    return () => clearInterval(clock);
  }, [until]);
  if (remaining === null) return <p>Repos de {duration} s</p>;
  return <p>{remaining ? `Repos · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : 'Repos terminé'}</p>;
}
