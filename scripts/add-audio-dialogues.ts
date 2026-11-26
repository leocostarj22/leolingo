import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

import { generateDialogueAudio } from "./dialogue-audio";
import { draftDialogues } from "./audio-dialogues-draft-data";

const VOICES = {
  Leo: "en-US-GuyNeural",
  Juba: "en-US-AvaNeural",
  default: "en-US-AvaNeural",
};

async function main() {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("../db/schema");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  for (const entry of draftDialogues) {
    const unit = await db.query.units.findFirst({
      where: (u, { eq: eqOp, and: andOp, isNull }) =>
        andOp(
          eqOp(u.title, entry.unitTitle),
          eqOp(u.targetLevel, entry.targetLevel),
          entry.targetGoal === null ? isNull(u.targetGoal) : eqOp(u.targetGoal, entry.targetGoal),
        ),
    });

    if (!unit) {
      console.error(`SKIP (unit not found): ${entry.targetLevel}/${entry.targetGoal ?? "any"} "${entry.unitTitle}"`);
      continue;
    }

    const lesson = await db.query.lessons.findFirst({
      where: (l, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(l.unitId, unit.id), eqOp(l.title, entry.lessonTitle)),
      with: { challenges: true },
    });

    if (!lesson) {
      console.error(`SKIP (lesson not found): unit#${unit.id} "${entry.lessonTitle}"`);
      continue;
    }

    const dialogueChallenge = entry.challenges.find((c) => c.type === "DIALOGUE");
    if (!dialogueChallenge) {
      console.error(`SKIP (entry has no DIALOGUE): "${entry.lessonTitle}"`);
      continue;
    }

    const alreadyExists = lesson.challenges.some(
      (c) => c.type === "DIALOGUE" && c.question === dialogueChallenge.question,
    );
    if (alreadyExists) {
      console.log(`SKIP (already applied): lesson#${lesson.id} "${lesson.title}"`);
      continue;
    }

    const audioSrc = await generateDialogueAudio({
      slug: `dialogue-new-${lesson.id}`,
      script: dialogueChallenge.question,
      voices: VOICES,
    });

    let nextOrder = Math.max(0, ...lesson.challenges.map((c) => c.order)) + 1;

    await db.transaction(async (tx) => {
      for (const challenge of entry.challenges) {
        const isDialogue = challenge.type === "DIALOGUE";
        const [inserted] = await tx
          .insert(schema.challenges)
          .values({
            lessonId: lesson.id,
            type: challenge.type,
            question: challenge.question,
            order: nextOrder++,
            audioSrc: isDialogue ? audioSrc : null,
          })
          .returning();

        if (challenge.options.length > 0) {
          await tx.insert(schema.challengeOptions).values(
            challenge.options.map((option) => ({
              challengeId: inserted.id,
              text: option.text,
              correct: option.correct,
            })),
          );
        }
      }
    });

    console.log(`ADDED: lesson#${lesson.id} "${lesson.title}" (${entry.challenges.length} challenges, audio ${audioSrc})`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
