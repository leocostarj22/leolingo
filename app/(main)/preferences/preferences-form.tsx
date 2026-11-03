"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ENGLISH_LEVEL_OPTIONS, LEARNING_GOAL_OPTIONS } from "@/lib/profile-options";
import type { EnglishLevel, LearningGoal } from "@/lib/profile-options";
import { Button } from "@/components/ui/button";
import { updateLearningPreferences } from "@/actions/user-progress";

type Props = {
  initialEnglishLevel: EnglishLevel | null;
  initialLearningGoal: LearningGoal | null;
};

const toggleButtonClasses = (isActive: boolean) =>
  cn(
    "rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors",
    isActive
      ? "border-sky-500 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
  );

export const PreferencesForm = ({ initialEnglishLevel, initialLearningGoal }: Props) => {
  const [pending, startTransition] = useTransition();
  const [englishLevel, setEnglishLevel] = useState(initialEnglishLevel);
  const [learningGoal, setLearningGoal] = useState(initialLearningGoal);

  const hasChanges = englishLevel !== initialEnglishLevel || learningGoal !== initialLearningGoal;

  const onSave = () => {
    if (!hasChanges || pending) return;

    const confirmed = window.confirm(
      "Mudar o objetivo ou o nível vai mostrar unidades diferentes em \"Aprender\". O teu progresso, corações e pontos ficam guardados. Continuar?",
    );

    if (!confirmed) return;

    startTransition(() => {
      updateLearningPreferences({ englishLevel, learningGoal })
        .then(() => toast.success("Preferências atualizadas."))
        .catch(() => toast.error("Não foi possível guardar as preferências."));
    });
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-extrabold text-slate-800">Objetivo e nível</h1>
      <p className="mt-2 text-sm text-slate-500">
        Isto decide quais unidades aparecem em &quot;Aprender&quot;.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <span className="mb-1 block text-sm font-semibold text-slate-600">
            Nível atual de inglês
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ENGLISH_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={englishLevel === option.value}
                disabled={pending}
                onClick={() => setEnglishLevel(option.value)}
                className={toggleButtonClasses(englishLevel === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold text-slate-600">
            Objetivo de aprendizagem
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LEARNING_GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={learningGoal === option.value}
                disabled={pending}
                onClick={() => setLearningGoal(option.value)}
                className={toggleButtonClasses(learningGoal === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        variant="secondary"
        disabled={pending || !hasChanges}
        onClick={onSave}
        className="mt-6 w-full rounded-full"
      >
        Guardar
      </Button>
    </div>
  );
};
