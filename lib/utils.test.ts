import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswer } from "./utils";

test("normalizeAnswer: ignora maiúsculas/minúsculas e espaços extra", () => {
  assert.equal(normalizeAnswer("  Hello   World  "), "hello world");
});

test("normalizeAnswer: remove pontuação final", () => {
  assert.equal(normalizeAnswer("Is this correct?"), "is this correct");
});

test("normalizeAnswer: ignora vírgula interna opcional", () => {
  assert.equal(
    normalizeAnswer("If you need help, let me know"),
    normalizeAnswer("If you need help let me know"),
  );
});

test("normalizeAnswer: não junta palavras ao remover a vírgula", () => {
  assert.equal(normalizeAnswer("Well, actually"), "well actually");
});
