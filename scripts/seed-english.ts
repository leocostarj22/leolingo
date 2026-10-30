import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean; imageSrc?: string };
type ChallengeType = "SELECT" | "ASSIST";
type Challenge = { type: ChallengeType; question: string; options: Option[] };
type Lesson = { title: string; challenges: Challenge[] };
type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";
type LearningGoal = "TRAVEL" | "WORK" | "STUDY_ABROAD" | "SPEAK_CONFIDENTLY" | "OTHER";
type Unit = {
  title: string;
  description: string;
  targetLevel: EnglishLevel | null;
  targetGoal: LearningGoal | null;
  lessons: Lesson[];
};

const unitsData: Unit[] = [
  {
    title: "Noções básicas",
    description: "Aprende o essencial: cumprimentos, pessoas, números e os verbos mais importantes.",
    targetLevel: "BASIC",
    targetGoal: null,
    lessons: [
      {
        title: "Cumprimentos",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Olá\" em inglês?", options: [
            { text: "Hello", correct: true },
            { text: "Goodbye", correct: false },
            { text: "Please", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Adeus\" em inglês?", options: [
            { text: "Goodbye", correct: true },
            { text: "Hello", correct: false },
            { text: "Sorry", correct: false },
          ] },
          { type: "ASSIST", question: "\"Bom dia\"", options: [
            { text: "Good morning", correct: true },
            { text: "Good night", correct: false },
            { text: "Good afternoon", correct: false },
          ] },
          { type: "ASSIST", question: "\"Por favor\"", options: [
            { text: "Please", correct: true },
            { text: "Thank you", correct: false },
            { text: "Sorry", correct: false },
          ] },
          { type: "ASSIST", question: "\"Obrigado\"", options: [
            { text: "Thank you", correct: true },
            { text: "Please", correct: false },
            { text: "Excuse me", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Como estás?\" em inglês?", options: [
            { text: "How are you?", correct: true },
            { text: "What is your name?", correct: false },
            { text: "Where are you?", correct: false },
          ] },
        ],
      },
      {
        title: "Pessoas",
        challenges: [
          { type: "SELECT", question: "Qual destas é \"o homem\"?", options: [
            { text: "the man", correct: true, imageSrc: "/man.svg" },
            { text: "the woman", correct: false, imageSrc: "/woman.svg" },
            { text: "the robot", correct: false, imageSrc: "/robot.svg" },
          ] },
          { type: "SELECT", question: "Qual destas é \"a mulher\"?", options: [
            { text: "the man", correct: false, imageSrc: "/man.svg" },
            { text: "the woman", correct: true, imageSrc: "/woman.svg" },
            { text: "the girl", correct: false, imageSrc: "/girl.svg" },
          ] },
          { type: "SELECT", question: "Qual destas é \"o menino\"?", options: [
            { text: "the boy", correct: true, imageSrc: "/boy.svg" },
            { text: "the girl", correct: false, imageSrc: "/girl.svg" },
            { text: "the man", correct: false, imageSrc: "/man.svg" },
          ] },
          { type: "SELECT", question: "Qual destas é \"a menina\"?", options: [
            { text: "the boy", correct: false, imageSrc: "/boy.svg" },
            { text: "the girl", correct: true, imageSrc: "/girl.svg" },
            { text: "the woman", correct: false, imageSrc: "/woman.svg" },
          ] },
          { type: "ASSIST", question: "\"o robô\"", options: [
            { text: "the robot", correct: true },
            { text: "the man", correct: false },
            { text: "the boy", correct: false },
          ] },
        ],
      },
      {
        title: "Números",
        challenges: [
          { type: "ASSIST", question: "\"um\"", options: [
            { text: "one", correct: true },
            { text: "two", correct: false },
            { text: "eleven", correct: false },
          ] },
          { type: "ASSIST", question: "\"dois\"", options: [
            { text: "two", correct: true },
            { text: "ten", correct: false },
            { text: "twelve", correct: false },
          ] },
          { type: "ASSIST", question: "\"três\"", options: [
            { text: "three", correct: true },
            { text: "tree", correct: false },
            { text: "free", correct: false },
          ] },
          { type: "ASSIST", question: "\"cinco\"", options: [
            { text: "five", correct: true },
            { text: "four", correct: false },
            { text: "nine", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"10\" em inglês?", options: [
            { text: "ten", correct: true },
            { text: "two", correct: false },
            { text: "nine", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"7\" em inglês?", options: [
            { text: "seven", correct: true },
            { text: "six", correct: false },
            { text: "eight", correct: false },
          ] },
        ],
      },
      {
        title: "Be e Have",
        challenges: [
          { type: "ASSIST", question: "\"Eu sou\"", options: [
            { text: "I am", correct: true },
            { text: "I have", correct: false },
            { text: "I can", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tu és\"", options: [
            { text: "You are", correct: true },
            { text: "You have", correct: false },
            { text: "You do", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eu tenho\"", options: [
            { text: "I have", correct: true },
            { text: "I am", correct: false },
            { text: "I do", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Nós somos amigos\" em inglês?", options: [
            { text: "We are friends", correct: true },
            { text: "We have friends", correct: false },
            { text: "We is friends", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Ela tem um gato\" em inglês?", options: [
            { text: "She has a cat", correct: true },
            { text: "She have a cat", correct: false },
            { text: "She is a cat", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eles são\"", options: [
            { text: "They are", correct: true },
            { text: "They have", correct: false },
            { text: "They am", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Inglês no trabalho",
    description: "Vocabulário e frases para usar no teu dia a dia profissional.",
    targetLevel: "BASIC",
    targetGoal: "WORK",
    lessons: [
      {
        title: "No escritório",
        challenges: [
          { type: "ASSIST", question: "\"a secretária\" (móvel)", options: [
            { text: "the desk", correct: true },
            { text: "the chair", correct: false },
            { text: "the wall", correct: false },
          ] },
          { type: "ASSIST", question: "\"o computador\"", options: [
            { text: "the computer", correct: true },
            { text: "the phone", correct: false },
            { text: "the printer", correct: false },
          ] },
          { type: "ASSIST", question: "\"o colega\"", options: [
            { text: "the colleague", correct: true },
            { text: "the boss", correct: false },
            { text: "the client", correct: false },
          ] },
          { type: "ASSIST", question: "\"a reunião\"", options: [
            { text: "the meeting", correct: true },
            { text: "the email", correct: false },
            { text: "the report", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o chefe\" em inglês?", options: [
            { text: "the boss", correct: true },
            { text: "the colleague", correct: false },
            { text: "the client", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o relatório\" em inglês?", options: [
            { text: "the report", correct: true },
            { text: "the desk", correct: false },
            { text: "the meeting", correct: false },
          ] },
        ],
      },
      {
        title: "Reuniões",
        challenges: [
          { type: "ASSIST", question: "\"Podemos começar?\"", options: [
            { text: "Can we start?", correct: true },
            { text: "Can we leave?", correct: false },
            { text: "Can we wait?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Concordo.\"", options: [
            { text: "I agree.", correct: true },
            { text: "I disagree.", correct: false },
            { text: "I understand.", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tenho uma pergunta.\"", options: [
            { text: "I have a question.", correct: true },
            { text: "I have an answer.", correct: false },
            { text: "I have a meeting.", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Podemos continuar amanhã?\" em inglês?", options: [
            { text: "Can we continue tomorrow?", correct: true },
            { text: "Can we continue today?", correct: false },
            { text: "Can we start tomorrow?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Não concordo.\"", options: [
            { text: "I disagree.", correct: true },
            { text: "I agree.", correct: false },
            { text: "I apologize.", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Vamos fazer uma pausa\" em inglês?", options: [
            { text: "Let's take a break", correct: true },
            { text: "Let's take a seat", correct: false },
            { text: "Let's take a meeting", correct: false },
          ] },
        ],
      },
      {
        title: "Email",
        challenges: [
          { type: "ASSIST", question: "\"Caro/Cara\" (início de email)", options: [
            { text: "Dear", correct: true },
            { text: "Hello", correct: false },
            { text: "Best", correct: false },
          ] },
          { type: "ASSIST", question: "\"Com os melhores cumprimentos\" (fim de email)", options: [
            { text: "Best regards", correct: true },
            { text: "Dear Sir", correct: false },
            { text: "See you soon", correct: false },
          ] },
          { type: "ASSIST", question: "\"Em anexo\"", options: [
            { text: "Attached", correct: true },
            { text: "Attachment", correct: false },
            { text: "Attend", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Por favor, encontre em anexo\" em inglês?", options: [
            { text: "Please find attached", correct: true },
            { text: "Please find attend", correct: false },
            { text: "Please find email", correct: false },
          ] },
          { type: "ASSIST", question: "\"Aguardo a sua resposta.\"", options: [
            { text: "I look forward to your reply.", correct: true },
            { text: "I look forward to your email.", correct: false },
            { text: "I wait for your reply.", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Obrigado pelo seu email\" em inglês?", options: [
            { text: "Thank you for your email", correct: true },
            { text: "Thank you for your meeting", correct: false },
            { text: "Thank you for your reply", correct: false },
          ] },
        ],
      },
      {
        title: "Conversas de trabalho",
        challenges: [
          { type: "ASSIST", question: "\"Como foi o teu fim de semana?\"", options: [
            { text: "How was your weekend?", correct: true },
            { text: "How is your work?", correct: false },
            { text: "How was your meeting?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Prazer em conhecer-te.\"", options: [
            { text: "Nice to meet you.", correct: true },
            { text: "Nice to see you.", correct: false },
            { text: "Nice to know you.", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Até amanhã\" em inglês?", options: [
            { text: "See you tomorrow", correct: true },
            { text: "See you later", correct: false },
            { text: "See you soon", correct: false },
          ] },
          { type: "ASSIST", question: "\"Tens um minuto?\"", options: [
            { text: "Do you have a minute?", correct: true },
            { text: "Do you have a meeting?", correct: false },
            { text: "Do you have a question?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Bom trabalho!\" em inglês?", options: [
            { text: "Good job!", correct: true },
            { text: "Good morning!", correct: false },
            { text: "Good luck!", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vemo-nos na segunda-feira.\"", options: [
            { text: "See you on Monday.", correct: true },
            { text: "See you on Friday.", correct: false },
            { text: "See you tomorrow.", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Inglês em viagem",
    description: "Frases úteis para te desenrascares numa viagem a um país de língua inglesa.",
    targetLevel: "BASIC",
    targetGoal: "TRAVEL",
    lessons: [
      {
        title: "No aeroporto",
        challenges: [
          { type: "ASSIST", question: "\"o passaporte\"", options: [
            { text: "the passport", correct: true },
            { text: "the ticket", correct: false },
            { text: "the suitcase", correct: false },
          ] },
          { type: "ASSIST", question: "\"a mala\"", options: [
            { text: "the suitcase", correct: true },
            { text: "the passport", correct: false },
            { text: "the gate", correct: false },
          ] },
          { type: "ASSIST", question: "\"o voo\"", options: [
            { text: "the flight", correct: true },
            { text: "the gate", correct: false },
            { text: "the ticket", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"o portão de embarque\" em inglês?", options: [
            { text: "the gate", correct: true },
            { text: "the flight", correct: false },
            { text: "the suitcase", correct: false },
          ] },
          { type: "ASSIST", question: "\"Onde fica o check-in?\"", options: [
            { text: "Where is check-in?", correct: true },
            { text: "Where is the gate?", correct: false },
            { text: "Where is my flight?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"O meu voo está atrasado\" em inglês?", options: [
            { text: "My flight is delayed", correct: true },
            { text: "My flight is early", correct: false },
            { text: "My gate is delayed", correct: false },
          ] },
        ],
      },
      {
        title: "No hotel",
        challenges: [
          { type: "ASSIST", question: "\"Tenho uma reserva.\"", options: [
            { text: "I have a reservation.", correct: true },
            { text: "I have a passport.", correct: false },
            { text: "I have a room.", correct: false },
          ] },
          { type: "ASSIST", question: "\"Onde fica o meu quarto?\"", options: [
            { text: "Where is my room?", correct: true },
            { text: "Where is my hotel?", correct: false },
            { text: "Where is my key?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"A que horas é o pequeno-almoço?\" em inglês?", options: [
            { text: "What time is breakfast?", correct: true },
            { text: "What time is check-out?", correct: false },
            { text: "What time is dinner?", correct: false },
          ] },
          { type: "ASSIST", question: "\"a chave\"", options: [
            { text: "the key", correct: true },
            { text: "the room", correct: false },
            { text: "the door", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Preciso de uma toalha\" em inglês?", options: [
            { text: "I need a towel", correct: true },
            { text: "I need a key", correct: false },
            { text: "I need a room", correct: false },
          ] },
          { type: "ASSIST", question: "\"A que horas é o check-out?\"", options: [
            { text: "What time is check-out?", correct: true },
            { text: "What time is check-in?", correct: false },
            { text: "What time is breakfast?", correct: false },
          ] },
        ],
      },
      {
        title: "Pedir direções",
        challenges: [
          { type: "ASSIST", question: "\"Onde fica a estação?\"", options: [
            { text: "Where is the station?", correct: true },
            { text: "Where is the hotel?", correct: false },
            { text: "Where is the airport?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Vire à esquerda\" em inglês?", options: [
            { text: "Turn left", correct: true },
            { text: "Turn right", correct: false },
            { text: "Go straight", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Vire à direita\" em inglês?", options: [
            { text: "Turn right", correct: true },
            { text: "Turn left", correct: false },
            { text: "Go straight", correct: false },
          ] },
          { type: "ASSIST", question: "\"Siga em frente.\"", options: [
            { text: "Go straight.", correct: true },
            { text: "Turn left.", correct: false },
            { text: "Turn around.", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"É longe?\" em inglês?", options: [
            { text: "Is it far?", correct: true },
            { text: "Is it near?", correct: false },
            { text: "Is it here?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Está perto.\"", options: [
            { text: "It's close.", correct: true },
            { text: "It's far.", correct: false },
            { text: "It's left.", correct: false },
          ] },
        ],
      },
      {
        title: "No restaurante",
        challenges: [
          { type: "ASSIST", question: "\"Posso ver o menu?\"", options: [
            { text: "Can I see the menu?", correct: true },
            { text: "Can I see the bill?", correct: false },
            { text: "Can I see the table?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eu gostaria de...\"", options: [
            { text: "I would like...", correct: true },
            { text: "I would go...", correct: false },
            { text: "I would eat...", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"A conta, por favor\" em inglês?", options: [
            { text: "The bill, please", correct: true },
            { text: "The menu, please", correct: false },
            { text: "The table, please", correct: false },
          ] },
          { type: "ASSIST", question: "\"uma mesa para dois\"", options: [
            { text: "a table for two", correct: true },
            { text: "a room for two", correct: false },
            { text: "a menu for two", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Está delicioso\" em inglês?", options: [
            { text: "It's delicious", correct: true },
            { text: "It's expensive", correct: false },
            { text: "It's cold", correct: false },
          ] },
          { type: "ASSIST", question: "\"Estou cheio.\"", options: [
            { text: "I'm full.", correct: true },
            { text: "I'm hungry.", correct: false },
            { text: "I'm thirsty.", correct: false },
          ] },
        ],
      },
    ],
  },
];

const main = async () => {
  try {
    console.log("Inserting English course...");

    const [course] = await db.insert(schema.courses).values({
      title: "English",
      imageSrc: "/gb.svg",
    }).returning();

    let unitOrder = 1;
    for (const unit of unitsData) {
      const [unitRow] = await db.insert(schema.units).values({
        courseId: course.id,
        title: unit.title,
        description: unit.description,
        order: unitOrder++,
        targetLevel: unit.targetLevel,
        targetGoal: unit.targetGoal,
      }).returning();

      let lessonOrder = 1;
      for (const lesson of unit.lessons) {
        const [lessonRow] = await db.insert(schema.lessons).values({
          unitId: unitRow.id,
          title: lesson.title,
          order: lessonOrder++,
        }).returning();

        let challengeOrder = 1;
        for (const challenge of lesson.challenges) {
          const [challengeRow] = await db.insert(schema.challenges).values({
            lessonId: lessonRow.id,
            type: challenge.type,
            question: challenge.question,
            order: challengeOrder++,
          }).returning();

          await db.insert(schema.challengeOptions).values(
            challenge.options.map((option) => ({
              challengeId: challengeRow.id,
              text: option.text,
              correct: option.correct,
              imageSrc: option.imageSrc,
            })),
          );
        }
      }
    }

    console.log("English course inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert English course");
  } finally {
    await pool.end();
  }
};

main();
