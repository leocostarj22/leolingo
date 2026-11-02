import assert from "node:assert/strict";
import { test } from "node:test";

import { getTodayDateString, daysSince, getNextStreak, getDisplayStreak } from "./streak";

test("getTodayDateString converte para o dia em Europe/Lisbon, não em UTC (verão, UTC+1)", () => {
  assert.equal(getTodayDateString(new Date("2026-07-01T23:30:00Z")), "2026-07-02");
});

test("getTodayDateString no mesmo dia em UTC quando não há troca de dia", () => {
  assert.equal(getTodayDateString(new Date("2026-07-01T10:00:00Z")), "2026-07-01");
});

test("daysSince conta dias entre duas datas, incluindo fronteira de mês", () => {
  assert.equal(daysSince("2026-01-31", "2026-02-01"), 1);
  assert.equal(daysSince("2026-01-01", "2026-01-01"), 0);
  assert.equal(daysSince("2026-01-01", "2026-01-05"), 4);
});

test("getNextStreak: sem atividade anterior → 1", () => {
  assert.equal(getNextStreak(5, null, "2026-01-05"), 1);
});

test("getNextStreak: mesma atividade no mesmo dia → sem alteração", () => {
  assert.equal(getNextStreak(5, "2026-01-05", "2026-01-05"), 5);
});

test("getNextStreak: última atividade ontem → soma 1", () => {
  assert.equal(getNextStreak(5, "2026-01-04", "2026-01-05"), 6);
});

test("getNextStreak: gap de 2+ dias → reinicia para 1", () => {
  assert.equal(getNextStreak(5, "2026-01-01", "2026-01-05"), 1);
});

test("getDisplayStreak: sem atividade anterior → 0", () => {
  assert.equal(getDisplayStreak(5, null, "2026-01-05"), 0);
});

test("getDisplayStreak: atividade hoje → mostra o valor atual", () => {
  assert.equal(getDisplayStreak(5, "2026-01-05", "2026-01-05"), 5);
});

test("getDisplayStreak: atividade ontem (gap de 1) → ainda não quebrou", () => {
  assert.equal(getDisplayStreak(5, "2026-01-04", "2026-01-05"), 5);
});

test("getDisplayStreak: gap de 2+ dias → mostra 0", () => {
  assert.equal(getDisplayStreak(5, "2026-01-01", "2026-01-05"), 0);
});
