type OrderableChallenge = {
  completed: boolean;
  type: "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE";
  audioSrc: string | null;
};

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// Quiz filters completed challenges out of its rotating queue entirely
// (except in practice mode, where it replays everything), so their exact
// position in this array no longer matters for resume — only the relative
// order of the uncompleted ones does (DIALOGUE first, then shuffled).
export const orderLessonChallenges = <T extends OrderableChallenge>(challenges: T[]): T[] => {
  const completed = challenges.filter((c) => c.completed);
  const uncompleted = challenges.filter((c) => !c.completed);
  const dialogue = uncompleted.filter((c) => c.type === "DIALOGUE");
  const restNoAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && !c.audioSrc);
  const withAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && c.audioSrc);

  return [...completed, ...dialogue, ...shuffle(restNoAudio), ...shuffle(withAudio)];
};
