# Tipo de Exercício "Correspondência" (MATCH) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um novo tipo de desafio, `MATCH`, onde o utilizador liga 4 frases curtas em português às respetivas traduções em inglês, por toque (sem arrastar), avaliado tudo-ou-nada só ao clicar em "Verificar".

**Architecture:** Cada par usa uma linha de `challengeOptions` já existente, com o texto no formato `"<frase PT>|||<frase EN>"` — sem colunas novas na base de dados, no mesmo espírito do tipo DIALOGUE já existente. Duas funções puras isoladas (`lib/match.ts`) fazem o parsing de cada linha e a verificação de correção por id, testadas com `node:assert/strict` via `tsx` (mesmo padrão já estabelecido em `lib/streak.ts` — este projeto não tem framework de testes formal). Um novo componente `MatchChallenge` faz a interação de toque (duas colunas, selecionar-depois-tocar-para-ligar, tocar numa ligação para desfazer), seguindo o mesmo padrão de `ArrangeChallenge` (sem bibliotecas de drag-and-drop). `app/lesson/quiz.tsx` ganha um novo estado (`matchPairs`) e um ramo novo em cada uma das suas funções de resultado já existentes (`isAnswerReady`, `isAnswerCorrect`, `getCorrectAnswerText`), ao lado dos ramos já lá existentes para WRITE/ARRANGE/DIALOGUE.

**Tech Stack:** Next.js 14 (App Router), Drizzle ORM + Postgres, React (client component), TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-02-exercicio-correspondencia-design.md`

## Global Constraints

- 4 pares por exercício (não é um número configurável nesta versão — o código não precisa de o impor, mas o conteúdo seguirá sempre 4).
- Avaliação tudo-ou-nada: só se verifica ao clicar em "Verificar" (`Footer`'s `onCheck`), nunca par a par enquanto se liga.
- Sem dica de repetição (prefill estilo ARRANGE) para MATCH nesta versão.
- Este projeto não tem framework de testes (`package.json` sem jest/vitest, sem script `test`). Para lógica pura (Task 1), a verificação usa `node:assert/strict` num ficheiro `.test.ts` executado com `npx tsx --test`, tal como em `lib/streak.test.ts`. Para código que toca `quiz.tsx`/React (Tasks 3-4), a verificação é `npx tsc --noEmit` mais traço manual e verificação visual no browser, tal como em todas as funcionalidades anteriores deste projeto.

## Review Focus

- Uma linha de `challengeOptions` sem o delimitador `"|||"` (conteúdo malformado): não deve rebentar a app — deve cair num resultado seguro, não num erro de runtime.
- O botão "Verificar" só fica pronto (`isAnswerReady`) com os 4 pares ligados, nunca com menos, ao contrário do `isAnswerReady` do ARRANGE que fica pronto com 1 peça.
- Desfazer uma ligação já feita (tocando em qualquer um dos dois lados) devolve ambos os itens ao estado "disponível", voltando a poder ligar-se a outra coisa — nunca ficam presos num estado intermédio.
- Duas frases com o mesmo texto em PT ou em EN dentro do mesmo exercício não confundem a verificação de correção, porque esta é feita por id da linha, nunca pelo texto.
- Ao revelar a resposta correta na segunda tentativa errada (mecanismo já existente, partilhado por todos os tipos), o texto mostrado para MATCH lista os 4 pares corretos, não só um.

---

### Task 1: Funções puras de parsing e correção do MATCH

**Files:**
- Create: `lib/match.ts`
- Create: `lib/match.test.ts`

**Interfaces:**
- Produces: `parseMatchPair(id: number, text: string): { id: number; pt: string; en: string }`, `isMatchCorrect(pairs: Record<number, number>, totalPairs: number): boolean`. Task 3 (`MatchChallenge`) consome `parseMatchPair`; Task 4 (`quiz.tsx`) consome `isMatchCorrect` e `parseMatchPair`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// lib/match.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseMatchPair, isMatchCorrect } from "./match";

test("parseMatchPair separa pt e en pelo delimitador, com trim", () => {
  assert.deepEqual(
    parseMatchPair(5, "  Bom dia  |||  Good morning  "),
    { id: 5, pt: "Bom dia", en: "Good morning" },
  );
});

test("parseMatchPair sem delimitador não rebenta — usa o mesmo texto nos dois lados", () => {
  assert.deepEqual(
    parseMatchPair(7, "Bom dia"),
    { id: 7, pt: "Bom dia", en: "Bom dia" },
  );
});

test("isMatchCorrect: todos os 4 pares certos → true", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 2, 3: 3, 4: 4 }, 4), true);
});

test("isMatchCorrect: incompleto (falta 1 par) → false", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 2, 3: 3 }, 4), false);
});

test("isMatchCorrect: completo mas com 1 par trocado → false", () => {
  assert.equal(isMatchCorrect({ 1: 1, 2: 3, 3: 2, 4: 4 }, 4), false);
});

test("isMatchCorrect: vazio → false", () => {
  assert.equal(isMatchCorrect({}, 4), false);
});
```

- [ ] **Step 2: Correr e confirmar que falha**

Run: `npx tsx --test lib/match.test.ts`
Expected: FALHA — `lib/match.ts` ainda não existe (erro de módulo não encontrado).

- [ ] **Step 3: Implementar `lib/match.ts`**

`parseMatchPair(id, text)`: faz `text.split("|||")`; se a 2ª parte não existir (sem delimitador), usa o texto completo (já sem espaços nas pontas) nos dois lados — nunca lança excepção.

`isMatchCorrect(pairs, totalPairs)`: devolve `true` só se `Object.keys(pairs).length === totalPairs` **e** todas as entradas tiverem `Number(leftId) === rightId`.

- [ ] **Step 4: Correr e confirmar que passa**

Run: `npx tsx --test lib/match.test.ts`
Expected: PASS, todos os testes.

- [ ] **Step 5: Commit**

```bash
git add lib/match.ts lib/match.test.ts
git commit -m "feat: add pure parsing/correctness logic for MATCH challenge type"
```

---

### Task 2: Novo valor `MATCH` no enum de desafios

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `challengesEnum` passa a aceitar `"MATCH"` como valor válido de `challenges.type`. Tasks 3 e 4 usam esse valor em comparações de tipo (`challenge.type === "MATCH"`).

- [ ] **Step 1: Adicionar `"MATCH"` ao enum em `db/schema.ts`**

Mudar `export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST", "WRITE", "ARRANGE", "DIALOGUE"]);` para incluir `"MATCH"` no fim do array.

- [ ] **Step 2: Aplicar a migração**

Run: `printf '\x1b[B\r' | npx drizzle-kit push:pg` (o atalho de `yes |` sozinho não resolve o menu interativo deste comando — já confirmado nas funcionalidades anteriores deste projeto).
Expected: confirma a alteração do enum, sem erros.

- [ ] **Step 3: Confirmar o novo valor na base de dados**

Run: `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT unnest(enum_range(NULL::type));"`
Expected: lista inclui `MATCH` junto dos valores já existentes.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts
git commit -m "feat: add MATCH value to challenges type enum"
```

---

### Task 3: Componente `MatchChallenge`

**Files:**
- Create: `app/lesson/match-challenge.tsx`

**Interfaces:**
- Consumes: `parseMatchPair` de `lib/match.ts` (Task 1).
- Produces: `MatchChallenge({ options, pairs, onPair, onUnpair, status, disabled }: Props)` — `options: typeof challengeOptions.$inferSelect[]`, `pairs: Record<number, number>` (leftId → rightId, "committed" — ownership do estado fica em `quiz.tsx`, tal como `arrangedTileIds` já é do `ArrangeChallenge`), `onPair: (leftId: number, rightId: number) => void`, `onUnpair: (leftId: number) => void` (recebe sempre o id do lado esquerdo, mesmo quando o toque que desfez a ligação foi do lado direito — o componente resolve essa troca internamente), `status: "correct" | "wrong" | "none"`, `disabled?: boolean`. Task 4 consome exatamente esta assinatura.

- [ ] **Step 1: Estado local de seleção pendente e baralhamento da coluna EN**

No topo do componente, tal como `ArrangeChallenge` baralha o seu banco de peças: `const [rightOrder, setRightOrder] = useState(() => options.map((o) => o.id));` seguido de um `useEffect` que o volta a baralhar quando `options` muda de referência (a mesma lógica de `ArrangeChallenge`, linhas 18-21). Mais dois estados locais: `const [selectedLeftId, setSelectedLeftId] = useState<number>();` e `const [selectedRightId, setSelectedRightId] = useState<number>();` — nenhum dos dois é passado pelo `quiz.tsx`, porque não afeta a correção, só a interação.

- [ ] **Step 2: Handlers de toque**

```ts
const handleLeftTap = (id: number) => {
  if (disabled) return;
  if (id in pairs) { onUnpair(id); return; }
  if (selectedRightId !== undefined) {
    onPair(id, selectedRightId);
    setSelectedRightId(undefined);
    return;
  }
  setSelectedLeftId(id);
};

const handleRightTap = (id: number) => {
  if (disabled) return;
  const pairedLeftId = Object.entries(pairs).find(([, rightId]) => rightId === id)?.[0];
  if (pairedLeftId !== undefined) { onUnpair(Number(pairedLeftId)); return; }
  if (selectedLeftId !== undefined) {
    onPair(selectedLeftId, id);
    setSelectedLeftId(undefined);
    return;
  }
  setSelectedRightId(id);
};
```

- [ ] **Step 3: Desenhar as duas colunas**

Usar `parseMatchPair` para obter `{ pt, en }` de cada linha de `options` (coluna esquerda: ordem de `options`, mostra `pt`; coluna direita: ordem de `rightOrder`, mostra `en`). Cada item é um `<button>` (seguir o padrão de classes de `ArrangeChallenge`: borda `sky` quando ligado/selecionado, borda `neutral-200` quando disponível), desativado quando `disabled`. O item da esquerda chama `handleLeftTap(id)`; o da direita chama `handleRightTap(id)`.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros (este componente ainda não é usado em nenhum lado, por isso não há verificação visual nesta task).

- [ ] **Step 5: Commit**

```bash
git add app/lesson/match-challenge.tsx
git commit -m "feat: add MatchChallenge tap-to-pair component"
```

---

### Task 4: Ligar o MATCH a `quiz.tsx`

**Files:**
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `isMatchCorrect`, `parseMatchPair` de `lib/match.ts` (Task 1); `MatchChallenge` de `./match-challenge` (Task 3).

- [ ] **Step 1: Novo estado**

Ao lado de `arrangedTileIds` (linha 103), acrescentar `const [matchPairs, setMatchPairs] = useState<Record<number, number>>({});`.

- [ ] **Step 2: Repor o estado ao mudar de desafio**

Em `resetAnswerStateFor` (linha 121), acrescentar `setMatchPairs({});` ao lado das outras reposições incondicionais (`setSelectedOption(undefined)`, `setWrittenAnswer("")`, `setHasPlayedAudio(false)`) — sem nenhum ramo condicional por tipo, porque esta funcionalidade não tem dica de repetição.

- [ ] **Step 3: `isAnswerReady`**

Acrescentar, antes do `return !!selectedOption` final (linha 170): `if (challenge?.type === "MATCH") return Object.keys(matchPairs).length === options.length;`.

- [ ] **Step 4: `isAnswerCorrect`**

Acrescentar, antes do `const correctOption = ...` final (linha 186): `if (challenge.type === "MATCH") return isMatchCorrect(matchPairs, options.length);`.

- [ ] **Step 5: `getCorrectAnswerText`**

Acrescentar, antes do `return options.find(...)` final (linha 199):

```ts
if (challenge.type === "MATCH") {
  return options
    .map((o) => {
      const { pt, en } = parseMatchPair(o.id, o.text);
      return `${pt} → ${en}`;
    })
    .join("; ");
}
```

- [ ] **Step 6: Handlers de ligação/desfazer**

Ao lado de `onToggleTile` (linha 208), acrescentar:

```ts
const onPairMatch = (leftId: number, rightId: number) => {
  if (status !== "none") return;
  setMatchPairs((prev) => ({ ...prev, [leftId]: rightId }));
};

const onUnpairMatch = (leftId: number) => {
  if (status !== "none") return;
  setMatchPairs((prev) => {
    const next = { ...prev };
    delete next[leftId];
    return next;
  });
};
```

- [ ] **Step 7: Ramo no JSX**

No ternário que escolhe o componente por tipo (linha 378, a seguir ao ramo `ARRANGE`), acrescentar antes do ramo `DIALOGUE`:

```tsx
) : challenge.type === "MATCH" ? (
  <MatchChallenge
    options={options}
    pairs={matchPairs}
    onPair={onPairMatch}
    onUnpair={onUnpairMatch}
    status={status}
    disabled={pending}
  />
```

Acrescentar também o `import { MatchChallenge } from "./match-challenge";` e `import { isMatchCorrect, parseMatchPair } from "@/lib/match";` no topo do ficheiro.

- [ ] **Step 8: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Traçar manualmente os casos do Review Focus**

Sem framework de testes para este ficheiro (toca `useState`/React, não corre fora de um componente real montado — mesmo padrão já seguido nas funcionalidades anteriores). Traçar à mão, com as funções já verificadas na Task 1:
- Linha malformada: `parseMatchPair` já testado na Task 1 a não rebentar; confirmado por leitura que `getCorrectAnswerText` e `MatchChallenge` usam sempre essa função, nunca acedem a `text.split` diretamente.
- `isAnswerReady` com `options.length === 4` e `matchPairs` com 3 entradas → `false`; com 4 → `true`. Confirmado pela assinatura de `Object.keys(...).length === options.length`.
- Desfazer: `onUnpairMatch` usa `delete next[leftId]`, devolvendo esse id (e, por construção do componente, o `rightId` que lhe estava ligado) a "disponível" em ambas as colunas no próximo render, porque `MatchChallenge` deriva "disponível" de não aparecer em `pairs`/`Object.values(pairs)` — confirmar por leitura do componente que nenhuma coluna filtra por um estado separado que possa dessincronizar.
- Frases duplicadas: `isMatchCorrect` e a construção de `pairs` trabalham só com os ids (`number`), nunca comparam texto — confirmado pela assinatura da Task 1.
- Revelar resposta: `getCorrectAnswerText` para MATCH itera todas as `options`, não só a primeira — confirma visualmente que o texto junta os 4 pares com "; ".

- [ ] **Step 10: Verificação manual no browser**

Abrir uma lição com um desafio MATCH (precisa de conteúdo de teste — ver nota abaixo) e confirmar visualmente: ligar e desligar pares, "Verificar" só fica ativo com os 4 pares, errar mostra o coração a descer, repetir mostra a resposta revelada na 2ª tentativa errada. Como ainda não existe nenhum desafio MATCH seeded na base de dados, esta task pode ficar sem verificação visual própria — a próxima funcionalidade da lista ("mais níveis/objetivos de conteúdo") vai escrever conteúdo real que usa este tipo, e é aí que a verificação visual completa acontece.

- [ ] **Step 11: Commit**

```bash
git add app/lesson/quiz.tsx
git commit -m "feat: wire MATCH challenge type into the lesson quiz flow"
```
