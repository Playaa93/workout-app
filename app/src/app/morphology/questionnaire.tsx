'use client';

import { useState } from 'react';
import { type MorphoQuestion, type MorphotypeResult, calculateMorphotype, saveMorphoProfile } from './actions';

type Props = {
  questions: MorphoQuestion[];
  onComplete: (result: MorphotypeResult) => void;
};

export function Questionnaire({ questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.questionKey]: value };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      // Small delay for visual feedback
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      // Last question - calculate result
      setIsCalculating(true);
      try {
        const result = await calculateMorphotype(newAnswers);
        await saveMorphoProfile(newAnswers, result);
        onComplete(result);
      } catch (error) {
        console.error('Error calculating morphotype:', error);
        setIsCalculating(false);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400">Analyse en cours...</p>
      </div>
    );
  }

  const options = currentQuestion.options as Array<{
    label: string;
    value: string;
  }>;

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-neutral-400 mb-2">
          <span>Question {currentIndex + 1}/{questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-6 leading-relaxed">
          {currentQuestion.questionTextFr}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {Array.isArray(options) &&
            options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQuestion.questionKey] === option.value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800'
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>

        {/* Measurement input for measurement type questions */}
        {currentQuestion.questionType === 'measurement' && (
          <MeasurementInput
            question={currentQuestion}
            value={answers[currentQuestion.questionKey]}
            onChange={(value) => handleAnswer(value)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Retour
          </button>
        )}
      </div>
    </div>
  );
}

function MeasurementInput({
  question,
  value,
  onChange,
}: {
  question: MorphoQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const options = question.options as {
    unit: string;
    ranges: Array<{ label: string; value: string }>;
  };

  return (
    <div className="space-y-3">
      {options.ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
            value === range.value
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
