"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription, getUnits } from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";
import { getNextStreak, getTodayDateString } from "@/lib/streak";
import { getNextDailyLessonsCompleted } from "@/lib/pilha";
import { getNextLevel, isLevelComplete, type EnglishLevel } from "@/lib/level-up";

export const upsertChallengeProgress = async (challengeId: number, isLastChallenge: boolean) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized"); 
  }

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      lesson: true,
    },
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  const lessonId = challenge.lessonId;
  const pointsAwarded = challenge.lesson?.isBonus ? 20 : 10;

  const today = getTodayDateString();
  const nextStreak = isLastChallenge
    ? getNextStreak(currentUserProgress.currentStreak, currentUserProgress.lastActivityDate, today)
    : currentUserProgress.currentStreak;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId),
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (
    currentUserProgress.hearts === 0 && 
    !isPractice && 
    !userSubscription?.isActive
  ) {
    return { error: "hearts" };
  }

  const computeLevelUpResult = async () => {
    if (!isLastChallenge) return undefined;

    const nextLevel = getNextLevel(currentUserProgress.englishLevel ?? "BASIC");
    if (!nextLevel) return undefined;

    const unitsForCurrentLevel = await getUnits();
    const lessonsForCurrentLevel = unitsForCurrentLevel.flatMap((unit) => unit.lessons);
    if (!isLevelComplete(lessonsForCurrentLevel)) return undefined;

    return { leveledUp: true as const, newLevel: nextLevel };
  };

  if (isPractice) {
    await db.update(challengeProgress).set({
      completed: true,
    })
    .where(
      eq(challengeProgress.id, existingChallengeProgress.id)
    );

    const levelUpResult = await computeLevelUpResult();

    await db.update(userProgress).set({
      hearts: Math.min(currentUserProgress.hearts + 1, 5),
      points: currentUserProgress.points + pointsAwarded,
      ...(isLastChallenge ? { currentStreak: nextStreak, lastActivityDate: today } : {}),
      ...(levelUpResult ? { englishLevel: levelUpResult.newLevel } : {}),
    }).where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath("/lesson");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
    return levelUpResult;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  const levelUpResult = await computeLevelUpResult();

  const nextDailyLessonsCompleted = isLastChallenge
    ? getNextDailyLessonsCompleted(currentUserProgress.dailyLessonsCompleted, currentUserProgress.dailyLessonsDate, today)
    : currentUserProgress.dailyLessonsCompleted;

  await db.update(userProgress).set({
    points: currentUserProgress.points + pointsAwarded,
    ...(isLastChallenge ? { currentStreak: nextStreak, lastActivityDate: today, dailyLessonsCompleted: nextDailyLessonsCompleted, dailyLessonsDate: today } : {}),
    ...(levelUpResult ? { englishLevel: levelUpResult.newLevel } : {}),
  }).where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
  return levelUpResult;
};
