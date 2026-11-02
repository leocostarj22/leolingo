import { test } from "node:test";
import assert from "node:assert/strict";
import { isArrangeCorrect } from "./arrange";

const option = (id: number, text: string, correct: boolean) => ({ id, text, correct });

test("isArrangeCorrect: ordem certa de palavras únicas é aceite", () => {
  const options = [
    option(1, "I", true),
    option(2, "am", true),
    option(3, "happy", true),
    option(4, "have", false),
  ];
  assert.equal(isArrangeCorrect([1, 2, 3], options), true);
});

test("isArrangeCorrect: ordem errada de palavras únicas é rejeitada", () => {
  const options = [
    option(1, "I", true),
    option(2, "am", true),
    option(3, "happy", true),
  ];
  assert.equal(isArrangeCorrect([3, 2, 1], options), false);
});

test("isArrangeCorrect: frase com palavra repetida é aceite com qualquer dos dois separadores que tenham o texto certo na posição certa", () => {
  // "She is the most experienced person on the team" — duas peças com texto "the".
  const options = [
    option(1, "She", true),
    option(2, "is", true),
    option(3, "the", true),
    option(4, "most", true),
    option(5, "experienced", true),
    option(6, "person", true),
    option(7, "on", true),
    option(8, "the", true),
    option(9, "team", true),
    option(10, "more", false),
  ];
  // Utilizador tocou na peça id=8 (uma das duas "the") na posição em que a
  // referência (ordenada por id) esperaria a peça id=3 — mas o texto é o
  // mesmo, por isso a frase construída está correta.
  assert.equal(isArrangeCorrect([1, 2, 8, 4, 5, 6, 7, 3, 9], options), true);
});

test("isArrangeCorrect: frase com palavra repetida mas texto errado numa posição é rejeitada", () => {
  const options = [
    option(1, "She", true),
    option(2, "is", true),
    option(3, "the", true),
    option(4, "most", true),
  ];
  assert.equal(isArrangeCorrect([1, 3, 2, 4], options), false);
});

test("isArrangeCorrect: número de peças diferente do esperado é rejeitado", () => {
  const options = [
    option(1, "I", true),
    option(2, "am", true),
    option(3, "happy", true),
  ];
  assert.equal(isArrangeCorrect([1, 2], options), false);
});
