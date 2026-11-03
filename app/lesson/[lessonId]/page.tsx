import { redirect } from "next/navigation";

import { getLesson, getUserProgress, getUserSubscription, isLastLessonInUnit } from "@/db/queries";
import { computePointsAvailable } from "@/lib/points";
import { getTodayDateString } from "@/lib/streak";
import { hasPilhaRemaining } from "@/lib/pilha";
import { DAILY_LESSON_LIMIT } from "@/constants";

import { Quiz } from "../quiz";
import { NoPilhaScreen } from "../no-pilha-screen";
import { orderLessonChallenges } from "../order-challenges";

type Props = {
  params: {
    lessonId: number;
  };
};

const LessonIdPage = async ({
  params,
}: Props) => {
  const lessonData = getLesson(params.lessonId);
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const isLastLessonInUnitData = isLastLessonInUnit(params.lessonId);

  const [
    lesson,
    userProgress,
    userSubscription,
    isLastLesson,
  ] = await Promise.all([
    lessonData,
    userProgressData,
    userSubscriptionData,
    isLastLessonInUnitData,
  ]);

  if (!lesson || !userProgress) {
    redirect("/learn");
  }

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

export default LessonIdPage;
