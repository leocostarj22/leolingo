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
    title: "Inglês avançado — Base",
    description: "Phrasal verbs, discurso indireto, idiomas e tempos verbais complexos para um inglês fluente.",
    targetGoal: null,
    lessons: [
      {
        title: "Phrasal verbs comuns",
        icon: "GitBranch",
        challenges: [
          { type: "SELECT", question: "Como se diz \"desistir\" (phrasal verb) em inglês?", options: [
            { text: "give up", correct: true },
            { text: "go up", correct: false },
            { text: "come up", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"continuar\" (phrasal verb) em inglês?", options: [
            { text: "carry on", correct: true },
            { text: "carry out", correct: false },
            { text: "carry off", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vou pesquisar isso.\"", options: [
            { text: "I'll look into that", correct: true },
            { text: "I'll look up that", correct: false },
            { text: "I'll look for that", correct: false },
          ] },
          { type: "ASSIST", question: "\"Ele desistiu do projeto.\"", options: [
            { text: "He gave up on the project", correct: true },
            { text: "He gave up the project on", correct: false },
            { text: "He give up on the project", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vamos adiar a reunião\"", options: [
            { text: "Let's put off the meeting", correct: true },
          ] },
        ],
      },
      {
        title: "Discurso indireto",
        icon: "MessageSquare",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Ela disse que estava cansada\" em inglês?", options: [
            { text: "She said she was tired", correct: true },
            { text: "She said she is tired", correct: false },
            { text: "She said that tired", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Ele perguntou onde eu morava\" em inglês?", options: [
            { text: "He asked where I lived", correct: true },
            { text: "He asked where I live", correct: false },
            { text: "He asked where did I live", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eles disseram que viriam.\"", options: [
            { text: "They said they would come", correct: true },
            { text: "They said they will come", correct: false },
            { text: "They said that come", correct: false },
          ] },
          { type: "ASSIST", question: "\"Ela perguntou-me se eu estava bem.\"", options: [
            { text: "She asked me if I was okay", correct: true },
            { text: "She asked me if I am okay", correct: false },
            { text: "She asked if am I okay", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Ele disse que já tinha terminado\"", options: [
            { text: "He said he had already finished", correct: true },
          ] },
        ],
      },
      {
        title: "Expressões idiomáticas",
        icon: "Puzzle",
        challenges: [
          { type: "SELECT", question: "Como se diz \"estudar muito\" (idioma) em inglês?", options: [
            { text: "to hit the books", correct: true },
            { text: "to read the books", correct: false },
            { text: "to open the books", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"chover a cântaros\" em inglês?", options: [
            { text: "to rain cats and dogs", correct: true },
            { text: "to rain hard rain", correct: false },
            { text: "to rain buckets and cats", correct: false },
          ] },
          { type: "ASSIST", question: "\"Custar os olhos da cara.\"", options: [
            { text: "to cost an arm and a leg", correct: true },
            { text: "to cost the eyes of the face", correct: false },
            { text: "to cost a fortune of legs", correct: false },
          ] },
          { type: "ASSIST", question: "\"Matar dois coelhos de uma cajadada.\"", options: [
            { text: "to kill two birds with one stone", correct: true },
            { text: "to kill two rabbits with one shot", correct: false },
            { text: "to catch two birds with a stone", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Está a chover a cântaros\"", options: [
            { text: "It's raining cats and dogs", correct: true },
          ] },
        ],
      },
      {
        title: "Tempos verbais avançados",
        icon: "Clock",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Eu já tinha saído quando ele chegou\" em inglês?", options: [
            { text: "I had already left when he arrived", correct: true },
            { text: "I already left when he arrived", correct: false },
            { text: "I have already left when he arrived", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Até amanhã, já terei terminado\" em inglês?", options: [
            { text: "By tomorrow, I will have finished", correct: true },
            { text: "By tomorrow, I will finish", correct: false },
            { text: "By tomorrow, I have finished", correct: false },
          ] },
          { type: "ASSIST", question: "\"Estarei a trabalhar às 9 horas.\"", options: [
            { text: "I will be working at 9 o'clock", correct: true },
            { text: "I will work at 9 o'clock", correct: false },
            { text: "I am working at 9 o'clock tomorrow", correct: false },
          ] },
          { type: "ASSIST", question: "\"Se eu tivesse sabido, teria ajudado.\"", options: [
            { text: "If I had known, I would have helped", correct: true },
            { text: "If I knew, I would help", correct: false },
            { text: "If I had know, I would helped", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Estava a chover quando saí\"", options: [
            { text: "It was raining when I left", correct: true },
          ] },
        ],
      },
      {
        title: "Conectores de argumentação",
        icon: "Presentation",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Além disso\" em inglês?", options: [
            { text: "Furthermore", correct: true },
            { text: "Despite", correct: false },
            { text: "Because", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"No entanto\" em inglês?", options: [
            { text: "However", correct: true },
            { text: "Therefore", correct: false },
            { text: "Moreover", correct: false },
          ] },
          { type: "ASSIST", question: "\"Apesar das dificuldades, continuámos.\"", options: [
            { text: "Despite the difficulties, we continued", correct: true },
            { text: "Although the difficulties, we continued", correct: false },
            { text: "Because the difficulties, we continued", correct: false },
          ] },
          { type: "ASSIST", question: "\"Portanto, decidimos cancelar.\"", options: [
            { text: "Therefore, we decided to cancel", correct: true },
            { text: "However, we decided to cancel", correct: false },
            { text: "Besides, we decided to cancel", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Além disso, é mais barato\"", options: [
            { text: "Furthermore, it's cheaper", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"desistir\" (phrasal verb) em inglês?", options: [
            { text: "give up", correct: true },
            { text: "go up", correct: false },
            { text: "come up", correct: false },
          ] },
          { type: "ASSIST", question: "\"Eles disseram que viriam.\"", options: [
            { text: "They said they would come", correct: true },
            { text: "They said they will come", correct: false },
            { text: "They said that come", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"chover a cântaros\" em inglês?", options: [
            { text: "to rain cats and dogs", correct: true },
            { text: "to rain hard rain", correct: false },
            { text: "to rain buckets and cats", correct: false },
          ] },
          { type: "ASSIST", question: "\"Se eu tivesse sabido, teria ajudado.\"", options: [
            { text: "If I had known, I would have helped", correct: true },
            { text: "If I knew, I would help", correct: false },
            { text: "If I had know, I would helped", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Além disso, é mais barato\"", options: [
            { text: "Furthermore, it's cheaper", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Vamos adiar a reunião\"", options: [
            { text: "Let's", correct: true },
            { text: "put", correct: true },
            { text: "off", correct: true },
            { text: "the", correct: true },
            { text: "meeting", correct: true },
            { text: "on", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Inglês avançado no trabalho",
    description: "Negociação, apresentações, feedback e linguagem diplomática para contextos profissionais exigentes.",
    targetGoal: "WORK",
    lessons: [
      {
        title: "Negociação",
        icon: "Scale",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Podemos chegar a um meio-termo?\" em inglês?", options: [
            { text: "Can we reach a compromise?", correct: true },
            { text: "Can we reach a middle?", correct: false },
            { text: "Can we arrive to a compromise?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isso está fora do nosso orçamento\" em inglês?", options: [
            { text: "That's outside our budget", correct: true },
            { text: "That's out from our budget", correct: false },
            { text: "That's far our budget", correct: false },
          ] },
          { type: "ASSIST", question: "\"Estou disposto a negociar o prazo.\"", options: [
            { text: "I'm willing to negotiate the deadline", correct: true },
            { text: "I'm willing negotiate the deadline", correct: false },
            { text: "I'm will to negotiate the deadline", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos rever os termos do contrato.\"", options: [
            { text: "Let's review the contract terms", correct: true },
            { text: "Let's finish the contract terms", correct: false },
            { text: "Let's sign the contract terms", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Aceito os termos propostos\"", options: [
            { text: "I accept the proposed terms", correct: true },
          ] },
        ],
      },
      {
        title: "Apresentações persuasivas",
        icon: "Presentation",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Deixem-me mostrar os dados\" em inglês?", options: [
            { text: "Let me show you the data", correct: true },
            { text: "Let me shown the data", correct: false },
            { text: "Let me showing the data", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isto vai mudar o jogo\" em inglês?", options: [
            { text: "This will be a game changer", correct: true },
            { text: "This will change the game player", correct: false },
            { text: "This will changing the game", correct: false },
          ] },
          { type: "ASSIST", question: "\"Acreditamos que isto trará resultados.\"", options: [
            { text: "We believe this will bring results", correct: true },
            { text: "We believe this bring results", correct: false },
            { text: "We believe this will brings results", correct: false },
          ] },
          { type: "ASSIST", question: "\"Passando para o próximo ponto.\"", options: [
            { text: "Moving on to the next point", correct: true },
            { text: "Moving to the next point on", correct: false },
            { text: "Move on the next point", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Para resumir, é uma boa oportunidade\"", options: [
            { text: "To sum up, it's a good opportunity", correct: true },
          ] },
        ],
      },
      {
        title: "Feedback construtivo",
        icon: "MessageSquare",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Gostei muito do teu trabalho\" em inglês?", options: [
            { text: "I really liked your work", correct: true },
            { text: "I really like your work very", correct: false },
            { text: "I really liking your work", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Há espaço para melhorar aqui\" em inglês?", options: [
            { text: "There's room for improvement here", correct: true },
            { text: "There's a room to improve here", correct: false },
            { text: "There's space for improving here", correct: false },
          ] },
          { type: "ASSIST", question: "\"Gostaria de sugerir uma mudança.\"", options: [
            { text: "I'd like to suggest a change", correct: true },
            { text: "I'd like suggest a change", correct: false },
            { text: "I'd like to suggesting a change", correct: false },
          ] },
          { type: "ASSIST", question: "\"No geral, um ótimo trabalho.\"", options: [
            { text: "Overall, great work", correct: true },
            { text: "In general, a great work", correct: false },
            { text: "At all, great work", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Podias detalhar mais esse ponto\"", options: [
            { text: "Could you elaborate on that point", correct: true },
          ] },
        ],
      },
      {
        title: "Linguagem diplomática",
        icon: "Handshake",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Com todo o respeito, discordo\" em inglês?", options: [
            { text: "With all due respect, I disagree", correct: true },
            { text: "With all respect due, I disagree", correct: false },
            { text: "With due all respect, I disagree", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Talvez devêssemos considerar outra opção\" em inglês?", options: [
            { text: "Perhaps we should consider another option", correct: true },
            { text: "Perhaps we should considering another option", correct: false },
            { text: "Perhaps we must consider another option", correct: false },
          ] },
          { type: "ASSIST", question: "\"Entendo o teu ponto de vista.\"", options: [
            { text: "I understand your point of view", correct: true },
            { text: "I understand you point of view", correct: false },
            { text: "I understand your point in view", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos encontrar uma solução que funcione para ambos.\"", options: [
            { text: "Let's find a solution that works for both", correct: true },
            { text: "Let's found a solution that works for both", correct: false },
            { text: "Let's find a solution what works for both", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Agradeço a tua paciência\"", options: [
            { text: "I appreciate your patience", correct: true },
          ] },
        ],
      },
      {
        title: "Networking",
        icon: "Users",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Vamos manter contacto\" em inglês?", options: [
            { text: "Let's keep in touch", correct: true },
            { text: "Let's stay in contact touch", correct: false },
            { text: "Let's keep on touch", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Foi um prazer conhecer-te\" em inglês?", options: [
            { text: "It was a pleasure to meet you", correct: true },
            { text: "It was pleasure meeting you", correct: false },
            { text: "It was a pleasure meet you", correct: false },
          ] },
          { type: "ASSIST", question: "\"Podemos marcar um café para falar mais?\"", options: [
            { text: "Can we grab a coffee to talk more?", correct: true },
            { text: "Can we take a coffee to talk more?", correct: false },
            { text: "Can we grab coffee for talk more?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vou apresentar-te ao meu colega.\"", options: [
            { text: "I'll introduce you to my colleague", correct: true },
            { text: "I'll introduce you my colleague", correct: false },
            { text: "I'll introducing you to my colleague", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Aqui está o meu cartão\"", options: [
            { text: "Here's my card", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Podemos chegar a um meio-termo?\" em inglês?", options: [
            { text: "Can we reach a compromise?", correct: true },
            { text: "Can we reach a middle?", correct: false },
            { text: "Can we arrive to a compromise?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Acreditamos que isto trará resultados.\"", options: [
            { text: "We believe this will bring results", correct: true },
            { text: "We believe this bring results", correct: false },
            { text: "We believe this will brings results", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Há espaço para melhorar aqui\" em inglês?", options: [
            { text: "There's room for improvement here", correct: true },
            { text: "There's a room to improve here", correct: false },
            { text: "There's space for improving here", correct: false },
          ] },
          { type: "ASSIST", question: "\"Entendo o teu ponto de vista.\"", options: [
            { text: "I understand your point of view", correct: true },
            { text: "I understand you point of view", correct: false },
            { text: "I understand your point in view", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Aqui está o meu cartão\"", options: [
            { text: "Here's my card", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Vamos manter contacto\"", options: [
            { text: "Let's", correct: true },
            { text: "keep", correct: true },
            { text: "in", correct: true },
            { text: "touch", correct: true },
            { text: "stay", correct: false },
          ] },
        ],
      },
    ],
  },
  {
    title: "Inglês avançado em viagem",
    description: "Lida com imprevistos, idiomas e conversas culturais exigentes durante viagens internacionais.",
    targetGoal: "TRAVEL",
    lessons: [
      {
        title: "Situações inesperadas",
        icon: "Puzzle",
        challenges: [
          { type: "SELECT", question: "Como se diz \"O voo foi desviado para outro aeroporto\" em inglês?", options: [
            { text: "The flight was diverted to another airport", correct: true },
            { text: "The flight diverted to another airport", correct: false },
            { text: "The flight has divert to another airport", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Ficámos retidos durante horas\" em inglês?", options: [
            { text: "We were stuck for hours", correct: true },
            { text: "We were stucked for hours", correct: false },
            { text: "We stuck for hours", correct: false },
          ] },
          { type: "ASSIST", question: "\"Se soubesse, teria trazido um guarda-chuva.\"", options: [
            { text: "If I had known, I would have brought an umbrella", correct: true },
            { text: "If I knew, I would bring an umbrella", correct: false },
            { text: "If I had know, I would brought an umbrella", correct: false },
          ] },
          { type: "ASSIST", question: "\"Acabámos por perder a ligação.\"", options: [
            { text: "We ended up missing the connection", correct: true },
            { text: "We end up missing the connection", correct: false },
            { text: "We ended up miss the connection", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Tivemos de improvisar um plano B\"", options: [
            { text: "We had to improvise a plan B", correct: true },
          ] },
        ],
      },
      {
        title: "Expressões idiomáticas de viagem",
        icon: "MapPin",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Cair em pé\" (sair-se bem de uma situação) em inglês?", options: [
            { text: "to land on your feet", correct: true },
            { text: "to fall on your feet", correct: false },
            { text: "to stand on your feet", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Ir com a corrente\" em inglês?", options: [
            { text: "to go with the flow", correct: true },
            { text: "to go with the river", correct: false },
            { text: "to swim with the flow", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos deixar para a próxima.\"", options: [
            { text: "Let's take a rain check", correct: true },
            { text: "Let's leave for next time", correct: false },
            { text: "Let's check the rain", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos improvisar.\"", options: [
            { text: "Let's play it by ear", correct: true },
            { text: "Let's play by the ear", correct: false },
            { text: "Let's hear it by playing", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vamos ver como corre\"", options: [
            { text: "Let's see how it goes", correct: true },
          ] },
        ],
      },
      {
        title: "Conversas culturais",
        icon: "Users",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Cada cultura tem os seus costumes\" em inglês?", options: [
            { text: "Every culture has its own customs", correct: true },
            { text: "Every culture have its own customs", correct: false },
            { text: "Every culture has their own custom", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isso seria considerado falta de educação lá\" em inglês?", options: [
            { text: "That would be considered rude there", correct: true },
            { text: "That would considered rude there", correct: false },
            { text: "That would be consider rude there", correct: false },
          ] },
          { type: "ASSIST", question: "\"Aprecio muito a vossa hospitalidade.\"", options: [
            { text: "I really appreciate your hospitality", correct: true },
            { text: "I really appreciate you hospitality", correct: false },
            { text: "I really appreciated your hospitality now", correct: false },
          ] },
          { type: "ASSIST", question: "\"Isso varia muito de região para região.\"", options: [
            { text: "That varies a lot from region to region", correct: true },
            { text: "That vary a lot from region to region", correct: false },
            { text: "That is varies a lot region to region", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Estou a aprender a respeitar as diferenças\"", options: [
            { text: "I'm learning to respect the differences", correct: true },
          ] },
        ],
      },
      {
        title: "Reclamações educadas",
        icon: "Scale",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Lamento incomodar, mas há um problema\" em inglês?", options: [
            { text: "I'm sorry to bother you, but there's a problem", correct: true },
            { text: "I'm sorry for bother you, but there's a problem", correct: false },
            { text: "I'm sorry to bothering you, but there's a problem", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isto não é bem o que esperava\" em inglês?", options: [
            { text: "This isn't quite what I expected", correct: true },
            { text: "This isn't quite what I expect", correct: false },
            { text: "This wasn't quite what I expecting", correct: false },
          ] },
          { type: "ASSIST", question: "\"Podiam resolver isto, por favor?\"", options: [
            { text: "Could you please resolve this?", correct: true },
            { text: "Could you please resolving this?", correct: false },
            { text: "Could you resolve this please now?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Agradecia uma solução o mais rápido possível.\"", options: [
            { text: "I'd appreciate a solution as soon as possible", correct: true },
            { text: "I'd appreciated a solution as soon as possible", correct: false },
            { text: "I'd appreciate a solution so soon as possible", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Gostaria de falar com o responsável\"", options: [
            { text: "I'd like to speak to the manager", correct: true },
          ] },
        ],
      },
      {
        title: "Viagens de negócios",
        icon: "Briefcase",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Tenho uma reunião assim que aterrar\" em inglês?", options: [
            { text: "I have a meeting as soon as I land", correct: true },
            { text: "I have a meeting as soon I land", correct: false },
            { text: "I have a meeting so soon as I land", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Preciso de um recibo para a despesa\" em inglês?", options: [
            { text: "I need a receipt for the expense", correct: true },
            { text: "I need a receipt to the expense", correct: false },
            { text: "I need a receipt for expend", correct: false },
          ] },
          { type: "ASSIST", question: "\"O meu voo de regresso foi reagendado.\"", options: [
            { text: "My return flight was rescheduled", correct: true },
            { text: "My return flight has reschedule", correct: false },
            { text: "My return flight is rescheduling", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vou trabalhar remotamente durante a viagem.\"", options: [
            { text: "I'll be working remotely during the trip", correct: true },
            { text: "I'll working remotely during the trip", correct: false },
            { text: "I'll work remote during the trip", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Tenho de submeter o relatório de despesas\"", options: [
            { text: "I have to submit the expense report", correct: true },
          ] },
        ],
      },
      {
        title: "Revisão da Unidade",
        icon: "Trophy",
        challenges: [
          { type: "SELECT", question: "Como se diz \"O voo foi desviado para outro aeroporto\" em inglês?", options: [
            { text: "The flight was diverted to another airport", correct: true },
            { text: "The flight diverted to another airport", correct: false },
            { text: "The flight has divert to another airport", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos deixar para a próxima.\"", options: [
            { text: "Let's take a rain check", correct: true },
            { text: "Let's leave for next time", correct: false },
            { text: "Let's check the rain", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isso seria considerado falta de educação lá\" em inglês?", options: [
            { text: "That would be considered rude there", correct: true },
            { text: "That would considered rude there", correct: false },
            { text: "That would be consider rude there", correct: false },
          ] },
          { type: "ASSIST", question: "\"Podiam resolver isto, por favor?\"", options: [
            { text: "Could you please resolve this?", correct: true },
            { text: "Could you please resolving this?", correct: false },
            { text: "Could you resolve this please now?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Tenho de submeter o relatório de despesas\"", options: [
            { text: "I have to submit the expense report", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Vamos ver como corre\"", options: [
            { text: "Let's", correct: true },
            { text: "see", correct: true },
            { text: "how", correct: true },
            { text: "it", correct: true },
            { text: "goes", correct: true },
            { text: "going", correct: false },
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
      where: eq(schema.units.targetLevel, "ADVANCED"),
    });

    if (alreadySeeded) {
      console.log("ADVANCED units already seeded, skipping.");
      return;
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.units)
      .where(eq(schema.units.courseId, englishCourse.id));

    await db.transaction(async (tx) => {
      console.log("Inserting ADVANCED units...");

      let unitOrder = count + 1;
      for (const unit of unitsData) {
        const [unitRow] = await tx.insert(schema.units).values({
          courseId: englishCourse.id,
          title: unit.title,
          description: unit.description,
          order: unitOrder++,
          targetLevel: "ADVANCED",
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

    console.log("ADVANCED units inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert ADVANCED units");
  } finally {
    await pool.end();
  }
};

main();
