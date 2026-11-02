import Link from "next/link";
import { redirect } from "next/navigation";

import { getReviewQueue, getUserProgress, getUserSubscription } from "@/db/queries";
import { Button } from "@/components/ui/button";

import { Quiz } from "../lesson/quiz";

const ReviewPage = async () => {
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const reviewQueueData = getReviewQueue();

  const [
    userProgress,
    userSubscription,
    reviewQueue,
  ] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    reviewQueueData,
  ]);

  if (!userProgress) {
    redirect("/learn");
  }

  if (reviewQueue.challenges.length === 0) {
    return (
      <div className="flex flex-col gap-y-4 max-w-lg mx-auto text-center items-center justify-center h-full">
        <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
          Ainda não tens nada para rever
        </h1>
        <p className="text-neutral-500 text-sm lg:text-base">
          Termina pelo menos uma lição e volta aqui para reveres o que já aprendeste.
        </p>
        <Button size="lg" variant="primary" className="w-full" asChild>
          <Link href="/learn">Ir para Aprender</Link>
        </Button>
      </div>
    );
  }

  return (
    <Quiz
      initialLessonId={reviewQueue.challenges[0].lessonId}
      initialLessonChallenges={reviewQueue.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={100}
      initialGender={userProgress.gender}
      initialPointsAvailable={reviewQueue.pointsAvailable}
      isReviewSession
      userSubscription={userSubscription}
    />
  );
};

export default ReviewPage;
