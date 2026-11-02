import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";

import * as schema from "../db/schema";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

type Option = { text: string; correct: boolean };
type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE" | "MATCH";
type Challenge = { type: ChallengeType; question: string; options: Option[] };
type Lesson = { title: string; isBonus?: boolean; challenges: Challenge[] };
type LearningGoal = "WORK" | null;
type Unit = {
  title: string;
  description: string;
  targetGoal: LearningGoal;
  lessons: Lesson[];
};

const unitsData: Unit[] = [
  {
    title: "Inglês intermédio — Base",
    description: "Vai além do básico: tempos verbais, comparações, condicionais e expressões do dia a dia.",
    targetGoal: null,
    lessons: [
      {
        title: "Tempos verbais",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Eu já vi esse filme\" em inglês?", options: [
            { text: "I have already seen that movie", correct: true },
            { text: "I am seeing that movie", correct: false },
            { text: "I will see that movie", correct: false },
          ] },
          { type: "ASSIST", question: "\"Ela ainda não terminou o relatório.\"", options: [
            { text: "She hasn't finished the report yet", correct: true },
            { text: "She didn't finish the report", correct: false },
            { text: "She doesn't finish the report", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Nós vivemos aqui há cinco anos\" em inglês?", options: [
            { text: "We have lived here for five years", correct: true },
            { text: "We live here since five years", correct: false },
            { text: "We lived here for five years ago", correct: false },
          ] },
          { type: "ASSIST", question: "\"Já alguma vez estiveste em Londres?\"", options: [
            { text: "Have you ever been to London?", correct: true },
            { text: "Did you ever go to London?", correct: false },
            { text: "Are you ever in London?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Ele acabou de chegar\" em inglês?", options: [
            { text: "He has just arrived", correct: true },
            { text: "He is just arriving", correct: false },
            { text: "He just arrives", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Nunca tinha comido sushi antes.\"", options: [
            { text: "I had never eaten sushi before", correct: true },
            { text: "I'd never eaten sushi before", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Já terminámos o projeto\"", options: [
            { text: "We", correct: true },
            { text: "have", correct: true },
            { text: "already", correct: true },
            { text: "finished", correct: true },
            { text: "the", correct: true },
            { text: "project", correct: true },
            { text: "are", correct: false },
            { text: "finishing", correct: false },
          ] },
        ],
      },
      {
        title: "Comparações",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Este carro é mais rápido do que aquele\" em inglês?", options: [
            { text: "This car is faster than that one", correct: true },
            { text: "This car is fast as that one", correct: false },
            { text: "This car is the fastest that one", correct: false },
          ] },
          { type: "ASSIST", question: "\"A reunião de hoje é mais importante do que a de ontem.\"", options: [
            { text: "Today's meeting is more important than yesterday's", correct: true },
            { text: "Today's meeting is important than yesterday", correct: false },
            { text: "Today's meeting is most important than yesterday", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Esta é a melhor solução\" em inglês?", options: [
            { text: "This is the best solution", correct: true },
            { text: "This is the better solution", correct: false },
            { text: "This is the goodest solution", correct: false },
          ] },
          { type: "ASSIST", question: "\"O mais cedo possível.\"", options: [
            { text: "As soon as possible", correct: true },
            { text: "As early as possible", correct: false },
            { text: "As fast as possible", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Quanto mais praticas, melhor ficas.\"", options: [
            { text: "The more you practice, the better you get", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Ela é a mais experiente da equipa\"", options: [
            { text: "She", correct: true },
            { text: "is", correct: true },
            { text: "the", correct: true },
            { text: "most", correct: true },
            { text: "experienced", correct: true },
            { text: "person", correct: true },
            { text: "on", correct: true },
            { text: "the", correct: true },
            { text: "team", correct: true },
            { text: "more", correct: false },
          ] },
          { type: "MATCH", question: "Liga cada frase à sua tradução", options: [
            { text: "mais barato|||cheaper", correct: true },
            { text: "o mais caro|||the most expensive", correct: true },
            { text: "tão bom como|||as good as", correct: true },
            { text: "pior do que|||worse than", correct: true },
          ] },
        ],
      },
      {
        title: "Frases condicionais",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Se chover, ficamos em casa\" em inglês?", options: [
            { text: "If it rains, we will stay home", correct: true },
            { text: "If it rains, we stayed home", correct: false },
            { text: "If it will rain, we stay home", correct: false },
          ] },
          { type: "ASSIST", question: "\"Se tiveres tempo, podes rever isto?\"", options: [
            { text: "If you have time, can you review this?", correct: true },
            { text: "If you will have time, can you review this?", correct: false },
            { text: "If you had time, can you review this?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Se eu fosse tu, aceitava a proposta\" em inglês?", options: [
            { text: "If I were you, I would accept the offer", correct: true },
            { text: "If I was you, I accept the offer", correct: false },
            { text: "If I am you, I will accept the offer", correct: false },
          ] },
          { type: "ASSIST", question: "\"A menos que algo mude.\"", options: [
            { text: "Unless something changes", correct: true },
            { text: "Except something changes", correct: false },
            { text: "Without something changes", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Se precisares de ajuda, avisa-me.\"", options: [
            { text: "If you need help, let me know", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Teríamos terminado mais cedo se tivéssemos ajuda\"", options: [
            { text: "We", correct: true },
            { text: "would", correct: true },
            { text: "have", correct: true },
            { text: "finished", correct: true },
            { text: "earlier", correct: true },
            { text: "if", correct: true },
            { text: "we", correct: true },
            { text: "had", correct: true },
            { text: "help", correct: true },
            { text: "will", correct: false },
          ] },
        ],
      },
      {
        title: "Expressões do dia a dia",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Desistir\" em inglês (verbo frasal)?", options: [
            { text: "To give up", correct: true },
            { text: "To give down", correct: false },
            { text: "To take up", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos resolver isto.\"", options: [
            { text: "Let's figure this out", correct: true },
            { text: "Let's give this up", correct: false },
            { text: "Let's look this up", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Adiar uma reunião\" em inglês?", options: [
            { text: "To put off a meeting", correct: true },
            { text: "To put on a meeting", correct: false },
            { text: "To put up a meeting", correct: false },
          ] },
          { type: "ASSIST", question: "\"Está a crescer rapidamente.\"", options: [
            { text: "It's growing fast", correct: true },
            { text: "It's getting over fast", correct: false },
            { text: "It's running out fast", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Cuidar de algo\" em inglês?", options: [
            { text: "To take care of something", correct: true },
            { text: "To take off something", correct: false },
            { text: "To take away something", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vou pensar sobre isso.\"", options: [
            { text: "I will think it over", correct: true },
            { text: "I'll think about it", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Ela desistiu do trabalho na semana passada\"", options: [
            { text: "She", correct: true },
            { text: "gave", correct: true },
            { text: "up", correct: true },
            { text: "the", correct: true },
            { text: "job", correct: true },
            { text: "last", correct: true },
            { text: "week", correct: true },
            { text: "down", correct: false },
          ] },
          { type: "MATCH", question: "Liga cada expressão à sua tradução", options: [
            { text: "continuar|||to carry on", correct: true },
            { text: "acabar com algo|||to run out of something", correct: true },
            { text: "aparecer|||to show up", correct: true },
            { text: "cancelar|||to call off", correct: true },
          ] },
        ],
      },
      {
        title: "Uma conversa sobre planos",
        isBonus: true,
        challenges: [
          { type: "DIALOGUE", question: "Leo: Do you have any plans for the weekend?\nJuba: Not yet, why?\nLeo: I was thinking we could visit that new museum.\nJuba: That sounds great, what time?", options: [] },
          { type: "DIALOGUE", question: "Juba: If it rains, should we reschedule?\nLeo: If it rains, we'll just bring umbrellas.\nJuba: Fair enough, let's stick to the plan then.", options: [] },
          { type: "DIALOGUE", question: "Leo: I have never been to that part of the city.\nJuba: Me neither, it should be fun.\nLeo: Let's figure out the directions tonight.", options: [] },
        ],
      },
      {
        title: "Revisão da Unidade",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Eu já vi esse filme\" em inglês?", options: [
            { text: "I have already seen that movie", correct: true },
            { text: "I am seeing that movie", correct: false },
            { text: "I will see that movie", correct: false },
          ] },
          { type: "ASSIST", question: "\"Já alguma vez estiveste em Londres?\"", options: [
            { text: "Have you ever been to London?", correct: true },
            { text: "Did you ever go to London?", correct: false },
            { text: "Are you ever in London?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Esta é a melhor solução\" em inglês?", options: [
            { text: "This is the best solution", correct: true },
            { text: "This is the better solution", correct: false },
            { text: "This is the goodest solution", correct: false },
          ] },
          { type: "ASSIST", question: "\"O mais cedo possível.\"", options: [
            { text: "As soon as possible", correct: true },
            { text: "As early as possible", correct: false },
            { text: "As fast as possible", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Se chover, ficamos em casa\" em inglês?", options: [
            { text: "If it rains, we will stay home", correct: true },
            { text: "If it rains, we stayed home", correct: false },
            { text: "If it will rain, we stay home", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Vou pensar sobre isso.\"", options: [
            { text: "I will think it over", correct: true },
            { text: "I'll think about it", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Já terminámos o projeto\"", options: [
            { text: "We", correct: true },
            { text: "have", correct: true },
            { text: "already", correct: true },
            { text: "finished", correct: true },
            { text: "the", correct: true },
            { text: "project", correct: true },
            { text: "are", correct: false },
          ] },
          { type: "MATCH", question: "Liga cada expressão à sua tradução", options: [
            { text: "continuar|||to carry on", correct: true },
            { text: "mais barato|||cheaper", correct: true },
            { text: "aparecer|||to show up", correct: true },
            { text: "pior do que|||worse than", correct: true },
          ] },
        ],
      },
    ],
  },
  {
    title: "Inglês intermédio no trabalho",
    description: "Comunica com mais confiança no trabalho: reuniões, relatórios, resolução de problemas e entrevistas.",
    targetGoal: "WORK",
    lessons: [
      {
        title: "Reuniões e apresentações",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Vamos começar a apresentação\" em inglês?", options: [
            { text: "Let's start the presentation", correct: true },
            { text: "Let's finish the presentation", correct: false },
            { text: "Let's cancel the presentation", correct: false },
          ] },
          { type: "ASSIST", question: "\"Como podem ver neste gráfico...\"", options: [
            { text: "As you can see in this chart...", correct: true },
            { text: "As you saw in this chart...", correct: false },
            { text: "As you will see this chart...", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Alguma pergunta até agora?\" em inglês?", options: [
            { text: "Any questions so far?", correct: true },
            { text: "Any question until now?", correct: false },
            { text: "Some questions by now?", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos passar ao próximo ponto.\"", options: [
            { text: "Let's move on to the next point", correct: true },
            { text: "Let's move back to the next point", correct: false },
            { text: "Let's go over the next point again", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Discordo respeitosamente\" em inglês?", options: [
            { text: "I respectfully disagree", correct: true },
            { text: "I respectfully agree", correct: false },
            { text: "I disagree respectful", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Podemos agendar uma reunião de seguimento?\"", options: [
            { text: "Can we schedule a follow-up meeting?", correct: true },
            { text: "Can we schedule a follow up meeting?", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Vamos rever os próximos passos antes de terminar\"", options: [
            { text: "Let's", correct: true },
            { text: "go", correct: true },
            { text: "over", correct: true },
            { text: "the", correct: true },
            { text: "next", correct: true },
            { text: "steps", correct: true },
            { text: "before", correct: true },
            { text: "we", correct: true },
            { text: "finish", correct: true },
            { text: "after", correct: false },
          ] },
        ],
      },
      {
        title: "Relatórios e dados",
        challenges: [
          { type: "SELECT", question: "Como se diz \"As vendas aumentaram 10%\" em inglês?", options: [
            { text: "Sales increased by 10%", correct: true },
            { text: "Sales increase by 10%", correct: false },
            { text: "Sales are increased on 10%", correct: false },
          ] },
          { type: "ASSIST", question: "\"Os custos diminuíram face ao trimestre anterior.\"", options: [
            { text: "Costs decreased compared to the previous quarter", correct: true },
            { text: "Costs decreased comparing the last quarter", correct: false },
            { text: "Costs are decreasing than last quarter", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Segundo os dados mais recentes\" em inglês?", options: [
            { text: "According to the latest data", correct: true },
            { text: "Accordingly to the last data", correct: false },
            { text: "By the latest data", correct: false },
          ] },
          { type: "ASSIST", question: "\"Precisamos de analisar estes números com mais cuidado.\"", options: [
            { text: "We need to analyze these numbers more carefully", correct: true },
            { text: "We need analyzing these numbers more careful", correct: false },
            { text: "We need to analyze this numbers carefully more", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Em resumo\" em inglês?", options: [
            { text: "In summary", correct: true },
            { text: "At summary", correct: false },
            { text: "On summary", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"O relatório estará pronto até sexta-feira.\"", options: [
            { text: "The report will be ready by Friday", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Os lucros cresceram mais do que esperávamos\"", options: [
            { text: "Profits", correct: true },
            { text: "grew", correct: true },
            { text: "more", correct: true },
            { text: "than", correct: true },
            { text: "we", correct: true },
            { text: "expected", correct: true },
            { text: "grow", correct: false },
          ] },
          { type: "MATCH", question: "Liga cada termo à sua tradução", options: [
            { text: "receita|||revenue", correct: true },
            { text: "orçamento|||budget", correct: true },
            { text: "prazo|||deadline", correct: true },
            { text: "meta|||target", correct: true },
          ] },
        ],
      },
      {
        title: "Resolver problemas",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Encontrámos um problema\" em inglês?", options: [
            { text: "We ran into a problem", correct: true },
            { text: "We ran out a problem", correct: false },
            { text: "We ran over a problem", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos descobrir a causa raiz.\"", options: [
            { text: "Let's find the root cause", correct: true },
            { text: "Let's find the top cause", correct: false },
            { text: "Let's find the deep cause", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Isto precisa de ser resolvido com urgência\" em inglês?", options: [
            { text: "This needs to be fixed urgently", correct: true },
            { text: "This need to fix urgent", correct: false },
            { text: "This needs fixing urgent", correct: false },
          ] },
          { type: "ASSIST", question: "\"Qual é o plano B?\"", options: [
            { text: "What's the backup plan?", correct: true },
            { text: "What's the back plan?", correct: false },
            { text: "What's the second plan?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Já implementámos uma solução temporária.\"", options: [
            { text: "We have already implemented a temporary solution", correct: true },
            { text: "We've already implemented a temporary solution", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Se identificarmos o problema a tempo, evitamos o atraso\"", options: [
            { text: "If", correct: true },
            { text: "we", correct: true },
            { text: "identify", correct: true },
            { text: "the", correct: true },
            { text: "problem", correct: true },
            { text: "in", correct: true },
            { text: "time", correct: true },
            { text: "we", correct: true },
            { text: "avoid", correct: true },
            { text: "the", correct: true },
            { text: "delay", correct: true },
            { text: "will", correct: false },
          ] },
        ],
      },
      {
        title: "Entrevistas e feedback",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Fala-me sobre a tua experiência anterior\" em inglês?", options: [
            { text: "Tell me about your previous experience", correct: true },
            { text: "Tell me about your previously experience", correct: false },
            { text: "Tell me on your previous experience", correct: false },
          ] },
          { type: "ASSIST", question: "\"Quais são os teus pontos fortes?\"", options: [
            { text: "What are your strengths?", correct: true },
            { text: "What are your strongs?", correct: false },
            { text: "What are your strength points?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Gostaria de dar feedback construtivo\" em inglês?", options: [
            { text: "I'd like to give some constructive feedback", correct: true },
            { text: "I'd like to give some construction feedback", correct: false },
            { text: "I'd like to give some constructed feedback", correct: false },
          ] },
          { type: "ASSIST", question: "\"Onde te vês dentro de cinco anos?\"", options: [
            { text: "Where do you see yourself in five years?", correct: true },
            { text: "Where you see yourself in five years?", correct: false },
            { text: "Where do you see you in five years?", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Obrigado pela oportunidade\" em inglês?", options: [
            { text: "Thank you for the opportunity", correct: true },
            { text: "Thank you for the opportunities", correct: false },
            { text: "Thanks you for the opportunity", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"Estou disponível para começar na próxima semana.\"", options: [
            { text: "I'm available to start next week", correct: true },
            { text: "I am available to start next week", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Aprendi muito com os meus erros anteriores\"", options: [
            { text: "I", correct: true },
            { text: "learned", correct: true },
            { text: "a", correct: true },
            { text: "lot", correct: true },
            { text: "from", correct: true },
            { text: "my", correct: true },
            { text: "previous", correct: true },
            { text: "mistakes", correct: true },
            { text: "learn", correct: false },
          ] },
          { type: "MATCH", question: "Liga cada expressão à sua tradução", options: [
            { text: "ponto forte|||strength", correct: true },
            { text: "ponto fraco|||weakness", correct: true },
            { text: "disponibilidade|||availability", correct: true },
            { text: "desempenho|||performance", correct: true },
          ] },
        ],
      },
      {
        title: "Uma reunião de equipa",
        isBonus: true,
        challenges: [
          { type: "DIALOGUE", question: "Leo: We ran into a problem with the deadline.\nJuba: What's the root cause?\nLeo: The supplier was late again.\nJuba: Let's find a backup plan.", options: [] },
          { type: "DIALOGUE", question: "Juba: According to the latest data, sales increased by 10%.\nLeo: That's great news.\nJuba: Costs decreased too, compared to last quarter.", options: [] },
          { type: "DIALOGUE", question: "Leo: Any questions so far?\nJuba: Yes, can we schedule a follow-up meeting?\nLeo: Sure, let's move on to the next point first.", options: [] },
        ],
      },
      {
        title: "Revisão da Unidade",
        challenges: [
          { type: "SELECT", question: "Como se diz \"Vamos começar a apresentação\" em inglês?", options: [
            { text: "Let's start the presentation", correct: true },
            { text: "Let's finish the presentation", correct: false },
            { text: "Let's cancel the presentation", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos passar ao próximo ponto.\"", options: [
            { text: "Let's move on to the next point", correct: true },
            { text: "Let's move back to the next point", correct: false },
            { text: "Let's go over the next point again", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Em resumo\" em inglês?", options: [
            { text: "In summary", correct: true },
            { text: "At summary", correct: false },
            { text: "On summary", correct: false },
          ] },
          { type: "ASSIST", question: "\"Vamos descobrir a causa raiz.\"", options: [
            { text: "Let's find the root cause", correct: true },
            { text: "Let's find the top cause", correct: false },
            { text: "Let's find the deep cause", correct: false },
          ] },
          { type: "SELECT", question: "Como se diz \"Quais são os teus pontos fortes?\" em inglês?", options: [
            { text: "What are your strengths?", correct: true },
            { text: "What are your strongs?", correct: false },
            { text: "What are your strength points?", correct: false },
          ] },
          { type: "WRITE", question: "Escreve em inglês: \"O relatório estará pronto até sexta-feira.\"", options: [
            { text: "The report will be ready by Friday", correct: true },
          ] },
          { type: "ARRANGE", question: "Monta a frase: \"Aprendi muito com os meus erros anteriores\"", options: [
            { text: "I", correct: true },
            { text: "learned", correct: true },
            { text: "a", correct: true },
            { text: "lot", correct: true },
            { text: "from", correct: true },
            { text: "my", correct: true },
            { text: "previous", correct: true },
            { text: "mistakes", correct: true },
          ] },
          { type: "MATCH", question: "Liga cada termo à sua tradução", options: [
            { text: "receita|||revenue", correct: true },
            { text: "prazo|||deadline", correct: true },
            { text: "ponto forte|||strength", correct: true },
            { text: "desempenho|||performance", correct: true },
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
      where: and(
        eq(schema.units.courseId, englishCourse.id),
        eq(schema.units.targetLevel, "INTERMEDIATE"),
      ),
    });

    if (alreadySeeded) {
      console.log("INTERMEDIATE units already seeded, skipping.");
      return;
    }

    await db.transaction(async (tx) => {
      console.log("Inserting INTERMEDIATE units...");

      let unitOrder = 4;
      for (const unit of unitsData) {
        const [unitRow] = await tx.insert(schema.units).values({
          courseId: englishCourse.id,
          title: unit.title,
          description: unit.description,
          order: unitOrder++,
          targetLevel: "INTERMEDIATE",
          targetGoal: unit.targetGoal,
        }).returning();

        let lessonOrder = 1;
        for (const lesson of unit.lessons) {
          const [lessonRow] = await tx.insert(schema.lessons).values({
            unitId: unitRow.id,
            title: lesson.title,
            order: lessonOrder++,
            isBonus: lesson.isBonus ?? false,
          }).returning();

          let challengeOrder = 1;
          for (const challenge of lesson.challenges) {
            const [challengeRow] = await tx.insert(schema.challenges).values({
              lessonId: lessonRow.id,
              type: challenge.type,
              question: challenge.question,
              order: challengeOrder++,
            }).returning();

            if (challenge.options.length > 0) {
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
      }
    });

    console.log("INTERMEDIATE units inserted.");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert INTERMEDIATE units");
  } finally {
    await pool.end();
  }
};

main();
