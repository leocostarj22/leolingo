# Progressão de Nível (BASIC → INTERMEDIATE) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o `englishLevel` do utilizador subir automaticamente de `BASIC` para `INTERMEDIATE` ao terminar todo o conteúdo do seu nível/objetivo atual, mostrar uma celebração visível nesse momento, e criar o conteúdo INTERMEDIATE real (unidade genérica + unidade `WORK`) que torna isso possível.

**Architecture:** Uma função pura decide "qual é o próximo nível" e "este conjunto de lições está terminado"; `upsertChallengeProgress` (já o único sítio que atualiza `userProgress` ao fim de uma lição) chama essas funções reaproveitando `getUnits()` — a mesma query já usada por `/learn` — e devolve um sinal extra quando promove o utilizador; `quiz.tsx` lê esse sinal e, no ecrã de fim de lição, encaminha para uma nova rota `/level-up` em vez de `/learn`; um script de seed cria as duas novas `units` INTERMEDIATE com a mesma forma das `units` BASIC já existentes.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Postgres, TypeScript, `node:test` para a lógica pura (mesmo padrão de `lib/streak.ts`/`lib/match.ts`).

**Spec:** `docs/superpowers/specs/2026-11-02-progressao-de-nivel-design.md`

## Global Constraints

- Direto em `main`, sem worktree — padrão já acordado neste projeto para todas as funcionalidades.
- Sem linha `Co-Authored-By` em nenhum commit — regra permanente deste repositório.
- **Âmbito desta fase:** só a unidade genérica + a unidade `WORK` ao nível INTERMEDIATE. A unidade `TRAVEL` fica para um plano de seguimento curto e separado — não faz parte deste plano.
- **Progressão só `BASIC → INTERMEDIATE`** nesta fase — `ADVANCED` não existe ainda e não deve ser alcançável.
- **O trigger da subida de nível corre nos dois ramos de `upsertChallengeProgress`** (conclusão nova e modo prática), exatamente como o streak já faz hoje — decisão confirmada por Leonardo.
- **A celebração é sempre visível**, nunca silenciosa, num ecrã dedicado distinto do ecrã normal de fim de lição.
- Sem nova página de perfil/definições para o utilizador escolher nível manualmente — fora de âmbito; o painel de admin já permite forçar o campo para testes.
- Este projeto não tem infraestrutura de testes de integração com a base de dados (nenhum ficheiro `actions/*.ts` ou `db/*.ts` tem testes automatizados em todo o repositório) — a lógica pura de decisão (Tarefa 1) tem testes completos via `node:test`; o código que liga essa lógica à base de dados (Tarefa 2) é verificado por leitura real (script só-de-leitura) e por `npx tsc --noEmit`, consistente com todo o histórico deste projeto.

## Review Focus

- Um utilizador com `learningGoal` nulo que termina só a unidade genérica do seu nível tem de ser promovido tal como um utilizador com objetivo definido — a lógica de "nível terminado" não pode assumir implicitamente que existe sempre uma unidade de objetivo. (Tarefa 1)
- Um pedido que falha por falta de corações (`{ error: "hearts" }`) nunca pode promover o utilizador nessa chamada — a verificação de nível só pode correr depois de o desafio ter sido mesmo registado como concluído na base de dados. (Tarefa 2)
- Um utilizador com pelo menos uma lição ainda não terminada nas unidades aplicáveis ao seu nível nunca é promovido. (Tarefa 1)
- Visitar `/level-up` diretamente, sem ter acabado de subir de nível, não pode rebentar a página — tem de mostrar o nível atual do utilizador de forma coerente. (Tarefa 3)
- Um utilizador já em `INTERMEDIATE` que termina tudo não pode ser promovido para `ADVANCED` (que ainda não existe) nem causar erro — `getNextLevel` devolve `null` e nenhuma promoção é tentada. (Tarefa 1)

---

## Ficheiros

- Criar: `lib/level-up.ts` — lógica pura de decisão.
- Criar: `lib/level-up.test.ts`
- Modificar: `actions/challenge-progress.ts` — liga a lógica pura à base de dados, dentro de `upsertChallengeProgress`.
- Criar: `app/level-up/page.tsx` — ecrã de celebração.
- Modificar: `app/lesson/quiz.tsx` — captura o sinal de subida de nível e encaminha para `/level-up`.
- Criar: `scripts/seed-intermediate.ts` — conteúdo INTERMEDIATE genérico + WORK.

---

### Task 1: Lógica pura de progressão de nível

**Files:**
- Create: `lib/level-up.ts`
- Test: `lib/level-up.test.ts`

**Interfaces:**
- Produces: `export type EnglishLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";`, `export const getNextLevel = (level: EnglishLevel): EnglishLevel | null => ...`, `export const isLevelComplete = (lessons: { completed: boolean }[]): boolean => ...`. Consumidos pela Tarefa 2.

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getNextLevel, isLevelComplete } from "./level-up";

test("getNextLevel: BASIC avança para INTERMEDIATE", () => {
  assert.equal(getNextLevel("BASIC"), "INTERMEDIATE");
});

test("getNextLevel: INTERMEDIATE não tem próximo nível nesta fase", () => {
  assert.equal(getNextLevel("INTERMEDIATE"), null);
});

test("getNextLevel: BEGINNER não tem próximo nível nesta fase", () => {
  assert.equal(getNextLevel("BEGINNER"), null);
});

test("getNextLevel: ADVANCED não tem próximo nível", () => {
  assert.equal(getNextLevel("ADVANCED"), null);
});

test("isLevelComplete: conjunto vazio nunca está terminado", () => {
  assert.equal(isLevelComplete([]), false);
});

test("isLevelComplete: todas as lições terminadas", () => {
  assert.equal(isLevelComplete([{ completed: true }, { completed: true }]), true);
});

test("isLevelComplete: pelo menos uma lição por terminar", () => {
  assert.equal(isLevelComplete([{ completed: true }, { completed: false }]), false);
});

test("isLevelComplete: uma única lição genérica terminada (utilizador sem objetivo)", () => {
  assert.equal(isLevelComplete([{ completed: true }]), true);
});
```

- [ ] **Step 2: Confirmar que falham**

Run: `npx tsx --test lib/level-up.test.ts`
Expected: FAIL — `lib/level-up` não existe.

- [ ] **Step 3: Implementar `lib/level-up.ts`**

`getNextLevel`: só `"BASIC"` tem sucessor (`"INTERMEDIATE"`) nesta fase; qualquer outro valor devolve `null` (inclui `"INTERMEDIATE"` e `"ADVANCED"` — a progressão além de INTERMEDIATE fica para uma fase futura, por desenho). `isLevelComplete`: `true` apenas se o array não for vazio e todas as entradas tiverem `completed === true`.

- [ ] **Step 4: Confirmar que passam**

Run: `npx tsx --test lib/level-up.test.ts`
Expected: PASS — 8/8.

- [ ] **Step 5: Commit**

```bash
git add lib/level-up.ts lib/level-up.test.ts
git commit -m "feat: add pure level-up decision logic"
```

---

### Task 2: Ligar a progressão de nível a `upsertChallengeProgress`

**Files:**
- Modify: `actions/challenge-progress.ts`

**Interfaces:**
- Consumes: `getNextLevel`, `isLevelComplete`, `EnglishLevel` (Tarefa 1); `getUnits` (já exportado em `db/queries.ts`, devolve as `units` filtradas pelo `englishLevel`/`learningGoal` atuais do utilizador autenticado, cada uma com `lessons: { completed: boolean, ... }[]`).
- Produces: `upsertChallengeProgress` passa a poder devolver, além do já existente `{ error: "hearts" } | undefined`, também `{ leveledUp: true; newLevel: EnglishLevel }`. Consumido pela Tarefa 3.

- [ ] **Step 1: Importar as novas dependências**

Em `actions/challenge-progress.ts`, importar `getNextLevel` e `isLevelComplete` de `@/lib/level-up`, e adicionar `getUnits` ao import já existente de `@/db/queries`.

- [ ] **Step 2: Calcular o resultado da subida de nível**

Depois de o `challengeProgress` do desafio atual ter sido gravado (depois do `db.update(challengeProgress)` no ramo de prática, depois do `db.insert(challengeProgress)` no ramo novo) e só quando `isLastChallenge` é verdadeiro, calcular:

```ts
let levelUpResult: { leveledUp: true; newLevel: EnglishLevel } | undefined;
if (isLastChallenge) {
  const nextLevel = getNextLevel(currentUserProgress.englishLevel ?? "BASIC");
  if (nextLevel) {
    const unitsForCurrentLevel = await getUnits();
    const lessonsForCurrentLevel = unitsForCurrentLevel.flatMap((unit) => unit.lessons);
    if (isLevelComplete(lessonsForCurrentLevel)) {
      levelUpResult = { leveledUp: true, newLevel: nextLevel };
    }
  }
}
```

Este bloco fica depois da escrita do `challengeProgress` em cada ramo (para que `getUnits()` veja já o desafio atual como concluído) e antes do `db.update(userProgress)` desse ramo.

- [ ] **Step 3: Aplicar a subida de nível e devolvê-la**

Em cada um dos dois `db.update(userProgress).set({...})` (ramo de prática e ramo novo), acrescentar ao objeto passado a `.set()`: `...(levelUpResult ? { englishLevel: levelUpResult.newLevel } : {})`. No fim de cada ramo, substituir o `return;` existente por `return levelUpResult;` (o ramo de prática já tem um `return;` implícito no fim da função — tornar explícito).

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual só-de-leitura**

Escrever um script temporário (fora do repositório, no scratchpad) que, para o utilizador real `user_3LN3ZpiSycpP83mFMmYe9D5cggd`, chama a mesma lógica de leitura (`getUnits` equivalente via SQL direto, já que `getUnits()` depende de `auth()`) para confirmar que, com o seu `englishLevel`/`learningGoal` atuais, todas as lições aplicáveis já têm `challengeProgress.completed = true` — ou seja, que `isLevelComplete` devolveria `true` para ele hoje. **Não escrever na base de dados** — isto é só para confirmar que a lógica vai disparar na próxima vez que ele terminar uma lição a sério (incluindo em modo prática), depois de a Tarefa 4 ter conteúdo INTERMEDIATE pronto.

Expected: confirma `completed = true` em todas as linhas aplicáveis.

- [ ] **Step 6: Commit**

```bash
git add actions/challenge-progress.ts
git commit -m "feat: promote user to next level when current level is fully completed"
```

---

### Task 3: Ecrã de celebração e encaminhamento

**Files:**
- Create: `app/level-up/page.tsx`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: resposta de `upsertChallengeProgress` (Tarefa 2) — `"leveledUp" in response`; `getUserProgress()` (já exportado em `db/queries.ts`) para ler o `englishLevel` atual no novo ecrã.

- [ ] **Step 1: Capturar o sinal de subida de nível em `quiz.tsx`**

Junto às outras declarações de estado (perto de `const [wrongAttempts, setWrongAttempts] = useState<Record<number, number>>({});`, linha ~99), adicionar `const [leveledUp, setLeveledUp] = useState(false);`.

- [ ] **Step 2: Marcar o estado quando a resposta indicar subida**

No `.then((response) => {...})` do ramo de resposta correta de `onContinue` (depois de `setStatus("correct");`), adicionar: se `response && "leveledUp" in response && response.leveledUp`, chamar `setLeveledUp(true)`.

- [ ] **Step 3: Encaminhar para `/level-up` no ecrã de fim de lição**

No bloco `if (!challenge) { ... }` (o ecrã final de "Great job!"), alterar o `onCheck` do `Footer` de `() => router.push("/learn")` para `() => router.push(leveledUp ? "/level-up" : "/learn")`.

- [ ] **Step 4: Criar o ecrã `/level-up`**

`app/level-up/page.tsx` — componente de servidor. Lê `getUserProgress()`; se não houver utilizador autenticado ou `userProgress`, `redirect("/learn")` (mesmo padrão de guarda já usado noutras páginas de `app/(main)/`). Mostra, a toda a largura, o nível atual (`userProgress.englishLevel ?? "BASIC"`) traduzido por um mapa local `{ BEGINNER: "Iniciante", BASIC: "Básico", INTERMEDIATE: "Intermédio", ADVANCED: "Avançado" }`, título tipo "Subiste para {nível}!", o ícone `Crown` de `lucide-react` (já usado no projeto, em `lesson-button.tsx`), `Confetti` de `react-confetti` (já usado em `quiz.tsx`) e um botão/`Link` "Continuar" para `/learn`.

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Verificação manual**

Visitar `/level-up` diretamente (sem ter acabado de subir de nível) com o servidor de desenvolvimento a correr, e confirmar que não rebenta — mostra o nível atual do utilizador autenticado normalmente. (Verificação de UI deferida para confirmação visual por Leonardo, conforme o resto deste projeto — sem automação de browser disponível.)

- [ ] **Step 7: Commit**

```bash
git add app/level-up/page.tsx app/lesson/quiz.tsx
git commit -m "feat: add level-up celebration screen and route to it after promotion"
```

---

### Task 4: Conteúdo INTERMEDIATE — unidade genérica + unidade WORK

**Files:**
- Create: `scripts/seed-intermediate.ts`

**Interfaces:**
- Consumes: nenhuma das Tarefas 1–3 (conteúdo independente da lógica de progressão); as novas `units` precisam exatamente de `targetLevel: "INTERMEDIATE"` e `targetGoal: null` / `targetGoal: "WORK"` para que `buildUnitsWhereClause`/`getUnits()` (já existentes) as apanhem corretamente.

- [ ] **Step 1: Inspecionar a estrutura existente antes de escrever conteúdo novo**

Correr `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT c.text FROM challenges ch JOIN challenge_options c ON c.challenge_id = ch.id WHERE ch.type = 'DIALOGUE' LIMIT 1;"` para confirmar a codificação exata do texto de um desafio `DIALOGUE` existente antes de escrever os novos, e mirror essa mesma forma.

Expected: devolve o texto de um desafio `DIALOGUE` real, usado como referência.

- [ ] **Step 2: Escrever `scripts/seed-intermediate.ts`**

Mesmo esqueleto do `scripts/seed-unit-review.ts` já existente (import de `dotenv`/`pg`/`drizzle`, `pool`/`db` próprios, guarda de idempotência no início do `main()`, tudo dentro de `db.transaction`, `pool.end()` no `finally`). Difere por criar `units` novas (não só lições em `units` existentes):

1. Procurar o `id` do curso `"English"` por título (`eq(schema.courses.title, "English")`) — nunca assumir um id fixo.
2. Guarda de idempotência: se já existir uma `unit` com `targetLevel: "INTERMEDIATE"` nesse curso, terminar sem inserir nada (`console.log` e `return`).
3. Inserir a `unit` genérica: `targetLevel: "INTERMEDIATE"`, `targetGoal: null`, `order: 4`, mesmo `courseId`.
4. Inserir a `unit` `WORK`: `targetLevel: "INTERMEDIATE"`, `targetGoal: "WORK"`, `order: 5`, mesmo `courseId`.
5. Para cada uma das duas `units`: 4 lições normais (`order` 1–4, `isBonus: false`, 6–10 desafios cada, tipos `SELECT`/`ASSIST`/`WRITE`/`ARRANGE`/`MATCH` à escolha de quem implementa — incluir pelo menos um desafio `MATCH` por unidade, já que o tipo MATCH ainda não tem nenhum conteúdo real em produção); 1 lição bónus (`order: 5`, `isBonus: true`, tipo `DIALOGUE`, exatamente 3 desafios, mesma codificação de texto confirmada no Step 1); 1 lição `"Revisão da Unidade"` (`order: 6`, `isBonus: false`, exatamente 8 desafios, sem `DIALOGUE` e sem áudio — mesma regra já usada em `seed-unit-review.ts`).
6. Vocabulário/frases: nível intermédio real (acima do BASIC — estruturas gramaticais mais complexas, vocabulário menos literal), em português → inglês, escrito por quem implementa.

- [ ] **Step 3: Correr o script**

Run: `npx tsx scripts/seed-intermediate.ts`
Expected: "Unit review..." — ou mensagem equivalente de sucesso — sem erros; corrida novamente, imprime a mensagem de "já seedado" e não duplica nada.

- [ ] **Step 4: Verificar a estrutura inserida**

Run: `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT u.title, u.target_level, u.target_goal, l.title, l.\"order\", l.is_bonus, count(c.id) FROM units u JOIN lessons l ON l.unit_id = u.id LEFT JOIN challenges c ON c.lesson_id = l.id WHERE u.target_level = 'INTERMEDIATE' GROUP BY u.title, u.target_level, u.target_goal, l.title, l.\"order\", l.is_bonus ORDER BY u.title, l.\"order\";"`
Expected: 2 unidades, 6 lições cada, contagens de desafios 6–10/6–10/6–10/6–10/3/8 por unidade, conforme o Step 2.

- [ ] **Step 5: Verificar tipos e servidor**

Run: `npx tsc --noEmit`
Expected: sem erros.

Confirmar no log do servidor de desenvolvimento (`/tmp/leolingo-dev.log`) que `/learn` continua a responder 200 depois do seed.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-intermediate.ts
git commit -m "feat: seed INTERMEDIATE generic and WORK units"
```
