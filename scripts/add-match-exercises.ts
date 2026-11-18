import { config } from "dotenv";
import { Pool } from "pg";

import { englishLevelEnum, learningGoalEnum } from "../db/schema";

config({ path: ".env.local" });

type EnglishLevel = (typeof englishLevelEnum.enumValues)[number];
type LearningGoal = (typeof learningGoalEnum.enumValues)[number];

type Target = {
  targetLevel: EnglishLevel;
  targetGoal: LearningGoal | null;
  unitTitle: string;
  lessonTitle: string;
  question: string;
  pairs: [pt: string, en: string][];
};

const targets: Target[] = [
  {
    targetLevel: "BEGINNER", targetGoal: null,
    unitTitle: "Primeiros passos", lessonTitle: "Objetos do dia a dia",
    question: "Liga cada palavra à sua tradução",
    pairs: [
      ["a chave", "the key"],
      ["o livro", "the book"],
      ["a caneta", "the pen"],
      ["a mala", "the bag"],
      ["a chávena", "the cup"],
      ["o telemóvel", "the phone"],
      ["o relógio", "the watch"],
    ],
  },
  {
    targetLevel: "BEGINNER", targetGoal: "WORK",
    unitTitle: "Primeiras palavras no trabalho", lessonTitle: "Profissões",
    question: "Liga cada profissão à sua tradução",
    pairs: [
      ["professor", "teacher"],
      ["médico", "doctor"],
      ["motorista", "driver"],
      ["cozinheiro", "cook"],
      ["enfermeira", "nurse"],
      ["advogado", "lawyer"],
      ["bombeiro", "firefighter"],
    ],
  },
  {
    targetLevel: "BEGINNER", targetGoal: "TRAVEL",
    unitTitle: "Primeiras palavras em viagem", lessonTitle: "Comida simples",
    question: "Liga cada palavra à sua tradução",
    pairs: [
      ["o pão", "the bread"],
      ["a água", "the water"],
      ["o arroz", "the rice"],
      ["a carne", "the meat"],
      ["o peixe", "the fish"],
      ["o sumo", "the juice"],
      ["o leite", "the milk"],
    ],
  },
  {
    targetLevel: "BASIC", targetGoal: null,
    unitTitle: "Noções básicas", lessonTitle: "Lugares e objetos",
    question: "Liga cada palavra à sua tradução",
    pairs: [
      ["a casa", "the house"],
      ["a mesa", "the table"],
      ["a porta", "the door"],
      ["a janela", "the window"],
      ["a cadeira", "the chair"],
      ["o carro", "the car"],
      ["a parede", "the wall"],
    ],
  },
  {
    targetLevel: "BASIC", targetGoal: "WORK",
    unitTitle: "Inglês no trabalho", lessonTitle: "No escritório",
    question: "Liga cada palavra à sua tradução",
    pairs: [
      ["a secretária", "the desk"],
      ["o computador", "the computer"],
      ["o colega", "the colleague"],
      ["a reunião", "the meeting"],
      ["o chefe", "the boss"],
      ["o relatório", "the report"],
      ["a impressora", "the printer"],
    ],
  },
  {
    targetLevel: "BASIC", targetGoal: "TRAVEL",
    unitTitle: "Inglês em viagem", lessonTitle: "No restaurante",
    question: "Liga cada frase à sua tradução",
    pairs: [
      ["o menu", "the menu"],
      ["a conta", "the bill"],
      ["uma mesa para dois", "a table for two"],
      ["está delicioso", "it's delicious"],
      ["estou cheio", "I'm full"],
      ["tenho fome", "I'm hungry"],
      ["a gorjeta", "the tip"],
    ],
  },
  {
    targetLevel: "ADVANCED", targetGoal: null,
    unitTitle: "Inglês avançado — Base", lessonTitle: "Phrasal verbs comuns",
    question: "Liga cada expressão à sua tradução",
    pairs: [
      ["desistir", "give up"],
      ["continuar", "carry on"],
      ["investigar/pesquisar", "look into"],
      ["adiar", "put off"],
      ["procurar (num livro/lista)", "look up"],
      ["executar/realizar", "carry out"],
      ["surgir/aparecer", "come up"],
    ],
  },
  {
    targetLevel: "ADVANCED", targetGoal: "WORK",
    unitTitle: "Inglês avançado no trabalho", lessonTitle: "Negociação",
    question: "Liga cada expressão à sua tradução",
    pairs: [
      ["chegar a um meio-termo", "reach a compromise"],
      ["fora do orçamento", "outside the budget"],
      ["disposto a negociar", "willing to negotiate"],
      ["rever os termos", "review the terms"],
      ["aceitar os termos propostos", "accept the proposed terms"],
      ["fazer uma contraproposta", "make a counteroffer"],
      ["assinar o contrato", "sign the contract"],
    ],
  },
  {
    targetLevel: "ADVANCED", targetGoal: "TRAVEL",
    unitTitle: "Inglês avançado em viagem", lessonTitle: "Expressões idiomáticas de viagem",
    question: "Liga cada expressão à sua tradução",
    pairs: [
      ["cair em pé", "to land on your feet"],
      ["ir com a corrente", "to go with the flow"],
      ["deixar para a próxima", "to take a rain check"],
      ["improvisar", "to play it by ear"],
      ["ver como corre", "to see how it goes"],
      ["quebrar o gelo", "to break the ice"],
      ["em Roma, sê romano", "when in Rome, do as the Romans do"],
    ],
  },
];

async function main() {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("../db/schema");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  for (const target of targets) {
    const unit = await db.query.units.findFirst({
      where: (u, { eq: eqOp, and: andOp, isNull }) =>
        andOp(
          eqOp(u.title, target.unitTitle),
          eqOp(u.targetLevel, target.targetLevel),
          target.targetGoal === null ? isNull(u.targetGoal) : eqOp(u.targetGoal, target.targetGoal),
        ),
    });

    if (!unit) {
      console.error(`SKIP (unit not found): ${target.targetLevel}/${target.targetGoal ?? "any"} "${target.unitTitle}"`);
      continue;
    }

    const lesson = await db.query.lessons.findFirst({
      where: (l, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(l.unitId, unit.id), eqOp(l.title, target.lessonTitle)),
      with: { challenges: true },
    });

    if (!lesson) {
      console.error(`SKIP (lesson not found): unit#${unit.id} "${target.lessonTitle}"`);
      continue;
    }

    const alreadyHasMatch = lesson.challenges.some((c) => c.type === "MATCH");
    if (alreadyHasMatch) {
      console.log(`SKIP (already has MATCH): lesson#${lesson.id} "${lesson.title}"`);
      continue;
    }

    const nextOrder = Math.max(0, ...lesson.challenges.map((c) => c.order)) + 1;

    await db.transaction(async (tx) => {
      const [challenge] = await tx.insert(schema.challenges).values({
        lessonId: lesson.id,
        type: "MATCH",
        question: target.question,
        order: nextOrder,
      }).returning();

      await tx.insert(schema.challengeOptions).values(
        target.pairs.map(([pt, en]) => ({
          challengeId: challenge.id,
          text: `${pt}|||${en}`,
          correct: true,
        })),
      );
    });

    console.log(`ADDED: lesson#${lesson.id} "${lesson.title}" (${target.pairs.length} pairs)`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
