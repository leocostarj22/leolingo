export type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";

// Progressão automática ainda só cobre BASIC -> INTERMEDIATE; qualquer outro
// nível (incluindo INTERMEDIATE) não tem sucessor nesta fase.
export const getNextLevel = (level: EnglishLevel): EnglishLevel | null => {
  return level === "BASIC" ? "INTERMEDIATE" : null;
};

export const isLevelComplete = (lessons: { completed: boolean }[]): boolean => {
  return lessons.length > 0 && lessons.every((lesson) => lesson.completed);
};
