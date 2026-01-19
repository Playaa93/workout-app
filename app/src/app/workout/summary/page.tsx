'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SummaryContent() {
  const searchParams = useSearchParams();

  const xp = parseInt(searchParams.get('xp') || '0');
  const volume = parseFloat(searchParams.get('volume') || '0');
  const duration = parseInt(searchParams.get('duration') || '0');
  const prs = parseInt(searchParams.get('prs') || '0');

  const volumeDisplay = volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Celebration */}
      <div className="mb-8">
        <span className="text-7xl block mb-4">🎉</span>
        <h1 className="text-3xl font-bold mb-2">Séance terminée !</h1>
        <p className="text-neutral-400">Bravo, continue comme ça</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        <StatCard
          icon="⏱️"
          label="Durée"
          value={`${duration} min`}
        />
        <StatCard
          icon="🏋️"
          label="Volume"
          value={volumeDisplay}
        />
        <StatCard
          icon="⭐"
          label="XP gagné"
          value={`+${xp}`}
          highlight
        />
        {prs > 0 && (
          <StatCard
            icon="🏆"
            label="Records"
            value={prs.toString()}
            highlight
          />
        )}
      </div>

      {/* XP Animation */}
      <div className="mb-8 p-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-2xl border border-violet-500/30">
        <p className="text-violet-300 text-sm mb-1">Expérience gagnée</p>
        <p className="text-4xl font-bold text-violet-400">+{xp} XP</p>
      </div>

      {/* PR Celebration */}
      {prs > 0 && (
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl border border-amber-500/30">
          <p className="text-amber-300 text-sm mb-1">
            {prs === 1 ? 'Nouveau record personnel !' : `${prs} nouveaux records !`}
          </p>
          <p className="text-2xl">🏆🔥</p>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/workout"
          className="block w-full py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
        >
          Voir l'historique
        </Link>
        <Link
          href="/"
          className="block w-full py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SummaryContent />
    </Suspense>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl ${
        highlight ? 'bg-violet-900/30 border border-violet-700' : 'bg-neutral-900'
      }`}
    >
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-neutral-400 text-sm">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-violet-400' : ''}`}>{value}</p>
    </div>
  );
}
