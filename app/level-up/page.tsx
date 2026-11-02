import { redirect } from "next/navigation";

import { getUserProgress } from "@/db/queries";

import { LevelUpCelebration } from "./celebration";

const ENGLISH_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Iniciante",
  BASIC: "Básico",
  INTERMEDIATE: "Intermédio",
  ADVANCED: "Avançado",
};

const LevelUpPage = async () => {
  const userProgress = await getUserProgress();

  if (!userProgress) {
    redirect("/learn");
  }

  const levelLabel = ENGLISH_LEVEL_LABELS[userProgress.englishLevel ?? "BASIC"];

  return <LevelUpCelebration levelLabel={levelLabel} />;
};

export default LevelUpPage;
