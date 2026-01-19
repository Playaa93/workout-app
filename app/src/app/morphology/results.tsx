'use client';

import { type MorphotypeResult } from './actions';

type Props = {
  result: MorphotypeResult;
  onRetake: () => void;
};

const morphotypeInfo: Record<
  string,
  { emoji: string; title: string; description: string; color: string }
> = {
  ectomorph: {
    emoji: '🦒',
    title: 'Ectomorphe',
    description:
      'Silhouette longiligne, métabolisme rapide. Tu as naturellement du mal à prendre du poids, mais tu gardes facilement une définition musculaire.',
    color: 'from-blue-500 to-cyan-500',
  },
  mesomorph: {
    emoji: '🦁',
    title: 'Mésomorphe',
    description:
      'Le morphotype athlétique par excellence. Tu prends du muscle facilement et tu as une bonne force naturelle.',
    color: 'from-amber-500 to-orange-500',
  },
  endomorph: {
    emoji: '🐻',
    title: 'Endomorphe',
    description:
      'Silhouette plus large, métabolisme lent. Tu as une grande force naturelle et tu prends du muscle facilement, mais le cardio est ton ami.',
    color: 'from-emerald-500 to-green-500',
  },
};

export function Results({ result, onRetake }: Props) {
  const primary = morphotypeInfo[result.primary];
  const secondary = result.secondary ? morphotypeInfo[result.secondary] : null;

  // Calculate percentage for visualization
  const total = result.scores.ecto + result.scores.meso + result.scores.endo;
  const percentages = {
    ecto: total > 0 ? Math.round((result.scores.ecto / total) * 100) : 33,
    meso: total > 0 ? Math.round((result.scores.meso / total) * 100) : 33,
    endo: total > 0 ? Math.round((result.scores.endo / total) * 100) : 34,
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div
        className={`p-6 rounded-2xl bg-gradient-to-br ${primary.color} text-white`}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{primary.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold">{primary.title}</h2>
            {secondary && (
              <p className="text-white/80 text-sm">
                avec tendance {secondary.title.toLowerCase()}
              </p>
            )}
          </div>
        </div>
        <p className="text-white/90 leading-relaxed">{primary.description}</p>
      </div>

      {/* Score Distribution */}
      <div className="p-4 rounded-xl bg-neutral-900">
        <h3 className="font-semibold mb-4">Répartition</h3>
        <div className="space-y-3">
          <ScoreBar label="Ectomorphe" value={percentages.ecto} color="bg-blue-500" />
          <ScoreBar label="Mésomorphe" value={percentages.meso} color="bg-amber-500" />
          <ScoreBar label="Endomorphe" value={percentages.endo} color="bg-emerald-500" />
        </div>
      </div>

      {/* Strengths */}
      <div className="p-4 rounded-xl bg-neutral-900">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>💪</span> Tes points forts
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.strengths.map((strength) => (
            <span
              key={strength}
              className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
            >
              {strength}
            </span>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="p-4 rounded-xl bg-neutral-900">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>🎯</span> Points à travailler
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.weaknesses.map((weakness) => (
            <span
              key={weakness}
              className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm"
            >
              {weakness}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Exercises */}
      <div className="p-4 rounded-xl bg-neutral-900">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>✅</span> Exercices recommandés
        </h3>
        <ul className="space-y-2">
          {result.recommendedExercises.map((exercise) => (
            <li key={exercise} className="flex items-center gap-2 text-neutral-300">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              {exercise}
            </li>
          ))}
        </ul>
      </div>

      {/* Exercises to Avoid */}
      <div className="p-4 rounded-xl bg-neutral-900">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>⚠️</span> À éviter
        </h3>
        <ul className="space-y-2">
          {result.exercisesToAvoid.map((exercise) => (
            <li key={exercise} className="flex items-center gap-2 text-neutral-400">
              <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
              {exercise}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <a
          href="/"
          className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-center transition-colors"
        >
          Commencer à s'entraîner
        </a>
        <button
          onClick={onRetake}
          className="py-3 px-4 border border-neutral-700 text-neutral-300 rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Refaire
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-300">{value}%</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
