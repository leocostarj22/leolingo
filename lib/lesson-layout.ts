export const LESSON_CYCLE_LENGTH = 8;
export const LESSON_OFFSET_PX = 14;
export const LESSON_ROW_HEIGHT_PX = 86;
export const LESSON_ANCHOR_CENTER_X = 220;

export function getLessonIndentationLevel(index: number): number {
  const cycleIndex = index % LESSON_CYCLE_LENGTH;

  if (cycleIndex <= 2) return cycleIndex;
  if (cycleIndex <= 6) return 4 - cycleIndex;
  return cycleIndex - 8;
}

export function getLessonAnchorX(index: number): number {
  return LESSON_ANCHOR_CENTER_X - getLessonIndentationLevel(index) * LESSON_OFFSET_PX;
}

export function getLessonAnchorY(index: number, firstRowExtraPx: number = 0): number {
  return index * LESSON_ROW_HEIGHT_PX + LESSON_ROW_HEIGHT_PX / 2 + firstRowExtraPx;
}

export function buildLessonRoadPath(totalCount: number, firstRowExtraPx: number = 0): string {
  if (totalCount <= 1) return "";

  const anchors = Array.from({ length: totalCount }, (_, i) => ({
    x: getLessonAnchorX(i),
    y: getLessonAnchorY(i, firstRowExtraPx),
  }));

  let d = `M ${anchors[0].x},${anchors[0].y}`;
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
  }
  return d;
}
