import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";

import * as schema from "../db/schema";
import type { LessonIcon } from "../lib/lesson-icons";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE";
type Challenge = { type: ChallengeType; question: string; options: Option[] };
type Lesson = { title: string; icon: LessonIcon; challenges: Challenge[] };

const lessons: Lesson[] = [
  {
    title: "Problemas na viagem",
    icon: "Plane",
    challenges: [
      { type: "SELECT", question: "Como se diz \"O meu voo foi cancelado\" em inglês?", options: [
        { text: "My flight has been cancelled", correct: true },
        { text: "My flight is cancelling", correct: false },
        { text: "My flight was cancel", correct: false },
      ] },
      { type: "ASSIST", question: "\"Perdi a ligação do voo.\"", options: [
        { text: "I missed my connecting flight", correct: true },
        { text: "I lost my connecting flight", correct: false },
        { text: "I miss my connecting flight", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"A minha mala não apareceu\" em inglês?", options: [
        { text: "My luggage didn't show up", correct: true },
        { text: "My luggage doesn't show", correct: false },
        { text: "My luggage isn't shown", correct: false },
      ] },
      { type: "ASSIST", question: "\"Há algum voo mais cedo disponível?\"", options: [
        { text: "Is there an earlier flight available?", correct: true },
        { text: "Is there an early flight available?", correct: false },
        { text: "Was there an earlier flight available?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Preciso de reportar uma mala perdida\"", options: [
        { text: "I need to report a lost bag", correct: true },
        { text: "I need to report lost luggage", correct: true },
      ] },
    ],
  },
  {
    title: "Alojamento e reservas",
    icon: "Hotel",
    challenges: [
      { type: "SELECT", question: "Como se diz \"Gostaria de alterar a minha reserva\" em inglês?", options: [
        { text: "I would like to change my reservation", correct: true },
        { text: "I would like to cancel my reservation", correct: false },
        { text: "I will change my reservation", correct: false },
      ] },
      { type: "ASSIST", question: "\"O quarto não tem a vista que pedi.\"", options: [
        { text: "The room doesn't have the view I asked for", correct: true },
        { text: "The room doesn't have the view I ask for", correct: false },
        { text: "The room hasn't the view I asked for", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"A que horas é o check-out?\" em inglês?", options: [
        { text: "What time is check-out?", correct: true },
        { text: "What time was check-out?", correct: false },
        { text: "What time is check-in?", correct: false },
      ] },
      { type: "ASSIST", question: "\"Podia pedir mais uma noite?\"", options: [
        { text: "Could I book one more night?", correct: true },
        { text: "Could I booked one more night?", correct: false },
        { text: "Can I booking one more night?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Fiz a reserva online\"", options: [
        { text: "I made the reservation online", correct: true },
        { text: "I booked online", correct: true },
      ] },
    ],
  },
  {
    title: "Transportes públicos",
    icon: "MapPin",
    challenges: [
      { type: "SELECT", question: "Como se diz \"Qual autocarro vai para o centro?\" em inglês?", options: [
        { text: "Which bus goes downtown?", correct: true },
        { text: "Which bus went downtown?", correct: false },
        { text: "Which bus is going from downtown?", correct: false },
      ] },
      { type: "ASSIST", question: "\"Onde devo fazer transbordo?\"", options: [
        { text: "Where should I transfer?", correct: true },
        { text: "Where do I transferred?", correct: false },
        { text: "Where I should transfer?", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"O comboio está atrasado\" em inglês?", options: [
        { text: "The train is delayed", correct: true },
        { text: "The train was delayed", correct: false },
        { text: "The train is delaying", correct: false },
      ] },
      { type: "ASSIST", question: "\"Este bilhete serve para o metro também?\"", options: [
        { text: "Does this ticket work for the subway too?", correct: true },
        { text: "Does this ticket working for the subway too?", correct: false },
        { text: "Is this ticket work for the subway too?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Onde fica a paragem mais próxima?\"", options: [
        { text: "Where is the nearest stop?", correct: true },
      ] },
    ],
  },
  {
    title: "Emergências",
    icon: "UserCheck",
    challenges: [
      { type: "SELECT", question: "Como se diz \"Preciso de ajuda, por favor\" em inglês?", options: [
        { text: "I need help, please", correct: true },
        { text: "I needed help, please", correct: false },
        { text: "I need helping, please", correct: false },
      ] },
      { type: "ASSIST", question: "\"Alguém roubou a minha carteira.\"", options: [
        { text: "Someone stole my wallet", correct: true },
        { text: "Someone steals my wallet", correct: false },
        { text: "Someone has steal my wallet", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Onde fica o hospital mais próximo?\" em inglês?", options: [
        { text: "Where is the nearest hospital?", correct: true },
        { text: "Where was the nearest hospital?", correct: false },
        { text: "Where is the near hospital?", correct: false },
      ] },
      { type: "ASSIST", question: "\"Pode chamar a polícia?\"", options: [
        { text: "Can you call the police?", correct: true },
        { text: "Can you called the police?", correct: false },
        { text: "Could you calling the police?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Perdi o meu passaporte\"", options: [
        { text: "I lost my passport", correct: true },
      ] },
    ],
  },
  {
    title: "Cultura e costumes",
    icon: "Puzzle",
    challenges: [
      { type: "SELECT", question: "Como se diz \"É costume dar gorjeta aqui?\" em inglês?", options: [
        { text: "Is it customary to tip here?", correct: true },
        { text: "Is it custom to tip here?", correct: false },
        { text: "Is it a custom to tipping here?", correct: false },
      ] },
      { type: "ASSIST", question: "\"Nunca tinha experimentado esta comida antes.\"", options: [
        { text: "I had never tried this food before", correct: true },
        { text: "I never tried this food before", correct: false },
        { text: "I have never try this food before", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Quando em Roma, faz como os romanos\" em inglês?", options: [
        { text: "When in Rome, do as the Romans do", correct: true },
        { text: "When in Rome, make as Romans make", correct: false },
        { text: "When in Rome, be as Romans are", correct: false },
      ] },
      { type: "ASSIST", question: "\"É falta de educação chegar atrasado?\"", options: [
        { text: "Is it rude to arrive late?", correct: true },
        { text: "Is it rude arrive late?", correct: false },
        { text: "Is it rudely to arrive late?", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Adapto-me facilmente a novas culturas\"", options: [
        { text: "I adapt easily to new cultures", correct: true },
      ] },
    ],
  },
  {
    title: "Revisão da Unidade",
    icon: "Trophy",
    challenges: [
      { type: "SELECT", question: "Como se diz \"O meu voo foi cancelado\" em inglês?", options: [
        { text: "My flight has been cancelled", correct: true },
        { text: "My flight is cancelling", correct: false },
        { text: "My flight was cancel", correct: false },
      ] },
      { type: "ASSIST", question: "\"Gostaria de alterar a minha reserva.\"", options: [
        { text: "I would like to change my reservation", correct: true },
        { text: "I would like to cancel my reservation", correct: false },
        { text: "I will change my reservation", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"O comboio está atrasado\" em inglês?", options: [
        { text: "The train is delayed", correct: true },
        { text: "The train was delayed", correct: false },
        { text: "The train is delaying", correct: false },
      ] },
      { type: "ASSIST", question: "\"Alguém roubou a minha carteira.\"", options: [
        { text: "Someone stole my wallet", correct: true },
        { text: "Someone steals my wallet", correct: false },
        { text: "Someone has steal my wallet", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Perdi o meu passaporte\"", options: [
        { text: "I lost my passport", correct: true },
      ] },
      { type: "ARRANGE", question: "Monta a frase: \"É costume dar gorjeta aqui?\"", options: [
        { text: "Is", correct: true },
        { text: "it", correct: true },
        { text: "customary", correct: true },
        { text: "to", correct: true },
        { text: "tip", correct: true },
        { text: "here?", correct: true },
        { text: "was", correct: false },
      ] },
    ],
  },
];

const main = async () => {
  try {
    const [englishCourse] = await db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(eq(schema.courses.title, "English"));

    if (!englishCourse) {
      throw new Error("English course not found");
    }

    const alreadySeeded = await db.query.units.findFirst({
      where: and(
        eq(schema.units.courseId, englishCourse.id),
        eq(schema.units.targetLevel, "INTERMEDIATE"),
        eq(schema.units.targetGoal, "TRAVEL"),
      ),
    });

    if (alreadySeeded) {
      console.log("INTERMEDIATE/TRAVEL unit already seeded, skipping.");
      return;
    }

    const existingIntermediateUnits = await db.query.units.findMany({
      where: and(
        eq(schema.units.courseId, englishCourse.id),
        eq(schema.units.targetLevel, "INTERMEDIATE"),
      ),
    });

    const nextOrder = existingIntermediateUnits.length + 4;

    await db.transaction(async (tx) => {
      console.log("Inserting INTERMEDIATE/TRAVEL unit...");

      const [unitRow] = await tx.insert(schema.units).values({
        courseId: englishCourse.id,
        title: "Inglês intermédio em viagem",
        description: "Lida com imprevistos, reservas e situações do dia a dia em viagem num inglês mais fluente.",
        order: nextOrder,
        targetLevel: "INTERMEDIATE",
        targetGoal: "TRAVEL",
      }).returning();

      let lessonOrder = 1;
      for (const lesson of lessons) {
        const [lessonRow] = await tx.insert(schema.lessons).values({
          unitId: unitRow.id,
          title: lesson.title,
          icon: lesson.icon,
          order: lessonOrder++,
        }).returning();

        let challengeOrder = 1;
        for (const challenge of lesson.challenges) {
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
      }
    });

    console.log("INTERMEDIATE/TRAVEL unit inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert INTERMEDIATE/TRAVEL unit");
  } finally {
    await pool.end();
  }
};

main();
