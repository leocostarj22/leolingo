import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq } from "drizzle-orm";

import * as schema from "../db/schema";
import type { LessonIcon } from "../lib/lesson-icons";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE";
type Challenge = { type: ChallengeType; question: string; options: Option[] };
type Lesson = { title: string; icon: LessonIcon; challenges: Challenge[] };

type UnitFix = {
  unitTitle: string;
  // The lesson inserted by seed-basic-extra.ts with the colliding order:5.
  // It needs to move to order:6 so the new lesson below can take order:7.
  duplicateLessonTitle: string;
  newLesson: Lesson;
  reviewAdditions: Challenge[];
};

const unitFixes: UnitFix[] = [
  {
    unitTitle: "Noções básicas",
    duplicateLessonTitle: "Lugares e objetos",
    newLesson: {
      title: "Família",
      icon: "Users",
      challenges: [
        { type: "SELECT", question: "Como se diz \"a mãe\" em inglês?", options: [
          { text: "the mother", correct: true },
          { text: "the sister", correct: false },
          { text: "the daughter", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"o irmão\" em inglês?", options: [
          { text: "the brother", correct: true },
          { text: "the father", correct: false },
          { text: "the son", correct: false },
        ] },
        { type: "ASSIST", question: "\"Tenho duas irmãs.\"", options: [
          { text: "I have two sisters", correct: true },
          { text: "I have two brothers", correct: false },
          { text: "I had two sisters", correct: false },
        ] },
        { type: "ASSIST", question: "\"A minha irmã vive em Lisboa.\"", options: [
          { text: "My sister lives in Lisbon", correct: true },
          { text: "My sister lived in Lisbon", correct: false },
          { text: "My brother lives in Lisbon", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"Tens irmãos?\"", options: [
          { text: "Do you have any siblings?", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "ASSIST", question: "\"A minha irmã vive em Lisboa.\"", options: [
        { text: "My sister lives in Lisbon", correct: true },
        { text: "My sister lived in Lisbon", correct: false },
        { text: "My brother lives in Lisbon", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"o avô\" em inglês?", options: [
        { text: "the grandfather", correct: true },
        { text: "the grandmother", correct: false },
        { text: "the father", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Tens irmãos?\"", options: [
        { text: "Do you have any siblings?", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês no trabalho",
    duplicateLessonTitle: "Uma reunião rápida",
    newLesson: {
      title: "Telefonemas no trabalho",
      icon: "Mail",
      challenges: [
        { type: "SELECT", question: "Como se diz \"Quem fala?\" em inglês (ao telefone)?", options: [
          { text: "Who's calling?", correct: true },
          { text: "Who are you?", correct: false },
          { text: "What's your name?", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"Aguarde um momento, por favor\" em inglês?", options: [
          { text: "Hold on, please", correct: true },
          { text: "Wait here, please", correct: false },
          { text: "Stay calm, please", correct: false },
        ] },
        { type: "ASSIST", question: "\"Posso deixar uma mensagem?\"", options: [
          { text: "Can I leave a message?", correct: true },
          { text: "Can I take a message?", correct: false },
          { text: "Can I send a message?", correct: false },
        ] },
        { type: "ASSIST", question: "\"Eu ligo-te de volta.\"", options: [
          { text: "I'll call you back", correct: true },
          { text: "I called you back", correct: false },
          { text: "I'll call you now", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"Ele não está disponível agora.\"", options: [
          { text: "He is not available now", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "SELECT", question: "Como se diz \"Quem fala?\" em inglês?", options: [
        { text: "Who's calling?", correct: true },
        { text: "Who are you?", correct: false },
        { text: "What's your name?", correct: false },
      ] },
      { type: "ASSIST", question: "\"Eu ligo-te de volta.\"", options: [
        { text: "I'll call you back", correct: true },
        { text: "I called you back", correct: false },
        { text: "I'll call you now", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Ele não está disponível agora.\"", options: [
        { text: "He is not available now", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês em viagem",
    duplicateLessonTitle: "Compras e dinheiro",
    newLesson: {
      title: "Imprevistos na viagem",
      icon: "Puzzle",
      challenges: [
        { type: "SELECT", question: "Como se diz \"A minha bagagem desapareceu\" em inglês?", options: [
          { text: "My luggage is missing", correct: true },
          { text: "My luggage is heavy", correct: false },
          { text: "My luggage is here", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"O voo está atrasado\" em inglês?", options: [
          { text: "The flight is delayed", correct: true },
          { text: "The flight is cancelled", correct: false },
          { text: "The flight is early", correct: false },
        ] },
        { type: "ASSIST", question: "\"Preciso de mudar o meu bilhete.\"", options: [
          { text: "I need to change my ticket", correct: true },
          { text: "I need to buy my ticket", correct: false },
          { text: "I need to find my ticket", correct: false },
        ] },
        { type: "ASSIST", question: "\"Onde fica a secção de perdidos e achados?\"", options: [
          { text: "Where is the lost and found?", correct: true },
          { text: "Where is the check-in?", correct: false },
          { text: "Where is the gate?", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"Perdi o meu voo.\"", options: [
          { text: "I missed my flight", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "SELECT", question: "Como se diz \"O voo está atrasado\" em inglês?", options: [
        { text: "The flight is delayed", correct: true },
        { text: "The flight is cancelled", correct: false },
        { text: "The flight is early", correct: false },
      ] },
      { type: "ASSIST", question: "\"Preciso de mudar o meu bilhete.\"", options: [
        { text: "I need to change my ticket", correct: true },
        { text: "I need to buy my ticket", correct: false },
        { text: "I need to find my ticket", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Perdi o meu voo.\"", options: [
        { text: "I missed my flight", correct: true },
      ] },
    ],
  },
];

const insertChallenges = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  lessonId: number,
  challenges: Challenge[],
  startOrder: number,
) => {
  let challengeOrder = startOrder;
  for (const challenge of challenges) {
    const [challengeRow] = await tx.insert(schema.challenges).values({
      lessonId,
      type: challenge.type,
      question: challenge.question,
      order: challengeOrder++,
    }).returning();

    await tx.insert(schema.challengeOptions).values(
      challenge.options.map((option) => ({
        challengeId: challengeRow.id,
        text: option.text,
        correct: option.correct,
      })),
    );
  }
};

const main = async () => {
  try {
    const [englishCourse] = await db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(eq(schema.courses.title, "English"));

    if (!englishCourse) {
      throw new Error("English course not found");
    }

    for (const fix of unitFixes) {
      const unitRow = await db.query.units.findFirst({
        where: and(
          eq(schema.units.courseId, englishCourse.id),
          eq(schema.units.title, fix.unitTitle),
          eq(schema.units.targetLevel, "BASIC"),
        ),
      });

      if (!unitRow) {
        throw new Error(`Unit not found: ${fix.unitTitle}`);
      }

      const alreadyFixed = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, fix.newLesson.title),
        ),
      });

      if (alreadyFixed) {
        console.log(`${fix.unitTitle}: already fixed/extended, skipping.`);
        continue;
      }

      const duplicateLesson = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, fix.duplicateLessonTitle),
        ),
      });

      if (!duplicateLesson) {
        throw new Error(`Duplicate lesson not found: ${fix.duplicateLessonTitle} (unit ${fix.unitTitle})`);
      }

      const reviewLesson = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, "Revisão da Unidade"),
        ),
      });

      if (!reviewLesson) {
        throw new Error(`Review lesson not found for unit ${fix.unitTitle}`);
      }

      const lastReviewChallenge = await db.query.challenges.findFirst({
        where: eq(schema.challenges.lessonId, reviewLesson.id),
        orderBy: desc(schema.challenges.order),
      });

      await db.transaction(async (tx) => {
        console.log(`Fixing + extending unit: ${fix.unitTitle}`);

        // Move the colliding "order: 5" lesson (inserted by seed-basic-extra.ts)
        // out of the way to order 6.
        await tx.update(schema.lessons)
          .set({ order: 6 })
          .where(eq(schema.lessons.id, duplicateLesson.id));

        // Move the review lesson from order 6 to order 8, to make room for
        // the new content lesson at order 7.
        await tx.update(schema.lessons)
          .set({ order: 8 })
          .where(eq(schema.lessons.id, reviewLesson.id));

        const [lessonRow] = await tx.insert(schema.lessons).values({
          unitId: unitRow.id,
          title: fix.newLesson.title,
          icon: fix.newLesson.icon,
          order: 7,
        }).returning();

        await insertChallenges(tx, lessonRow.id, fix.newLesson.challenges, 1);

        await insertChallenges(
          tx,
          reviewLesson.id,
          fix.reviewAdditions,
          (lastReviewChallenge?.order ?? 0) + 1,
        );
      });
    }

    console.log("BASIC units fixed and extended.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fix/extend BASIC units");
  } finally {
    await pool.end();
  }
};

main();
