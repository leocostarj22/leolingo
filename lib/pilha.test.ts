// lib/pilha.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveDailyLessonsCompleted,
  getNextDailyLessonsCompleted,
  hasPilhaRemaining,
} from "./pilha";

test("getEffectiveDailyLessonsCompleted: data nula conta como 0", () => {
  assert.equal(getEffectiveDailyLessonsCompleted(3, null, "2026-11-03"), 0);
});

test("getEffectiveDailyLessonsCompleted: mesma data devolve o valor guardado", () => {
  assert.equal(getEffectiveDailyLessonsCompleted(3, "2026-11-03", "2026-11-03"), 3);
});

test("getEffectiveDailyLessonsCompleted: data diferente conta como 0", () => {
  assert.equal(getEffectiveDailyLessonsCompleted(5, "2026-11-02", "2026-11-03"), 0);
});

test("getNextDailyLessonsCompleted: dia novo começa em 1", () => {
  assert.equal(getNextDailyLessonsCompleted(5, "2026-11-02", "2026-11-03"), 1);
});

test("getNextDailyLessonsCompleted: mesmo dia incrementa", () => {
  assert.equal(getNextDailyLessonsCompleted(3, "2026-11-03", "2026-11-03"), 4);
});

test("hasPilhaRemaining: abaixo do limite no mesmo dia é verdadeiro", () => {
  assert.equal(hasPilhaRemaining(4, "2026-11-03", "2026-11-03", 5), true);
});

test("hasPilhaRemaining: no limite no mesmo dia é falso", () => {
  assert.equal(hasPilhaRemaining(5, "2026-11-03", "2026-11-03", 5), false);
});

test("hasPilhaRemaining: no limite mas em dia diferente volta a ser verdadeiro", () => {
  assert.equal(hasPilhaRemaining(5, "2026-11-02", "2026-11-03", 5), true);
});
