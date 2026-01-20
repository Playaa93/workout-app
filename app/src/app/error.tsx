'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">😅</div>
        <h2 className="text-xl font-semibold">Oups, quelque chose s&apos;est mal passé</h2>
        <p className="text-neutral-400 text-sm max-w-sm">
          Une erreur inattendue est survenue. Réessaie ou retourne à l&apos;accueil.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
