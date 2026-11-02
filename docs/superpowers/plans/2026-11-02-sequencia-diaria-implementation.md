# Sequência Diária (Streak) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contar e mostrar quantos dias consecutivos o utilizador completou pelo menos uma lição, com um ícone de chama 🔥 no widget `UserProgress`.

**Architecture:** Duas novas colunas em `userProgress` (`currentStreak`, `lastActivityDate`, esta última como texto "YYYY-MM-DD" em fuso `Europe/Lisbon`, não `date` do Postgres, para evitar conversões de fuso horário pela ligação). Toda a aritmética de datas vive em funções puras isoladas (`lib/streak.ts`), testadas com `node:assert/strict` executado via `tsx` (este projeto não tem framework de testes — ver Global Constraints). A escrita acontece dentro de `upsertChallengeProgress`, que já corre sempre que uma resposta certa é processada; o cliente (`quiz.tsx`) informa-a explicitamente de que esta é a última pergunta da fila, exatamente como já confia no cliente para a própria correção da resposta. A leitura recalcula o valor a mostrar a partir de `lastActivityDate`, sem depender de um job periódico.

**Tech Stack:** Next.js 14 (App Router), Drizzle ORM + Postgres, Server Actions, Clerk auth.

**Spec:** `docs/superpowers/specs/2026-11-02-sequencia-diaria-design.md`

## Global Constraints

- Sem "congelamento" de sequência nem item de loja associado — a sequência quebra-se sempre que passa um dia de calendário completo sem nenhuma lição concluída.
- Qualquer lição conta, incluindo lições-bónus de diálogo, "Revisão da Unidade", e lições repetidas em modo de prática.
- O "dia de calendário" usa sempre o fuso `Europe/Lisbon`, independentemente do fuso onde o servidor Node corre.
- O valor mostrado no widget é calculado no momento da leitura a partir de `lastActivityDate` (mostra 0 se a última atividade foi há 2+ dias, mesmo sem nova lição concluída desde então); a escrita só acontece ao concluir uma lição.
- Sem backfill: todos os utilizadores (incluindo os já ativos) arrancam com `lastActivityDate` nulo.
- Sem notificação de marco/quebra nesta versão — só o número muda no widget.
- Este projeto não tem framework de testes (`package.json` não tem jest/vitest nem script `test`). Para lógica pura (Task 1), a verificação usa `node:assert/strict` num ficheiro `.test.ts` executado diretamente com `npx tsx` — um script que lança excepção e sai com código de erro se alguma asserção falhar, não uma suite formal. Para código que toca a base de dados ou React (Tasks 2-4), a verificação é `npx tsc --noEmit` mais verificação manual (consulta à base de dados, traço manual do código), tal como em todas as funcionalidades anteriores deste projeto.

## Review Focus

- Mudança de hora de verão/inverno em Portugal: `getTodayDateString` tem de continuar a devolver o dia certo em `Europe/Lisbon` dos dois lados da transição, não o dia em UTC.
- Utilizador sem nenhuma atividade anterior (`lastActivityDate` nulo — todos os utilizadores no lançamento, e qualquer conta nova): a sequência deve arrancar em 1 ao completar a primeira lição, e mostrar-se como 0 antes disso, nunca `NaN` ou negativo.
- Duas ou mais lições concluídas no mesmo dia: a sequência não deve subir mais do que 1 nesse dia.
- Último dia de atividade foi exactamente "ontem" (gap de 1 dia): ao *mostrar* o valor, a sequência ainda não está quebrada (mostra-se o valor atual); só quebra a partir de um gap de 2 dias.
- Lição repetida em modo de prática (curso já 100% completo): tem de atualizar a sequência tal como uma lição normal, não ser ignorada por já estar marcada como completa na base de dados.

---

### Task 1: Funções puras de data e sequência

**Files:**
- Create: `lib/streak.ts`
- Create: `lib/streak.test.ts`

**Interfaces:**
- Produces: `getTodayDateString(now?: Date): string`, `daysSince(from: string, to: string): number`, `getNextStreak(currentStreak: number, lastActivityDate: string | null, today: string): number`, `getDisplayStreak(currentStreak: number, lastActivityDate: string | null, today: string): number`. Todas as datas são strings `"YYYY-MM-DD"`. Tasks 2-4 consomem estas quatro funções, sem recalcular nada de datas noutro sítio.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// lib/streak.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { getTodayDateString, daysSince, getNextStreak, getDisplayStreak } from "./streak";

test("getTodayDateString converte para o dia em Europe/Lisbon, não em UTC (verão, UTC+1)", () => {
  assert.equal(getTodayDateString(new Date("2026-07-01T23:30:00Z")), "2026-07-02");
});

test("getTodayDateString no mesmo dia em UTC quando não há troca de dia", () => {
  assert.equal(getTodayDateString(new Date("2026-07-01T10:00:00Z")), "2026-07-01");
});

test("daysSince conta dias entre duas datas, incluindo fronteira de mês", () => {
  assert.equal(daysSince("2026-01-31", "2026-02-01"), 1);
  assert.equal(daysSince("2026-01-01", "2026-01-01"), 0);
  assert.equal(daysSince("2026-01-01", "2026-01-05"), 4);
});

test("getNextStreak: sem atividade anterior → 1", () => {
  assert.equal(getNextStreak(5, null, "2026-01-05"), 1);
});

test("getNextStreak: mesma atividade no mesmo dia → sem alteração", () => {
  assert.equal(getNextStreak(5, "2026-01-05", "2026-01-05"), 5);
});

test("getNextStreak: última atividade ontem → soma 1", () => {
  assert.equal(getNextStreak(5, "2026-01-04", "2026-01-05"), 6);
});

test("getNextStreak: gap de 2+ dias → reinicia para 1", () => {
  assert.equal(getNextStreak(5, "2026-01-01", "2026-01-05"), 1);
});

test("getDisplayStreak: sem atividade anterior → 0", () => {
  assert.equal(getDisplayStreak(5, null, "2026-01-05"), 0);
});

test("getDisplayStreak: atividade hoje → mostra o valor atual", () => {
  assert.equal(getDisplayStreak(5, "2026-01-05", "2026-01-05"), 5);
});

test("getDisplayStreak: atividade ontem (gap de 1) → ainda não quebrou", () => {
  assert.equal(getDisplayStreak(5, "2026-01-04", "2026-01-05"), 5);
});

test("getDisplayStreak: gap de 2+ dias → mostra 0", () => {
  assert.equal(getDisplayStreak(5, "2026-01-01", "2026-01-05"), 0);
});
```

- [ ] **Step 2: Correr e confirmar que falha**

Run: `npx tsx --test lib/streak.test.ts`
Expected: FALHA — `lib/streak.ts` ainda não existe (erro de módulo não encontrado).

- [ ] **Step 3: Implementar `lib/streak.ts`**

`getTodayDateString(now = new Date())`: formata `now` como `"YYYY-MM-DD"` no fuso `Europe/Lisbon` (usar `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" })`, que já devolve nesse formato).

`daysSince(from, to)`: converte cada string em `Date.UTC(ano, mês-1, dia)` (meio-dia ou meia-noite UTC, sem fuso horário envolvido — são só os três números, não a hora real) e devolve a diferença em dias inteiros, `(to - from) / 86 400 000`.

`getNextStreak`/`getDisplayStreak`: implementar exatamente a tabela de decisão nos testes acima (`lastActivityDate === null`, `daysSince === 0`, `daysSince === 1`, `daysSince >= 2`).

- [ ] **Step 4: Correr e confirmar que passa**

Run: `npx tsx --test lib/streak.test.ts`
Expected: PASS, todos os testes.

- [ ] **Step 5: Commit**

```bash
git add lib/streak.ts lib/streak.test.ts
git commit -m "feat: add pure date/streak math for daily streak feature"
```

---

### Task 2: Colunas novas em `userProgress`

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `userProgress.currentStreak: integer not null default 0`, `userProgress.lastActivityDate: text, nullable`. Task 3 lê e escreve estas duas colunas.

- [ ] **Step 1: Adicionar as colunas em `db/schema.ts`**

No objeto `userProgress` (depois de `adminOverridePro`), adicionar:

```ts
currentStreak: integer("current_streak").notNull().default(0),
lastActivityDate: text("last_activity_date"),
```

- [ ] **Step 2: Aplicar a migração**

Run: `yes | npx drizzle-kit push:pg` (interativo — se ficar à espera de confirmação por setas em vez de aceitar `yes`, usar `printf '\x1b[B\r' | npx drizzle-kit push:pg`, tal como em tarefas anteriores deste projeto).
Expected: confirma a criação das duas colunas, sem erros.

- [ ] **Step 3: Confirmar as colunas na base de dados**

Run: `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "\d user_progress"`
Expected: lista `current_streak` (integer, not null, default 0) e `last_activity_date` (text, nullable).

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts
git commit -m "feat: add currentStreak and lastActivityDate columns to userProgress"
```

---

### Task 3: Escrever a sequência em `upsertChallengeProgress`

**Files:**
- Modify: `actions/challenge-progress.ts`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `getNextStreak`, `getTodayDateString` de `lib/streak.ts` (Task 1); colunas `currentStreak`/`lastActivityDate` de `userProgress` (Task 2).
- Produces: `upsertChallengeProgress(challengeId: number, isLastChallenge: boolean)` — assinatura nova (acrescenta o segundo parâmetro); nenhuma outra task depende desta função.

- [ ] **Step 1: Mudar a assinatura e calcular a próxima sequência**

Em `actions/challenge-progress.ts`, mudar `export const upsertChallengeProgress = async (challengeId: number) => {` para `export const upsertChallengeProgress = async (challengeId: number, isLastChallenge: boolean) => {`, e importar `getNextStreak`, `getTodayDateString` de `@/lib/streak`.

Logo depois de calcular `pointsAwarded` (antes do `if (isPractice)`), calcular:

```ts
const today = getTodayDateString();
const nextStreak = isLastChallenge
  ? getNextStreak(currentUserProgress.currentStreak, currentUserProgress.lastActivityDate, today)
  : currentUserProgress.currentStreak;
```

- [ ] **Step 2: Incluir a sequência nas duas escrita de `userProgress` existentes**

No ramo `isPractice` (já existe `await db.update(userProgress).set({ hearts: ..., points: ... })`) e no ramo normal (já existe `await db.update(userProgress).set({ points: ... })`), acrescentar ao mesmo objeto `.set({...})`, só quando `isLastChallenge` for `true`:

```ts
...(isLastChallenge ? { currentStreak: nextStreak, lastActivityDate: today } : {}),
```

Não criar uma chamada `db.update` adicional — é o mesmo `.set({...})` que já existe, só com mais campos condicionais.

- [ ] **Step 3: Passar `isLastChallenge` no único sítio que chama `upsertChallengeProgress`**

Em `app/lesson/quiz.tsx`, dentro de `onContinue`, o bloco que chama `upsertChallengeProgress(challenge.id)` (resposta correta) passa a chamar `upsertChallengeProgress(challenge.id, queue.length === 1)` — `queue.length === 1` significa que este é o último item da fila, tanto em modo normal como em modo de prática (que usa a mesma fila e a mesma lógica de `onContinue`).

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Traçar manualmente os casos do Review Focus**

Sem framework de testes para server actions (toca `auth()`/`db`, que não correm fora de um pedido Next.js real — ver ruling já registado para `getUserSubscription`/`admin-queries.ts` noutras tasks deste projeto). Traçar à mão, usando as funções de `lib/streak.ts` já verificadas na Task 1:
- Primeira lição de sempre (`currentStreak=0`, `lastActivityDate=null`, `isLastChallenge=true`) → `getNextStreak(0, null, hoje)` = 1. Confirmado pelo teste da Task 1.
- Segunda lição no mesmo dia (`currentStreak=1`, `lastActivityDate=hoje`, `isLastChallenge=true`) → `getNextStreak(1, hoje, hoje)` = 1 (sem alteração). Confirmado pelo teste da Task 1.
- Lição em modo de prática: `queue.length === 1` é computado a partir da mesma fila (`queue`) usada em modo normal — `isPracticeSession` não altera como a fila é percorrida em `onContinue`, só o conteúdo inicial da fila (ver `quiz.tsx`, já lido durante o desenho). Confirma visualmente no ficheiro que não há nenhum `if (isPracticeSession)` a saltar o novo argumento.

- [ ] **Step 6: Commit**

```bash
git add actions/challenge-progress.ts app/lesson/quiz.tsx
git commit -m "feat: update daily streak when the last challenge of a lesson is answered correctly"
```

---

### Task 4: Mostrar a chama no widget `UserProgress`

**Files:**
- Modify: `components/user-progress.tsx`
- Modify: `app/(main)/learn/page.tsx`
- Modify: `app/(main)/quests/page.tsx`
- Modify: `app/(main)/leaderboard/page.tsx`
- Modify: `app/(main)/shop/page.tsx`

**Interfaces:**
- Consumes: `getDisplayStreak`, `getTodayDateString` de `lib/streak.ts` (Task 1); `userProgress.currentStreak`/`userProgress.lastActivityDate` já devolvidos por `getUserProgress()` sem alteração nenhuma a essa função (não tem `columns` a restringir, devolve a linha completa).
- Produces: nada consumido por outra task.

- [ ] **Step 1: Adicionar as duas novas props a `UserProgress` e calcular o valor a mostrar**

Em `components/user-progress.tsx`, acrescentar ao tipo `Props`: `currentStreak: number; lastActivityDate: string | null;`. Importar `getDisplayStreak`, `getTodayDateString` de `@/lib/streak`. Dentro do componente, antes do `return`:

```ts
const streak = getDisplayStreak(currentStreak, lastActivityDate, getTodayDateString());
```

- [ ] **Step 2: Desenhar o ícone de chama**

Acrescentar, entre o botão do curso e o botão dos pontos, um `<span>` com o ícone `Flame` de `lucide-react` (já é uma dependência do projeto — `lucide-react` já é usado em `lesson-button.tsx` e `dialogue-header.tsx`) a `text-orange-500`, mostrando `{streak}` ao lado, sem `Link` (não há nenhum ecrã de destino dedicado à sequência nesta versão, ao contrário de pontos/corações que levam à loja).

- [ ] **Step 3: Passar as duas novas props nos 4 ecrãs**

Em cada um dos 4 ficheiros (`app/(main)/learn/page.tsx`, `quests/page.tsx`, `leaderboard/page.tsx`, `shop/page.tsx`), no `<UserProgress .../>` já existente, acrescentar:

```tsx
currentStreak={userProgress.currentStreak}
lastActivityDate={userProgress.lastActivityDate}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Consultar a base de dados para confirmar `current_streak`/`last_activity_date` da conta de teste depois de completar uma lição real no browser (deferido ao utilizador, tal como as restantes verificações manuais deste projeto nesta sessão). Confirmar visualmente que o ícone aparece nos 4 ecrãs.

- [ ] **Step 6: Commit**

```bash
git add components/user-progress.tsx "app/(main)/learn/page.tsx" "app/(main)/quests/page.tsx" "app/(main)/leaderboard/page.tsx" "app/(main)/shop/page.tsx"
git commit -m "feat: show daily streak with flame icon in UserProgress widget"
```
