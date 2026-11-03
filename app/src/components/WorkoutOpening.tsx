'use client';

import { useEffect } from 'react';

export default function WorkoutOpening({ sessionId }: { sessionId?: string | null }) {
  const href = '/workout/active/en-ligne' + (sessionId ? '?id=' + encodeURIComponent(sessionId) : '');
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (navigator.onLine) location.replace(href);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [href]);

  return <main style={{ maxWidth: '32rem', padding: '2rem 1.25rem', margin: 'auto' }}>
    <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Reprendre la séance</h1>
    <p role="status" style={{ margin: '1rem 0' }}>Ouverture de tes exercices et de tes séries…</p>
    <a href={href} style={{ display: 'inline-block', padding: '.75rem 1rem', color: '#171510', background: '#d4af37', borderRadius: '.7rem' }}>
      Ouvrir la séance en ligne
    </a>
    <p style={{ marginTop: '1rem' }}><a href="/workout">Mes séances</a></p>
  </main>;
}
