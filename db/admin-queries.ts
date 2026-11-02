import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { units, userProgress } from "@/db/schema";

type EnglishLevel = NonNullable<typeof userProgress.$inferSelect["englishLevel"]>;
type LearningGoal = NonNullable<typeof userProgress.$inferSelect["learningGoal"]>;
type Gender = NonNullable<typeof userProgress.$inferSelect["gender"]>;

type AdminUserRow = {
  userId: string;
  userName: string;
  lastName: string | null;
  userImageSrc: string;
  hearts: number;
  points: number;
  englishLevel: EnglishLevel | null;
  learningGoal: LearningGoal | null;
  gender: Gender | null;
  adminOverridePro: boolean;
  activeCourse: { id: number; title: string } | null;
};

export const getAllUserProgress = async (): Promise<AdminUserRow[]> => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { asc }) => [asc(userProgress.userName)],
    with: { activeCourse: true },
  });

  return data.map((row) => ({
    ...row,
    activeCourse: row.activeCourse
      ? { id: row.activeCourse.id, title: row.activeCourse.title }
      : null,
  }));
};

export const getUserProgressByIdForAdmin = async (
  userId: string,
): Promise<(AdminUserRow & { activeCourseId: number | null }) | null> => {
  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: { activeCourse: true },
  });

  if (!data) return null;

  return {
    ...data,
    activeCourse: data.activeCourse
      ? { id: data.activeCourse.id, title: data.activeCourse.title }
      : null,
  };
};

export const getLessonsForCourse = async (courseId: number) => {
  const unitsInCourse = await db.query.units.findMany({
    where: eq(units.courseId, courseId),
    orderBy: (units, { asc }) => [asc(units.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
      },
    },
  });

  return unitsInCourse.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      unitTitle: unit.title,
    })),
  );
};
