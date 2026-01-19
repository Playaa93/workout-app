'use client';

import { useState, useEffect } from 'react';
import { Questionnaire } from './questionnaire';
import { Results } from './results';
import {
  getMorphoQuestions,
  getMorphoProfile,
  type MorphoQuestion,
  type MorphotypeResult,
} from './actions';

type ViewState = 'loading' | 'intro' | 'questionnaire' | 'results';

export default function MorphologyPage() {
  const [view, setView] = useState<ViewState>('loading');
  const [questions, setQuestions] = useState<MorphoQuestion[]>([]);
  const [result, setResult] = useState<MorphotypeResult | null>(null);

  useEffect(() => {
    async function init() {
      // Check if user already has a profile
      const existingProfile = await getMorphoProfile();

      if (existingProfile) {
        // Convert profile to result format
        setResult({
          primary: existingProfile.primaryMorphotype as MorphotypeResult['primary'],
          secondary: existingProfile.secondaryMorphotype as MorphotypeResult['secondary'],
          scores: existingProfile.morphotypeScore as MorphotypeResult['scores'],
          strengths: existingProfile.strengths || [],
          weaknesses: existingProfile.weaknesses || [],
          recommendedExercises: existingProfile.recommendedExercises || [],
          exercisesToAvoid: existingProfile.exercisesToAvoid || [],
        });
        setView('results');
      } else {
        // Load questions for new users
        const qs = await getMorphoQuestions();
        setQuestions(qs);
        setView('intro');
      }
    }

    init();
  }, []);

  const handleStartQuestionnaire = async () => {
    if (questions.length === 0) {
      const qs = await getMorphoQuestions();
      setQuestions(qs);
    }
    setView('questionnaire');
  };

  const handleComplete = (morphoResult: MorphotypeResult) => {
    setResult(morphoResult);
    setView('results');
  };

  const handleRetake = async () => {
    const qs = await getMorphoQuestions();
    setQuestions(qs);
    setResult(null);
    setView('intro');
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
        <h1 className="text-lg font-semibold">Analyse Morphologique</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        {view === 'loading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {view === 'intro' && <IntroView onStart={handleStartQuestionnaire} />}

        {view === 'questionnaire' && questions.length > 0 && (
          <Questionnaire questions={questions} onComplete={handleComplete} />
        )}

        {view === 'results' && result && (
          <Results result={result} onRetake={handleRetake} />
        )}
      </div>
    </main>
  );
}

function IntroView({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <span className="text-6xl mb-6">🧬</span>
      <h2 className="text-2xl font-bold mb-4">Découvre ton morphotype</h2>
      <p className="text-neutral-400 mb-8 max-w-md leading-relaxed">
        Basé sur les travaux de <strong className="text-white">Delavier</strong> et{' '}
        <strong className="text-white">Gundill</strong>, ce questionnaire analyse ta
        morphologie pour te recommander les exercices les plus adaptés à ton corps.
      </p>

      <div className="w-full max-w-md space-y-4 mb-8">
        <InfoCard
          emoji="⏱️"
          title="2-3 minutes"
          description="8 questions simples"
        />
        <InfoCard
          emoji="🎯"
          title="Personnalisé"
          description="Exercices adaptés à ton corps"
        />
        <InfoCard
          emoji="💪"
          title="Scientifique"
          description="Basé sur l'anatomie fonctionnelle"
        />
      </div>

      <button
        onClick={onStart}
        className="w-full max-w-md py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all"
      >
        Commencer l'analyse
      </button>
    </div>
  );
}

function InfoCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-neutral-900 rounded-xl text-left">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
    </div>
  );
}
