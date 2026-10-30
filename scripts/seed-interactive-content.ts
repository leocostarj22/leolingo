import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, sql } from "drizzle-orm";

import * as schema from "../db/schema";
import { generateAudio } from "./generate-audio";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE";
type NewChallenge = { type: ChallengeType; question: string; options: Option[]; audioSrc?: string };
type ExistingLessonContent = { lessonTitle: string; challenges: NewChallenge[] };
type BonusLessonContent = { unitTitle: string; title: string; challenges: NewChallenge[] };

const audioItems = [
  { slug: "how-are-you", text: "How are you?" },
  { slug: "nice-to-meet-you", text: "Nice to meet you" },
  { slug: "we-are-students", text: "We are students" },
  { slug: "i-am-happy", text: "I am happy" },
  { slug: "lets-schedule-a-meeting", text: "Let's schedule a meeting" },
  { slug: "i-have-a-question", text: "I have a question" },
  { slug: "see-you-at-the-office", text: "See you at the office" },
  { slug: "have-a-good-weekend", text: "Have a good weekend" },
  { slug: "where-is-gate-five", text: "Where is gate five?" },
  { slug: "i-need-a-new-ticket", text: "I need a new ticket" },
  { slug: "can-i-have-the-bill", text: "Can I have the bill?" },
  { slug: "this-is-delicious", text: "This is delicious" },
];

const existingLessonsContent: ExistingLessonContent[] = [
  {
    lessonTitle: "Cumprimentos",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"Boa noite\"", options: [
        { text: "Good night", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/how-are-you.mp3", options: [
        { text: "How are you?", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Como te chamas?\"", options: [
        { text: "What", correct: true },
        { text: "is", correct: true },
        { text: "your", correct: true },
        { text: "name?", correct: true },
        { text: "Where", correct: false },
        { text: "How", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/nice-to-meet-you.mp3", options: [
        { text: "Nice", correct: true },
        { text: "to", correct: true },
        { text: "meet", correct: true },
        { text: "you", correct: true },
        { text: "See", correct: false },
        { text: "Good", correct: false },
      ] },
    ],
  },
  {
    lessonTitle: "Be e Have",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"Ele tem um cão\"", options: [
        { text: "He has a dog", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/we-are-students.mp3", options: [
        { text: "We are students", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Tu tens razão\"", options: [
        { text: "You", correct: true },
        { text: "are", correct: true },
        { text: "right", correct: true },
        { text: "have", correct: false },
        { text: "is", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/i-am-happy.mp3", options: [
        { text: "I", correct: true },
        { text: "am", correct: true },
        { text: "happy", correct: true },
        { text: "have", correct: false },
        { text: "is", correct: false },
      ] },
    ],
  },
  {
    lessonTitle: "Reuniões",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"Eu concordo totalmente\"", options: [
        { text: "I totally agree", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/lets-schedule-a-meeting.mp3", options: [
        { text: "Let's schedule a meeting", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Podemos adiar a reunião?\"", options: [
        { text: "Can", correct: true },
        { text: "we", correct: true },
        { text: "postpone", correct: true },
        { text: "the", correct: true },
        { text: "meeting?", correct: true },
        { text: "cancel", correct: false },
        { text: "start", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/i-have-a-question.mp3", options: [
        { text: "I", correct: true },
        { text: "have", correct: true },
        { text: "a", correct: true },
        { text: "question", correct: true },
        { text: "need", correct: false },
        { text: "am", correct: false },
      ] },
    ],
  },
  {
    lessonTitle: "Conversas de trabalho",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"Tenho de ir\"", options: [
        { text: "I have to go", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/see-you-at-the-office.mp3", options: [
        { text: "See you at the office", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Vamos almoçar juntos?\"", options: [
        { text: "Shall", correct: true },
        { text: "we", correct: true },
        { text: "have", correct: true },
        { text: "lunch", correct: true },
        { text: "together?", correct: true },
        { text: "dinner", correct: false },
        { text: "meeting", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/have-a-good-weekend.mp3", options: [
        { text: "Have", correct: true },
        { text: "a", correct: true },
        { text: "good", correct: true },
        { text: "weekend", correct: true },
        { text: "nice", correct: false },
        { text: "day", correct: false },
      ] },
    ],
  },
  {
    lessonTitle: "No aeroporto",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"O meu voo foi cancelado\"", options: [
        { text: "My flight was cancelled", correct: true },
        { text: "My flight was canceled", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/where-is-gate-five.mp3", options: [
        { text: "Where is gate five?", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Perdi o meu voo\"", options: [
        { text: "I", correct: true },
        { text: "missed", correct: true },
        { text: "my", correct: true },
        { text: "flight", correct: true },
        { text: "lost", correct: false },
        { text: "passport", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/i-need-a-new-ticket.mp3", options: [
        { text: "I", correct: true },
        { text: "need", correct: true },
        { text: "a", correct: true },
        { text: "new", correct: true },
        { text: "ticket", correct: true },
        { text: "want", correct: false },
        { text: "flight", correct: false },
      ] },
    ],
  },
  {
    lessonTitle: "No restaurante",
    challenges: [
      { type: "WRITE", question: "Escreve em inglês: \"Está muito bom\"", options: [
        { text: "It's very good", correct: true },
        { text: "It is very good", correct: true },
      ] },
      { type: "WRITE", question: "Escreve a frase que ouviste.", audioSrc: "/audio/can-i-have-the-bill.mp3", options: [
        { text: "Can I have the bill?", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Quero reservar uma mesa\"", options: [
        { text: "I", correct: true },
        { text: "want", correct: true },
        { text: "to", correct: true },
        { text: "book", correct: true },
        { text: "a", correct: true },
        { text: "table", correct: true },
        { text: "need", correct: false },
        { text: "room", correct: false },
      ] },
      { type: "ARRANGE", question: "Ouve e monta a frase.", audioSrc: "/audio/this-is-delicious.mp3", options: [
        { text: "This", correct: true },
        { text: "is", correct: true },
        { text: "delicious", correct: true },
        { text: "was", correct: false },
        { text: "great", correct: false },
      ] },
    ],
  },
];

const bonusLessonsContent: BonusLessonContent[] = [
  {
    unitTitle: "Noções básicas",
    title: "Primeira conversa",
    challenges: [
      { type: "DIALOGUE", question: "Leo: Hi! What's your name?\nJuba: Hi! I'm Juba. What's your name?\nLeo: I'm Leo. Nice to meet you!\nJuba: Nice to meet you too!", options: [] },
      { type: "SELECT", question: "O que a Juba perguntou ao Leo?", options: [
        { text: "What's your name?", correct: true },
        { text: "How are you?", correct: false },
        { text: "Where are you from?", correct: false },
      ] },
      { type: "SELECT", question: "Quem disse \"Nice to meet you too!\"?", options: [
        { text: "Juba", correct: true },
        { text: "Leo", correct: false },
        { text: "Nenhum dos dois", correct: false },
      ] },
    ],
  },
  {
    unitTitle: "Inglês no trabalho",
    title: "Uma reunião rápida",
    challenges: [
      { type: "DIALOGUE", question: "Leo: Can we start the meeting?\nJuba: Sure, I have a question first.\nLeo: Go ahead.\nJuba: Can we postpone the deadline?\nLeo: Let's discuss it after lunch.", options: [] },
      { type: "SELECT", question: "O que a Juba pergunta?", options: [
        { text: "Se podem adiar o prazo", correct: true },
        { text: "Se podem cancelar a reunião", correct: false },
        { text: "Se podem almoçar juntos", correct: false },
      ] },
      { type: "SELECT", question: "Quando é que vão discutir o prazo?", options: [
        { text: "Depois do almoço", correct: true },
        { text: "Amanhã de manhã", correct: false },
        { text: "Agora mesmo", correct: false },
      ] },
    ],
  },
  {
    unitTitle: "Inglês em viagem",
    title: "No check-in do hotel",
    challenges: [
      { type: "DIALOGUE", question: "Juba: Hi, I have a reservation.\nLeo: Great, what's your name?\nJuba: My name is Juba Silva.\nLeo: Here is your key. Room 204.\nJuba: Thank you! What time is breakfast?\nLeo: Breakfast is from 7 to 10.", options: [] },
      { type: "SELECT", question: "Qual é o número do quarto da Juba?", options: [
        { text: "204", correct: true },
        { text: "402", correct: false },
        { text: "214", correct: false },
      ] },
      { type: "SELECT", question: "A que horas é o pequeno-almoço?", options: [
        { text: "Das 7 às 10", correct: true },
        { text: "Das 8 às 11", correct: false },
        { text: "Das 6 às 9", correct: false },
      ] },
    ],
  },
];

const insertIntoExistingLesson = async (content: ExistingLessonContent) => {
  const [lessonRow] = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .innerJoin(schema.units, eq(schema.lessons.unitId, schema.units.id))
    .innerJoin(schema.courses, eq(schema.units.courseId, schema.courses.id))
    .where(and(
      eq(schema.courses.title, "English"),
      eq(schema.lessons.title, content.lessonTitle),
    ));

  if (!lessonRow) {
    throw new Error(`Lesson not found: ${content.lessonTitle}`);
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${schema.challenges.order}), 0)` })
    .from(schema.challenges)
    .where(eq(schema.challenges.lessonId, lessonRow.id));

  let challengeOrder = maxOrder + 1;
  for (const challenge of content.challenges) {
    const [challengeRow] = await db.insert(schema.challenges).values({
      lessonId: lessonRow.id,
      type: challenge.type,
      question: challenge.question,
      order: challengeOrder++,
      audioSrc: challenge.audioSrc,
    }).returning();

    if (challenge.options.length > 0) {
      await db.insert(schema.challengeOptions).values(
        challenge.options.map((option) => ({
          challengeId: challengeRow.id,
          text: option.text,
          correct: option.correct,
        })),
      );
    }
  }
};

const insertBonusLesson = async (content: BonusLessonContent) => {
  const [unitRow] = await db
    .select({ id: schema.units.id })
    .from(schema.units)
    .innerJoin(schema.courses, eq(schema.units.courseId, schema.courses.id))
    .where(and(
      eq(schema.courses.title, "English"),
      eq(schema.units.title, content.unitTitle),
    ));

  if (!unitRow) {
    throw new Error(`Unit not found: ${content.unitTitle}`);
  }

  const [lessonRow] = await db.insert(schema.lessons).values({
    unitId: unitRow.id,
    title: content.title,
    order: 5,
    isBonus: true,
  }).returning();

  let challengeOrder = 1;
  for (const challenge of content.challenges) {
    const [challengeRow] = await db.insert(schema.challenges).values({
      lessonId: lessonRow.id,
      type: challenge.type,
      question: challenge.question,
      order: challengeOrder++,
      audioSrc: challenge.audioSrc,
    }).returning();

    if (challenge.options.length > 0) {
      await db.insert(schema.challengeOptions).values(
        challenge.options.map((option) => ({
          challengeId: challengeRow.id,
          text: option.text,
          correct: option.correct,
        })),
      );
    }
  }
};

const main = async () => {
  try {
    console.log("Generating audio...");
    await generateAudio(audioItems);

    console.log("Inserting WRITE/ARRANGE content into existing lessons...");
    for (const content of existingLessonsContent) {
      await insertIntoExistingLesson(content);
    }

    console.log("Inserting bonus dialogue lessons...");
    for (const content of bonusLessonsContent) {
      await insertBonusLesson(content);
    }

    console.log("Interactive content inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert interactive content");
  } finally {
    await pool.end();
  }
};

main();
