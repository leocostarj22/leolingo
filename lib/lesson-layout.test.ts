import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LESSON_OFFSET_PX,
  LESSON_ROW_HEIGHT_PX,
  LESSON_ANCHOR_CENTER_X,
  getLessonIndentationLevel,
  getLessonAnchorX,
  getLessonAnchorY,
  buildLessonRoadPath,
} from "./lesson-layout";

test("getLessonIndentationLevel: segue a sequência 0,1,2,1,0,-1,-2,-1 num ciclo de 8", () => {
  const got = Array.from({ length: 8 }, (_, i) => getLessonIndentationLevel(i));
  assert.deepEqual(got, [0, 1, 2, 1, 0, -1, -2, -1]);
});

test("getLessonIndentationLevel: repete o ciclo a partir do índice 8", () => {
  assert.equal(getLessonIndentationLevel(8), getLessonIndentationLevel(0));
  assert.equal(getLessonIndentationLevel(9), getLessonIndentationLevel(1));
});

test("getLessonAnchorX: nível 0 fica centrado, níveis positivos deslocam para a esquerda do centro", () => {
  assert.equal(getLessonAnchorX(0), LESSON_ANCHOR_CENTER_X);
  assert.equal(getLessonAnchorX(1), LESSON_ANCHOR_CENTER_X - LESSON_OFFSET_PX);
});

test("getLessonAnchorY: linhas consecutivas distam LESSON_ROW_HEIGHT_PX", () => {
  assert.equal(getLessonAnchorY(0), LESSON_ROW_HEIGHT_PX / 2);
  assert.equal(getLessonAnchorY(1) - getLessonAnchorY(0), LESSON_ROW_HEIGHT_PX);
});

test("buildLessonRoadPath: unidade com 1 lição não rebenta e não desenha segmento", () => {
  assert.equal(buildLessonRoadPath(1), "");
});

test("buildLessonRoadPath: 6 lições produzem 5 segmentos cúbicos ligados", () => {
  const d = buildLessonRoadPath(6);
  assert.ok(d.startsWith("M "));
  assert.equal((d.match(/C /g) ?? []).length, 5);
});

test("getLessonAnchorY: firstRowExtraPx desloca todas as linhas pelo mesmo valor fixo", () => {
  assert.equal(getLessonAnchorY(0, 36), LESSON_ROW_HEIGHT_PX / 2 + 36);
  assert.equal(getLessonAnchorY(1, 36) - getLessonAnchorY(0, 36), LESSON_ROW_HEIGHT_PX);
});

test("getLessonAnchorY: sem firstRowExtraPx mantém o comportamento original", () => {
  assert.equal(getLessonAnchorY(2), getLessonAnchorY(2, 0));
});

test("buildLessonRoadPath: firstRowExtraPx desloca o ponto de partida do traçado", () => {
  const withoutExtra = buildLessonRoadPath(3);
  const withExtra = buildLessonRoadPath(3, 36);
  const startYWithout = Number(withoutExtra.match(/^M [\d.-]+,([\d.-]+)/)![1]);
  const startYWith = Number(withExtra.match(/^M [\d.-]+,([\d.-]+)/)![1]);
  assert.equal(startYWith - startYWithout, 36);
});
