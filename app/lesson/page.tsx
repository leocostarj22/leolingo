import { redirect } from "next/navigation";

import { getLesson, getUserProgress, getUserSubscription, isLastLessonInUnit } from "@/db/queries";
import { computePointsAvailable } from "@/lib/points";
import { getTodayDateString } from "@/lib/streak";
import { hasPilhaRemaining } from "@/lib/pilha";
import { DAILY_LESSON_LIMIT } from "@/constants";

import { Quiz } from "./quiz";
import { NoPilhaScreen } from "./no-pilha-screen";
import { orderLessonChallenges } from "./order-challenges";

const LessonPage = async () => {
  const lessonData = getLesson();
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [
    lesson,
    userProgress,
    userSubscription,
  ] = await Promise.all([
    lessonData,
    userProgressData,
    userSubscriptionData,
  ]);

  if (!lesson || !userProgress) {
    redirect("/learn");
  }

  const isLastLesson = await isLastLessonInUnit(lesson.id);

  const initialPercentage = lesson.challenges
    .filter((challenge) => challenge.completed)
    .length / lesson.challenges.length * 100;

  const today = getTodayDateString();
  const isNewLesson = initialPercentage < 100;
  const pilhaBlocked = isNewLesson
    && !userSubscription?.isActive
    && !hasPilhaRemaining(userProgress.dailyLessonsCompleted, userProgress.dailyLessonsDate, today, DAILY_LESSON_LIMIT);

  if (pilhaBlocked) {
    return <NoPilhaScreen />;
  }

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={orderLessonChallenges(lesson.challenges)}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      initialGender={userProgress.gender}
      initialPointsAvailable={computePointsAvailable(lesson.challenges.map(() => ({ isBonus: lesson.isBonus })))}
      userSubscription={userSubscription}
      isLastLessonInUnit={isLastLesson}
    />
  );
};

export default LessonPage;
