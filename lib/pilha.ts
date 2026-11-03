export const getEffectiveDailyLessonsCompleted = (
  dailyLessonsCompleted: number,
  dailyLessonsDate: string | null,
  today: string,
): number => {
  if (dailyLessonsDate == null || dailyLessonsDate !== today) return 0;
  return dailyLessonsCompleted;
};

export const getNextDailyLessonsCompleted = (
  dailyLessonsCompleted: number,
  dailyLessonsDate: string | null,
  today: string,
): number => {
  return getEffectiveDailyLessonsCompleted(dailyLessonsCompleted, dailyLessonsDate, today) + 1;
};

export const hasPilhaRemaining = (
  dailyLessonsCompleted: number,
  dailyLessonsDate: string | null,
  today: string,
  limit: number,
): boolean => {
  return getEffectiveDailyLessonsCompleted(dailyLessonsCompleted, dailyLessonsDate, today) < limit;
};
