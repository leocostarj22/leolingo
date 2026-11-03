import {
  LESSON_ANCHOR_CENTER_X,
  LESSON_ROW_HEIGHT_PX,
  buildLessonRoadPath,
  getLessonAnchorY,
} from "@/lib/lesson-layout";

type Props = {
  totalCount: number;
};

export const LessonPath = ({ totalCount }: Props) => {
  const width = LESSON_ANCHOR_CENTER_X * 2;
  const height = totalCount * LESSON_ROW_HEIGHT_PX;
  const finishY = getLessonAnchorY(totalCount - 1);

  return (
    <div className="absolute inset-x-0 top-0 z-0 pointer-events-none">
      <span
        className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-600"
      >
        ▶ Início
      </span>
      <svg
        width={width}
        height={height}
        className="absolute left-1/2 top-0 -translate-x-1/2"
      >
        <path
          d={buildLessonRoadPath(totalCount)}
          stroke="#86efac"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="2 14"
          fill="none"
        />
      </svg>
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: finishY + 48 }}
      >
        <span className="inline-block rounded-full border-2 border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-600">
          🏁 Fim da unidade
        </span>
      </div>
    </div>
  );
};
