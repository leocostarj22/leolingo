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
    unitTitle: "Inglês intermédio — Base",
    newLessons: [
      {
        title: "Voz passiva",
        icon: "GitBranch",
        challenges: [
          { type: "SELECT", question: "Como se diz \"O relatório foi escrito pelo João\" em inglês?", options: [
            { text: "The report was written by John", correct: true },
            { text: "John was written the report", correct: false },
            { text: "The report is writing by John", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"A janela foi partida\" em inglês?", options: [
            { text: "The window was broken", correct: true },
            { text: "The window broke itself", correct: false },
            { text: "The window is breaking", correct: false },
          ] },
          { type: "ASSIST", question: "\"Este carro foi fabricado em 2020.\"", options: [
            { text: "This car was made in 2020", correct: true },
            { text: "This car made in 2020", correct: false },
            { text: "This car is made in 2020", correct: false },
          ] },
          { type: "ASSIST", question: "\"O email vai ser enviado esta tarde.\"", options: [
            { text: "The email will be sent this afternoon", correct: true },
            { text: "The email will send this afternoon", correct: false },
            { text: "The email is sent this afternoon", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"A reunião foi cancelada.\"", options: [
            { text: "The meeting was cancelled", correct: true },
            { text: "The meeting was canceled", correct: true },
          ] },
        ],
      },
      {
        title: "Verbos modais",
        icon: "Scale",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Devias ligar-lhe\" em inglês?", options: [
            { text: "You should call her", correct: true },
            { text: "You must call her", correct: false },
            { text: "You can call her", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Posso chegar atrasado\" em inglês?", options: [
            { text: "I might be late", correct: true },
            { text: "I must be late", correct: false },
            { text: "I should be late", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tens de terminar isto hoje.\"", options: [
            { text: "You must finish this today", correct: true },
            { text: "You might finish this today", correct: false },
            { text: "You could finish this today", correct: false },
          ] },
          { type: "ASSIST", question: "\"Podias ajudar-me com isto?\"", options: [
            { text: "Could you help me with this?", correct: true },
            { text: "Must you help me with this?", correct: false },
            { text: "Should you help me with this?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Não precisas de vir se estiveres cansado.\"", options: [
            { text: "You don't need to come if you are tired", correct: true },
            { text: "You don't have to come if you are tired", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Este carro foi fabricado em 2020.\"", options: [
        { text: "This car was made in 2020", correct: true },
        { text: "This car made in 2020", correct: false },
        { text: "This car is made in 2020", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Tens de terminar isto hoje\" em inglês?", options: [
        { text: "You must finish this today", correct: true },
        { text: "You might finish this today", correct: false },
        { text: "You could finish this today", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"A reunião foi cancelada.\"", options: [
        { text: "The meeting was cancelled", correct: true },
        { text: "The meeting was canceled", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês intermédio no trabalho",
    newLessons: [
      {
        title: "Email formal",
        icon: "Mail",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Escrevo para informar que...\" em inglês?", options: [
            { text: "I am writing to inform you that...", correct: true },
            { text: "I write for inform you that...", correct: false },
            { text: "I am write to inform that...", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Segue em anexo o documento\" em inglês?", options: [
            { text: "Please find attached the document", correct: true },
            { text: "Please find attach the document", correct: false },
            { text: "Please see the document attach", correct: false },
          ] },
          { type: "ASSIST", question: "\"Fico à espera da sua resposta.\"", options: [
            { text: "I look forward to your reply", correct: true },
            { text: "I wait forward your reply", correct: false },
            { text: "I look forward for your reply", correct: false },
          ] },
          { type: "ASSIST", question: "\"Não hesite em contactar-me.\"", options: [
            { text: "Please do not hesitate to contact me", correct: true },
            { text: "Please do not hesitate contact me", correct: false },
            { text: "Please not hesitate to contact me", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Obrigado pelo seu tempo.\"", options: [
            { text: "Thank you for your time", correct: true },
          ] },
        ],
      },
      {
        title: "Pequenas negociações",
        icon: "Scale",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Podíamos acordar um preço mais baixo?\" em inglês?", options: [
            { text: "Could we agree on a lower price?", correct: true },
            { text: "Could we agree a price more low?", correct: false },
            { text: "Can we agree on low a price?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isso funciona para mim\" em inglês?", options: [
            { text: "That works for me", correct: true },
            { text: "That work for me", correct: false },
            { text: "That is working to me", correct: false },
          ] },
          { type: "ASSIST", question: "\"Receio que isso não seja possível.\"", options: [
            { text: "I'm afraid that's not possible", correct: true },
            { text: "I fear that's not possible", correct: false },
            { text: "I'm afraid of that's not possible", correct: false },
          ] },
          { type: "ASSIST", question: "\"Podemos chegar a um meio-termo?\"", options: [
            { text: "Can we reach a compromise?", correct: true },
            { text: "Can we arrive a compromise?", correct: false },
            { text: "Can we reach to a compromise?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vamos pensar na proposta.\"", options: [
            { text: "We will think about the proposal", correct: true },
            { text: "We'll think about the proposal", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Fico à espera da sua resposta.\"", options: [
        { text: "I look forward to your reply", correct: true },
        { text: "I wait forward your reply", correct: false },
        { text: "I look forward for your reply", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Isso funciona para mim\" em inglês?", options: [
        { text: "That works for me", correct: true },
        { text: "That work for me", correct: false },
        { text: "That is working to me", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Obrigado pelo seu tempo.\"", options: [
        { text: "Thank you for your time", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês intermédio em viagem",
    newLessons: [
      {
        title: "Planear uma viagem",
        icon: "MapPin",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Estou a planear uma viagem a...\" em inglês?", options: [
            { text: "I'm planning a trip to...", correct: true },
            { text: "I'm planning a travel to...", correct: false },
            { text: "I'm planning of a trip to...", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Quanto tempo dura o voo?\" em inglês?", options: [
            { text: "How long is the flight?", correct: true },
            { text: "How much time is the flight?", correct: false },
            { text: "How long takes the flight?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Qual é a melhor época para visitar?\"", options: [
            { text: "What's the best time to visit?", correct: true },
            { text: "What's the best time for visit?", correct: false },
            { text: "Which is the best time to visit?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Preciso de reservar com antecedência.\"", options: [
            { text: "I need to book in advance", correct: true },
            { text: "I need to reserve with advance", correct: false },
            { text: "I need book in advance", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vamos ficar uma semana.\"", options: [
            { text: "We are staying for a week", correct: true },
            { text: "We're staying for a week", correct: true },
          ] },
        ],
      },
      {
        title: "Recomendações e opiniões",
        icon: "MessageSquare",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Recomendo visitar...\" em inglês?", options: [
            { text: "I'd recommend visiting...", correct: true },
            { text: "I recommend to visit...", correct: false },
            { text: "I'd recommend to visiting...", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Na minha opinião...\" em inglês?", options: [
            { text: "In my opinion...", correct: true },
            { text: "In my opinion of...", correct: false },
            { text: "For my opinion...", correct: false },
          ] },
          { type: "ASSIST", question: "\"O que pensas sobre este lugar?\"", options: [
            { text: "What do you think about this place?", correct: true },
            { text: "What do you think of about this place?", correct: false },
            { text: "What you think about this place?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vale mesmo a pena visitar.\"", options: [
            { text: "It's really worth visiting", correct: true },
            { text: "It's really worth to visit", correct: false },
            { text: "It's really worthy visit", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Prefiro praias a montanhas.\"", options: [
            { text: "I prefer beaches to mountains", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Qual é a melhor época para visitar?\"", options: [
        { text: "What's the best time to visit?", correct: true },
        { text: "What's the best time for visit?", correct: false },
        { text: "Which is the best time to visit?", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Recomendo visitar...\" em inglês?", options: [
        { text: "I'd recommend visiting...", correct: true },
        { text: "I recommend to visit...", correct: false },
        { text: "I'd recommend to visiting...", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Prefiro praias a montanhas.\"", options: [
        { text: "I prefer beaches to mountains", correct: true },
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
          eq(schema.units.targetLevel, "INTERMEDIATE"),
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
          await tx.update(schema.lessons)
            .set({ order: 8 })
            .where(eq(schema.lessons.id, reviewLesson.id));
        }

        let lessonOrder = 6;
        for (const newLesson of extra.newLessons) {
          const [lessonRow] = await tx.insert(schema.lessons).values({
            unitId: unitRow.id,
            title: newLesson.title,
            icon: newLesson.icon,
            order: lessonOrder++,
          }).returning();

          await insertChallenges(tx, lessonRow.id, newLesson.challenges, 1);
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

    console.log("INTERMEDIATE units extended.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extend INTERMEDIATE units");
  } finally {
    await pool.end();
  }
};

main();
