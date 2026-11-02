import assert from "node:assert/strict";
import { test } from "node:test";

import { parseMatchPair, isMatchCorrect } from "./match";

test("parseMatchPair separa pt e en pelo delimitador, com trim", () => {
  assert.deepEqual(
    parseMatchPair(5, "  Bom dia  |||  Good morning  "),
    { id: 5, pt: "Bom dia", en: "Good morning" },
  );
});

test("parseMatchPair sem delimitador não rebenta — usa o mesmo texto nos dois lados", () => {
  assert.deepEqual(
    parseMatchPair(7, "Bom dia"),
    { id: 7, pt: "Bom dia", en: "Bom dia" },
  );
});

test("isMatchCorrect: todos os 4 pares certos → true", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 2, 3: 3, 4: 4 }, 4), true);
});

test("isMatchCorrect: incompleto (falta 1 par) → false", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 2, 3: 3 }, 4), false);
});

test("isMatchCorrect: completo mas com 1 par trocado → false", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 3, 3: 2, 4: 4 }, 4), false);
});

test("isMatchCorrect: vazio → false", () => {
  assert.equal(isMatchCorrect({}, 4), false);
});
