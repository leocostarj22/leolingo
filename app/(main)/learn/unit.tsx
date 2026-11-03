import { lessons, units } from "@/db/schema"

import { UnitBanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";
import { LessonPath } from "./lesson-path";

type Props = {
  id: number;
  order: number;
  title: string;
  description: string;
  lessons: (typeof lessons.$inferSelect & {
    completed: boolean;
  })[];
  activeLesson: typeof lessons.$inferSelect & {
    unit: typeof units.$inferSelect;
  } | undefined;
  activeLessonPercentage: number;
};

export const Unit = ({
  id,
  order,
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: Props) => {
  // isCompleted replica a mesma fórmula usada dentro de LessonButton
  // (!current && !locked) — as duas devem concordar sempre sobre qual é
  // a primeira linha "especial" (marginTop extra), senão o traçado da
  // estrada desalinha-se dos balões.
  const lessonStates = lessons.map((lesson) => {
    const isCurrent = lesson.id === activeLesson?.id;
    const isLocked = !lesson.completed && !isCurrent;
    const isCompleted = !isCurrent && !isLocked;
    return { lesson, isCurrent, isLocked, isCompleted };
  });
  const firstRowExtraPx = lessonStates[0] && !lessonStates[0].isCompleted ? 36 : 0;

  return (
    <>
      <UnitBanner title={title} description={description} />
      <div className="flex items-center flex-col relative">
        <LessonPath totalCount={lessons.length} firstRowExtraPx={firstRowExtraPx} />
        <span className="relative z-10 mb-2 whitespace-nowrap rounded-full border-2 border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-600">
          ▶ Início
        </span>
        {lessonStates.map(({ lesson, isCurrent, isLocked }, index) => (
          <LessonButton
            key={lesson.id}
            id={lesson.id}
            index={index}
            title={lesson.title}
            icon={lesson.icon}
            current={isCurrent}
            locked={isLocked}
            percentage={activeLessonPercentage}
          />
        ))}
        <span className="relative z-10 mt-6 whitespace-nowrap rounded-full border-2 border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-600">
          🏁 Fim da unidade
        </span>
      </div>
    </>
  );
};
