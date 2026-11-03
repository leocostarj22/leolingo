export type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";
export type LearningGoal =
  | "TRAVEL"
  | "WORK"
  | "STUDY_ABROAD"
  | "SPEAK_CONFIDENTLY"
  | "OTHER";

export const ENGLISH_LEVEL_OPTIONS: { value: EnglishLevel; label: string }[] = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "BASIC", label: "Básico" },
  { value: "INTERMEDIATE", label: "Intermédio" },
  { value: "ADVANCED", label: "Avançado" },
];

export const LEARNING_GOAL_OPTIONS: { value: LearningGoal; label: string }[] = [
  { value: "TRAVEL", label: "Viajar pelo mundo" },
  { value: "WORK", label: "Melhorar no trabalho" },
  { value: "STUDY_ABROAD", label: "Estudar no estrangeiro" },
  { value: "SPEAK_CONFIDENTLY", label: "Falar com confiança" },
  { value: "OTHER", label: "Outros objetivos" },
];
