export const getTodayDateString = (now: Date = new Date()): string => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(now);
};

export const daysSince = (from: string, to: string): number => {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / 86_400_000);
};

export const getNextStreak = (
  currentStreak: number,
  lastActivityDate: string | null,
  today: string,
): number => {
  if (lastActivityDate == null) return 1;

  const gap = daysSince(lastActivityDate, today);
  if (gap === 0) return currentStreak;
  if (gap === 1) return currentStreak + 1;
  return 1;
};

export const getDisplayStreak = (
  currentStreak: number,
  lastActivityDate: string | null,
  today: string,
): number => {
  if (lastActivityDate == null) return 0;

  const gap = daysSince(lastActivityDate, today);
  return gap <= 1 ? currentStreak : 0;
};
