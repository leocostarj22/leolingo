export const computePointsAvailable = (challenges: { isBonus: boolean }[]): number => {
  return challenges.reduce((sum, challenge) => sum + (challenge.isBonus ? 20 : 10), 0);
};
