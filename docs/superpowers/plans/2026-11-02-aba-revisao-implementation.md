# Aba Revisão — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nova aba "Revisão" na barra lateral que leva a uma sessão de prática (até 10 desafios aleatórios, excluindo DIALOGUE) construída a partir de tudo o que o utilizador já terminou em qualquer unidade/nível, não só o nível/objetivo atual.

**Architecture:** Uma função pura soma os pontos disponíveis de um conjunto de desafios a partir do seu estatuto de bónus (reaproveitada por `/lesson` e pela nova `/review`); uma nova query em `db/queries.ts` constrói a amostra aleatória; uma nova rota de topo `/review` (fora do grupo `(main)`, como `/lesson`/`/level-up`) reaproveita o componente `Quiz` já existente, que trata a sessão como modo prática automaticamente porque todos os itens já estão `completed`; um novo item na barra lateral leva à rota.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Postgres, TypeScript, `node:test` para a lógica pura.

**Spec:** `docs/superpowers/specs/2026-11-02-aba-revisao-design.md`

## Global Constraints

- Direto em `main`, sem worktree — padrão já acordado neste projeto.
- Sem linha `Co-Authored-By` em nenhum commit — regra permanente deste repositório.
- Sem infraestrutura de testes de integração com a base de dados (nenhum ficheiro `actions/*.ts` ou `db/*.ts` tem testes automatizados em todo o repositório) — a lógica pura (Tarefa 1) tem testes completos via `node:test`; o resto é verificado por leitura real da base de dados (scripts só-de-leitura) e por `npx tsc --noEmit`.
- `/review` é uma rota de topo própria, fora do grupo `(main)`, com o seu próprio `layout.tsx` mínimo — mesmo padrão já usado em `app/lesson/` e `app/level-up/`.
- A amostra de revisão é: até 10 desafios, aleatórios, de tipo diferente de `DIALOGUE`, entre **todos** os `challengeProgress.completed = true` do utilizador — nunca filtrada por `englishLevel`/`learningGoal` atual.
- Uma sessão de revisão não introduz nenhuma flag nova para o modo prática — já é automática porque todos os itens da amostra têm `completed = true` (`initialPercentage === 100`).

## Review Focus

- Um utilizador sem nenhum desafio terminado (ou só com desafios `DIALOGUE` terminados) vê um estado vazio simpático em `/review`, nunca uma sessão sem nada ou um erro. (Tarefa 2, Tarefa 4)
- Um utilizador com menos de 10 desafios terminados (não-`DIALOGUE`) tem de conseguir rever os que existem, sem exigir exatamente 10. (Tarefa 2)
- A pontuação mostrada no ecrã final de uma lição normal, depois do refactor da Tarefa 3, tem de ser exatamente igual à de antes — este projeto não pode alterar o que já funcionava. (Tarefa 3)
- O botão "Continuar" numa sessão de revisão tem de continuar a contar como conclusão para a sequência diária e para uma eventual subida de nível, exatamente como qualquer prática — sem código novo para isso, mas vale a pena confirmar que nada na Tarefa 4 acidentalmente impede isso. (Tarefa 4)
- O botão "Practice again" tem de desaparecer apenas em sessões de revisão — lições normais e ecrãs de subida de nível continuam a comportar-se exactamente como antes. (Tarefa 3)

---

## Ficheiros

- Criar: `lib/points.ts` — soma os pontos disponíveis de um conjunto de desafios.
- Criar: `lib/points.test.ts`
- Modificar: `db/queries.ts` — nova query `getReviewQueue`.
- Modificar: `app/lesson/quiz.tsx` — troca `initialIsBonus` por `initialPointsAvailable`; nova prop `isReviewSession`.
- Modificar: `app/lesson/footer.tsx` — nova prop `hidePracticeAgain`.
- Modificar: `app/lesson/page.tsx` e `app/lesson/[lessonId]/page.tsx` — ambos usam `computePointsAvailable` em vez de passar `initialIsBonus` (são os dois únicos sítios, fora da Tarefa 4, que invocam `<Quiz>`).
- Criar: `app/review/layout.tsx`, `app/review/page.tsx`.
- Modificar: `components/sidebar.tsx` — novo item "Revisão".
- Modificar: `components/sidebar-item.tsx` — nova cor (`Tint`) para o item.

---

### Task 1: Pontos disponíveis de um conjunto de desafios

**Files:**
- Create: `lib/points.ts`
- Test: `lib/points.test.ts`

**Interfaces:**
- Produces: `export const computePointsAvailable = (challenges: { isBonus: boolean }[]): number => ...`. Consumido pela Tarefa 2 (`db/queries.ts`) e pela Tarefa 3 (`app/lesson/page.tsx`).

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { computePointsAvailable } from "./points";

test("computePointsAvailable: lista vazia não vale pontos", () => {
  assert.equal(computePointsAvailable([]), 0);
});

test("computePointsAvailable: desafios normais valem 10 cada", () => {
  assert.equal(computePointsAvailable([{ isBonus: false }, { isBonus: false }]), 20);
});

test("computePointsAvailable: desafios de lição bónus valem 20 cada", () => {
  assert.equal(computePointsAvailable([{ isBonus: true }, { isBonus: true }]), 40);
});

test("computePointsAvailable: mistura de desafios normais e de bónus na mesma amostra", () => {
  assert.equal(
    computePointsAvailable([{ isBonus: false }, { isBonus: true }, { isBonus: false }]),
    40,
  );
});
```

- [ ] **Step 2: Confirmar que falham**

Run: `npx tsx --test lib/points.test.ts`
Expected: FAIL — `lib/points` não existe.

- [ ] **Step 3: Implementar `lib/points.ts`**

Soma `10` por cada item com `isBonus: false` e `20` por cada item com `isBonus: true`.

- [ ] **Step 4: Confirmar que passam**

Run: `npx tsx --test lib/points.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add lib/points.ts lib/points.test.ts
git commit -m "feat: add pure points-available calculation"
```

---

### Task 2: Query da amostra de revisão

**Files:**
- Modify: `db/queries.ts`

**Interfaces:**
- Consumes: `computePointsAvailable` (Tarefa 1).
- Produces: `export const getReviewQueue = cache(async () => ...)`, devolvendo `{ challenges: (typeof challenges.$inferSelect & { completed: true; challengeOptions: typeof challengeOptions.$inferSelect[] })[]; pointsAvailable: number }`. Consumido pela Tarefa 4 (`app/review/page.tsx`).

- [ ] **Step 1: Importar o necessário**

Em `db/queries.ts`, acrescentar `inArray`, `ne`, `sql` ao import já existente de `drizzle-orm`; acrescentar `challenges` ao import já existente de `@/db/schema`; importar `computePointsAvailable` de `@/lib/points`.

- [ ] **Step 2: Implementar `getReviewQueue`**

Sem utilizador autenticado, devolve `{ challenges: [], pointsAvailable: 0 }`. Caso contrário: procura todos os `challengeProgress.challengeId` desse utilizador onde `completed = true` (com `eq(challengeProgress.userId, userId)`); se não houver nenhum, devolve `{ challenges: [], pointsAvailable: 0 }`. Caso haja, usa `db.query.challenges.findMany` com `where: and(inArray(challenges.id, <os ids encontrados>), ne(challenges.type, "DIALOGUE"))`, `orderBy: sql\`random()\``, `limit: 10`, `with: { challengeOptions: true, lesson: { columns: { isBonus: true } } }`. Mapeia o resultado para a forma exigida pela Interfaces (tira o campo `lesson` de cada item, acrescenta `completed: true`), e calcula `pointsAvailable` com `computePointsAvailable` a partir do `lesson.isBonus` de cada linha devolvida (antes de o tirar).

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual só-de-leitura**

Correr uma query equivalente via `psql`, para o utilizador real `user_3LN3ZpiSycpP83mFMmYe9D5cggd` (Leonardo), confirmando que existem desafios não-`DIALOGUE` já terminados por ele (vai dar pelo menos os 12 do nível BASIC/WORK já antigos, mais o que já tiver feito em INTERMEDIATE) — confirma que a amostra não ficaria vazia para uma conta real com progresso.

Run (via `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "..."`): contagem de `challenge_progress` com `completed = true` desse utilizador, junta com `challenges.type <> 'DIALOGUE'`.
Expected: contagem maior que zero.

Correr a mesma contagem para o segundo utilizador real (`user_3LMfi1qqtmoFbfTDmRpWN5DDxcG`) para documentar se o caminho de estado vazio (zero resultados) é ou não real hoje — qualquer um dos dois resultados é aceitável, só serve para confirmar qual caminho a Tarefa 4 vai exercitar de facto quando visitado por essa conta.

- [ ] **Step 5: Commit**

```bash
git add db/queries.ts
git commit -m "feat: add getReviewQueue cross-unit random sampling query"
```

---

### Task 3: `initialPointsAvailable` e `isReviewSession` em `Quiz`/`Footer`

**Files:**
- Modify: `app/lesson/quiz.tsx`
- Modify: `app/lesson/footer.tsx`
- Modify: `app/lesson/page.tsx`
- Modify: `app/lesson/[lessonId]/page.tsx`

**Interfaces:**
- Consumes: `computePointsAvailable` (Tarefa 1).
- Produces: `Quiz`'s props passam a incluir `initialPointsAvailable: number` (substitui `initialIsBonus: boolean`) e `isReviewSession?: boolean`; `Footer`'s props passam a incluir `hidePracticeAgain?: boolean`. Consumido pela Tarefa 4 (`app/review/page.tsx` invoca `<Quiz>` com estas props).

- [ ] **Step 1: Trocar `initialIsBonus` por `initialPointsAvailable` em `Quiz`**

Em `app/lesson/quiz.tsx`: no type `Props`, substituir `initialIsBonus: boolean;` por `initialPointsAvailable: number;` e acrescentar `isReviewSession?: boolean;`; atualizar a desestruturação dos props do componente da mesma forma. No ecrã final (bloco `if (!challenge)`), trocar `value={totalChallengeCount * (initialIsBonus ? 20 : 10)}` por `value={initialPointsAvailable}`.

- [ ] **Step 2: Esconder "Practice again" em sessões de revisão**

Em `app/lesson/footer.tsx`: acrescentar `hidePracticeAgain?: boolean;` ao `Props` e à desestruturação; o bloco `{status === "completed" && (...)}` do botão "Practice again" passa a `{status === "completed" && !hidePracticeAgain && (...)}`. Em `app/lesson/quiz.tsx`, no `<Footer>` do ecrã final, acrescentar `hidePracticeAgain={isReviewSession}`.

- [ ] **Step 3: Atualizar `app/lesson/page.tsx` e `app/lesson/[lessonId]/page.tsx`**

Em cada um dos dois ficheiros: importar `computePointsAvailable` de `@/lib/points`; trocar `initialIsBonus={lesson.isBonus}` por `initialPointsAvailable={computePointsAvailable(lesson.challenges.map(() => ({ isBonus: lesson.isBonus })))}`.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Confirmar que a pontuação exibida não mudou para lições normais**

Para qualquer lição real (todos os seus desafios partilham o mesmo `lesson.isBonus`), `computePointsAvailable(lesson.challenges.map(() => ({ isBonus: lesson.isBonus })))` é algebricamente igual a `lesson.challenges.length * (lesson.isBonus ? 20 : 10)` — a fórmula antiga. Confirmar por leitura do código que a Tarefa 1 implementa exatamente essa soma (10/20 por item, nunca outra coisa), e que `/lesson` continua a compilar e a responder (confirmar no log do servidor que não há erro depois da mudança).

- [ ] **Step 6: Commit**

```bash
git add app/lesson/quiz.tsx app/lesson/footer.tsx app/lesson/page.tsx "app/lesson/[lessonId]/page.tsx"
git commit -m "feat: replace single isBonus flag with summed points-available"
```

---

### Task 4: Rota `/review` e item na barra lateral

**Files:**
- Create: `app/review/layout.tsx`
- Create: `app/review/page.tsx`
- Modify: `components/sidebar.tsx`
- Modify: `components/sidebar-item.tsx`

**Interfaces:**
- Consumes: `getReviewQueue` (Tarefa 2); `Quiz`'s `initialPointsAvailable`/`isReviewSession` (Tarefa 3); `getUserProgress`, `getUserSubscription` (já exportados em `db/queries.ts`).

- [ ] **Step 1: `app/review/layout.tsx`**

Mesmo conteúdo de `app/lesson/layout.tsx` (wrapper flex de altura total, sem barra lateral).

- [ ] **Step 2: `app/review/page.tsx`**

Componente de servidor. Lê `getReviewQueue()`, `getUserProgress()`, `getUserSubscription()`. Se não houver `userProgress`, `redirect("/learn")` (mesmo padrão de guarda das outras páginas). Se `reviewQueue.challenges.length === 0`, mostra um estado vazio simpático (título + texto a explicar que ainda não há nada para rever + um `Link` para `/learn`) em vez do `<Quiz>`. Caso contrário, renderiza `<Quiz>` com: `initialLessonId={reviewQueue.challenges[0].lessonId}`, `initialLessonChallenges={reviewQueue.challenges}`, `initialHearts={userProgress.hearts}`, `initialPercentage={100}`, `initialGender={userProgress.gender}`, `initialPointsAvailable={reviewQueue.pointsAvailable}`, `isReviewSession`, `userSubscription={userSubscription}`.

- [ ] **Step 3: Novo item na barra lateral**

Em `components/sidebar-item.tsx`: acrescentar `"purple"` ao union `Tint` e uma entrada em `tintStyles` (mesma forma das 4 já existentes, ex. `purple: { tile: "bg-purple-100", active: "border-purple-300 bg-purple-50" }`). Em `components/sidebar.tsx`: acrescentar `<SidebarItem label="Revisão" href="/review" icon="🔄" tint="purple" />` à lista já existente de `SidebarItem`.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Visitar `/review` sem sessão autenticada; confirmar no log do servidor que é o próprio middleware do Clerk a redirecionar (307), mesmo padrão já confirmado em `/level-up`, sem erro no código novo.

Com os dados reais já lidos na Tarefa 2 Step 4: se o segundo utilizador real (`user_3LMfi1qqtmoFbfTDmRpWN5DDxcG`) tiver zero desafios não-`DIALOGUE` terminados, isso confirma que o caminho de estado vazio já é exercitável por uma conta real hoje; se não tiver, documentar que o estado vazio só foi confirmado por leitura do código (sem conta real a testá-lo neste momento).

- [ ] **Step 6: Commit**

```bash
git add app/review/layout.tsx app/review/page.tsx components/sidebar.tsx components/sidebar-item.tsx
git commit -m "feat: add review tab with cross-unit practice session"
```
