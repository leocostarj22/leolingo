import {
  LESSON_ANCHOR_CENTER_X,
  LESSON_ROW_HEIGHT_PX,
  buildLessonRoadPath,
} from "@/lib/lesson-layout";

type Props = {
  totalCount: number;
  firstRowExtraPx?: number;
};

export const LessonPath = ({ totalCount, firstRowExtraPx = 0 }: Props) => {
  const width = LESSON_ANCHOR_CENTER_X * 2;
  const height = totalCount * LESSON_ROW_HEIGHT_PX + firstRowExtraPx;

  return (
    <div className="absolute inset-x-0 top-0 z-0 pointer-events-none">
      <svg
        width={width}
        height={height}
        className="absolute left-1/2 top-0 -translate-x-1/2"
      >
        <path
          d={buildLessonRoadPath(totalCount, firstRowExtraPx)}
          stroke="#86efac"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="2 14"
          fill="none"
        />
      </svg>
    </div>
  );
};
