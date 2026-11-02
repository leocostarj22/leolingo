export type MatchPair = { id: number; pt: string; en: string };

export const parseMatchPair = (id: number, text: string): MatchPair => {
  const [pt, en] = text.split("|||");
  const trimmedPt = pt.trim();
  return { id, pt: trimmedPt, en: en !== undefined ? en.trim() : trimmedPt };
};

export const isMatchCorrect = (pairs: Record<number, number>, totalPairs: number): boolean => {
  const entries = Object.entries(pairs);
  return entries.length === totalPairs && entries.every(([leftId, rightId]) => Number(leftId) === rightId);
};
