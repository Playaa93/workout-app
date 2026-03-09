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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a09] dark:bg-[#0a0a09]">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#f5f0e6] tracking-tight">
          Oups, quelque chose s&apos;est mal pass&eacute;
        </h2>
        <p className="text-[#6b655c] text-sm leading-relaxed">
          Une erreur inattendue est survenue. R&eacute;essaie ou retourne &agrave; l&apos;accueil.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#e8c860] text-[#1a1715] rounded-xl text-sm font-semibold transition-colors"
          >
            R&eacute;essayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white/7 hover:bg-white/10 border border-white/10 text-[#f5f0e6] rounded-xl text-sm font-medium transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
