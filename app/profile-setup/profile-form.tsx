"use client";

import Image from "next/image";
import { useTransition, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeUserProfile } from "@/actions/user-progress";

type Gender = "MALE" | "FEMALE";
type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";
type LearningGoal =
  | "TRAVEL"
  | "WORK"
  | "STUDY_ABROAD"
  | "SPEAK_CONFIDENTLY"
  | "OTHER";

// Mirrors the parameter shape of `completeUserProfile` so the payload we
// build here can never drift from what the server action actually expects.
type ProfileSubmitData = Parameters<typeof completeUserProfile>[0];

type ProfileFormProps = {
  defaultFirstName: string;
  defaultLastName: string;
};

const GENDER_OPTIONS: { value: Gender; label: string; icon: string; theme: "sky" | "pink" }[] = [
  { value: "MALE", label: "Masculino", icon: "♂", theme: "sky" },
  { value: "FEMALE", label: "Feminino", icon: "♀", theme: "pink" },
];

const ENGLISH_LEVEL_OPTIONS: { value: EnglishLevel; label: string }[] = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "BASIC", label: "Básico" },
  { value: "INTERMEDIATE", label: "Intermédio" },
  { value: "ADVANCED", label: "Avançado" },
];

const LEARNING_GOAL_OPTIONS: { value: LearningGoal; label: string }[] = [
  { value: "TRAVEL", label: "Viajar pelo mundo" },
  { value: "WORK", label: "Melhorar no trabalho" },
  { value: "STUDY_ABROAD", label: "Estudar no estrangeiro" },
  { value: "SPEAK_CONFIDENTLY", label: "Falar com confiança" },
  { value: "OTHER", label: "Outros objetivos" },
];

const toggleButtonClasses = (isActive: boolean, activeTheme: "sky" | "pink") =>
  cn(
    "rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors",
    isActive
      ? activeTheme === "pink"
        ? "border-pink-500 bg-pink-50 text-pink-700"
        : "border-sky-500 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
  );

export const ProfileForm = ({
  defaultFirstName,
  defaultLastName,
}: ProfileFormProps) => {
  const [pending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel | null>(null);
  const [learningGoal, setLearningGoal] = useState<LearningGoal>("TRAVEL");

  const isFemaleTheme = gender === "FEMALE";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending || !firstName.trim() || !gender) return;

    const trimmedAge = age.trim();

    const data: ProfileSubmitData = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      age: trimmedAge ? Number(trimmedAge) : undefined,
      gender,
      englishLevel: englishLevel ?? undefined,
      learningGoal: learningGoal ?? undefined,
    };

    startTransition(() => {
      completeUserProfile(data).catch(() =>
        toast.error("Something went wrong.")
      );
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50">
      <div className="relative h-64 w-full shrink-0 sm:h-80">
        {isFemaleTheme ? (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-pink-600 via-fuchsia-500 to-purple-300"
            role="img"
            aria-label="Juba, a mascote do Leolingo"
          >
            <span className="text-7xl drop-shadow-md" aria-hidden>
              🦁
            </span>
          </div>
        ) : (
          <Image
            src="/hero-leolingo.png"
            alt="Leo, a mascote do Leolingo, em frente ao Big Ben em Londres"
            fill
            priority
            className="object-cover object-center"
          />
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 -mt-8 flex flex-1 justify-center px-6 pb-10"
      >
        <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold text-slate-800">
            Criar o seu perfil
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Conte-nos um pouco sobre si para personalizar a sua experiência.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-semibold text-slate-600"
              >
                Nome
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="O seu nome"
                disabled={pending}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-semibold text-slate-600"
              >
                Apelido
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="O seu apelido"
                disabled={pending}
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="mb-1 block text-sm font-semibold text-slate-600"
              >
                Idade
              </label>
              <Input
                id="age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="A sua idade"
                disabled={pending}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-semibold text-slate-600">
                Sexo
              </span>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map((option) => {
                  const isActive = gender === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      disabled={pending}
                      onClick={() => setGender(option.value)}
                      className={cn(
                        "flex items-center justify-center gap-2",
                        toggleButtonClasses(isActive, option.theme)
                      )}
                    >
                      <span aria-hidden>{option.icon}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-sm font-semibold text-slate-600">
                Nível atual de inglês
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ENGLISH_LEVEL_OPTIONS.map((option) => {
                  const isActive = englishLevel === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      disabled={pending}
                      onClick={() => setEnglishLevel(option.value)}
                      className={toggleButtonClasses(
                        isActive,
                        isFemaleTheme ? "pink" : "sky"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="learningGoal"
                className="mb-1 block text-sm font-semibold text-slate-600"
              >
                Objetivo de aprendizagem
              </label>
              <select
                id="learningGoal"
                value={learningGoal}
                disabled={pending}
                onChange={(event) =>
                  setLearningGoal(event.target.value as LearningGoal)
                }
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {LEARNING_GOAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            disabled={pending || !firstName.trim() || !gender}
            className={cn(
              "mt-6 w-full rounded-full",
              isFemaleTheme && "bg-pink-500 hover:bg-pink-500/90 border-pink-600"
            )}
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
};
