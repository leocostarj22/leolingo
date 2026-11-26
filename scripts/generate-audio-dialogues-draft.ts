import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });

import { englishLevelEnum, learningGoalEnum } from "../db/schema";

export type EnglishLevel = (typeof englishLevelEnum.enumValues)[number];
export type LearningGoal = (typeof learningGoalEnum.enumValues)[number];

export type Option = { text: string; correct: boolean };
export type ChallengeType = "SELECT" | "ASSIST" | "WRITE" | "ARRANGE" | "DIALOGUE" | "MATCH" | "SPEAK";
export type NewChallenge = { type: ChallengeType; question: string; options: Option[] };
export type DraftEntry = {
  targetLevel: EnglishLevel;
  targetGoal: LearningGoal | null;
  unitTitle: string;
  lessonTitle: string;
  challenges: NewChallenge[];
};

type Target = {
  targetLevel: EnglishLevel;
  targetGoal: LearningGoal | null;
  unitTitle: string;
  lessonTitle: string;
  topicHint: string;
};

const targets: Target[] = [
  {
    targetLevel: "BASIC", targetGoal: "TRAVEL",
    unitTitle: "Inglês em viagem", lessonTitle: "Compras e dinheiro",
    topicHint: "fazer compras, perguntar preços, pagar e receber troco",
  },
  {
    targetLevel: "INTERMEDIATE", targetGoal: "WORK",
    unitTitle: "Inglês intermédio no trabalho", lessonTitle: "Relatórios e dados",
    topicHint: "apresentar números/dados de um relatório a um colega",
  },
  {
    targetLevel: "ADVANCED", targetGoal: "TRAVEL",
    unitTitle: "Inglês avançado em viagem", lessonTitle: "Storytelling e experiências",
    topicHint: "contar uma experiência de viagem a alguém, com detalhe e opinião",
  },
];

const buildPrompt = (target: Target) => `Gera um exercício de inglês para uma app de aprendizagem de línguas (português para inglês).

Contexto: nível ${target.targetLevel}, objetivo ${target.targetGoal ?? "geral"}, lição "${target.lessonTitle}".
Tema: ${target.topicHint}.

Preciso de um diálogo curto em inglês entre duas personagens, "Leo" e "Juba", sobre este tema, com 4 a 6 falas alternadas, em inglês adequado ao nível indicado.

Depois do diálogo, cria 3 perguntas de compreensão em português sobre o diálogo, misturando os tipos "SELECT" (escolha múltipla, 3-4 opções, só uma correta), "WRITE" (o utilizador escreve a resposta em inglês) e "SPEAK" (o utilizador responde falando em inglês) — usa pelo menos 2 tipos diferentes, nunca os 3 iguais.

Responde APENAS com um JSON válido, sem comentários, neste formato exato:
{
  "dialogue": "Leo: ...\\nJuba: ...\\n...",
  "questions": [
    { "type": "SELECT", "question": "pergunta em português", "options": [{"text": "...", "correct": true}, {"text": "...", "correct": false}] },
    { "type": "WRITE", "question": "pergunta em português", "options": [{"text": "resposta correta em inglês", "correct": true}] },
    { "type": "SPEAK", "question": "pergunta em português", "options": [{"text": "resposta correta em inglês", "correct": true}] }
  ]
}`;

type DraftResponse = {
  dialogue: string;
  questions: { type: ChallengeType; question: string; options: Option[] }[];
};

const generateDraft = async (target: Target): Promise<DraftEntry> => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: buildPrompt(target) }],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status}) for "${target.lessonTitle}"`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`Groq returned no content for "${target.lessonTitle}"`);
  }

  const parsed: DraftResponse = JSON.parse(content);

  const types = new Set(parsed.questions.map((q) => q.type));
  if (parsed.questions.length < 2 || types.size < 2) {
    throw new Error(`Draft for "${target.lessonTitle}" doesn't mix question types as required — regenerate.`);
  }

  return {
    targetLevel: target.targetLevel,
    targetGoal: target.targetGoal,
    unitTitle: target.unitTitle,
    lessonTitle: target.lessonTitle,
    challenges: [
      { type: "DIALOGUE", question: parsed.dialogue, options: [] },
      ...parsed.questions.map((q) => ({ type: q.type, question: q.question, options: q.options })),
    ],
  };
};

async function main() {
  const entries: DraftEntry[] = [];

  for (const target of targets) {
    console.log(`Generating draft for "${target.lessonTitle}" (${target.targetLevel}/${target.targetGoal ?? "geral"})...`);
    entries.push(await generateDraft(target));
  }

  const outPath = path.join(process.cwd(), "scripts", "audio-dialogues-draft-data.ts");
  const header = `// Rascunho gerado por IA (Groq, modelo gratuito) em ${new Date().toISOString()}.
// REVÊ E CORRIGE À MÃO antes de correr scripts/add-audio-dialogues.ts.
// Este ficheiro não é committado — é só um rascunho de trabalho.
import type { DraftEntry } from "./generate-audio-dialogues-draft";

export const draftDialogues: DraftEntry[] = `;
  fs.writeFileSync(outPath, header + JSON.stringify(entries, null, 2) + ";\n");

  console.log(`\nRascunho escrito em ${outPath}. Revê o conteúdo antes de aplicar.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
