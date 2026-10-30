"use client";

import { toast } from "sonner";
import Image from "next/image";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAudio, useWindowSize, useMount } from "react-use";

import { reduceHearts } from "@/actions/user-progress";
import { normalizeAnswer } from "@/lib/utils";
import { useMascot } from "@/store/use-mascot";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { challengeOptions, challenges, userProgress, userSubscription } from "@/db/schema";
import { usePracticeModal } from "@/store/use-practice-modal";
import { upsertChallengeProgress } from "@/actions/challenge-progress";

import { Header } from "./header";
import { Footer } from "./footer";
import { Challenge } from "./challenge";
import { ResultCard } from "./result-card";
import { QuestionBubble } from "./question-bubble";
import { WriteChallenge } from "./write-challenge";
import { ArrangeChallenge } from "./arrange-challenge";
import { Dialogue } from "./dialogue";
import { AudioPrompt } from "./audio-prompt";

type Props ={
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialGender: typeof userProgress.$inferSelect["gender"];
  initialIsBonus: boolean;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: typeof challengeOptions.$inferSelect[];
  })[];
  userSubscription: typeof userSubscription.$inferSelect & {
    isActive: boolean;
  } | null;
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialGender,
  initialIsBonus,
  initialLessonChallenges,
  userSubscription,
}: Props) => {
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  useMount(() => {
    useMascot.getState().setGender(initialGender);

    if (initialPercentage === 100) {
      openPracticeModal();
    }
  });

  const { width, height } = useWindowSize();

  const router = useRouter();

  const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: true });
  const [
    correctAudio,
    _c,
    correctControls,
  ] = useAudio({ src: "/correct.wav" });
  const [
    incorrectAudio,
    _i,
    incorrectControls,
  ] = useAudio({ src: "/incorrect.wav" });
  const [pending, startTransition] = useTransition();

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);

  const isPracticeSession = initialPercentage === 100;

  const [queue, setQueue] = useState(() =>
    isPracticeSession
      ? initialLessonChallenges
      : initialLessonChallenges.filter((c) => !c.completed)
  );
  const [completedIds, setCompletedIds] = useState<Set<number>>(() =>
    isPracticeSession
      ? new Set<number>()
      : new Set(initialLessonChallenges.filter((c) => c.completed).map((c) => c.id))
  );
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, number>>({});
  const totalChallengeCount = initialLessonChallenges.length;

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [arrangedTileIds, setArrangedTileIds] = useState<number[]>([]);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<string>();

  const challenge = queue[0];
  const options = challenge?.challengeOptions ?? [];
  const percentage = (completedIds.size / totalChallengeCount) * 100;

  // Reset per-challenge answer state whenever the active challenge changes
  // (by advancing or by rotating back after a wrong answer).
  useEffect(() => {
    setSelectedOption(undefined);
    setWrittenAnswer("");
    setArrangedTileIds([]);
    setHasPlayedAudio(false);
  }, [challenge?.id]);

  // Starts in DB order so the server-rendered markup matches the first
  // client paint; the shuffle below only runs post-hydration, so it never
  // triggers a hydration mismatch.
  const [shuffledOptions, setShuffledOptions] = useState(options);
  useEffect(() => {
    setShuffledOptions([...options].sort(() => Math.random() - 0.5));
  }, [options]);

  const isAnswerReady = (() => {
    if (challenge?.audioSrc && !hasPlayedAudio) return false;
    if (challenge?.type === "WRITE") return writtenAnswer.trim().length > 0;
    if (challenge?.type === "ARRANGE") return arrangedTileIds.length > 0;
    if (challenge?.type === "DIALOGUE") return true;
    return !!selectedOption;
  })();

  const isAnswerCorrect = () => {
    if (challenge.type === "WRITE") {
      const accepted = options.filter((o) => o.correct).map((o) => normalizeAnswer(o.text));
      return accepted.includes(normalizeAnswer(writtenAnswer));
    }
    if (challenge.type === "DIALOGUE") return true;
    if (challenge.type === "ARRANGE") {
      const correctIds = options.filter((o) => o.correct).map((o) => o.id).sort((a, b) => a - b);
      return (
        arrangedTileIds.length === correctIds.length &&
        arrangedTileIds.every((id, i) => id === correctIds[i])
      );
    }
    const correctOption = options.find((option) => option.correct);
    return !!correctOption && correctOption.id === selectedOption;
  };

  const getCorrectAnswerText = () => {
    if (challenge.type === "WRITE") {
      return options.filter((o) => o.correct)[0]?.text ?? "";
    }
    if (challenge.type === "ARRANGE") {
      const byId = new Map(options.map((o) => [o.id, o]));
      const correctIds = options.filter((o) => o.correct).map((o) => o.id).sort((a, b) => a - b);
      return correctIds.map((id) => byId.get(id)?.text).join(" ");
    }
    return options.find((o) => o.correct)?.text ?? "";
  };

  const onSelect = (id: number) => {
    if (status !== "none") return;

    setSelectedOption(id);
  };

  const onToggleTile = (id: number) => {
    if (status !== "none") return;
    setArrangedTileIds((prev) =>
      prev.includes(id) ? prev.filter((tileId) => tileId !== id) : [...prev, id]
    );
  };

  const onContinue = () => {
    if (pending) return;
    if (!isAnswerReady) return;

    if (status === "wrong") {
      setQueue((prev) => [...prev.slice(1), prev[0]]);
      setStatus("none");
      setRevealedAnswer(undefined);
      return;
    }

    if (status === "correct") {
      setQueue((prev) => prev.slice(1));
      setStatus("none");
      return;
    }

    if (!isAnswerCorrect()) {
      const alreadyFailedBefore = (wrongAttempts[challenge.id] ?? 0) >= 1;
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setWrongAttempts((prev) => ({
              ...prev,
              [challenge.id]: (prev[challenge.id] ?? 0) + 1,
            }));
            setRevealedAnswer(alreadyFailedBefore ? getCorrectAnswerText() : undefined);
            setStatus("wrong");

            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again."))
      });
      return;
    }

    {
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            correctControls.play();
            setCompletedIds((prev) => new Set(prev).add(challenge.id));
            setStatus("correct");

            // This is a practice
            if (isPracticeSession) {
              setHearts((prev) => Math.min(prev + 1, 5));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again."))
      });
    }
  };

  if (!challenge) {
    return (
      <>
        {finishAudio}
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10000}
        />
        <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
          <Image
            src="/finish.svg"
            alt="Finish"
            className="hidden lg:block"
            height={100}
            width={100}
          />
          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden"
            height={50}
            width={50}
          />
          <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
            Great job! <br /> You&apos;ve completed the lesson.
          </h1>
          <div className="flex items-center gap-x-4 w-full">
            <ResultCard
              variant="points"
              value={totalChallengeCount * (initialIsBonus ? 20 : 10)}
            />
            <ResultCard
              variant="hearts"
              value={hearts}
            />
          </div>
        </div>
        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push("/learn")}
        />
      </>
    );
  }

  const title = challenge.type === "DIALOGUE"
    ? "Read the dialogue"
    : challenge.type === "ASSIST"
    ? "Select the correct meaning"
    : challenge.question;

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />
      <div className="flex-1">
        <div className="h-full flex items-center justify-center">
          <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
            {challenge.audioSrc ? (
              <AudioPrompt
                key={challenge.id}
                src={challenge.audioSrc}
                onPlayed={() => setHasPlayedAudio(true)}
              />
            ) : (
              <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                {title}
              </h1>
            )}
            <div>
              {challenge.type === "ASSIST" && (
                <QuestionBubble question={challenge.question} />
              )}
              {challenge.type === "WRITE" ? (
                <WriteChallenge
                  value={writtenAnswer}
                  onChange={setWrittenAnswer}
                  status={status}
                  disabled={pending}
                />
              ) : challenge.type === "ARRANGE" ? (
                <ArrangeChallenge
                  options={options}
                  selectedIds={arrangedTileIds}
                  onToggle={onToggleTile}
                  status={status}
                  disabled={pending}
                />
              ) : challenge.type === "DIALOGUE" ? (
                <Dialogue script={challenge.question} />
              ) : (
                <Challenge
                  options={shuffledOptions}
                  onSelect={onSelect}
                  status={status}
                  selectedOption={selectedOption}
                  disabled={pending}
                  type={challenge.type}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer
        disabled={pending || !isAnswerReady}
        status={status}
        onCheck={onContinue}
        revealedAnswer={revealedAnswer}
      />
    </>
  );
};
