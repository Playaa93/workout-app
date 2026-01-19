'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentSessions, startWorkoutSession, type WorkoutSession } from './actions';

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getRecentSessions();
      setSessions(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const sessionId = await startWorkoutSession();
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-neutral-800 flex items-center gap-4">
        <a href="/" className="text-neutral-400 hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold">Entraînement</h1>
      </header>

      {/* Start Workout Button */}
      <div className="p-4">
        <button
          onClick={handleStartWorkout}
          disabled={isStarting}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
        >
          {isStarting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Démarrage...
            </>
          ) : (
            <>
              <span className="text-xl">🏋️</span>
              Nouvelle séance
            </>
          )}
        </button>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 px-4 pb-4">
        <h2 className="text-lg font-semibold mb-3">Historique</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🏃</span>
            <p className="text-neutral-400">Aucune séance pour l'instant</p>
            <p className="text-neutral-500 text-sm mt-1">Commence ta première séance !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const date = new Date(session.startedAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isComplete = !!session.endedAt;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;

  return (
    <div className="p-4 bg-neutral-900 rounded-xl">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium capitalize">{formattedDate}</p>
          <p className="text-sm text-neutral-400">{formattedTime}</p>
        </div>
        {!isComplete && (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            En cours
          </span>
        )}
      </div>

      {isComplete && (
        <div className="flex gap-4 mt-3 text-sm">
          <div>
            <span className="text-neutral-400">Durée</span>
            <p className="font-medium">{session.durationMinutes} min</p>
          </div>
          <div>
            <span className="text-neutral-400">Volume</span>
            <p className="font-medium">{volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`}</p>
          </div>
        </div>
      )}

      {!isComplete && (
        <a
          href={`/workout/active?id=${session.id}`}
          className="mt-3 block text-center py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
        >
          Reprendre
        </a>
      )}
    </div>
  );
}
