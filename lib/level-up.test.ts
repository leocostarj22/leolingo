import { test } from "node:test";
import assert from "node:assert/strict";
import { getNextLevel, isLevelComplete } from "./level-up";

test("getNextLevel: BASIC avança para INTERMEDIATE", () => {
  assert.equal(getNextLevel("BASIC"), "INTERMEDIATE");
});

test("getNextLevel: INTERMEDIATE não tem próximo nível nesta fase", () => {
  assert.equal(getNextLevel("INTERMEDIATE"), null);
});

test("getNextLevel: BEGINNER não tem próximo nível nesta fase", () => {
  assert.equal(getNextLevel("BEGINNER"), null);
});

test("getNextLevel: ADVANCED não tem próximo nível", () => {
  assert.equal(getNextLevel("ADVANCED"), null);
});

test("isLevelComplete: conjunto vazio nunca está terminado", () => {
  assert.equal(isLevelComplete([]), false);
});

test("isLevelComplete: todas as lições terminadas", () => {
  assert.equal(isLevelComplete([{ completed: true }, { completed: true }]), true);
});

test("isLevelComplete: pelo menos uma lição por terminar", () => {
  assert.equal(isLevelComplete([{ completed: true }, { completed: false }]), false);
});

test("isLevelComplete: uma única lição genérica terminada (utilizador sem objetivo)", () => {
  assert.equal(isLevelComplete([{ completed: true }]), true);
});
