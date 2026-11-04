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
  newLessons: [Lesson, Lesson];
  // Appended to the unit's existing "Revisão da Unidade" lesson, so the
  // review also covers the vocabulary from both newLessons above.
  reviewAdditions: Challenge[];
};

const unitExtras: UnitExtra[] = [
  {
    unitTitle: "Primeiros passos",
    newLessons: [
      {
        title: "Família",
        icon: "Users",
        challenges: [
          { type: "SELECT", question: "Como se diz \"mãe\" em inglês?", options: [
            { text: "mother", correct: true },
            { text: "father", correct: false },
            { text: "sister", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"pai\" em inglês?", options: [
            { text: "father", correct: true },
            { text: "brother", correct: false },
            { text: "son", correct: false },
          ] },
          { type: "ASSIST", question: "\"irmão\"", options: [
            { text: "brother", correct: true },
            { text: "sister", correct: false },
            { text: "father", correct: false },
          ] },
          { type: "ASSIST", question: "\"This is my mother.\"", options: [
            { text: "Esta é a minha mãe.", correct: true },
            { text: "Este é o meu pai.", correct: false },
            { text: "Esta é a minha irmã.", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Eu tenho dois irmãos.\"", options: [
            { text: "I have two brothers", correct: true },
          ] },
        ],
      },
      {
        title: "Roupa",
        icon: "Tag",
        challenges: [
          { type: "SELECT", question: "Como se diz \"a camisa\" em inglês?", options: [
            { text: "the shirt", correct: true },
            { text: "the shoes", correct: false },
            { text: "the coat", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"os sapatos\" em inglês?", options: [
            { text: "the shoes", correct: true },
            { text: "the pants", correct: false },
            { text: "the dress", correct: false },
          ] },
          { type: "ASSIST", question: "\"as calças\"", options: [
            { text: "the pants", correct: true },
            { text: "the shirt", correct: false },
            { text: "the coat", correct: false },
          ] },
          { type: "ASSIST", question: "\"I am wearing a red shirt.\"", options: [
            { text: "Estou a usar uma camisa vermelha.", correct: true },
            { text: "Estou a usar um casaco vermelho.", correct: false },
            { text: "Estou a usar sapatos vermelhos.", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"o vestido\"", options: [
            { text: "the dress", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "SELECT", question: "Como se diz \"irmão\" em inglês?", options: [
        { text: "brother", correct: true },
        { text: "sister", correct: false },
        { text: "mother", correct: false },
      ] },
      { type: "ASSIST", question: "\"os sapatos\"", options: [
        { text: "the shoes", correct: true },
        { text: "the shirt", correct: false },
        { text: "the dress", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"a camisa\"", options: [
        { text: "the shirt", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Primeiras palavras no trabalho",
    newLessons: [
      {
        title: "Instruções simples",
        icon: "MessageSquare",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Sente-se, por favor.\" em inglês?", options: [
            { text: "Please sit down", correct: true },
            { text: "Please stand up", correct: false },
            { text: "Please wait here", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Siga-me.\" em inglês?", options: [
            { text: "Follow me", correct: true },
            { text: "Wait for me", correct: false },
            { text: "Call me", correct: false },
          ] },
          { type: "ASSIST", question: "\"Pode ajudar-me?\"", options: [
            { text: "Can you help me?", correct: true },
            { text: "Can you follow me?", correct: false },
            { text: "Can you wait?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Espere um momento.\"", options: [
            { text: "Wait a moment", correct: true },
            { text: "Sit a moment", correct: false },
            { text: "Follow a moment", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Siga-me, por favor.\"", options: [
            { text: "Follow me, please", correct: true },
          ] },
        ],
      },
      {
        title: "Pedir ajuda no trabalho",
        icon: "MessageCircle",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Pode repetir isso?\" em inglês?", options: [
            { text: "Can you repeat that?", correct: true },
            { text: "Can you help that?", correct: false },
            { text: "Can you wait that?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Não entendo.\" em inglês?", options: [
            { text: "I don't understand", correct: true },
            { text: "I don't help", correct: false },
            { text: "I don't wait", correct: false },
          ] },
          { type: "ASSIST", question: "\"Onde é o banheiro?\"", options: [
            { text: "Where is the bathroom?", correct: true },
            { text: "Where is the office?", correct: false },
            { text: "Where is the meeting?", correct: false },
          ] },
          { type: "ASSIST", question: "\"A que horas é o almoço?\"", options: [
            { text: "What time is lunch?", correct: true },
            { text: "What time is it?", correct: false },
            { text: "What time is the meeting?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Não entendo.\"", options: [
            { text: "I don't understand", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "SELECT", question: "Como se diz \"Siga-me.\" em inglês?", options: [
        { text: "Follow me", correct: true },
        { text: "Wait for me", correct: false },
        { text: "Help me", correct: false },
      ] },
      { type: "ASSIST", question: "\"Não entendo.\"", options: [
        { text: "I don't understand", correct: true },
        { text: "I don't follow", correct: false },
        { text: "I don't wait", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Pode ajudar-me?\"", options: [
        { text: "Can you help me?", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Primeiras palavras em viagem",
    newLessons: [
      {
        title: "No aeroporto (básico)",
        icon: "Plane",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Onde é o portão 5?\" em inglês?", options: [
            { text: "Where is gate 5?", correct: true },
            { text: "Where is room 5?", correct: false },
            { text: "Where is seat 5?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o cartão de embarque\" em inglês?", options: [
            { text: "the boarding pass", correct: true },
            { text: "the passport", correct: false },
            { text: "the suitcase", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tenho uma mala.\"", options: [
            { text: "I have one suitcase", correct: true },
            { text: "I have one passport", correct: false },
            { text: "I have one ticket", correct: false },
          ] },
          { type: "ASSIST", question: "\"Este é o meu passaporte.\"", options: [
            { text: "This is my passport", correct: true },
            { text: "This is my suitcase", correct: false },
            { text: "This is my gate", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"o cartão de embarque\"", options: [
            { text: "the boarding pass", correct: true },
          ] },
        ],
      },
      {
        title: "Alojamento simples",
        icon: "Hotel",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Tenho uma reserva.\" em inglês?", options: [
            { text: "I have a reservation", correct: true },
            { text: "I have a passport", correct: false },
            { text: "I have a key", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"a chave\" em inglês?", options: [
            { text: "the key", correct: true },
            { text: "the room", correct: false },
            { text: "the breakfast", correct: false },
          ] },
          { type: "ASSIST", question: "\"Onde é o meu quarto?\"", options: [
            { text: "Where is my room?", correct: true },
            { text: "Where is my key?", correct: false },
            { text: "Where is my suitcase?", correct: false },
          ] },
          { type: "ASSIST", question: "\"A que horas é o pequeno-almoço?\"", options: [
            { text: "What time is breakfast?", correct: true },
            { text: "What time is the room?", correct: false },
            { text: "What time is it?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Tenho uma reserva.\"", options: [
            { text: "I have a reservation", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "SELECT", question: "Como se diz \"a chave\" em inglês?", options: [
        { text: "the key", correct: true },
        { text: "the gate", correct: false },
        { text: "the room", correct: false },
      ] },
      { type: "ASSIST", question: "\"Tenho uma reserva.\"", options: [
        { text: "I have a reservation", correct: true },
        { text: "I have a suitcase", correct: false },
        { text: "I have a passport", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"o cartão de embarque\"", options: [
        { text: "the boarding pass", correct: true },
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
          eq(schema.units.targetLevel, "BEGINNER"),
        ),
      });

      if (!unitRow) {
        throw new Error(`Unit not found: ${extra.unitTitle}`);
      }

      const alreadySeeded = await db.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.unitId, unitRow.id),
          eq(schema.lessons.title, extra.newLessons[0].title),
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

        if (reviewLesson) {
          // The review lesson currently sits at order 6; the two new content
          // lessons take 6 and 7, so review moves to 8.
          await tx.update(schema.lessons)
            .set({ order: 8 })
            .where(eq(schema.lessons.id, reviewLesson.id));
        }

        for (let index = 0; index < extra.newLessons.length; index++) {
          const lesson = extra.newLessons[index];
          const [lessonRow] = await tx.insert(schema.lessons).values({
            unitId: unitRow.id,
            title: lesson.title,
            icon: lesson.icon,
            order: 6 + index,
          }).returning();

          await insertChallenges(tx, lessonRow.id, lesson.challenges, 1);
        }

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
            order: 8,
          }).returning();

          await insertChallenges(tx, newReviewLesson.id, extra.reviewAdditions, 1);
        }
      });
    }

    console.log("BEGINNER units extended with 2 new lessons each.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extend BEGINNER units");
  } finally {
    await pool.end();
  }
};

main();
