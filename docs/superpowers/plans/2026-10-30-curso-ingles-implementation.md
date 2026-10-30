# Curso de Inglês (conteúdo inicial, personalizado) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o curso "English" com conteúdo real (nível Básico, em três percursos: genérico, Trabalho, Viagem), mostrando a cada pessoa só as unidades que correspondem ao `englishLevel`/`learningGoal` do seu perfil.

**Architecture:** Duas colunas novas em `units` (`targetLevel`, `targetGoal`, reaproveitando os enums já existentes) marcam a que combinação nível/objetivo uma unidade pertence (`NULL` = aplica-se a todos nessa dimensão, preservando o comportamento atual dos cursos de exemplo). `db/queries.ts` ganha um filtro partilhado que as duas queries que listam unidades (`getUnits`, `getCourseProgress`) passam a usar. Um script novo, só de inserção, popula o curso de Inglês sem tocar em nenhuma tabela existente.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Postgres (driver `pg`/`drizzle-orm/node-postgres`, igual ao de `db/drizzle.ts`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-30-curso-ingles-design.md`

## Global Constraints

- Não instalar nenhuma dependência nova.
- Não criar tipos de desafio novos — só `SELECT` e `ASSIST` (já existentes em `challengesEnum`).
- Sem áudio nos desafios desta entrega (`challengeOptions.audioSrc` fica `null`/omitido).
- O script de inserção nunca usa `delete`/`truncate` — só `insert`. Nunca reaproveitar nem editar `scripts/seed.ts` ou `scripts/reset.ts` (usam o driver Neon, incompatível com o Postgres local, e são destrutivos).
- Os cursos de exemplo existentes (Spanish, Italian, French, Croatian) e as suas unidades ficam exatamente como estão — qualquer unidade sem `targetLevel`/`targetGoal` continua visível para todos.
- Não há framework de testes automatizados no repositório — verificação é `npx tsc --noEmit` (deve ficar sempre limpo) + comandos `psql` manuais + verificação visual no browser.
- `courses.id`, `units.id`, `lessons.id`, `challenges.id` são sempre gerados pela base de dados (`serial`/`.returning()`), nunca escritos à mão.

## Review Focus

- Um utilizador com um curso de exemplo já ativo (ex. Spanish) continua a ver a mesma única unidade de sempre depois da mudança no filtro — nenhuma unidade de curso antigo desaparece.
- Um perfil com `englishLevel` por preencher (campo opcional) ainda vê as unidades do nível `BASIC` (default aplicado em memória), não uma lista vazia.
- Um perfil cujo `learningGoal` não tem percurso próprio ainda (ex. `STUDY_ABROAD`) vê a unidade genérica "Noções básicas", nunca uma lista vazia nem um erro.
- `getUnits` e `getCourseProgress` nunca divergem sobre que unidades existem para a mesma pessoa — ambas chamam o mesmo auxiliar de filtro, não duas cláusulas `where` escritas à parte.
- Correr `scripts/seed-english.ts` não falha a meio (ex. por `imageSrc` undefined em vez de omitido) e nunca executa nenhum `delete` em nenhuma tabela.

---

### Task 1: Esquema — reordenar enums e marcar unidades por nível/objetivo

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: colunas `units.targetLevel` (`english_level` enum, nullable) e `units.targetGoal` (`learning_goal` enum, nullable), usadas pela Task 2.

- [ ] **Step 1: Mover as declarações dos enums para antes de `units`**

Hoje `challengesEnum`, `genderEnum`, `englishLevelEnum` e `learningGoalEnum` estão declarados logo antes da tabela `challenges` — ou seja, **depois** da tabela `units`. Como a Task 2 precisa que `units` referencie `englishLevelEnum`/`learningGoalEnum` no próprio objeto da tabela, essas quatro constantes têm de passar a estar declaradas **antes** de `export const units = pgTable(...)`, senão o módulo rebenta em runtime (`Cannot access '...' before initialization`, erro de temporal dead zone do `const`).

Corta o bloco:
```ts
export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);

export const englishLevelEnum = pgEnum("english_level", ["BEGINNER", "BASIC", "INTERMEDIATE", "ADVANCED"]);

export const learningGoalEnum = pgEnum("learning_goal", ["TRAVEL", "WORK", "STUDY_ABROAD", "SPEAK_CONFIDENTLY", "OTHER"]);
```
(hoje logo antes de `export const challenges = pgTable(...)`) e cola-o logo depois de `coursesRelations` e antes de `export const units = pgTable(...)`. Não mudes nomes nem valores, só a posição. A ordem final dos blocos no ficheiro passa a ser: `courses`, `coursesRelations`, `challengesEnum`/`genderEnum`/`englishLevelEnum`/`learningGoalEnum`, `units`, `unitsRelations`, `lessons`, `lessonsRelations`, `challenges`, ... (resto sem alterações).

- [ ] **Step 2: Adicionar as duas colunas novas em `units`**

No objeto `units = pgTable("units", { ... })`, depois do campo `order`, adiciona:
```ts
  targetLevel: englishLevelEnum("target_level"),
  targetGoal: learningGoalEnum("target_goal"),
```

- [ ] **Step 3: Aplicar à base de dados**

Run: `npm run db:push`
Expected: termina sem erro (pode mostrar avisos sobre recriar foreign keys — isso já acontecia antes desta mudança e não está relacionado; só confirma que não há nenhum erro novo).

- [ ] **Step 4: Verificar as colunas e os dados existentes**

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "\d units"`
Expected: lista `target_level` e `target_goal`, ambas sem `not null`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT id, title, target_level, target_goal FROM units;"`
Expected: todas as linhas existentes mostram `target_level`/`target_goal` a `NULL` (nenhum dado antigo foi alterado).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add db/schema.ts
git commit -m "feat: add targetLevel/targetGoal columns to units"
```

---

### Task 2: Filtrar unidades por nível e objetivo do perfil

**Files:**
- Modify: `db/queries.ts`

**Interfaces:**
- Consumes: `units.targetLevel`/`units.targetGoal` (Task 1), `userProgress.englishLevel`/`userProgress.learningGoal` (já existentes).
- Produces: `buildUnitsWhereClause(courseId, level, goal)` — usada só dentro de `db/queries.ts` por `getUnits` e `getCourseProgress`.

- [ ] **Step 1: Importar os combinadores que faltam**

Troca:
```ts
import { eq } from "drizzle-orm";
```
por:
```ts
import { and, eq, isNull, or } from "drizzle-orm";
```

- [ ] **Step 2: Criar o auxiliar de filtro**

Logo a seguir ao `export const getUserProgress = cache(...)`, antes de `export const getUnits = cache(...)`, adiciona:

```ts
type EnglishLevel = NonNullable<typeof userProgress.$inferSelect["englishLevel"]>;
type LearningGoal = NonNullable<typeof userProgress.$inferSelect["learningGoal"]>;

const buildUnitsWhereClause = (
  courseId: number,
  level: EnglishLevel,
  goal: LearningGoal | null,
) => {
  const levelMatch = or(isNull(units.targetLevel), eq(units.targetLevel, level));
  const goalMatch = goal
    ? or(isNull(units.targetGoal), eq(units.targetGoal, goal))
    : isNull(units.targetGoal);

  return and(eq(units.courseId, courseId), levelMatch, goalMatch);
};
```

Nota: dentro de `getUnits`/`getCourseProgress` já existe uma variável local chamada `userProgress` (o resultado de `getUserProgress()`), que sombreia a tabela `userProgress` importada — isso é normal e já acontecia antes; o tipo `typeof userProgress.$inferSelect` acima refere-se à tabela importada (é avaliado fora dessas funções), não à variável local.

- [ ] **Step 3: Usar o auxiliar em `getUnits`**

Dentro de `getUnits`, troca:
```ts
    where: eq(units.courseId, userProgress.activeCourseId),
```
por:
```ts
    where: buildUnitsWhereClause(
      userProgress.activeCourseId,
      userProgress.englishLevel ?? "BASIC",
      userProgress.learningGoal,
    ),
```

- [ ] **Step 4: Usar o auxiliar em `getCourseProgress`**

Dentro de `getCourseProgress`, na query `unitsInActiveCourse`, troca:
```ts
    where: eq(units.courseId, userProgress.activeCourseId),
```
pela mesma chamada do Step 3:
```ts
    where: buildUnitsWhereClause(
      userProgress.activeCourseId,
      userProgress.englishLevel ?? "BASIC",
      userProgress.learningGoal,
    ),
```

Não tocar em `getCourseById` — fica sem filtro de propósito (só valida que o curso tem unidades antes de o atribuir em `upsertUserProgress`, independentemente da combinação nível/objetivo de quem o escolhe).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add db/queries.ts
git commit -m "feat: filter course units by profile english level and learning goal"
```

(A verificação end-to-end deste filtro — com dados reais — só é possível depois da Task 3 inserir o curso de Inglês; fica coberta nos passos de verificação dessa tarefa.)

---

### Task 3: Curso de Inglês — ícone e conteúdo (nível Básico: genérico, Trabalho, Viagem)

**Files:**
- Create: `scripts/seed-english.ts`
- Modify: `package.json` (novo script `db:seed-english`)
- (`public/gb.svg` já existe no repositório — ícone de bandeira britânica no mesmo estilo plano dos outros ícones em `public/`; não precisa de ser criado nesta tarefa.)

**Interfaces:**
- Consumes: `schema.courses`, `schema.units` (com `targetLevel`/`targetGoal` da Task 1), `schema.lessons`, `schema.challenges`, `schema.challengeOptions`.

- [ ] **Step 1: Criar `scripts/seed-english.ts`**

Cria o ficheiro com exatamente este conteúdo (dados completos das 3 unidades, 12 lições, 71 desafios — o texto exato de cada enunciado e opção já está decidido, não é para reescrever):

```ts
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../db/schema";

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
```

- [ ] **Step 2: Registar o script em `package.json`**

Na secção `"scripts"`, a seguir a `"db:seed"`, adiciona:
```json
    "db:seed-english": "tsx ./scripts/seed-english.ts",
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Correr o script**

Run: `npm run db:seed-english`
Expected: imprime `Inserting English course...` e depois `English course inserted.`, sem erro.

- [ ] **Step 5: Verificar os dados inseridos**

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT title, image_src FROM courses ORDER BY id;"`
Expected: mostra `Spanish, Italian, French, Croatian` (inalterados) e, no fim, `English | /gb.svg`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT u.title, u.target_level, u.target_goal, u.\"order\", count(l.id) AS lessons FROM units u LEFT JOIN lessons l ON l.unit_id = u.id WHERE u.course_id = (SELECT id FROM courses WHERE title = 'English') GROUP BY u.id ORDER BY u.\"order\";"`
Expected: 3 linhas — `Noções básicas | BASIC | (null) | 1 | 4`, `Inglês no trabalho | BASIC | WORK | 2 | 4`, `Inglês em viagem | BASIC | TRAVEL | 3 | 4`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT count(*) FROM challenges c JOIN lessons l ON c.lesson_id = l.id JOIN units u ON l.unit_id = u.id JOIN courses co ON u.course_id = co.id WHERE co.title = 'English';"`
Expected: `71`.

- [ ] **Step 6: Verificação manual ponta-a-ponta no browser**

Com o servidor de dev a correr:
- Inicia sessão com a conta real (`Leonardo`, perfil Básico/Trabalho) e vai a `/courses`. O cartão "English" (bandeira britânica) aparece ao lado dos outros.
- Seleciona "English". Em `/learn`, aparecem só duas unidades: "Noções básicas" e "Inglês no trabalho" (NÃO "Inglês em viagem").
- Abre a primeira lição ("Cumprimentos") e confirma que os desafios aparecem e respondem (sem crash).
- Se possível, confirma com a conta de teste `Giovana` (Avançado/Estudar no estrangeiro) que `/learn`, depois de escolher "English", não dá erro — mostra zero unidades (não há conteúdo para essa combinação ainda), o que é o comportamento esperado por agora.
- Confirma que um curso de exemplo antigo (ex. Spanish) continua a mostrar a sua única unidade de sempre, sem mudanças.

- [ ] **Step 7: Commit**

```bash
git add scripts/seed-english.ts package.json
git commit -m "feat: seed English course with Basic-level general, work, and travel content"
```
