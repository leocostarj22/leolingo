import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";

import * as schema from "../db/schema";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE";
type NewChallenge = { type: ChallengeType; question: string; options: Option[] };
type UnitReviewContent = { unitTitle: string; challenges: NewChallenge[] };

// Revisão da unidade: mistura itens já vistos nas lições normais dessa
// unidade (sem vocabulário novo), sem DIALOGUE (é só leitura passiva, não
// testa recordação) e sem áudio (nenhum destes itens precisa de TTS novo).
const unitReviewsContent: UnitReviewContent[] = [
  {
    unitTitle: "Noções básicas",
    challenges: [
      { type: "SELECT", question: "Como se diz \"Olá\" em inglês?", options: [
        { text: "Hello", correct: true },
        { text: "Goodbye", correct: false },
        { text: "Please", correct: false },
      ] },
      { type: "ASSIST", question: "\"Por favor\"", options: [
        { text: "Please", correct: true },
        { text: "Thank you", correct: false },
        { text: "Sorry", correct: false },
      ] },
      { type: "SELECT", question: "Qual destas é \"a mulher\"?", options: [
        { text: "the woman", correct: true },
        { text: "the man", correct: false },
        { text: "the boy", correct: false },
      ] },
      { type: "ASSIST", question: "\"cinco\"", options: [
        { text: "five", correct: true },
        { text: "four", correct: false },
        { text: "six", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"7\" em inglês?", options: [
        { text: "seven", correct: true },
        { text: "seventeen", correct: false },
        { text: "seventy", correct: false },
      ] },
      { type: "ASSIST", question: "\"Eles são\"", options: [
        { text: "They are", correct: true },
        { text: "They have", correct: false },
        { text: "They is", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Ela tem um gato\"", options: [
        { text: "She has a cat", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Eu sou feliz\"", options: [
        { text: "I", correct: true },
        { text: "am", correct: true },
        { text: "happy", correct: true },
        { text: "have", correct: false },
        { text: "is", correct: false },
      ] },
    ],
  },
  {
    unitTitle: "Inglês no trabalho",
    challenges: [
      { type: "SELECT", question: "Como se diz \"o chefe\" em inglês?", options: [
        { text: "the boss", correct: true },
        { text: "the colleague", correct: false },
        { text: "the report", correct: false },
      ] },
      { type: "ASSIST", question: "\"o computador\"", options: [
        { text: "the computer", correct: true },
        { text: "the desk", correct: false },
        { text: "the colleague", correct: false },
      ] },
      { type: "ASSIST", question: "\"Concordo.\"", options: [
        { text: "I agree", correct: true },
        { text: "I disagree", correct: false },
        { text: "I have a question", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Vamos fazer uma pausa\" em inglês?", options: [
        { text: "Let's take a break", correct: true },
        { text: "Let's start", correct: false },
        { text: "Let's agree", correct: false },
      ] },
      { type: "ASSIST", question: "\"Em anexo\"", options: [
        { text: "Attached", correct: true },
        { text: "Dear", correct: false },
        { text: "Best regards", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Obrigado pelo seu email\" em inglês?", options: [
        { text: "Thank you for your email", correct: true },
        { text: "Thank you for your time", correct: false },
        { text: "See you soon", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Vemo-nos na segunda-feira.\"", options: [
        { text: "See you on Monday", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Tens um minuto?\"", options: [
        { text: "Do", correct: true },
        { text: "you", correct: true },
        { text: "have", correct: true },
        { text: "a", correct: true },
        { text: "minute?", correct: true },
        { text: "need", correct: false },
        { text: "question", correct: false },
      ] },
    ],
  },
  {
    unitTitle: "Inglês em viagem",
    challenges: [
      { type: "ASSIST", question: "\"o passaporte\"", options: [
        { text: "the passport", correct: true },
        { text: "the suitcase", correct: false },
        { text: "the flight", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"o portão de embarque\" em inglês?", options: [
        { text: "the boarding gate", correct: true },
        { text: "the check-in", correct: false },
        { text: "the ticket", correct: false },
      ] },
      { type: "ASSIST", question: "\"a chave\"", options: [
        { text: "the key", correct: true },
        { text: "the room", correct: false },
        { text: "the towel", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Preciso de uma toalha\" em inglês?", options: [
        { text: "I need a towel", correct: true },
        { text: "I need a key", correct: false },
        { text: "I need a room", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Vire à esquerda\" em inglês?", options: [
        { text: "Turn left", correct: true },
        { text: "Turn right", correct: false },
        { text: "Go straight", correct: false },
      ] },
      { type: "ASSIST", question: "\"Está perto.\"", options: [
        { text: "It's close", correct: true },
        { text: "It's far", correct: false },
        { text: "It's here", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Posso ver o menu?\"", options: [
        { text: "Can I see the menu?", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"Eu gostaria de um café\"", options: [
        { text: "I", correct: true },
        { text: "would", correct: true },
        { text: "like", correct: true },
        { text: "a", correct: true },
        { text: "coffee", correct: true },
        { text: "want", correct: false },
        { text: "need", correct: false },
      ] },
    ],
  },
];

type Database = typeof db;

const insertUnitReview = async (tx: Database, content: UnitReviewContent) => {
  const [unitRow] = await tx
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

  const [lessonRow] = await tx.insert(schema.lessons).values({
    unitId: unitRow.id,
    title: "Revisão da Unidade",
    icon: "Trophy",
    order: 6,
    isBonus: false,
  }).returning();

  let challengeOrder = 1;
  for (const challenge of content.challenges) {
    const [challengeRow] = await tx.insert(schema.challenges).values({
      lessonId: lessonRow.id,
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
    const alreadySeeded = await db.query.lessons.findFirst({
      where: eq(schema.lessons.title, "Revisão da Unidade"),
    });

    if (alreadySeeded) {
      console.log("Unit review lessons already seeded, skipping.");
      return;
    }

    await db.transaction(async (tx) => {
      console.log("Inserting unit review lessons...");
      for (const content of unitReviewsContent) {
        await insertUnitReview(tx, content);
      }
    });

    console.log("Unit review lessons inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert unit review lessons");
  } finally {
    await pool.end();
  }
};

main();
