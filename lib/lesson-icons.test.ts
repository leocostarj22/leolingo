import { test } from "node:test";
import assert from "node:assert/strict";
import { Trophy, Star } from "lucide-react";
import { resolveLessonIcon } from "./lesson-icons";

test("resolveLessonIcon: devolve o componente lucide correspondente a um nome conhecido", () => {
  assert.equal(resolveLessonIcon("Trophy"), Trophy);
});

test("resolveLessonIcon: nome desconhecido cai em Star (item 1 da Review Focus)", () => {
  assert.equal(resolveLessonIcon("não-existe"), Star);
});
