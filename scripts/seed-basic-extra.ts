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

type UnitExtra = {
  unitTitle: string;
  newLesson: Lesson;
  // Appended to the unit's existing "Revisão da Unidade" lesson, so the
  // review also covers the vocabulary from newLesson above.
  reviewAdditions: Challenge[];
};

const unitExtras: UnitExtra[] = [
  {
    unitTitle: "Noções básicas",
    newLesson: {
      title: "Lugares e objetos",
      icon: "MapPin",
      challenges: [
        { type: "SELECT", question: "Como se diz \"a casa\" em inglês?", options: [
          { text: "the house", correct: true },
          { text: "the car", correct: false },
          { text: "the chair", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"a mesa\" em inglês?", options: [
          { text: "the table", correct: true },
          { text: "the chair", correct: false },
          { text: "the door", correct: false },
        ] },
        { type: "ASSIST", question: "\"a porta\"", options: [
          { text: "the door", correct: true },
          { text: "the window", correct: false },
          { text: "the table", correct: false },
        ] },
        { type: "ASSIST", question: "\"a janela\"", options: [
          { text: "the window", correct: true },
          { text: "the door", correct: false },
          { text: "the house", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"a cadeira\"", options: [
          { text: "the chair", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "ASSIST", question: "\"a porta\"", options: [
        { text: "the door", correct: true },
        { text: "the window", correct: false },
        { text: "the house", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"a cadeira\" em inglês?", options: [
        { text: "the chair", correct: true },
        { text: "the table", correct: false },
        { text: "the door", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"a janela\"", options: [
        { text: "the window", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês no trabalho",
    newLesson: {
      title: "Agenda e horários",
      icon: "Clock",
      challenges: [
        { type: "SELECT", question: "Como se diz \"a reunião é às 10 horas\" em inglês?", options: [
          { text: "the meeting is at 10 o'clock", correct: true },
          { text: "the meeting was at 10 o'clock", correct: false },
          { text: "the meeting is 10 o'clock long", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"amanhã\" em inglês?", options: [
          { text: "tomorrow", correct: true },
          { text: "yesterday", correct: false },
          { text: "today", correct: false },
        ] },
        { type: "ASSIST", question: "\"Estou disponível na segunda-feira.\"", options: [
          { text: "I am available on Monday", correct: true },
          { text: "I was available on Monday", correct: false },
          { text: "I am available Monday to Friday", correct: false },
        ] },
        { type: "ASSIST", question: "\"Podemos remarcar para sexta-feira?\"", options: [
          { text: "Can we reschedule for Friday?", correct: true },
          { text: "Can we cancel for Friday?", correct: false },
          { text: "Did we reschedule for Friday?", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"Chego às nove\"", options: [
          { text: "I arrive at nine", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "ASSIST", question: "\"amanhã\"", options: [
        { text: "tomorrow", correct: true },
        { text: "yesterday", correct: false },
        { text: "today", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Estou disponível na segunda-feira\" em inglês?", options: [
        { text: "I am available on Monday", correct: true },
        { text: "I was available on Monday", correct: false },
        { text: "I am available Monday to Friday", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Chego às nove\"", options: [
        { text: "I arrive at nine", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês em viagem",
    newLesson: {
      title: "Compras e dinheiro",
      icon: "Tag",
      challenges: [
        { type: "SELECT", question: "Como se diz \"Quanto custa?\" em inglês?", options: [
          { text: "How much is it?", correct: true },
          { text: "How many is it?", correct: false },
          { text: "How much are you?", correct: false },
        ] },
        { type: "SELECT", question: "Como se diz \"Aceitam cartão?\" em inglês?", options: [
          { text: "Do you accept cards?", correct: true },
          { text: "Do you have cards?", correct: false },
          { text: "Are you cards?", correct: false },
        ] },
        { type: "ASSIST", question: "\"Está muito caro.\"", options: [
          { text: "It's too expensive", correct: true },
          { text: "It's too cheap", correct: false },
          { text: "It's too small", correct: false },
        ] },
        { type: "ASSIST", question: "\"Pode dar-me o troco?\"", options: [
          { text: "Can you give me the change?", correct: true },
          { text: "Can you give me the price?", correct: false },
          { text: "Can you give me the receipt?", correct: false },
        ] },
        { type: "WRITE", question: "Escreve em inglês: \"Está barato\"", options: [
          { text: "It's cheap", correct: true },
        ] },
      ],
    },
    reviewAdditions: [
      { type: "ASSIST", question: "\"Está muito caro.\"", options: [
        { text: "It's too expensive", correct: true },
        { text: "It's too cheap", correct: false },
        { text: "It's too small", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Pode dar-me o troco?\" em inglês?", options: [
        { text: "Can you give me the change?", correct: true },
        { text: "Can you give me the price?", correct: false },
        { text: "Can you give me the receipt?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Está barato\"", options: [
        { text: "It's cheap", correct: true },
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

    for (const extra of unitExtras) {
      const unitRow = await db.query.units.findFirst({
        where: and(
          eq(schema.units.courseId, englishCourse.id),
          eq(schema.units.title, extra.unitTitle),
          eq(schema.units.targetLevel, "BASIC"),
        ),
      });

      if (!unitRow) {
        throw new Error(`Unit not found: ${extra.unitTitle}`);
      }

      const alreadySeeded = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, extra.newLesson.title),
        ),
      });

      if (alreadySeeded) {
        console.log(`${extra.unitTitle}: already extended, skipping.`);
        continue;
      }

      const reviewLesson = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, "Revisão da Unidade"),
        ),
      });

      const lastReviewChallenge = reviewLesson
        ? await db.query.challenges.findFirst({
          where: eq(schema.challenges.lessonId, reviewLesson.id),
          orderBy: desc(schema.challenges.order),
        })
        : undefined;

      await db.transaction(async (tx) => {
        console.log(`Extending unit: ${extra.unitTitle}`);

        const [lessonRow] = await tx.insert(schema.lessons).values({
          unitId: unitRow.id,
          title: extra.newLesson.title,
          icon: extra.newLesson.icon,
          order: 5,
        }).returning();

        await insertChallenges(tx, lessonRow.id, extra.newLesson.challenges, 1);

        if (reviewLesson) {
          await insertChallenges(
            tx,
            reviewLesson.id,
            extra.reviewAdditions,
            (lastReviewChallenge?.order ?? 0) + 1,
          );
        } else {
          const [newReviewLesson] = await tx.insert(schema.lessons).values({
            unitId: unitRow.id,
            title: "Revisão da Unidade",
            icon: "Trophy",
            order: 6,
          }).returning();

          await insertChallenges(tx, newReviewLesson.id, extra.reviewAdditions, 1);
        }
      });
    }

    console.log("BASIC units extended.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extend BASIC units");
  } finally {
    await pool.end();
  }
};

main();
