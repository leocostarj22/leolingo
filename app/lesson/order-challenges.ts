type OrderableChallenge = {
  completed: boolean;
  type: "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE";
  audioSrc: string | null;
};

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// Quiz filters completed challenges out of its rotating queue entirely
// (except in practice mode, where it replays everything). DIALOGUE is kept
// first within both the completed and uncompleted groups so the header never
// switches more than once per lesson, regardless of each challenge's raw
// position in the DB (resume order is otherwise unaffected).
export const orderLessonChallenges = <T extends OrderableChallenge>(challenges: T[]): T[] => {
  const completed = challenges.filter((c) => c.completed);
  const uncompleted = challenges.filter((c) => !c.completed);
  const completedDialogue = completed.filter((c) => c.type === "DIALOGUE");
  const completedRest = completed.filter((c) => c.type !== "DIALOGUE");
  const dialogue = uncompleted.filter((c) => c.type === "DIALOGUE");
  const restNoAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && !c.audioSrc);
  const withAudio = uncompleted.filter((c) => c.type !== "DIALOGUE" && c.audioSrc);

  return [...completedDialogue, ...completedRest, ...dialogue, ...shuffle(restNoAudio), ...shuffle(withAudio)];
};
