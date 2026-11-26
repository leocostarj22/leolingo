import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswer, slugifyWord, isWrittenAnswerCorrect } from "./utils";

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

test("slugifyWord: minúsculas e remove pontuação final", () => {
  assert.equal(slugifyWord("name?"), "name");
  assert.equal(slugifyWord("Nice"), "nice");
});

test("slugifyWord: contrações e apóstrofos", () => {
  assert.equal(slugifyWord("Let's"), "let-s");
  assert.equal(slugifyWord("don't"), "don-t");
});

test("slugifyWord: mesma palavra em textos diferentes gera o mesmo slug", () => {
  assert.equal(slugifyWord("The"), slugifyWord("the"));
});

test("isWrittenAnswerCorrect aceita qualquer opção marcada correct, ignorando maiúsculas/pontuação", () => {
  const options = [
    { text: "Good morning.", correct: true },
    { text: "Good night", correct: false },
  ];
  assert.equal(isWrittenAnswerCorrect("good morning", options), true);
  assert.equal(isWrittenAnswerCorrect("GOOD MORNING!", options), true);
  assert.equal(isWrittenAnswerCorrect("good night", options), false);
});

test("isWrittenAnswerCorrect com texto vazio é sempre false", () => {
  assert.equal(isWrittenAnswerCorrect("", [{ text: "Hi", correct: true }]), false);
});
