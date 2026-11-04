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
    unitTitle: "Inglês avançado — Base",
    newLessons: [
      {
        title: "Voz passiva avançada",
        icon: "GitBranch",
        challenges: [
          { type: "SELECT", question: "Como se diz \"A decisão tinha sido tomada antes de eu chegar\" em inglês?", options: [
            { text: "The decision had been made before I arrived", correct: true },
            { text: "The decision was made before I arrived", correct: false },
            { text: "The decision has been made before I arrived", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Os erros devem ser evitados\" em inglês?", options: [
            { text: "Mistakes should be avoided", correct: true },
            { text: "Mistakes must avoided", correct: false },
            { text: "Mistakes should avoid", correct: false },
          ] },
          { type: "ASSIST", question: "\"O contrato está a ser revisto pelos advogados.\"", options: [
            { text: "The contract is being reviewed by the lawyers", correct: true },
            { text: "The contract is reviewed by the lawyers now", correct: false },
            { text: "The contract is being review by the lawyers", correct: false },
          ] },
          { type: "ASSIST", question: "\"Espera-se que o projeto seja concluído até junho.\"", options: [
            { text: "The project is expected to be completed by June", correct: true },
            { text: "The project is expecting to be completed by June", correct: false },
            { text: "The project expects to be completed by June", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"O problema terá sido resolvido até amanhã\"", options: [
            { text: "The problem will have been solved by tomorrow", correct: true },
          ] },
        ],
      },
      {
        title: "Frases hipotéticas",
        icon: "Puzzle",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Se eu tivesse sabido, teria agido diferente\" em inglês?", options: [
            { text: "If I had known, I would have acted differently", correct: true },
            { text: "If I knew, I would act differently", correct: false },
            { text: "If I had know, I would acted differently", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Se ela tivesse ligado antes, poderíamos ter ajudado\" em inglês?", options: [
            { text: "Had she called earlier, we could have helped", correct: true },
            { text: "If she called earlier, we could help", correct: false },
            { text: "Had she call earlier, we could helped", correct: false },
          ] },
          { type: "ASSIST", question: "\"Se não fosse pelo trânsito, já estaríamos lá.\"", options: [
            { text: "If it weren't for the traffic, we would already be there", correct: true },
            { text: "If it wasn't for the traffic, we will already be there", correct: false },
            { text: "If it weren't the traffic, we would already there", correct: false },
          ] },
          { type: "ASSIST", question: "\"Mesmo que ele tivesse razão, deveria ter sido mais diplomático.\"", options: [
            { text: "Even if he had been right, he should have been more diplomatic", correct: true },
            { text: "Even if he was right, he should being more diplomatic", correct: false },
            { text: "Even he had been right, he should have more diplomatic", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Se fosse a ti, não assinaria ainda\"", options: [
            { text: "If I were you, I wouldn't sign yet", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Os erros devem ser evitados.\"", options: [
        { text: "Mistakes should be avoided", correct: true },
        { text: "Mistakes must avoided", correct: false },
        { text: "Mistakes should avoid", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Se ela tivesse ligado antes, poderíamos ter ajudado\" em inglês?", options: [
        { text: "Had she called earlier, we could have helped", correct: true },
        { text: "If she called earlier, we could help", correct: false },
        { text: "Had she call earlier, we could helped", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Se fosse a ti, não assinaria ainda\"", options: [
        { text: "If I were you, I wouldn't sign yet", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês avançado no trabalho",
    newLessons: [
      {
        title: "Gestão de conflitos",
        icon: "Scale",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Vamos encontrar um meio-termo\" em inglês?", options: [
            { text: "Let's find a middle ground", correct: true },
            { text: "Let's find a middle way point", correct: false },
            { text: "Let's find the middle of ground", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Compreendo a tua preocupação, mas...\" em inglês?", options: [
            { text: "I understand your concern, but...", correct: true },
            { text: "I understand you concern, but...", correct: false },
            { text: "I understand your concerning, but...", correct: false },
          ] },
          { type: "ASSIST", question: "\"Precisamos de abordar esta tensão diretamente.\"", options: [
            { text: "We need to address this tension directly", correct: true },
            { text: "We need address this tension directly", correct: false },
            { text: "We need to addressing this tension directly", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos deixar as emoções de lado e focar-nos nos factos.\"", options: [
            { text: "Let's set emotions aside and focus on the facts", correct: true },
            { text: "Let's set aside emotions and focusing on the facts", correct: false },
            { text: "Let's put emotions aside and focus in the facts", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vamos resolver isto de forma profissional\"", options: [
            { text: "Let's resolve this professionally", correct: true },
          ] },
        ],
      },
      {
        title: "Liderança e delegação",
        icon: "UserCheck",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Gostava que assumisses isto\" em inglês?", options: [
            { text: "I'd like you to take ownership of this", correct: true },
            { text: "I'd like you take the ownership of this", correct: false },
            { text: "I'd like you to taking ownership of this", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Vamos definir expectativas claras\" em inglês?", options: [
            { text: "Let's set clear expectations", correct: true },
            { text: "Let's set clearly expectations", correct: false },
            { text: "Let's define clear expectations well", correct: false },
          ] },
          { type: "ASSIST", question: "\"Confio no teu critério para esta decisão.\"", options: [
            { text: "I trust your judgment on this", correct: true },
            { text: "I trust in your judgment on this", correct: false },
            { text: "I trust your judgement for this decision here", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vou delegar esta tarefa à equipa de vendas.\"", options: [
            { text: "I'm going to delegate this task to the sales team", correct: true },
            { text: "I'm going to delegate this task for the sales team", correct: false },
            { text: "I'm going delegate this task to the sales team", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Dá-me um ponto de situação até sexta-feira\"", options: [
            { text: "Give me a status update by Friday", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Precisamos de abordar esta tensão diretamente.\"", options: [
        { text: "We need to address this tension directly", correct: true },
        { text: "We need address this tension directly", correct: false },
        { text: "We need to addressing this tension directly", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Confio no teu critério para esta decisão\" em inglês?", options: [
        { text: "I trust your judgment on this", correct: true },
        { text: "I trust in your judgment on this", correct: false },
        { text: "I trust your judgement for this decision here", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Dá-me um ponto de situação até sexta-feira\"", options: [
        { text: "Give me a status update by Friday", correct: true },
      ] },
    ],
  },
  {
    unitTitle: "Inglês avançado em viagem",
    newLessons: [
      {
        title: "Imigração e vistos",
        icon: "Plane",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Estou aqui com um visto de negócios\" em inglês?", options: [
            { text: "I'm here on a business visa", correct: true },
            { text: "I'm here with a business visa on", correct: false },
            { text: "I'm here in a business visa", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"O meu visto é válido por 90 dias\" em inglês?", options: [
            { text: "My visa is valid for 90 days", correct: true },
            { text: "My visa is valid during 90 days", correct: false },
            { text: "My visa is valid for 90 days long", correct: false },
          ] },
          { type: "ASSIST", question: "\"Poderia esclarecer o propósito da sua visita?\"", options: [
            { text: "Could you clarify the purpose of your visit?", correct: true },
            { text: "Could you clarify the purpose for your visit?", correct: false },
            { text: "Could you clarify the purpose of you visit?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tenho todos os documentos necessários comigo.\"", options: [
            { text: "I have all the necessary documents with me", correct: true },
            { text: "I have all the necessaries documents with me", correct: false },
            { text: "I have all necessary documents on me", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vou renovar o meu visto antes de expirar\"", options: [
            { text: "I'm going to renew my visa before it expires", correct: true },
          ] },
        ],
      },
      {
        title: "Storytelling e experiências",
        icon: "MessageSquare",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Acabou por ser uma das viagens mais memoráveis\" em inglês?", options: [
            { text: "It turned out to be one of the most memorable trips", correct: true },
            { text: "It turned out to be one of the memorable most trips", correct: false },
            { text: "It turned to be one of the most memorable trips", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Olhando para trás, não mudaria nada\" em inglês?", options: [
            { text: "Looking back, I wouldn't change a thing", correct: true },
            { text: "Looking back, I won't change a thing", correct: false },
            { text: "Look back, I wouldn't change a thing", correct: false },
          ] },
          { type: "ASSIST", question: "\"Foi assim que conheci a minha melhor amiga.\"", options: [
            { text: "That's how I met my best friend", correct: true },
            { text: "That's how I meet my best friend", correct: false },
            { text: "That's as I met my best friend", correct: false },
          ] },
          { type: "ASSIST", question: "\"Nunca me vou esquecer daquele pôr do sol.\"", options: [
            { text: "I'll never forget that sunset", correct: true },
            { text: "I'll never forget of that sunset", correct: false },
            { text: "I'll never forgot that sunset", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Foi uma experiência que me mudou\"", options: [
            { text: "It was a life-changing experience", correct: true },
          ] },
        ],
      },
    ],
    reviewAdditions: [
      { type: "ASSIST", question: "\"Poderia esclarecer o propósito da sua visita?\"", options: [
        { text: "Could you clarify the purpose of your visit?", correct: true },
        { text: "Could you clarify the purpose for your visit?", correct: false },
        { text: "Could you clarify the purpose of you visit?", correct: false },
      ] },
      { type: "SELECT", question: "Como se diz \"Olhando para trás, não mudaria nada\" em inglês?", options: [
        { text: "Looking back, I wouldn't change a thing", correct: true },
        { text: "Looking back, I won't change a thing", correct: false },
        { text: "Look back, I wouldn't change a thing", correct: false },
      ] },
      { type: "WRITE", question: "Escreve em inglês: \"Foi uma experiência que me mudou\"", options: [
        { text: "It was a life-changing experience", correct: true },
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
          eq(schema.units.targetLevel, "ADVANCED"),
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

    console.log("ADVANCED units extended.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extend ADVANCED units");
  } finally {
    await pool.end();
  }
};

main();
