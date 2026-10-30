import { redirect } from "next/navigation";

import { getLesson, getUserProgress, getUserSubscription } from "@/db/queries";

import { Quiz } from "./quiz";
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

  const initialPercentage = lesson.challenges
    .filter((challenge) => challenge.completed)
    .length / lesson.challenges.length * 100;

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={orderLessonChallenges(lesson.challenges)}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      initialGender={userProgress.gender}
      initialIsBonus={lesson.isBonus}
      userSubscription={userSubscription}
    />
  );
};

export default LessonPage;
