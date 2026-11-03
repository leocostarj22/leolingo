import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";

import * as schema from "../db/schema";
import type { LessonIcon } from "../lib/lesson-icons";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE";
type Challenge = { type: ChallengeType; question: string; options: Option[] };
type Lesson = { title: string; icon: LessonIcon; challenges: Challenge[] };
type LearningGoal = "TRAVEL" | "WORK" | "STUDY_ABROAD" | "SPEAK_CONFIDENTLY" | "OTHER";
type Unit = {
  title: string;
  description: string;
  targetGoal: LearningGoal | null;
  lessons: Lesson[];
};

const unitsData: Unit[] = [
  {
    title: "Primeiros passos",
    description: "O primeiro contacto com o inglês: palavras simples do dia a dia, sem frases complexas.",
    targetGoal: null,
    lessons: [
      {
        title: "Alfabeto",
        icon: "BookOpen",
        challenges: [
          { type: "SELECT", question: "Como se diz \"gato\" em inglês?", options: [
            { text: "cat", correct: true },
            { text: "dog", correct: false },
            { text: "cup", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"cão\" em inglês?", options: [
            { text: "dog", correct: true },
            { text: "cat", correct: false },
            { text: "cow", correct: false },
          ] },
          { type: "ASSIST", question: "\"sol\"", options: [
            { text: "sun", correct: true },
            { text: "moon", correct: false },
            { text: "star", correct: false },
          ] },
          { type: "ASSIST", question: "\"lua\"", options: [
            { text: "moon", correct: true },
            { text: "sun", correct: false },
            { text: "sky", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"chapéu\"", options: [
            { text: "hat", correct: true },
          ] },
        ],
      },
      {
        title: "Cores",
        icon: "Tag",
        challenges: [
          { type: "SELECT", question: "Como se diz \"vermelho\" em inglês?", options: [
            { text: "red", correct: true },
            { text: "blue", correct: false },
            { text: "green", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"azul\" em inglês?", options: [
            { text: "blue", correct: true },
            { text: "yellow", correct: false },
            { text: "black", correct: false },
          ] },
          { type: "ASSIST", question: "\"amarelo\"", options: [
            { text: "yellow", correct: true },
            { text: "orange", correct: false },
            { text: "white", correct: false },
          ] },
          { type: "ASSIST", question: "\"verde\"", options: [
            { text: "green", correct: true },
            { text: "red", correct: false },
            { text: "purple", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"preto\"", options: [
            { text: "black", correct: true },
          ] },
        ],
      },
      {
        title: "Números 1-20",
        icon: "Hash",
        challenges: [
          { type: "SELECT", question: "Como se diz \"11\" em inglês?", options: [
            { text: "eleven", correct: true },
            { text: "twelve", correct: false },
            { text: "one", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"15\" em inglês?", options: [
            { text: "fifteen", correct: true },
            { text: "fifty", correct: false },
            { text: "five", correct: false },
          ] },
          { type: "ASSIST", question: "\"vinte\"", options: [
            { text: "twenty", correct: true },
            { text: "twelve", correct: false },
            { text: "two", correct: false },
          ] },
          { type: "ASSIST", question: "\"dezoito\"", options: [
            { text: "eighteen", correct: true },
            { text: "eight", correct: false },
            { text: "eighty", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"catorze\"", options: [
            { text: "fourteen", correct: true },
          ] },
        ],
      },
      {
        title: "Objetos do dia a dia",
        icon: "MapPin",
        challenges: [
          { type: "SELECT", question: "Como se diz \"a chave\" em inglês?", options: [
            { text: "the key", correct: true },
            { text: "the cup", correct: false },
            { text: "the bag", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o livro\" em inglês?", options: [
            { text: "the book", correct: true },
            { text: "the bag", correct: false },
            { text: "the pen", correct: false },
          ] },
          { type: "ASSIST", question: "\"a caneta\"", options: [
            { text: "the pen", correct: true },
            { text: "the key", correct: false },
            { text: "the cup", correct: false },
          ] },
          { type: "ASSIST", question: "\"a mala\"", options: [
            { text: "the bag", correct: true },
            { text: "the book", correct: false },
            { text: "the pen", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"a chávena\"", options: [
            { text: "the cup", correct: true },
          ] },
        ],
      },
      {
        title: "Sim/Não e básico",
        icon: "MessageCircle",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Sim\" em inglês?", options: [
            { text: "Yes", correct: true },
            { text: "No", correct: false },
            { text: "Maybe", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Não\" em inglês?", options: [
            { text: "No", correct: true },
            { text: "Yes", correct: false },
            { text: "Please", correct: false },
          ] },
          { type: "ASSIST", question: "\"Talvez\"", options: [
            { text: "Maybe", correct: true },
            { text: "Yes", correct: false },
            { text: "No", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eu não sei\"", options: [
            { text: "I don't know", correct: true },
            { text: "I don't like", correct: false },
            { text: "I am not", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Está bem\"", options: [
            { text: "Okay", correct: true },
            { text: "OK", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"gato\" em inglês?", options: [
            { text: "cat", correct: true },
            { text: "dog", correct: false },
            { text: "cup", correct: false },
          ] },
          { type: "ASSIST", question: "\"vermelho\"", options: [
            { text: "red", correct: true },
            { text: "blue", correct: false },
            { text: "green", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"15\" em inglês?", options: [
            { text: "fifteen", correct: true },
            { text: "fifty", correct: false },
            { text: "five", correct: false },
          ] },
          { type: "ASSIST", question: "\"a chave\"", options: [
            { text: "the key", correct: true },
            { text: "the book", correct: false },
            { text: "the bag", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Sim\"", options: [
            { text: "Yes", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Eu não sei\"", options: [
            { text: "I", correct: true },
            { text: "don't", correct: true },
            { text: "know", correct: true },
            { text: "not", correct: false },
            { text: "knows", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Primeiras palavras no trabalho",
    description: "Vocabulário essencial para os primeiros dias num ambiente de trabalho em inglês.",
    targetGoal: "WORK",
    lessons: [
      {
        title: "Profissões",
        icon: "Briefcase",
        challenges: [
          { type: "SELECT", question: "Como se diz \"professor\" em inglês?", options: [
            { text: "teacher", correct: true },
            { text: "doctor", correct: false },
            { text: "driver", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"médico\" em inglês?", options: [
            { text: "doctor", correct: true },
            { text: "teacher", correct: false },
            { text: "cook", correct: false },
          ] },
          { type: "ASSIST", question: "\"motorista\"", options: [
            { text: "driver", correct: true },
            { text: "doctor", correct: false },
            { text: "cook", correct: false },
          ] },
          { type: "ASSIST", question: "\"cozinheiro\"", options: [
            { text: "cook", correct: true },
            { text: "driver", correct: false },
            { text: "teacher", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"enfermeira\"", options: [
            { text: "nurse", correct: true },
          ] },
        ],
      },
      {
        title: "Objetos de escritório",
        icon: "Tag",
        challenges: [
          { type: "SELECT", question: "Como se diz \"a secretária\" (móvel) em inglês?", options: [
            { text: "the desk", correct: true },
            { text: "the chair", correct: false },
            { text: "the door", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o computador\" em inglês?", options: [
            { text: "the computer", correct: true },
            { text: "the phone", correct: false },
            { text: "the printer", correct: false },
          ] },
          { type: "ASSIST", question: "\"a impressora\"", options: [
            { text: "the printer", correct: true },
            { text: "the computer", correct: false },
            { text: "the desk", correct: false },
          ] },
          { type: "ASSIST", question: "\"o telefone\"", options: [
            { text: "the phone", correct: true },
            { text: "the printer", correct: false },
            { text: "the chair", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"a cadeira\"", options: [
            { text: "the chair", correct: true },
          ] },
        ],
      },
      {
        title: "Dias da semana",
        icon: "BookOpen",
        challenges: [
          { type: "SELECT", question: "Como se diz \"segunda-feira\" em inglês?", options: [
            { text: "Monday", correct: true },
            { text: "Tuesday", correct: false },
            { text: "Sunday", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"sexta-feira\" em inglês?", options: [
            { text: "Friday", correct: true },
            { text: "Thursday", correct: false },
            { text: "Saturday", correct: false },
          ] },
          { type: "ASSIST", question: "\"quarta-feira\"", options: [
            { text: "Wednesday", correct: true },
            { text: "Tuesday", correct: false },
            { text: "Thursday", correct: false },
          ] },
          { type: "ASSIST", question: "\"domingo\"", options: [
            { text: "Sunday", correct: true },
            { text: "Saturday", correct: false },
            { text: "Monday", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"sábado\"", options: [
            { text: "Saturday", correct: true },
          ] },
        ],
      },
      {
        title: "Horas simples",
        icon: "Clock",
        challenges: [
          { type: "SELECT", question: "Como se diz \"São três horas\" em inglês?", options: [
            { text: "It's three o'clock", correct: true },
            { text: "It's three hours", correct: false },
            { text: "It is three", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"meio-dia\" em inglês?", options: [
            { text: "noon", correct: true },
            { text: "midnight", correct: false },
            { text: "morning", correct: false },
          ] },
          { type: "ASSIST", question: "\"meia-noite\"", options: [
            { text: "midnight", correct: true },
            { text: "noon", correct: false },
            { text: "night", correct: false },
          ] },
          { type: "ASSIST", question: "\"de manhã\"", options: [
            { text: "in the morning", correct: true },
            { text: "in the night", correct: false },
            { text: "at morning", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"São cinco horas\"", options: [
            { text: "It's five o'clock", correct: true },
          ] },
        ],
      },
      {
        title: "Cumprimentos no trabalho",
        icon: "Handshake",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Bem-vindo à equipa\" em inglês?", options: [
            { text: "Welcome to the team", correct: true },
            { text: "Welcome at team", correct: false },
            { text: "Welcomed to the team", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Prazer em conhecê-lo\" em inglês?", options: [
            { text: "Nice to meet you", correct: true },
            { text: "Nice to know you", correct: false },
            { text: "Nice meet you", correct: false },
          ] },
          { type: "ASSIST", question: "\"Até amanhã\"", options: [
            { text: "See you tomorrow", correct: true },
            { text: "See you yesterday", correct: false },
            { text: "See you now", correct: false },
          ] },
          { type: "ASSIST", question: "\"Bom trabalho!\"", options: [
            { text: "Good job!", correct: true },
            { text: "Good work day!", correct: false },
            { text: "Good working!", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Tenha um bom dia\"", options: [
            { text: "Have a good day", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"professor\" em inglês?", options: [
            { text: "teacher", correct: true },
            { text: "doctor", correct: false },
            { text: "driver", correct: false },
          ] },
          { type: "ASSIST", question: "\"a impressora\"", options: [
            { text: "the printer", correct: true },
            { text: "the computer", correct: false },
            { text: "the desk", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"sexta-feira\" em inglês?", options: [
            { text: "Friday", correct: true },
            { text: "Thursday", correct: false },
            { text: "Saturday", correct: false },
          ] },
          { type: "ASSIST", question: "\"meia-noite\"", options: [
            { text: "midnight", correct: true },
            { text: "noon", correct: false },
            { text: "night", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Prazer em conhecê-lo\"", options: [
            { text: "Nice to meet you", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Bem-vindo à equipa\"", options: [
            { text: "Welcome", correct: true },
            { text: "to", correct: true },
            { text: "the", correct: true },
            { text: "team", correct: true },
            { text: "at", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Primeiras palavras em viagem",
    description: "Vocabulário essencial para os primeiros dias numa viagem em inglês.",
    targetGoal: "TRAVEL",
    lessons: [
      {
        title: "Países e nacionalidades",
        icon: "Users",
        challenges: [
          { type: "SELECT", question: "Como se diz \"português\" em inglês?", options: [
            { text: "Portuguese", correct: true },
            { text: "Spanish", correct: false },
            { text: "French", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Espanha\" em inglês?", options: [
            { text: "Spain", correct: true },
            { text: "France", correct: false },
            { text: "Italy", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eu sou do Brasil.\"", options: [
            { text: "I am from Brazil", correct: true },
            { text: "I am from Brasil", correct: false },
            { text: "I from Brazil", correct: false },
          ] },
          { type: "ASSIST", question: "\"De onde és?\"", options: [
            { text: "Where are you from?", correct: true },
            { text: "Where you are from?", correct: false },
            { text: "From where are you?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Eu sou português\"", options: [
            { text: "I am Portuguese", correct: true },
          ] },
        ],
      },
      {
        title: "Transporte básico",
        icon: "Plane",
        challenges: [
          { type: "SELECT", question: "Como se diz \"o autocarro\" em inglês?", options: [
            { text: "the bus", correct: true },
            { text: "the train", correct: false },
            { text: "the car", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o comboio\" em inglês?", options: [
            { text: "the train", correct: true },
            { text: "the bus", correct: false },
            { text: "the plane", correct: false },
          ] },
          { type: "ASSIST", question: "\"o táxi\"", options: [
            { text: "the taxi", correct: true },
            { text: "the bus", correct: false },
            { text: "the car", correct: false },
          ] },
          { type: "ASSIST", question: "\"o carro\"", options: [
            { text: "the car", correct: true },
            { text: "the taxi", correct: false },
            { text: "the train", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"o avião\"", options: [
            { text: "the plane", correct: true },
          ] },
        ],
      },
      {
        title: "Comida simples",
        icon: "UtensilsCrossed",
        challenges: [
          { type: "SELECT", question: "Como se diz \"o pão\" em inglês?", options: [
            { text: "the bread", correct: true },
            { text: "the rice", correct: false },
            { text: "the meat", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"a água\" em inglês?", options: [
            { text: "the water", correct: true },
            { text: "the juice", correct: false },
            { text: "the milk", correct: false },
          ] },
          { type: "ASSIST", question: "\"o arroz\"", options: [
            { text: "the rice", correct: true },
            { text: "the bread", correct: false },
            { text: "the soup", correct: false },
          ] },
          { type: "ASSIST", question: "\"a carne\"", options: [
            { text: "the meat", correct: true },
            { text: "the fish", correct: false },
            { text: "the rice", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"o peixe\"", options: [
            { text: "the fish", correct: true },
          ] },
        ],
      },
      {
        title: "Números e preços",
        icon: "Tag",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Custa dez euros\" em inglês?", options: [
            { text: "It costs ten euros", correct: true },
            { text: "It cost ten euros", correct: false },
            { text: "It is ten euros cost", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"vinte\" em inglês?", options: [
            { text: "twenty", correct: true },
            { text: "twelve", correct: false },
            { text: "two", correct: false },
          ] },
          { type: "ASSIST", question: "\"cem\"", options: [
            { text: "one hundred", correct: true },
            { text: "hundred", correct: false },
            { text: "one hundreds", correct: false },
          ] },
          { type: "ASSIST", question: "\"É muito caro\"", options: [
            { text: "It's very expensive", correct: true },
            { text: "It's very cheap", correct: false },
            { text: "It's too much expensive", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Custa cinco euros\"", options: [
            { text: "It costs five euros", correct: true },
          ] },
        ],
      },
      {
        title: "Direções simples",
        icon: "MapPin",
        challenges: [
          { type: "SELECT", question: "Como se diz \"à esquerda\" em inglês?", options: [
            { text: "to the left", correct: true },
            { text: "to the right", correct: false },
            { text: "straight ahead", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"à direita\" em inglês?", options: [
            { text: "to the right", correct: true },
            { text: "to the left", correct: false },
            { text: "straight ahead", correct: false },
          ] },
          { type: "ASSIST", question: "\"em frente\"", options: [
            { text: "straight ahead", correct: true },
            { text: "to the left", correct: false },
            { text: "behind", correct: false },
          ] },
          { type: "ASSIST", question: "\"perto daqui\"", options: [
            { text: "near here", correct: true },
            { text: "far from here", correct: false },
            { text: "next to there", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vire à esquerda\"", options: [
            { text: "Turn left", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"português\" em inglês?", options: [
            { text: "Portuguese", correct: true },
            { text: "Spanish", correct: false },
            { text: "French", correct: false },
          ] },
          { type: "ASSIST", question: "\"o comboio\"", options: [
            { text: "the train", correct: true },
            { text: "the bus", correct: false },
            { text: "the plane", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"a água\" em inglês?", options: [
            { text: "the water", correct: true },
            { text: "the juice", correct: false },
            { text: "the milk", correct: false },
          ] },
          { type: "ASSIST", question: "\"vinte\"", options: [
            { text: "twenty", correct: true },
            { text: "twelve", correct: false },
            { text: "two", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"à esquerda\"", options: [
            { text: "to the left", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Custa dez euros\"", options: [
            { text: "It", correct: true },
            { text: "costs", correct: true },
            { text: "ten", correct: true },
            { text: "euros", correct: true },
            { text: "cost", correct: false },
          ] },
        ],
      },
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
      where: eq(schema.units.targetLevel, "BEGINNER"),
    });

    if (alreadySeeded) {
      console.log("BEGINNER units already seeded, skipping.");
      return;
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.units)
      .where(eq(schema.units.courseId, englishCourse.id));

    await db.transaction(async (tx) => {
      console.log("Inserting BEGINNER units...");

      let unitOrder = count + 1;
      for (const unit of unitsData) {
        const [unitRow] = await tx.insert(schema.units).values({
          courseId: englishCourse.id,
          title: unit.title,
          description: unit.description,
          order: unitOrder++,
          targetLevel: "BEGINNER",
          targetGoal: unit.targetGoal,
        }).returning();

        let lessonOrder = 1;
        for (const lesson of unit.lessons) {
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
      }
    });

    console.log("BEGINNER units inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert BEGINNER units");
  } finally {
    await pool.end();
  }
};

main();
