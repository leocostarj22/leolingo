type OrderableChallenge = {
  completed: boolean;
  type: "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE";
  audioSrc: string | null;
};

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// Completed challenges must stay a prefix: Quiz resumes at the first
// uncompleted index and then just advances sequentially, so anything
// uncompleted placed before that index would never be shown, and
// anything completed placed after it would be replayed (and re-paid).
export const orderLessonChallenges = <T extends OrderableChallenge>(challenges: T[]): T[] => {
  const completed = challenges.filter((c) => c.completed);
  const uncompleted = challenges.filter((c) => !c.completed);
  const dialogue = uncompleted.filter((c) => c.type === "DIALOGUE");
  const restNoAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && !c.audioSrc);
  const withAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && c.audioSrc);

  return [...completed, ...dialogue, ...shuffle(restNoAudio), ...shuffle(withAudio)];
};
