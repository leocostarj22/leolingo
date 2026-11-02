"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { isAdmin } from "@/lib/admin";
import { getLessonsForCourse, getUserProgressByIdForAdmin } from "@/db/admin-queries";
import { challenges, challengeProgress, userProgress } from "@/db/schema";

type EnglishLevel = NonNullable<typeof userProgress.$inferSelect["englishLevel"]>;
type LearningGoal = NonNullable<typeof userProgress.$inferSelect["learningGoal"]>;
type Gender = NonNullable<typeof userProgress.$inferSelect["gender"]>;

export const updateUserHeartsAndPoints = async (
  userId: string,
  hearts: number,
  points: number,
) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  if (!Number.isInteger(hearts) || hearts < 0) {
    throw new Error("Invalid hearts value");
  }

  if (!Number.isInteger(points) || points < 0) {
    throw new Error("Invalid points value");
  }

  await db.update(userProgress)
    .set({ hearts, points })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/shop");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};

export const updateUserProfile = async (
  userId: string,
  data: {
    englishLevel: EnglishLevel | null;
    learningGoal: LearningGoal | null;
    gender: Gender | null;
  },
) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  await db.update(userProgress)
    .set({
      englishLevel: data.englishLevel,
      learningGoal: data.learningGoal,
      gender: data.gender,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
};

export const setAdminOverridePro = async (userId: string, enabled: boolean) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  await db.update(userProgress)
    .set({ adminOverridePro: enabled })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};

export const resetLessonProgress = async (userId: string, lessonId: number) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  const challengesInLesson = await db.query.challenges.findMany({
    where: eq(challenges.lessonId, lessonId),
    columns: { id: true },
  });

  const challengeIds = challengesInLesson.map((c) => c.id);

  if (challengeIds.length > 0) {
    await db.delete(challengeProgress).where(
      and(
        eq(challengeProgress.userId, userId),
        inArray(challengeProgress.challengeId, challengeIds),
      ),
    );
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
};

export const resetCourseProgress = async (userId: string) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  const targetUser = await getUserProgressByIdForAdmin(userId);

  if (!targetUser?.activeCourse) {
    throw new Error("User has no active course");
  }

  const lessonsInCourse = await getLessonsForCourse(targetUser.activeCourse.id);
  const lessonIds = lessonsInCourse.map((l) => l.id);

  const challengesInCourse = lessonIds.length > 0
    ? await db.query.challenges.findMany({
        where: inArray(challenges.lessonId, lessonIds),
        columns: { id: true },
      })
    : [];

  const challengeIds = challengesInCourse.map((c) => c.id);

  if (challengeIds.length > 0) {
    await db.delete(challengeProgress).where(
      and(
        eq(challengeProgress.userId, userId),
        inArray(challengeProgress.challengeId, challengeIds),
      ),
    );
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
};
