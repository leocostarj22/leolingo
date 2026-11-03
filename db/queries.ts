import { cache } from "react";
import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import {
  challengeProgress,
  challenges,
  courses,
  lessons,
  units,
  userProgress,
  userSubscription
} from "@/db/schema";
import { computePointsAvailable } from "@/lib/points";

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

type EnglishLevel = NonNullable<typeof userProgress.$inferSelect["englishLevel"]>;
type LearningGoal = NonNullable<typeof userProgress.$inferSelect["learningGoal"]>;

const buildUnitsWhereClause = (
  courseId: number,
  level: EnglishLevel,
  goal: LearningGoal | null,
) => {
  const levelMatch = or(isNull(units.targetLevel), eq(units.targetLevel, level));
  const goalMatch = goal
    ? or(isNull(units.targetGoal), eq(units.targetGoal, goal))
    : isNull(units.targetGoal);

  return and(eq(units.courseId, courseId), levelMatch, goalMatch);
};

export const getUnits = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) {
    return [];
  }

  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: buildUnitsWhereClause(
      userProgress.activeCourseId,
      userProgress.englishLevel ?? "BASIC",
      userProgress.learningGoal,
    ),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(
                  challengeProgress.userId,
                  userId,
                ),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (
        lesson.challenges.length === 0
      ) {
        return { ...lesson, completed: false };
      }

      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return challenge.challengeProgress
          && challenge.challengeProgress.length > 0
          && challenge.challengeProgress.every((progress) => progress.completed);
      });

      return { ...lesson, completed: allCompletedChallenges };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const getReviewQueue = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return { challenges: [], pointsAvailable: 0 };
  }

  const completedRows = await db
    .select({ challengeId: challengeProgress.challengeId })
    .from(challengeProgress)
    .where(and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.completed, true),
    ));

  const completedIds = Array.from(new Set(completedRows.map((row) => row.challengeId)));

  if (completedIds.length === 0) {
    return { challenges: [], pointsAvailable: 0 };
  }

  const sampled = await db.query.challenges.findMany({
    where: and(
      inArray(challenges.id, completedIds),
      ne(challenges.type, "DIALOGUE"),
    ),
    orderBy: sql`random()`,
    limit: 10,
    with: {
      challengeOptions: true,
      lesson: {
        columns: { isBonus: true },
      },
    },
  });

  const reviewChallenges = sampled.map(({ lesson, ...challenge }) => ({
    ...challenge,
    completed: true as const,
  }));
  const pointsAvailable = computePointsAvailable(
    sampled.map((challenge) => ({ isBonus: challenge.lesson.isBonus })),
  );

  return { challenges: reviewChallenges, pointsAvailable };
});

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();

  return data;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) {
    return null;
  }

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: buildUnitsWhereClause(
      userProgress.activeCourseId,
      userProgress.englishLevel ?? "BASIC",
      userProgress.learningGoal,
    ),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => {
      return lesson.challenges.some((challenge) => {
        return !challenge.challengeProgress 
          || challenge.challengeProgress.length === 0 
          || challenge.challengeProgress.some((progress) => progress.completed === false)
      });
    });

  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseProgress = await getCourseProgress();

  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) {
    return null;
  }

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) {
    return null;
  }

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed = challenge.challengeProgress 
      && challenge.challengeProgress.length > 0
      && challenge.challengeProgress.every((progress) => progress.completed)

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges }
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) {
    return 0;
  }

  const lesson = await getLesson(courseProgress.activeLessonId);

  if (!lesson) {
    return 0;
  }

  const completedChallenges = lesson.challenges
    .filter((challenge) => challenge.completed);
  const percentage = Math.round(
    (completedChallenges.length / lesson.challenges.length) * 100,
  );

  return percentage;
});

const DAY_IN_MS = 86_400_000;
export const getUserSubscription = cache(async (): Promise<{
  isActive: boolean;
  stripeCustomerId: string | null;
} | null> => {
  const { userId } = await auth();

  if (!userId) return null;

  const [subscriptionData, progressData] = await Promise.all([
    db.query.userSubscription.findFirst({
      where: eq(userSubscription.userId, userId),
    }),
    db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { adminOverridePro: true },
    }),
  ]);

  const adminOverridePro = progressData?.adminOverridePro ?? false;

  if (!subscriptionData) {
    return adminOverridePro
      ? { isActive: true, stripeCustomerId: null }
      : null;
  }

  const realIsActive =
    !!subscriptionData.stripePriceId &&
    subscriptionData.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return {
    isActive: realIsActive || adminOverridePro,
    stripeCustomerId: subscriptionData.stripeCustomerId,
  };
});

export const isLastLessonInUnit = cache(async (lessonId: number): Promise<boolean> => {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      unit: {
        with: {
          lessons: true,
        },
      },
    },
  });

  if (!lesson) {
    return false;
  }

  const maxOrder = Math.max(...lesson.unit.lessons.map((unitLesson) => unitLesson.order));

  return lesson.order === maxOrder;
});

export const getTopTenUsers = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  return data;
});
