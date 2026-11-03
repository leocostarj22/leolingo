"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENGLISH_LEVEL_OPTIONS, LEARNING_GOAL_OPTIONS } from "@/lib/profile-options";
import type { EnglishLevel, LearningGoal } from "@/lib/profile-options";
import {
  resetCourseProgress,
  resetLessonProgress,
  setAdminOverridePro,
  updateUserHeartsAndPoints,
  updateUserProfile,
} from "@/actions/admin";

type Gender = "MALE" | "FEMALE";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
];

type Lesson = {
  id: number;
  title: string;
  unitTitle: string;
};

type UserEditFormProps = {
  user: {
    userId: string;
    hearts: number;
    points: number;
    englishLevel: EnglishLevel | null;
    learningGoal: LearningGoal | null;
    gender: Gender | null;
    adminOverridePro: boolean;
    activeCourse: { id: number; title: string } | null;
  };
  lessons: Lesson[];
};

export const UserEditForm = ({ user, lessons }: UserEditFormProps) => {
  const [pending, startTransition] = useTransition();

  const [hearts, setHearts] = useState(String(user.hearts));
  const [points, setPoints] = useState(String(user.points));
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel | "">(
    user.englishLevel ?? "",
  );
  const [learningGoal, setLearningGoal] = useState<LearningGoal | "">(
    user.learningGoal ?? "",
  );
  const [gender, setGender] = useState<Gender | "">(user.gender ?? "");
  const [proOverride, setProOverride] = useState(user.adminOverridePro);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0] ? String(lessons[0].id) : "",
  );

  const onSaveHeartsAndPoints = () => {
    if (hearts.trim() === "" || points.trim() === "") {
      toast.error("Preenche os campos de corações e pontos.");
      return;
    }

    const heartsValue = Number(hearts);
    const pointsValue = Number(points);

    if (
      !Number.isInteger(heartsValue) || heartsValue < 0 ||
      !Number.isInteger(pointsValue) || pointsValue < 0
    ) {
      toast.error("Corações e pontos têm de ser números inteiros não negativos.");
      return;
    }

    startTransition(() => {
      updateUserHeartsAndPoints(user.userId, heartsValue, pointsValue)
        .then(() => toast.success("Corações e pontos atualizados."))
        .catch(() => toast.error("Não foi possível guardar corações e pontos."));
    });
  };

  const onSaveProfile = () => {
    startTransition(() => {
      updateUserProfile(user.userId, {
        englishLevel: englishLevel || null,
        learningGoal: learningGoal || null,
        gender: gender || null,
      })
        .then(() => toast.success("Perfil atualizado."))
        .catch(() => toast.error("Não foi possível guardar o perfil."));
    });
  };

  const onToggleProOverride = (enabled: boolean) => {
    setProOverride(enabled);

    startTransition(() => {
      setAdminOverridePro(user.userId, enabled)
        .then(() => toast.success("Pro simulado atualizado."))
        .catch(() => {
          setProOverride(!enabled);
          toast.error("Não foi possível atualizar o Pro simulado.");
        });
    });
  };

  const onResetLesson = () => {
    if (!selectedLessonId) return;

    if (!window.confirm("Repor o progresso desta lição? Esta ação não pode ser desfeita.")) {
      return;
    }

    startTransition(() => {
      resetLessonProgress(user.userId, Number(selectedLessonId))
        .then(() => toast.success("Progresso da lição reposto."))
        .catch(() => toast.error("Não foi possível repor o progresso da lição."));
    });
  };

  const onResetCourse = () => {
    if (!window.confirm("Repor TODO o progresso do curso ativo deste utilizador? Esta ação não pode ser desfeita.")) {
      return;
    }

    startTransition(() => {
      resetCourseProgress(user.userId)
        .then(() => toast.success("Progresso do curso reposto."))
        .catch(() => toast.error("Não foi possível repor o progresso do curso."));
    });
  };

  return (
    <div className="mt-6 space-y-8">
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-bold text-neutral-800">Corações e pontos</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="hearts" className="mb-1 block text-sm font-semibold text-neutral-600">
              Corações
            </label>
            <Input
              id="hearts"
              type="number"
              min={0}
              value={hearts}
              disabled={pending}
              onChange={(event) => setHearts(event.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="points" className="mb-1 block text-sm font-semibold text-neutral-600">
              Pontos
            </label>
            <Input
              id="points"
              type="number"
              min={0}
              value={points}
              disabled={pending}
              onChange={(event) => setPoints(event.target.value)}
            />
          </div>
        </div>
        <Button disabled={pending} onClick={onSaveHeartsAndPoints}>
          Guardar corações e pontos
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-bold text-neutral-800">Perfil</h2>
        <div>
          <label htmlFor="gender" className="mb-1 block text-sm font-semibold text-neutral-600">
            Sexo
          </label>
          <select
            id="gender"
            value={gender}
            disabled={pending}
            onChange={(event) => setGender(event.target.value as Gender | "")}
            className="h-10 w-full rounded-lg border px-3"
          >
            <option value="">—</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="englishLevel" className="mb-1 block text-sm font-semibold text-neutral-600">
            Nível de inglês
          </label>
          <select
            id="englishLevel"
            value={englishLevel}
            disabled={pending}
            onChange={(event) => setEnglishLevel(event.target.value as EnglishLevel | "")}
            className="h-10 w-full rounded-lg border px-3"
          >
            <option value="">—</option>
            {ENGLISH_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="learningGoal" className="mb-1 block text-sm font-semibold text-neutral-600">
            Objetivo de aprendizagem
          </label>
          <select
            id="learningGoal"
            value={learningGoal}
            disabled={pending}
            onChange={(event) => setLearningGoal(event.target.value as LearningGoal | "")}
            className="h-10 w-full rounded-lg border px-3"
          >
            <option value="">—</option>
            {LEARNING_GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button disabled={pending} onClick={onSaveProfile}>
          Guardar perfil
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-bold text-neutral-800">Pro simulado</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={proOverride}
            disabled={pending}
            onChange={(event) => onToggleProOverride(event.target.checked)}
          />
          Pro simulado ativo
        </label>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-bold text-neutral-800">Reposição de progresso</h2>
        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Esta conta não tem um curso ativo — não há lições para repor.
          </p>
        ) : (
          <div>
            <label htmlFor="lesson" className="mb-1 block text-sm font-semibold text-neutral-600">
              Lição
            </label>
            <select
              id="lesson"
              value={selectedLessonId}
              disabled={pending}
              onChange={(event) => setSelectedLessonId(event.target.value)}
              className="h-10 w-full rounded-lg border px-3"
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.unitTitle} — {lesson.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            disabled={pending || lessons.length === 0}
            onClick={onResetLesson}
          >
            Repor esta lição
          </Button>
          <Button
            variant="danger"
            disabled={pending || lessons.length === 0}
            onClick={onResetCourse}
          >
            Repor curso inteiro
          </Button>
        </div>
      </section>
    </div>
  );
};
