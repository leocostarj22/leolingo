# Redesenho do mapa de atividades em /learn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o percurso de lições de `/learn` para pílulas com ícone temático + título, ligadas por uma estrada, com banner de unidade com mascotes e cabeçalho/fundo em pílula/gradiente — sem gerar nenhuma imagem ilustrada nova.

**Architecture:** Um novo campo `lessons.icon` (enum fechado) guarda o tema de cada lição; uma função pura partilhada (`lib/lesson-layout.ts`) calcula a posição em ziguezague e a curva da estrada, usada tanto pelo botão de lição como pelo conector SVG, para nunca desalinharem; os componentes de `/learn` são reescritos em cima disso.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM/Postgres, Tailwind, lucide-react@0.344.0, `node:test` via `npx tsx --test`.

**Spec:** docs/superpowers/specs/2026-11-02-redesenho-mapa-atividades-design.md

## Global Constraints

- Não criar nem referenciar nenhuma imagem de fundo ilustrada nova — só gradientes CSS e emojis (como em `app/lesson/dialogue-header.tsx`).
- Só os ícones já existentes em `lucide-react@0.344.0` — nenhuma biblioteca de ícones nova.
- Mascotes só via `leo-mini.png`/`juba-mini.png`, já existentes em `public/` — nenhuma imagem de mascote nova.
- `lessons.icon` é uma coluna `NOT NULL` (enum `pgEnum`) com `default("Star")` só para a migração não falhar sobre linhas existentes; todo o código que insere uma lição nova passa a enviar `icon` explicitamente — nenhuma lição nova pode depender do valor por omissão.
- A fórmula de ziguezague existente (`cycleIndex <= 2 ? cycleIndex : cycleIndex <= 6 ? 4 - cycleIndex : cycleIndex - 8`) mantém-se bit-a-bit igual — só a constante de pixels por nível muda.
- Não alterar `/courses`, a barra lateral, ou qualquer lógica de corações/XP/desbloqueio de lições — só o visual de `/learn`.

## Review Focus

- Ícone desconhecido do mapa do cliente deve cair em `Star`, nunca quebrar a renderização → Task 3.
- Unidade com 1 só lição não pode rebentar o cálculo de posição nem a construção da estrada → Task 2.
- Lição bloqueada nunca mostra o badge de check nem é clicável → Task 4.
- O filtro de unidades por `englishLevel`/`learningGoal` (`buildUnitsWhereClause`) não pode ser afetado pelo redesenho → Task 4.
- Nenhuma das 35 lições existentes pode ficar presa no ícone de reserva `Star` depois da migração → Task 1.

---

### Task 1: Schema — campo `lessons.icon`

**Files:**
- Modify: `db/schema.ts`
- Backfill: executado diretamente via `psql` (sem script TS), conforme o precedente já usado nesta sessão para dados reais.

**Interfaces:**
- Produces: `lessonIconEnum` (pgEnum) e a coluna `lessons.icon: text` tipada por esse enum, consumida por: Task 3 (`resolveLessonIcon`, tipo `LessonIcon`), Task 4 (`Unit`/`LessonButton` leem `lesson.icon`), Task 6 (todos os scripts de seed passam a enviar `icon`).

- [ ] **Step 1: Adicionar o enum e a coluna em `db/schema.ts`**

Junto aos outros `pgEnum` (perto de `challengesEnum`):

```ts
export const lessonIconEnum = pgEnum("lesson_icon", [
  "Handshake", "Users", "Hash", "BookOpen", "MessageCircle", "Trophy",
  "Briefcase", "Mail", "MessageSquare", "Plane", "Hotel", "MapPin",
  "UtensilsCrossed", "Clock", "Scale", "GitBranch", "Presentation",
  "BarChart3", "Puzzle", "UserCheck", "Tag", "Star",
]);
```

Na tabela `lessons`, acrescentar: `icon: lessonIconEnum("icon").notNull().default("Star")`.

- [ ] **Step 2: Aplicar o schema à base de dados**

Run: `printf '\x1b[B\r' | npx drizzle-kit push:pg > /tmp/claude-1000/-home-lcsilva-codes-leolingo/34c47d53-8e37-4ea6-be50-e94b0b070c64/scratchpad/dbpush-lesson-icon.log 2>&1` (o workaround já usado nesta sessão para o prompt interativo do `drizzle-kit push:pg`), depois ler o ficheiro de log.

Expected: log termina sem erro, confirma a criação do enum `lesson_icon` e da coluna `icon` em `lessons`.

- [ ] **Step 3: Verificar que a coluna existe com o valor por omissão nas 35 linhas**

Run: `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT count(*) FROM lessons WHERE icon = 'Star';"`

Expected: `35` (todas ainda no valor por omissão, antes do backfill).

- [ ] **Step 4: Backfill — atribuir o ícone real a cada lição existente**

Run, na mesma ligação `psql`, as 21 instruções abaixo (uma por tema, pelo `title` — nenhum título colide entre temas diferentes, confirmado contra os 6 scripts de seed):

```sql
UPDATE lessons SET icon = 'Handshake' WHERE title = 'Cumprimentos';
UPDATE lessons SET icon = 'Users' WHERE title IN ('Pessoas', 'Reuniões');
UPDATE lessons SET icon = 'Hash' WHERE title = 'Números';
UPDATE lessons SET icon = 'BookOpen' WHERE title IN ('Be e Have', 'Verbs');
UPDATE lessons SET icon = 'MessageCircle' WHERE title IN ('Primeira conversa', 'Uma reunião rápida', 'No check-in do hotel', 'Uma conversa sobre planos', 'Uma reunião de equipa');
UPDATE lessons SET icon = 'Trophy' WHERE title = 'Revisão da Unidade';
UPDATE lessons SET icon = 'Briefcase' WHERE title = 'No escritório';
UPDATE lessons SET icon = 'Mail' WHERE title = 'Email';
UPDATE lessons SET icon = 'MessageSquare' WHERE title IN ('Conversas de trabalho', 'Expressões do dia a dia');
UPDATE lessons SET icon = 'Plane' WHERE title = 'No aeroporto';
UPDATE lessons SET icon = 'Hotel' WHERE title = 'No hotel';
UPDATE lessons SET icon = 'MapPin' WHERE title = 'Pedir direções';
UPDATE lessons SET icon = 'UtensilsCrossed' WHERE title = 'No restaurante';
UPDATE lessons SET icon = 'Clock' WHERE title = 'Tempos verbais';
UPDATE lessons SET icon = 'Scale' WHERE title = 'Comparações';
UPDATE lessons SET icon = 'GitBranch' WHERE title = 'Frases condicionais';
UPDATE lessons SET icon = 'Presentation' WHERE title = 'Reuniões e apresentações';
UPDATE lessons SET icon = 'BarChart3' WHERE title = 'Relatórios e dados';
UPDATE lessons SET icon = 'Puzzle' WHERE title = 'Resolver problemas';
UPDATE lessons SET icon = 'UserCheck' WHERE title = 'Entrevistas e feedback';
UPDATE lessons SET icon = 'Tag' WHERE title = 'Nouns';
```

- [ ] **Step 5: Verificar que nenhuma lição ficou no ícone de reserva**

Run: `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT count(*) FROM lessons WHERE icon = 'Star';"`

Expected: `0` (as 35 linhas receberam um tema real — este é o teste do item 5 da Review Focus).

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add db/schema.ts
git commit -m "feat: add themed icon field to lessons"
```

---

### Task 2: `lib/lesson-layout.ts` — matemática do ziguezague e da estrada

**Files:**
- Create: `lib/lesson-layout.ts`
- Test: `lib/lesson-layout.test.ts`

**Interfaces:**
- Consumes: nada (puro, sem dependências do projeto).
- Produces: `LESSON_CYCLE_LENGTH: number`, `LESSON_OFFSET_PX: number`, `LESSON_ROW_HEIGHT_PX: number`, `LESSON_ANCHOR_CENTER_X: number`, `getLessonIndentationLevel(index: number): number`, `getLessonAnchorX(index: number): number`, `getLessonAnchorY(index: number): number`, `buildLessonRoadPath(totalCount: number): string` — todos consumidos pela Task 4 (`LessonButton` usa `getLessonIndentationLevel`/`LESSON_OFFSET_PX`; `LessonPath` usa todo o resto).

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LESSON_OFFSET_PX,
  LESSON_ROW_HEIGHT_PX,
  LESSON_ANCHOR_CENTER_X,
  getLessonIndentationLevel,
  getLessonAnchorX,
  getLessonAnchorY,
  buildLessonRoadPath,
} from "./lesson-layout";

test("getLessonIndentationLevel: segue a sequência 0,1,2,1,0,-1,-2,-1 num ciclo de 8", () => {
  const got = Array.from({ length: 8 }, (_, i) => getLessonIndentationLevel(i));
  assert.deepEqual(got, [0, 1, 2, 1, 0, -1, -2, -1]);
});

test("getLessonIndentationLevel: repete o ciclo a partir do índice 8", () => {
  assert.equal(getLessonIndentationLevel(8), getLessonIndentationLevel(0));
  assert.equal(getLessonIndentationLevel(9), getLessonIndentationLevel(1));
});

test("getLessonAnchorX: nível 0 fica centrado, níveis positivos deslocam para a esquerda do centro", () => {
  assert.equal(getLessonAnchorX(0), LESSON_ANCHOR_CENTER_X);
  assert.equal(getLessonAnchorX(1), LESSON_ANCHOR_CENTER_X - LESSON_OFFSET_PX);
});

test("getLessonAnchorY: linhas consecutivas distam LESSON_ROW_HEIGHT_PX", () => {
  assert.equal(getLessonAnchorY(0), LESSON_ROW_HEIGHT_PX / 2);
  assert.equal(getLessonAnchorY(1) - getLessonAnchorY(0), LESSON_ROW_HEIGHT_PX);
});

test("buildLessonRoadPath: unidade com 1 lição não rebenta e não desenha segmento", () => {
  assert.equal(buildLessonRoadPath(1), "");
});

test("buildLessonRoadPath: 6 lições produzem 5 segmentos cúbicos ligados", () => {
  const d = buildLessonRoadPath(6);
  assert.ok(d.startsWith("M "));
  assert.equal((d.match(/C /g) ?? []).length, 5);
});
```

- [ ] **Step 2: Correr os testes e confirmar que falham**

Run: `npx tsx --test lib/lesson-layout.test.ts`
Expected: FAIL — `Cannot find module './lesson-layout'`.

- [ ] **Step 3: Implementar `lib/lesson-layout.ts`**

Constantes: `LESSON_CYCLE_LENGTH = 8`, `LESSON_OFFSET_PX = 80`, `LESSON_ROW_HEIGHT_PX = 94`, `LESSON_ANCHOR_CENTER_X = 220`.

`getLessonIndentationLevel(index)` é a mesma fórmula já existente em `app/(main)/learn/lesson-button.tsx` (extraída sem alterar comportamento): `cycleIndex = index % LESSON_CYCLE_LENGTH`; devolve `cycleIndex` se `<= 2`; senão `4 - cycleIndex` se `<= 6`; senão `cycleIndex - 8`.

`getLessonAnchorX(index) = LESSON_ANCHOR_CENTER_X - getLessonIndentationLevel(index) * LESSON_OFFSET_PX` (mesmo sinal que o `right` CSS usado pelo botão — nível positivo desloca visualmente para a esquerda).

`getLessonAnchorY(index) = index * LESSON_ROW_HEIGHT_PX + LESSON_ROW_HEIGHT_PX / 2`.

`buildLessonRoadPath(totalCount)`: se `totalCount <= 1`, devolve `""`. Senão, começa em `M {x0},{y0}` e, para cada par consecutivo de âncoras `(x0,y0)`→`(x1,y1)`, acrescenta um segmento `C {x0},{my} {x1},{my} {x1},{y1}` em que `my = (y0 + y1) / 2` (curva em S vertical, mesma técnica do protótipo aprovado v3).

- [ ] **Step 4: Correr os testes e confirmar que passam**

Run: `npx tsx --test lib/lesson-layout.test.ts`
Expected: PASS, todos os testes.

- [ ] **Step 5: Commit**

```bash
git add lib/lesson-layout.ts lib/lesson-layout.test.ts
git commit -m "feat: add pure lesson zigzag and road-path layout math"
```

---

### Task 3: Resolução do ícone temático

**Files:**
- Create: `lib/lesson-icons.ts`
- Test: `lib/lesson-icons.test.ts`
- Create: `components/lesson-icon.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `type LessonIcon` (as 22 strings do enum da Task 1), `resolveLessonIcon(name: string): LucideIcon`, componente `<LessonIcon name={string} className={string} />` — consumidos pela Task 4 (`LessonButton` usa `<LessonIcon>`).

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Trophy, Star } from "lucide-react";
import { resolveLessonIcon } from "./lesson-icons";

test("resolveLessonIcon: devolve o componente lucide correspondente a um nome conhecido", () => {
  assert.equal(resolveLessonIcon("Trophy"), Trophy);
});

test("resolveLessonIcon: nome desconhecido cai em Star (item 1 da Review Focus)", () => {
  assert.equal(resolveLessonIcon("não-existe"), Star);
});
```

- [ ] **Step 2: Correr o teste e confirmar que falha**

Run: `npx tsx --test lib/lesson-icons.test.ts`
Expected: FAIL — `Cannot find module './lesson-icons'`.

- [ ] **Step 3: Implementar `lib/lesson-icons.ts`**

```ts
export type LessonIcon =
  | "Handshake" | "Users" | "Hash" | "BookOpen" | "MessageCircle" | "Trophy"
  | "Briefcase" | "Mail" | "MessageSquare" | "Plane" | "Hotel" | "MapPin"
  | "UtensilsCrossed" | "Clock" | "Scale" | "GitBranch" | "Presentation"
  | "BarChart3" | "Puzzle" | "UserCheck" | "Tag" | "Star";
```

Mapa `LESSON_ICON_MAP: Record<LessonIcon, LucideIcon>` com as 22 entradas, importando os componentes homónimos de `lucide-react`. `resolveLessonIcon(name: string): LucideIcon` devolve `LESSON_ICON_MAP[name as LessonIcon] ?? Star`.

- [ ] **Step 4: Correr o teste e confirmar que passa**

Run: `npx tsx --test lib/lesson-icons.test.ts`
Expected: PASS, 2/2.

- [ ] **Step 5: Implementar `components/lesson-icon.tsx`**

```tsx
type Props = { name: string; className?: string };
export const LessonIcon = ({ name, className }: Props) => { ... };
```

Resolve o componente via `resolveLessonIcon(name)` e renderiza-o com `className`. Sem teste próprio — é passagem direta sem lógica adicional, coberta pela leitura no final da Task 4.

- [ ] **Step 6: Commit**

```bash
git add lib/lesson-icons.ts lib/lesson-icons.test.ts components/lesson-icon.tsx
git commit -m "feat: add thematic lesson icon resolver"
```

---

### Task 4: `LessonButton` em pílula + `LessonPath` (estrada) + integração em `Unit`

Numa só task: `LessonButton` muda de assinatura e `Unit` tem de ser atualizado no mesmo commit para o `tsc` nunca ficar vermelho entre os dois.

**Files:**
- Modify: `app/(main)/learn/lesson-button.tsx`
- Create: `app/(main)/learn/lesson-path.tsx`
- Modify: `app/(main)/learn/unit.tsx`

**Interfaces:**
- Consumes: `getLessonIndentationLevel`, `LESSON_OFFSET_PX`, `getLessonAnchorX`, `getLessonAnchorY`, `buildLessonRoadPath`, `LESSON_ROW_HEIGHT_PX`, `LESSON_ANCHOR_CENTER_X` de `lib/lesson-layout.ts` (Task 2); `<LessonIcon>` de `components/lesson-icon.tsx` (Task 3).
- Produces: novo `Props` de `LessonButton` — `{ id: number; index: number; totalCount: number; title: string; icon: string; locked?: boolean; current?: boolean; percentage: number }` (substitui `isBonus?: boolean`, que deixa de existir); `<LessonPath totalCount={number} />` — nenhuma outra task deste plano depende de nenhum dos dois.

- [ ] **Step 1: Reescrever `app/(main)/learn/lesson-button.tsx`**

Mantém `"use client"`, `Link`, `CircularProgressbarWithChildren`, a lógica de `isFirst`/`isLast`/`isCompleted` e o `href` existentes. Troca:
- `indentationLevel`/`rightPosition`: passam a vir de `getLessonIndentationLevel(index) * LESSON_OFFSET_PX` (import de `lib/lesson-layout.ts`), em vez da fórmula inline e do `40`.
- O botão deixa de ser só um círculo: vira uma pílula — círculo de ícone 44px (`bg-emerald-100 text-emerald-600` desbloqueada, `bg-neutral-100 text-neutral-400` bloqueada) com `<LessonIcon name={icon} className="h-6 w-6" />`, título (`title`, `font-bold text-sm text-slate-700`, `flex-1`), e badge de check 26px (`bg-green-500 text-white`) **só quando `isCompleted`** (item 3 da Review Focus — nunca em bloqueada nem em atual-por-terminar).
- Borda da pílula: `border-2 border-b-4 rounded-full` — `border-emerald-500` desbloqueada/atual, `border-neutral-300` bloqueada.
- Estado atual: mantém `CircularProgressbarWithChildren` e a etiqueta "Start" a saltar, agora à volta do círculo de ícone de 44px; acrescenta `ring-4 ring-emerald-200` à pílula.
- Remove por completo o antigo `Icon = isCompleted ? Check : isBonus ? Zap : isLast ? Crown : Star` — o ícone é sempre `icon` (prop).
- `locked` continua a usar `pointer-events: none`/`aria-disabled` exatamente como hoje.

- [ ] **Step 2: Implementar `app/(main)/learn/lesson-path.tsx`**

```tsx
type Props = { totalCount: number };
export const LessonPath = ({ totalCount }: Props) => { ... };
```

Renderiza um `<svg>` com `width={LESSON_ANCHOR_CENTER_X * 2}` e `height={totalCount * LESSON_ROW_HEIGHT_PX}` fixos em pixels (não percentagem — para 1 unidade do `viewBox` valer 1px real, igual ao `right` em pixels do botão), posicionado `absolute left-1/2 -translate-x-1/2 top-0 z-0 pointer-events-none`, com um único `<path d={buildLessonRoadPath(totalCount)} stroke="#86efac" strokeWidth={7} strokeLinecap="round" strokeDasharray="2 14" fill="none" />`. Acrescenta a etiqueta "▶ Início" (posicionada no topo, centrada) e "🏁 Fim da unidade" (centrada, abaixo do último `getLessonAnchorY`), como elementos de texto simples fora do `<svg>`.

- [ ] **Step 3: Atualizar `app/(main)/learn/unit.tsx`**

O `<div className="flex items-center flex-col relative">` que envolve os `lessons.map(...)` passa a também renderizar `<LessonPath totalCount={lessons.length} />` como primeiro filho (antes do `.map`). Cada `<LessonButton>` passa a receber `title={lesson.title}` e `icon={lesson.icon}` em vez de `isBonus={lesson.isBonus}`.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros — confirma também que `getUnits()`/`buildUnitsWhereClause` (não tocados por esta task) continuam a compilar sem alteração, item 4 da Review Focus.

- [ ] **Step 5: Verificação manual (sem harness de testes de componentes neste projeto)**

Ler os três ficheiros e confirmar, por leitura, as regras da Review Focus/spec: (a) bloqueada nunca mostra o badge de check; (b) bloqueada tem `pointer-events: none`; (c) o ícone mostrado é sempre `icon`, nunca depende de `isBonus`/`isLast`; (d) `LessonPath` usa as mesmas constantes/funções de `lib/lesson-layout.ts` que `LessonButton`, nunca uma curva fixa à parte.

- [ ] **Step 6: Verificar no servidor de desenvolvimento**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/learn` e ler a cauda de `/tmp/leolingo-dev.log`.
Expected: `307` (redireciona para o Clerk sem sessão, como as outras rotas protegidas já verificadas nesta sessão), sem erro novo no log.

- [ ] **Step 7: Commit**

```bash
git add app/\(main\)/learn/lesson-button.tsx app/\(main\)/learn/lesson-path.tsx app/\(main\)/learn/unit.tsx
git commit -m "feat: redesign lesson button as icon+title pill, connect with road"
```

---

### Task 5: Restante estilo visual — banner, cabeçalho, fundo

**Files:**
- Modify: `app/(main)/learn/unit-banner.tsx`
- Modify: `app/(main)/learn/header.tsx`
- Modify: `app/(main)/learn/page.tsx`

**Interfaces:**
- Consumes: nada de outras tasks deste plano.
- Produces: nada consumido por outra task — último elo visual, sem interface nova.

- [ ] **Step 1: Reescrever `app/(main)/learn/unit-banner.tsx`**

Mesma assinatura de `Props` (`title`, `description`). Troca o fundo `bg-green-500` por um cartão `bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl`. a mostrar `leo-mini.png` + `juba-mini.png` sobrepostos (56px cada, `rounded-full`, o segundo com `margin-left: -18px`, igual ao padrão já usado em `app/lesson/dialogue.tsx`) à esquerda de `title`/`description` (cores de texto `text-amber-900`/`text-amber-800` em vez do branco atual). Mantém o botão "Continue" existente, restyled para `secondaryOutline` ou equivalente que funcione sobre o novo fundo claro.

- [ ] **Step 2: Reescrever `app/(main)/learn/header.tsx`**

Mesma assinatura de `Props` (`title`). Troca a barra com borda inferior por um cabeçalho em pílula: `bg-white border-2 rounded-full shadow-sm px-4 py-2`, mantendo a seta-de-voltar (`Link href="/courses"`) à esquerda e o título centrado.

- [ ] **Step 3: Atualizar `app/(main)/learn/page.tsx`**

O `<div key={unit.id} className="mb-10">` que envolve cada `<Unit>` passa a `bg-gradient-to-b from-sky-100 to-emerald-50 rounded-3xl p-4 relative overflow-hidden`, com 2-3 emojis decorativos posicionados em absoluto (`🍃`, `🐾`, como em `dialogue-header.tsx`) — sem tocar no `StickyWrapper`/`UserProgress`/`Quests` à parte, que ficam exatamente como estão.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificar no servidor de desenvolvimento**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/learn` e ler a cauda de `/tmp/leolingo-dev.log`.
Expected: `307`, sem erro novo.

- [ ] **Step 6: Commit**

```bash
git add app/\(main\)/learn/unit-banner.tsx app/\(main\)/learn/header.tsx app/\(main\)/learn/page.tsx
git commit -m "feat: restyle learn banner, header and background"
```

---

### Task 6: Scripts de seed — enviar `icon` explicitamente

**Files:**
- Modify: `scripts/seed.ts`
- Modify: `scripts/seed-english.ts`
- Modify: `scripts/prod.ts`
- Modify: `scripts/seed-interactive-content.ts`
- Modify: `scripts/seed-unit-review.ts`
- Modify: `scripts/seed-intermediate.ts`

**Interfaces:**
- Consumes: `lessonIconEnum`/coluna `icon` da Task 1 (tipagem).
- Produces: nada consumido por outra task — garante só que nenhuma lição futura nasce no valor por omissão `Star` (Global Constraint + item 5 da Review Focus, agora para lições futuras).

- [ ] **Step 1: Adicionar `icon` a cada `insert(schema.lessons).values(...)`**

Em cada um dos 6 ficheiros, no(s) local(is) já localizado(s) (`scripts/seed-english.ts:490`, `scripts/prod.ts:57`, `scripts/seed.ts:59`, `scripts/seed-interactive-content.ts:316`, `scripts/seed-unit-review.ts:179`, `scripts/seed-intermediate.ts:565`), acrescentar o campo `icon: "<Nome>"` à mesma lição, usando a tabela de mapeamento do documento de design (mesmos valores do `UPDATE` da Task 1 — ex.: a lição "Cumprimentos" recebe `icon: "Handshake"`, todas as "Revisão da Unidade" recebem `icon: "Trophy"`, todas as lições bónus de diálogo recebem `icon: "MessageCircle"`).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros — o `pgEnum` da Task 1 rejeitaria em tempo de compilação qualquer `icon` que não esteja na lista de 22 valores, por isso este passo confirma os 6 ficheiros ao mesmo tempo.

- [ ] **Step 3: Confirmar por grep que nenhuma inserção de lição ficou sem `icon`**

Run: `grep -n -A 6 "insert(schema.lessons).values" scripts/*.ts | grep -B 6 "icon:" | grep -c "insert(schema.lessons)"`
Expected: `6` (uma correspondência por ficheiro — confirma que todas as 6 inserções têm `icon:` nas linhas seguintes).

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts scripts/seed-english.ts scripts/prod.ts scripts/seed-interactive-content.ts scripts/seed-unit-review.ts scripts/seed-intermediate.ts
git commit -m "feat: assign explicit themed icon in all lesson seed scripts"
```
