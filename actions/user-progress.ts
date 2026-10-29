"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { POINTS_TO_REFILL } from "@/constants";
import { getCourseById, getUserProgress, getUserSubscription } from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";

export const upsertUserProgress = async (courseId: number) => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const course = await getCourseById(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  if (!course.units.length || !course.units[0].lessons.length) {
    throw new Error("Course is empty");
  }

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db.update(userProgress).set({
      activeCourseId: courseId,
    }).where(eq(userProgress.userId, userId));

    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
  }

  await db.insert(userProgress).values({
    userId,
    activeCourseId: courseId,
    userName: user.firstName || "User",
    userImageSrc: user.imageUrl || "/mascot.svg",
  });

  revalidatePath("/courses");
  revalidatePath("/learn");
  redirect("/learn");
};

type CompleteUserProfileInput = {
  firstName: string;
  lastName?: string;
  age?: number;
  gender: "MALE" | "FEMALE";
  englishLevel?: "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";
  learningGoal?: "TRAVEL" | "WORK" | "STUDY_ABROAD" | "SPEAK_CONFIDENTLY" | "OTHER";
};

export const completeUserProfile = async (data: CompleteUserProfileInput): Promise<void> => {
  if (!data.firstName.trim()) {
    throw new Error("Name is required");
  }

  if (data.gender !== "MALE" && data.gender !== "FEMALE") {
    throw new Error("Invalid gender");
  }

  if (
    data.age !== undefined
    && (!Number.isInteger(data.age) || data.age < 1 || data.age > 120)
  ) {
    throw new Error("Invalid age");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress?.gender) {
    redirect("/courses");
  }

  if (existingUserProgress) {
    await db.update(userProgress).set({
      userName: data.firstName.trim(),
      lastName: data.lastName?.trim() || null,
      age: data.age ?? null,
      gender: data.gender,
      englishLevel: data.englishLevel ?? null,
      learningGoal: data.learningGoal ?? null,
    }).where(eq(userProgress.userId, userId));

    revalidatePath("/courses");
    redirect("/courses");
  }

  const user = await currentUser();

  await db.insert(userProgress).values({
    userId,
    userName: data.firstName.trim(),
    userImageSrc: user?.imageUrl || "/mascot.svg",
    lastName: data.lastName?.trim() || null,
    age: data.age ?? null,
    gender: data.gender,
    englishLevel: data.englishLevel ?? null,
    learningGoal: data.learningGoal ?? null,
  });

  revalidatePath("/courses");
  redirect("/courses");
};

export const reduceHearts = async (challengeId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  const lessonId = challenge.lessonId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId),
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (isPractice) {
    return { error: "practice" }; 
  }

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  if (userSubscription?.isActive) {
    return { error: "subscription" };
  }

  if (currentUserProgress.hearts === 0) {
    return { error: "hearts" };
  }

  await db.update(userProgress).set({
    hearts: Math.max(currentUserProgress.hearts - 1, 0),
  }).where(eq(userProgress.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  if (currentUserProgress.hearts === 5) {
    throw new Error("Hearts are already full");
  }

  if (currentUserProgress.points < POINTS_TO_REFILL) {
    throw new Error("Not enough points");
  }

  await db.update(userProgress).set({
    hearts: 5,
    points: currentUserProgress.points - POINTS_TO_REFILL,
  }).where(eq(userProgress.userId, currentUserProgress.userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
