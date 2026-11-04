export type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";

// Progressão automática: BEGINNER -> BASIC -> INTERMEDIATE. ADVANCED não tem
// sucessor (é o último nível).
export const getNextLevel = (level: EnglishLevel): EnglishLevel | null => {
  if (level === "BEGINNER") return "BASIC";
  if (level === "BASIC") return "INTERMEDIATE";
  return null;
};

export const isLevelComplete = (lessons: { completed: boolean }[]): boolean => {
  return lessons.length > 0 && lessons.every((lesson) => lesson.completed);
};
