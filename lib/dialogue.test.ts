import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDialogueScript } from "./dialogue";

test("parseDialogueScript separa speaker e texto por linha", () => {
  assert.deepEqual(
    parseDialogueScript("Leo: Hi! What's your name?\nJuba: Hi! I'm Juba."),
    [
      { speaker: "Leo", text: "Hi! What's your name?" },
      { speaker: "Juba", text: "Hi! I'm Juba." },
    ],
  );
});

test("parseDialogueScript ignora linhas vazias", () => {
  assert.deepEqual(
    parseDialogueScript("Leo: Hi!\n\nJuba: Hello!\n"),
    [
      { speaker: "Leo", text: "Hi!" },
      { speaker: "Juba", text: "Hello!" },
    ],
  );
});

test("parseDialogueScript aceita linha sem speaker (sem ':')", () => {
  assert.deepEqual(
    parseDialogueScript("Just some text"),
    [{ speaker: "", text: "Just some text" }],
  );
});

test("parseDialogueScript aceita um speaker desconhecido sem rebentar", () => {
  assert.deepEqual(
    parseDialogueScript("Narrator: Once upon a time..."),
    [{ speaker: "Narrator", text: "Once upon a time..." }],
  );
});
