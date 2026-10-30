# Atividades mais interativas (tipos novos, voz, mascote) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acrescentar dois tipos de desafio novos (`WRITE`, `ARRANGE`), áudio opcional em qualquer desafio, lições bónus com diálogo (`DIALOGUE`) e perguntas de compreensão, e a mascote real (Leo/Juba) nos ecrãs de atividade — sem tocar no conteúdo já existente.

**Architecture:** `challenges_enum` ganha três valores; `challenges` ganha `audio_src` (áudio do enunciado, independente do já existente em `challenge_options`); `lessons` ganha `is_bonus`. `ARRANGE`/`WRITE` reaproveitam `challenge_options` sem colunas novas (ver spec). A baralhada de ordem e a troca de mascote acontecem no cliente (`app/lesson/quiz.tsx` e os componentes que ele usa), sem tocar na base de dados. O áudio é gerado uma vez por um script (`node-edge-tts`), nunca em runtime.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Postgres (`pg`/`drizzle-orm/node-postgres`), Zustand, `react-use` (`useAudio`), TypeScript. Nova dependência: `node-edge-tts` (só usada por um script de build de conteúdo).

**Spec:** `docs/superpowers/specs/2026-10-30-atividades-interativas-design.md`

## Global Constraints

- Nenhum desafio/lição/curso existente é apagado ou reescrito — tudo o que este plano acrescenta é `insert`, nunca `delete`/`update` de conteúdo já existente (exceção: `actions/challenge-progress.ts`, que já faz `update` de pontos/corações — continua a fazê-lo, só muda o valor dos pontos).
- O áudio nunca é gerado em tempo de execução pela aplicação — só por um script de build de conteúdo, uma vez, guardado em `public/audio/`.
- `courses.id`/`units.id`/`lessons.id`/`challenges.id`/`challenge_options.id` são sempre gerados pela base de dados (`serial`/`.returning()`), nunca escritos à mão.
- Não há framework de testes automatizados no repositório — verificação é `npx tsc --noEmit` (deve ficar sempre limpo) + comandos `psql` manuais + verificação visual no browser.
- As duas imagens da mascote já existem em `docs/superpowers/specs/assets/leo.png` e `juba.png` — só precisam de ser copiadas para `public/`.

## Review Focus

- Uma pessoa que já tinha progresso em desafios `SELECT`/`ASSIST` antigos continua a conseguir completá-los normalmente depois dos tipos novos existirem — nada no esquema ou nas queries existentes muda de forma incompatível.
- Um desafio `WRITE` aceita a resposta certa mesmo com diferenças razoáveis de maiúsculas/minúsculas, pontuação final ou espaços a mais — mas não aceita uma resposta claramente diferente.
- Um desafio `ARRANGE` só conta como certo quando a pessoa seleciona exatamente os blocos certos, pela ordem certa — nunca com um bloco-isco incluído, nem com a ordem trocada, mesmo que "pareça" certo.
- Um desafio com `audioSrc` definido nunca mostra o texto do enunciado antes de a pessoa carregar em "Ouvir" pelo menos uma vez — e continua a funcionar (sem crash) se a pessoa tentar responder antes de ouvir (o botão de confirmar fica desativado, não a aplicação a rebentar).
- A baralhada da ordem dos desafios nunca perde nem duplica um desafio da lição — o conjunto de desafios mostrados é sempre exatamente o mesmo, só a ordem muda.

---

### Task 1: Esquema — tipos de desafio novos, áudio do enunciado, lição bónus

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `challengesEnum` com valores `["SELECT", "ASSIST", "WRITE", "ARRANGE", "DIALOGUE"]`; coluna `challenges.audioSrc` (`text`, nullable); coluna `lessons.isBonus` (`boolean`, not null, default `false`). Usadas pelas Tasks 2, 3, 4, 5, 6, 7, 9.

- [ ] **Step 1: Acrescentar os três valores novos ao `challengesEnum`**

Em `db/schema.ts`, troca:
```ts
export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);
```
por:
```ts
export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST", "WRITE", "ARRANGE", "DIALOGUE"]);
```
(este enum já foi movido para antes de `units` numa entrega anterior — a posição não muda, só a lista de valores.)

- [ ] **Step 2: Acrescentar `audioSrc` a `challenges`**

No objeto `challenges = pgTable("challenges", { ... })`, depois do campo `order`, adiciona:
```ts
  audioSrc: text("audio_src"),
```

- [ ] **Step 3: Acrescentar `isBonus` a `lessons`**

No objeto `lessons = pgTable("lessons", { ... })`, depois do campo `order`, adiciona:
```ts
  isBonus: boolean("is_bonus").notNull().default(false),
```
(`boolean` já está importado de `drizzle-orm/pg-core` — é usado em `challengeOptions.correct`.)

- [ ] **Step 4: Aplicar à base de dados**

Run: `npm run db:push`
Expected: termina sem erro. Tal como numa entrega anterior, o `drizzle-kit push:pg` pode mostrar um prompt interativo (@clack/prompts, sem TTY no shell deste harness) — usa a mesma automação pty/Python já usada antes (ver `docs/superpowers/plans/2026-10-30-curso-ingles-implementation.md`, Task 1) para confirmar "Yes, I want to execute all statements", em vez de tentar responder ao prompt diretamente pelo shell.

- [ ] **Step 5: Verificar o esquema**

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "\d lessons"`
Expected: mostra `is_bonus` com tipo `boolean`, `not null`, default `false`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "\d challenges"`
Expected: mostra `audio_src` como `text`, nullable.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT unnest(enum_range(NULL::type));"`
Expected: 5 linhas — `SELECT`, `ASSIST`, `WRITE`, `ARRANGE`, `DIALOGUE`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT count(*) FROM lessons WHERE is_bonus = true;"`
Expected: `0` (nenhuma lição existente fica bónus).

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add db/schema.ts
git commit -m "feat: add WRITE/ARRANGE/DIALOGUE challenge types, challenge audio, bonus lessons"
```

---

### Task 2: Pontos em dobro nas lições bónus

**Files:**
- Modify: `actions/challenge-progress.ts`

**Interfaces:**
- Consumes: `lessons.isBonus` (Task 1).
- Produces: nenhuma interface nova — `upsertChallengeProgress(challengeId: number)` mantém a mesma assinatura e o mesmo contrato de retorno (`{ error: "hearts" } | undefined`).

- [ ] **Step 1: Buscar a lição do desafio**

Em `actions/challenge-progress.ts`, troca:
```ts
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId)
  });
```
por:
```ts
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      lesson: true,
    },
  });
```
(a relação `challenge.lesson` já existe em `challengesRelations`, em `db/schema.ts` — não precisa de alteração ao schema.)

- [ ] **Step 2: Calcular os pontos consoante a lição**

Logo a seguir à linha `const lessonId = challenge.lessonId;`, adiciona:
```ts
  const pointsAwarded = challenge.lesson?.isBonus ? 20 : 10;
```

- [ ] **Step 3: Usar `pointsAwarded` nos dois sítios que hoje somam `10`**

Troca as duas ocorrências de:
```ts
      points: currentUserProgress.points + 10,
```
por:
```ts
      points: currentUserProgress.points + pointsAwarded,
```
(uma está dentro do bloco `if (isPractice)`, a outra no fim da função — as duas mudam.)

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Com o servidor de dev a correr e sessão iniciada: completa um desafio de uma lição normal (não bónus) e confirma no `psql` que `user_progress.points` subiu 10; a Task 9 vai criar lições bónus para confirmar o caso dos 20 — por agora, basta confirmar que o caso normal (10 pontos) continua a funcionar sem erros.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT points FROM user_progress WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"`
Expected: não dá erro (valor pode variar consoante o estado atual).

- [ ] **Step 6: Commit**

```bash
git add actions/challenge-progress.ts
git commit -m "feat: award double points for bonus lessons"
```

---

### Task 3: Mascote Leo/Juba nos ecrãs de atividade

**Files:**
- Create: `store/use-mascot.ts`
- Modify: `app/lesson/question-bubble.tsx`
- Modify: `components/modals/exit-modal.tsx`
- Modify: `components/modals/hearts-modal.tsx`
- Modify: `app/lesson/quiz.tsx`
- Modify: `app/lesson/page.tsx`

**Interfaces:**
- Produces: `useMascot()` (zustand hook) com `{ gender: "MALE" | "FEMALE" | null, setGender: (gender: "MALE" | "FEMALE" | null) => void }`; usado por `question-bubble.tsx`, `exit-modal.tsx`, `hearts-modal.tsx`. `Quiz` ganha uma prop nova, `initialGender: "MALE" | "FEMALE" | null`.
- Consumes: `userProgress.gender` (já existe em `db/schema.ts`, sem alterações).

- [ ] **Step 1: Copiar as imagens da mascote para `public/`**

```bash
cp docs/superpowers/specs/assets/leo.png public/leo.png
cp docs/superpowers/specs/assets/juba.png public/juba.png
```

- [ ] **Step 2: Criar `store/use-mascot.ts`**

Mesmo padrão de `store/use-exit-modal.ts`:
```ts
import { create } from "zustand";

type Gender = "MALE" | "FEMALE" | null;

type MascotState = {
  gender: Gender;
  setGender: (gender: Gender) => void;
};

export const useMascot = create<MascotState>((set) => ({
  gender: null,
  setGender: (gender) => set({ gender }),
}));
```

- [ ] **Step 3: `app/lesson/page.tsx` passa o género para `Quiz`**

Troca:
```ts
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={userSubscription}
    />
```
por:
```ts
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      initialGender={userProgress.gender}
      userSubscription={userSubscription}
    />
```

- [ ] **Step 4: `Quiz` define o género no `useMascot` ao montar**

Em `app/lesson/quiz.tsx`: acrescenta `initialGender: typeof userProgress.$inferSelect["gender"];` ao tipo `Props` (import `userProgress` de `@/db/schema` já existe no ficheiro, usado via `userSubscription`; adiciona `userProgress` à lista de imports de `@/db/schema` se ainda não lá estiver) e `initialGender` à desestruturação dos parâmetros. Importa `useMascot` de `@/store/use-mascot` e, dentro do `useMount` já existente (o mesmo que hoje só abre o `practiceModal` quando `initialPercentage === 100`), acrescenta a chamada `useMascot.getState().setGender(initialGender);` antes do `if`.

- [ ] **Step 5: `question-bubble.tsx` usa a mascote certa**

Em `app/lesson/question-bubble.tsx`, importa `useMascot` de `@/store/use-mascot`, lê `const gender = useMascot((state) => state.gender);` e troca as duas ocorrências de `src="/mascot.svg"` por `src={gender === "FEMALE" ? "/juba.png" : "/leo.png"}` (o `alt="Mascot"` fica igual).

- [ ] **Step 6: `exit-modal.tsx` e `hearts-modal.tsx` usam a mascote certa**

Em cada um dos dois ficheiros: importa `useMascot` de `@/store/use-mascot`, lê o `gender` da mesma forma, e troca `src="/mascot_sad.svg"` (em `exit-modal.tsx`) ou `src="/mascot_bad.svg"` (em `hearts-modal.tsx`) por `src={gender === "FEMALE" ? "/juba.png" : "/leo.png"}`.

- [ ] **Step 7: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 8: Verificação manual**

Com o servidor de dev a correr, inicia sessão como Leonardo (`gender = MALE`) e abre uma lição com um desafio `ASSIST` — a bolha de pergunta mostra `/leo.png`. Abre o modal de sair da lição (botão "X" no cabeçalho) e confirma que mostra `/leo.png` também.

- [ ] **Step 9: Commit**

```bash
git add store/use-mascot.ts app/lesson/question-bubble.tsx components/modals/exit-modal.tsx components/modals/hearts-modal.tsx app/lesson/quiz.tsx app/lesson/page.tsx public/leo.png public/juba.png
git commit -m "feat: use Leo/Juba mascot on activity screens based on profile gender"
```

---

### Task 4: Tipo de desafio `WRITE`

**Files:**
- Create: `app/lesson/write-challenge.tsx`
- Modify: `lib/utils.ts`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `challengesEnum` inclui `"WRITE"` (Task 1).
- Produces: `normalizeAnswer(value: string): string` em `lib/utils.ts` — usada também pela Task 5 (não, a Task 5 não precisa dela; é só para `WRITE`, mas fica exportada de um sítio central caso outro tipo de texto livre venha a precisar). `WriteChallenge` (componente) com props `{ value: string; onChange: (value: string) => void; status: "correct" | "wrong" | "none"; disabled?: boolean }`. Em `quiz.tsx`: estado novo `writtenAnswer: string`, e a introdução de duas variáveis derivadas, `isAnswerReady: boolean` e `isAnswerCorrect: () => boolean`, que os Tasks 5 e 6 estendem (ver o `switch (challenge.type)` introduzido nesta task).

- [ ] **Step 1: `normalizeAnswer` em `lib/utils.ts`**

Acrescenta, a seguir ao `cn`:
```ts
export const normalizeAnswer = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?,]+$/g, "");
};
```

- [ ] **Step 2: Criar `app/lesson/write-challenge.tsx`**

```tsx
type Props = {
  value: string;
  onChange: (value: string) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
};

export const WriteChallenge = ({ value, onChange, status, disabled }: Props) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoFocus
      placeholder="Escreve a tua resposta em inglês..."
      className={cn(
        "w-full rounded-xl border-2 p-4 text-base lg:text-lg outline-none",
        status === "correct" && "border-green-300 bg-green-100",
        status === "wrong" && "border-rose-300 bg-rose-100",
        status === "none" && "border-neutral-200 focus:border-neutral-400",
      )}
    />
  );
};
```
(importa `cn` de `@/lib/utils`.)

- [ ] **Step 3: Estado e scoring de `WRITE` em `quiz.tsx`**

Acrescenta o estado: `const [writtenAnswer, setWrittenAnswer] = useState("");`.

Introduz, logo antes de `onContinue`, o padrão que as Tasks 5 e 6 vão estender:
```ts
  const isAnswerReady = (() => {
    if (challenge?.type === "WRITE") return writtenAnswer.trim().length > 0;
    return !!selectedOption;
  })();

  const isAnswerCorrect = () => {
    if (challenge.type === "WRITE") {
      const accepted = options.filter((o) => o.correct).map((o) => normalizeAnswer(o.text));
      return accepted.includes(normalizeAnswer(writtenAnswer));
    }
    const correctOption = options.find((option) => option.correct);
    return !!correctOption && correctOption.id === selectedOption;
  };
```
(importa `normalizeAnswer` de `@/lib/utils`.)

Em `onContinue`, troca:
```ts
    const correctOption = options.find((option) => option.correct);

    if (!correctOption) {
      return;
    }

    if (correctOption.id === selectedOption) {
```
por:
```ts
    if (!isAnswerCorrect()) {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setStatus("wrong");

            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again."))
      });
      return;
    }

    {
```
(fecha essa chave extra `}` imediatamente antes do atual bloco `else { ... reduceHearts ... }`, e apaga esse bloco `else` inteiro — a lógica de erro já foi movida para cima. O bloco de sucesso, que já chama `upsertChallengeProgress`, fica como está, dentro do `if` que passa a ser `if (!isAnswerCorrect()) { ... return; } /* sucesso */ startTransition(() => { upsertChallengeProgress(...) ... })`.)

No início de `onContinue`, troca a guarda:
```ts
  const onContinue = () => {
    if (!selectedOption) return;
```
por:
```ts
  const onContinue = () => {
    if (!isAnswerReady) return;
```

Em `onSelect`/reset de estado (dentro de `onContinue`, nos ramos `status === "wrong"` e `status === "correct"`), onde hoje faz `setSelectedOption(undefined)`, acrescenta `setWrittenAnswer("")` logo a seguir (nos dois sítios).

- [ ] **Step 4: Renderizar `WriteChallenge` quando `challenge.type === "WRITE"`**

Em `quiz.tsx`, onde hoje `<Challenge ... />` é sempre renderizado, troca por uma renderização condicional:
```tsx
              {challenge.type === "WRITE" ? (
                <WriteChallenge
                  value={writtenAnswer}
                  onChange={setWrittenAnswer}
                  status={status}
                  disabled={pending}
                />
              ) : (
                <Challenge
                  options={options}
                  onSelect={onSelect}
                  status={status}
                  selectedOption={selectedOption}
                  disabled={pending}
                  type={challenge.type}
                />
              )}
```
(importa `WriteChallenge` de `./write-challenge`.)

Troca também o `disabled` do `<Footer ... />` de `disabled={pending || !selectedOption}` para `disabled={pending || !isAnswerReady}`.

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/utils.ts app/lesson/write-challenge.tsx app/lesson/quiz.tsx
git commit -m "feat: add WRITE challenge type"
```

(A verificação manual deste tipo só é prática depois da Task 9 inserir conteúdo `WRITE` real — fica coberta lá.)

---

### Task 5: Tipo de desafio `ARRANGE`

**Files:**
- Create: `app/lesson/arrange-challenge.tsx`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `challengesEnum` inclui `"ARRANGE"` (Task 1); o padrão `isAnswerReady`/`isAnswerCorrect` introduzido na Task 4.
- Produces: estado novo em `quiz.tsx`, `arrangedTileIds: number[]`. `ArrangeChallenge` (componente) com props `{ options: typeof challengeOptions.$inferSelect[]; selectedIds: number[]; onToggle: (id: number) => void; status: "correct" | "wrong" | "none"; disabled?: boolean }`.

- [ ] **Step 1: Criar `app/lesson/arrange-challenge.tsx`**

Mostra duas zonas: a frase em construção (os blocos já escolhidos, pela ordem em que foram tocados — tocar num bloco já escolhido remove-o, tal como os últimos a seguir) e o banco de blocos disponíveis (todas as opções, menos as já escolhidas). A ordem dos blocos no banco é baralhada uma vez quando o desafio muda (`useMemo` sobre `options.map(o => o.id)`, com `Math.random()` no comparador de `sort`, recalculado sempre que o array de `options` muda de identidade — o React dá um array novo a cada desafio porque vem de `challenges[activeIndex].challengeOptions`).

```tsx
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { challengeOptions } from "@/db/schema";

type Props = {
  options: typeof challengeOptions.$inferSelect[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
};

export const ArrangeChallenge = ({ options, selectedIds, onToggle, status, disabled }: Props) => {
  const bankOrder = useMemo(() => {
    return [...options].sort(() => Math.random() - 0.5).map((o) => o.id);
  }, [options]);

  const byId = new Map(options.map((o) => [o.id, o]));
  const available = bankOrder.filter((id) => !selectedIds.includes(id));

  return (
    <div className="flex flex-col gap-y-6">
      <div className={cn(
        "flex flex-wrap gap-2 min-h-[48px] border-b-2 pb-4",
        status === "correct" && "border-green-300",
        status === "wrong" && "border-rose-300",
      )}>
        {selectedIds.map((id) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-sky-300 bg-sky-100 px-3 py-2 text-sm lg:text-base"
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((id) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm hover:bg-black/5 lg:text-base"
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Estado e scoring de `ARRANGE` em `quiz.tsx`**

Acrescenta o estado: `const [arrangedTileIds, setArrangedTileIds] = useState<number[]>([]);` e o handler:
```ts
  const onToggleTile = (id: number) => {
    if (status !== "none") return;
    setArrangedTileIds((prev) =>
      prev.includes(id) ? prev.filter((tileId) => tileId !== id) : [...prev, id]
    );
  };
```

Estende `isAnswerReady` (de `app/lesson/quiz.tsx`, Task 4) acrescentando o ramo `ARRANGE` antes do `return !!selectedOption;`:
```ts
    if (challenge?.type === "ARRANGE") return arrangedTileIds.length > 0;
```

Estende `isAnswerCorrect` (mesmo ficheiro) acrescentando, antes do `const correctOption = ...` final:
```ts
    if (challenge.type === "ARRANGE") {
      const correctIds = options.filter((o) => o.correct).map((o) => o.id).sort((a, b) => a - b);
      return (
        arrangedTileIds.length === correctIds.length &&
        arrangedTileIds.every((id, i) => id === correctIds[i])
      );
    }
```

Nos dois sítios da Task 4 onde `setWrittenAnswer("")` foi acrescentado (reset ao avançar/tentar de novo), acrescenta também `setArrangedTileIds([])` a seguir.

- [ ] **Step 3: Renderizar `ArrangeChallenge` quando `challenge.type === "ARRANGE"`**

Na renderização condicional introduzida na Task 4, acrescenta mais um ramo antes do `else` genérico:
```tsx
              {challenge.type === "WRITE" ? (
                <WriteChallenge ... />
              ) : challenge.type === "ARRANGE" ? (
                <ArrangeChallenge
                  options={options}
                  selectedIds={arrangedTileIds}
                  onToggle={onToggleTile}
                  status={status}
                  disabled={pending}
                />
              ) : (
                <Challenge ... />
              )}
```
(importa `ArrangeChallenge` de `./arrange-challenge`.)

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add app/lesson/arrange-challenge.tsx app/lesson/quiz.tsx
git commit -m "feat: add ARRANGE challenge type"
```

(Verificação manual fica coberta na Task 9, com conteúdo `ARRANGE` real.)

---

### Task 6: Tipo de desafio `DIALOGUE` (bónus) e ícone de lição bónus

**Files:**
- Create: `app/lesson/dialogue.tsx`
- Modify: `app/lesson/quiz.tsx`
- Modify: `app/(main)/learn/lesson-button.tsx`
- Modify: `app/(main)/learn/unit.tsx`

**Interfaces:**
- Consumes: `challengesEnum` inclui `"DIALOGUE"`, `lessons.isBonus` (Task 1); o padrão `isAnswerReady`/`isAnswerCorrect` (Task 4).
- Produces: `Dialogue` (componente) com prop `{ script: string }`. `LessonButton` ganha a prop `isBonus?: boolean`.

- [ ] **Step 1: Criar `app/lesson/dialogue.tsx`**

O `script` vem em `challenge.question`, uma fala por linha, convenção `"Nome: fala"` (ver spec). Separa por `\n`, cada linha em `"Nome:"` + resto; alterna o lado (esquerda/direita) por índice de linha, não por nome (mantém-se consistente mesmo com mais de duas personagens).

```tsx
type Props = {
  script: string;
};

export const Dialogue = ({ script }: Props) => {
  const lines = script.split("\n").filter(Boolean);

  return (
    <div className="flex flex-col gap-y-3">
      {lines.map((line, i) => {
        const [speaker, ...rest] = line.split(":");
        const text = rest.join(":").trim();
        const isRight = i % 2 === 1;

        return (
          <div
            key={i}
            className={`flex ${isRight ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[80%] rounded-xl border-2 p-3">
              <p className="mb-1 text-xs font-bold text-neutral-400">{speaker.trim()}</p>
              <p className="text-sm lg:text-base">{text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: `DIALOGUE` é sempre "certo" ao avançar, em `quiz.tsx`**

Estende `isAnswerReady` (Task 4) acrescentando, antes do ramo `ARRANGE`:
```ts
    if (challenge?.type === "DIALOGUE") return true;
```

Estende `isAnswerCorrect` acrescentando, antes do ramo `ARRANGE`:
```ts
    if (challenge.type === "DIALOGUE") return true;
```

- [ ] **Step 3: Renderizar `Dialogue` quando `challenge.type === "DIALOGUE"`**

Na mesma renderização condicional (Tasks 4 e 5), acrescenta mais um ramo:
```tsx
              {challenge.type === "WRITE" ? (
                <WriteChallenge ... />
              ) : challenge.type === "ARRANGE" ? (
                <ArrangeChallenge ... />
              ) : challenge.type === "DIALOGUE" ? (
                <Dialogue script={challenge.question} />
              ) : (
                <Challenge ... />
              )}
```
(importa `Dialogue` de `./dialogue`.) Note também que o título acima (`title`, hoje `challenge.type === "ASSIST" ? "Select the correct meaning" : challenge.question`) não deve repetir o diálogo — acrescenta `challenge.type === "DIALOGUE" ? "Read the dialogue" :` como primeira opção desse ternário, antes do caso `"ASSIST"`.

- [ ] **Step 4: Ícone de lição bónus em `LessonButton`**

Em `app/(main)/learn/lesson-button.tsx`: importa `Zap` de `lucide-react` (junto a `Check, Crown, Star`), acrescenta a prop `isBonus?: boolean;` ao tipo `Props` e à desestruturação, e troca:
```ts
  const Icon = isCompleted ? Check : isLast ? Crown : Star;
```
por:
```ts
  const Icon = isCompleted ? Check : isBonus ? Zap : isLast ? Crown : Star;
```

- [ ] **Step 5: `Unit` passa `isBonus` para `LessonButton`**

Em `app/(main)/learn/unit.tsx`, dentro do `.map`, acrescenta `isBonus={lesson.isBonus}` nas props de `<LessonButton>` (o campo já vem no objeto `lesson` por vir direto da tabela `lessons`, sem precisar de alterar nenhuma query).

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add app/lesson/dialogue.tsx app/lesson/quiz.tsx "app/(main)/learn/lesson-button.tsx" "app/(main)/learn/unit.tsx"
git commit -m "feat: add DIALOGUE challenge type and bonus lesson icon"
```

(Verificação manual fica coberta na Task 9, com uma lição bónus real.)

---

### Task 7: Áudio do enunciado (ouvir antes de responder) e ordem aleatória

**Files:**
- Create: `app/lesson/audio-prompt.tsx`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `challenges.audioSrc` (Task 1).
- Produces: `AudioPrompt` (componente) com props `{ src: string; onPlayed: () => void }`. Em `quiz.tsx`, estado novo `hasPlayedAudio: boolean`, estendendo `isAnswerReady` (Task 4) para exigir `hasPlayedAudio` quando o desafio tem áudio.

- [ ] **Step 1: Criar `app/lesson/audio-prompt.tsx`**

Botão "Ouvir" que toca o áudio (pode repetir-se); a primeira vez que é tocado chama `onPlayed`.

```tsx
import { Volume2 } from "lucide-react";
import { useAudio } from "react-use";

type Props = {
  src: string;
  onPlayed: () => void;
};

export const AudioPrompt = ({ src, onPlayed }: Props) => {
  const [audio, _state, controls] = useAudio({ src });

  return (
    <div className="flex items-center justify-center py-6">
      {audio}
      <button
        type="button"
        onClick={() => {
          controls.play();
          onPlayed();
        }}
        className="flex items-center gap-x-2 rounded-xl border-2 border-neutral-200 px-6 py-3 hover:bg-black/5"
      >
        <Volume2 className="h-6 w-6" />
        Ouvir
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Esconder o enunciado e exigir áudio antes de responder, em `quiz.tsx`**

Acrescenta o estado: `const [hasPlayedAudio, setHasPlayedAudio] = useState(false);`.

Estende `isAnswerReady` (Task 4) envolvendo o resultado atual: troca a primeira linha do corpo da função (o `(() => { ... })()` do Step 3 da Task 4) para verificar o áudio primeiro —
```ts
  const isAnswerReady = (() => {
    if (challenge?.audioSrc && !hasPlayedAudio) return false;
    if (challenge?.type === "WRITE") return writtenAnswer.trim().length > 0;
    if (challenge?.type === "ARRANGE") return arrangedTileIds.length > 0;
    if (challenge?.type === "DIALOGUE") return true;
    return !!selectedOption;
  })();
```
(esta troca substitui integralmente a função já estendida pelas Tasks 4, 5 e 6 — fica uma só função com os quatro `if`, pela ordem acima, mais o `return` final.)

Nos dois sítios de reset (Tasks 4/5, ao avançar/tentar de novo), acrescenta `setHasPlayedAudio(false)`.

- [ ] **Step 3: Esconder o texto do enunciado e mostrar o `AudioPrompt` quando há áudio**

No JSX de `quiz.tsx`, onde hoje `<h1>{title}</h1>` mostra sempre o texto, troca por:
```tsx
            {challenge.audioSrc ? (
              <AudioPrompt
                key={challenge.id}
                src={challenge.audioSrc}
                onPlayed={() => setHasPlayedAudio(true)}
              />
            ) : (
              <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                {title}
              </h1>
            )}
```
(o `key={challenge.id}` garante que o `AudioPrompt` — e o estado interno do `useAudio` lá dentro — remonta a cada desafio novo, em vez de reaproveitar o `<audio>` do desafio anterior. Importa `AudioPrompt` de `./audio-prompt`.) A bolha `QuestionBubble` (para `ASSIST`) continua a aparecer por baixo tal como hoje — se um desafio `ASSIST` tiver áudio, o texto da bolha (que mostra a frase em português a traduzir) não é o enunciado em inglês escondido, por isso não precisa de mudar.

- [ ] **Step 4: Baralhar a ordem no cliente**

Em `quiz.tsx`, troca:
```ts
  const [challenges] = useState(initialLessonChallenges);
```
por:
```ts
  const [challenges] = useState(() => {
    const withoutAudio = initialLessonChallenges.filter((c) => !c.audioSrc);
    const withAudio = initialLessonChallenges.filter((c) => c.audioSrc);
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    return [...shuffle(withoutAudio), ...shuffle(withAudio)];
  });
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add app/lesson/audio-prompt.tsx app/lesson/quiz.tsx
git commit -m "feat: gate answering on listening first, shuffle non-audio challenges"
```

(Verificação manual — incluindo confirmar que a pessoa não consegue responder sem ouvir, e que os desafios com áudio aparecem no fim — fica coberta na Task 9, com áudio real gerado.)

---

### Task 8: Script de geração de áudio (TTS gratuito, uma vez)

**Files:**
- Create: `scripts/generate-audio.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: função `generateAudio(items: { slug: string; text: string }[]): Promise<void>` exportada de `scripts/generate-audio.ts`, que escreve `public/audio/<slug>.mp3` para cada item (salta os que já existem). Usada pela Task 9.

- [ ] **Step 1: Instalar a dependência**

```bash
npm install node-edge-tts
```

- [ ] **Step 2: Criar `scripts/generate-audio.ts`**

```ts
import fs from "fs";
import path from "path";
import { EdgeTTS } from "node-edge-tts";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export const generateAudio = async (items: { slug: string; text: string }[]) => {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const tts = new EdgeTTS({ voice: "en-US-AvaNeural" });

  for (const item of items) {
    const filePath = path.join(AUDIO_DIR, `${item.slug}.mp3`);

    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${item.slug} (already exists)`);
      continue;
    }

    console.log(`Generating ${item.slug}...`);
    await tts.ttsPromise(item.text, filePath);
  }
};
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-audio.ts package.json package-lock.json
git commit -m "feat: add one-time free TTS audio generation script"
```

(Este script não tem um "comando `npm run`" próprio — é importado e chamado pelo script de conteúdo da Task 9, que é o único sítio que sabe que frases precisam de áudio.)

---

### Task 9: Conteúdo novo — `WRITE`/`ARRANGE` em 6 lições existentes, 3 lições bónus com diálogo

**Files:**
- Create: `scripts/seed-interactive-content.ts`
- Modify: `package.json` (novo script `db:seed-interactive`)

**Interfaces:**
- Consumes: `schema.challenges` com `audioSrc` (Task 1), `schema.lessons` com `isBonus` (Task 1), `generateAudio` de `scripts/generate-audio.ts` (Task 8).

- [ ] **Step 1: Criar `scripts/seed-interactive-content.ts`**

Mesmo padrão de ligação à base de dados que `scripts/seed-english.ts` (`pg` + `drizzle-orm/node-postgres`, `config({ path: ".env.local" })`). O script:

1. Chama `generateAudio(...)` com as 12 frases abaixo, antes de inserir nada (os ficheiros ficam prontos em `public/audio/` para os caminhos usados a seguir).
2. Para cada uma das 6 lições existentes abaixo, busca o seu `id` (via `JOIN` lessons→units→courses, filtrando `courses.title = 'English'` e `lessons.title = '<nome>'`, tal como a robustez já usada no script anterior) e o maior `order` atual dos seus desafios (`SELECT max(order) FROM challenges WHERE lesson_id = ...`), e insere os desafios novos a partir de `maxOrder + 1`.
3. Para cada uma das 3 unidades, insere uma lição nova com `order = 5`, `isBonus = true`, e os desafios do diálogo + perguntas de compreensão, a partir de `order = 1` nessa lição nova (é uma lição nova, começa do zero).

Ficheiros de áudio a gerar (`generateAudio`, `slug` → `text`):
```ts
const audioItems = [
  { slug: "how-are-you", text: "How are you?" },
  { slug: "nice-to-meet-you", text: "Nice to meet you" },
  { slug: "we-are-students", text: "We are students" },
  { slug: "i-am-happy", text: "I am happy" },
  { slug: "lets-schedule-a-meeting", text: "Let's schedule a meeting" },
  { slug: "i-have-a-question", text: "I have a question" },
  { slug: "see-you-at-the-office", text: "See you at the office" },
  { slug: "have-a-good-weekend", text: "Have a good weekend" },
  { slug: "where-is-gate-five", text: "Where is gate five?" },
  { slug: "i-need-a-new-ticket", text: "I need a new ticket" },
  { slug: "can-i-have-the-bill", text: "Can I have the bill?" },
  { slug: "this-is-delicious", text: "This is delicious" },
];
```
Caminho de áudio usado nos desafios: `/audio/<slug>.mp3` (corresponde a `public/audio/<slug>.mp3`, gerado no passo 1).

**Lição "Cumprimentos" (unidade "Noções básicas") — 4 desafios novos, a seguir aos já existentes:**
- `WRITE`: pergunta `"Escreve em inglês: \"Boa noite\""`, opções: `{ text: "Good night", correct: true }`.
- `WRITE`, `audioSrc: "/audio/how-are-you.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{ text: "How are you?", correct: true }`.
- `ARRANGE`: pergunta `"Monta a frase: \"Como te chamas?\""`, opções: `{text:"What",correct:true}`, `{text:"is",correct:true}`, `{text:"your",correct:true}`, `{text:"name?",correct:true}`, `{text:"Where",correct:false}`, `{text:"How",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/nice-to-meet-you.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"Nice",correct:true}`, `{text:"to",correct:true}`, `{text:"meet",correct:true}`, `{text:"you",correct:true}`, `{text:"See",correct:false}`, `{text:"Good",correct:false}`.

**Lição "Be e Have" (unidade "Noções básicas") — 4 desafios novos:**
- `WRITE`: pergunta `"Escreve em inglês: \"Ele tem um cão\""`, opções: `{text:"He has a dog",correct:true}`.
- `WRITE`, `audioSrc: "/audio/we-are-students.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{text:"We are students",correct:true}`.
- `ARRANGE`: pergunta `"Monta a frase: \"Tu tens razão\""`, opções: `{text:"You",correct:true}`, `{text:"are",correct:true}`, `{text:"right",correct:true}`, `{text:"have",correct:false}`, `{text:"is",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/i-am-happy.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"I",correct:true}`, `{text:"am",correct:true}`, `{text:"happy",correct:true}`, `{text:"have",correct:false}`, `{text:"is",correct:false}`.

**Lição "Reuniões" (unidade "Inglês no trabalho") — 4 desafios novos:**
- `WRITE`: pergunta `"Escreve em inglês: \"Eu concordo totalmente\""`, opções: `{text:"I totally agree",correct:true}`.
- `WRITE`, `audioSrc: "/audio/lets-schedule-a-meeting.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{text:"Let's schedule a meeting",correct:true}`.
- `ARRANGE`: pergunta `"Monta a frase: \"Podemos adiar a reunião?\""`, opções: `{text:"Can",correct:true}`, `{text:"we",correct:true}`, `{text:"postpone",correct:true}`, `{text:"the",correct:true}`, `{text:"meeting?",correct:true}`, `{text:"cancel",correct:false}`, `{text:"start",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/i-have-a-question.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"I",correct:true}`, `{text:"have",correct:true}`, `{text:"a",correct:true}`, `{text:"question",correct:true}`, `{text:"need",correct:false}`, `{text:"am",correct:false}`.

**Lição "Conversas de trabalho" (unidade "Inglês no trabalho") — 4 desafios novos:**
- `WRITE`: pergunta `"Escreve em inglês: \"Tenho de ir\""`, opções: `{text:"I have to go",correct:true}`.
- `WRITE`, `audioSrc: "/audio/see-you-at-the-office.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{text:"See you at the office",correct:true}`.
- `ARRANGE`: pergunta `"Monta a frase: \"Vamos almoçar juntos?\""`, opções: `{text:"Shall",correct:true}`, `{text:"we",correct:true}`, `{text:"have",correct:true}`, `{text:"lunch",correct:true}`, `{text:"together?",correct:true}`, `{text:"dinner",correct:false}`, `{text:"meeting",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/have-a-good-weekend.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"Have",correct:true}`, `{text:"a",correct:true}`, `{text:"good",correct:true}`, `{text:"weekend",correct:true}`, `{text:"nice",correct:false}`, `{text:"day",correct:false}`.

**Lição "No aeroporto" (unidade "Inglês em viagem") — 4 desafios novos:**
- `WRITE`: pergunta `"Escreve em inglês: \"O meu voo foi cancelado\""`, opções: `{text:"My flight was cancelled",correct:true}`, `{text:"My flight was canceled",correct:true}`.
- `WRITE`, `audioSrc: "/audio/where-is-gate-five.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{text:"Where is gate five?",correct:true}`.
- `ARRANGE`: pergunta `"Monta a frase: \"Perdi o meu voo\""`, opções: `{text:"I",correct:true}`, `{text:"missed",correct:true}`, `{text:"my",correct:true}`, `{text:"flight",correct:true}`, `{text:"lost",correct:false}`, `{text:"passport",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/i-need-a-new-ticket.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"I",correct:true}`, `{text:"need",correct:true}`, `{text:"a",correct:true}`, `{text:"new",correct:true}`, `{text:"ticket",correct:true}`, `{text:"want",correct:false}`, `{text:"flight",correct:false}`.

**Lição "No restaurante" (unidade "Inglês em viagem") — 4 desafios novos:**
- `WRITE`: pergunta `"Escreve em inglês: \"Está muito bom\""`, opções: `{text:"It's very good",correct:true}`, `{text:"It is very good",correct:true}`.
- `WRITE`, `audioSrc: "/audio/can-i-have-the-bill.mp3"`: pergunta `"Escreve a frase que ouviste."`, opções: `{text:"Can I have the bill?",correct:true}`.
- `ARRANGE`: pergunta `"Monta a frase: \"Quero reservar uma mesa\""`, opções: `{text:"I",correct:true}`, `{text:"want",correct:true}`, `{text:"to",correct:true}`, `{text:"book",correct:true}`, `{text:"a",correct:true}`, `{text:"table",correct:true}`, `{text:"need",correct:false}`, `{text:"room",correct:false}`.
- `ARRANGE`, `audioSrc: "/audio/this-is-delicious.mp3"`: pergunta `"Ouve e monta a frase."`, opções: `{text:"This",correct:true}`, `{text:"is",correct:true}`, `{text:"delicious",correct:true}`, `{text:"was",correct:false}`, `{text:"great",correct:false}`.

**Lição bónus "Primeira conversa" (unidade "Noções básicas", `order: 5`, `isBonus: true`) — 3 desafios:**
- `DIALOGUE`: `question`: `"Leo: Hi! What's your name?\nJuba: Hi! I'm Juba. What's your name?\nLeo: I'm Leo. Nice to meet you!\nJuba: Nice to meet you too!"`, sem opções (array vazio).
- `SELECT`: pergunta `"O que a Juba perguntou ao Leo?"`, opções: `{text:"What's your name?",correct:true}`, `{text:"How are you?",correct:false}`, `{text:"Where are you from?",correct:false}`.
- `SELECT`: pergunta `"Quem disse \"Nice to meet you too!\"?"`, opções: `{text:"Juba",correct:true}`, `{text:"Leo",correct:false}`, `{text:"Nenhum dos dois",correct:false}`.

**Lição bónus "Uma reunião rápida" (unidade "Inglês no trabalho", `order: 5`, `isBonus: true`) — 3 desafios:**
- `DIALOGUE`: `question`: `"Leo: Can we start the meeting?\nJuba: Sure, I have a question first.\nLeo: Go ahead.\nJuba: Can we postpone the deadline?\nLeo: Let's discuss it after lunch."`, sem opções.
- `SELECT`: pergunta `"O que a Juba pergunta?"`, opções: `{text:"Se podem adiar o prazo",correct:true}`, `{text:"Se podem cancelar a reunião",correct:false}`, `{text:"Se podem almoçar juntos",correct:false}`.
- `SELECT`: pergunta `"Quando é que vão discutir o prazo?"`, opções: `{text:"Depois do almoço",correct:true}`, `{text:"Amanhã de manhã",correct:false}`, `{text:"Agora mesmo",correct:false}`.

**Lição bónus "No check-in do hotel" (unidade "Inglês em viagem", `order: 5`, `isBonus: true`) — 3 desafios:**
- `DIALOGUE`: `question`: `"Juba: Hi, I have a reservation.\nLeo: Great, what's your name?\nJuba: My name is Juba Silva.\nLeo: Here is your key. Room 204.\nJuba: Thank you! What time is breakfast?\nLeo: Breakfast is from 7 to 10."`, sem opções.
- `SELECT`: pergunta `"Qual é o número do quarto da Juba?"`, opções: `{text:"204",correct:true}`, `{text:"402",correct:false}`, `{text:"214",correct:false}`.
- `SELECT`: pergunta `"A que horas é o pequeno-almoço?"`, opções: `{text:"Das 7 às 10",correct:true}`, `{text:"Das 8 às 11",correct:false}`, `{text:"Das 6 às 9",correct:false}`.

Escreve o script com uma estrutura de dados em memória equivalente à das listas acima (um array por lição existente com `{lessonTitle, unitTitle, challenges: [...]}`, e um array por lição bónus com `{unitTitle, title, challenges: [...]}`), e duas funções, `insertIntoExistingLesson` e `insertBonusLesson`, chamadas em sequência — segue exatamente o mesmo estilo de `scripts/seed-english.ts` (inserir `challenge`, depois `.returning()` o `id`, depois `challengeOptions` com esse `challengeId`). Para `DIALOGUE`, insere a linha em `challenges` e **não** insere nenhuma linha em `challengeOptions` (array de opções vazio).

- [ ] **Step 2: Registar o script em `package.json`**

Na secção `"scripts"`, a seguir a `"db:seed-english"`, adiciona:
```json
    "db:seed-interactive": "tsx ./scripts/seed-interactive-content.ts",
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Correr o script**

Run: `npm run db:seed-interactive`
Expected: imprime o progresso da geração de áudio (`Generating ...` ou `Skipping ...` para cada uma das 12 frases) seguido da inserção dos desafios, sem erro.

- [ ] **Step 5: Verificar os ficheiros de áudio**

Run: `ls public/audio/*.mp3 | wc -l`
Expected: `12`.

- [ ] **Step 6: Verificar os desafios novos**

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT l.title, count(c.id) FROM challenges c JOIN lessons l ON c.lesson_id = l.id JOIN units u ON l.unit_id = u.id JOIN courses co ON u.course_id = co.id WHERE co.title = 'English' AND l.title IN ('Cumprimentos','Be e Have','Reuniões','Conversas de trabalho','No aeroporto','No restaurante') GROUP BY l.title;"`
Expected: cada uma das 6 lições mostra a contagem antiga + 4 (ex. "Cumprimentos" tinha 6, agora mostra 10).

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT title, is_bonus, \"order\" FROM lessons WHERE is_bonus = true ORDER BY id;"`
Expected: 3 linhas — "Primeira conversa", "Uma reunião rápida", "No check-in do hotel", todas com `is_bonus = t` e `order = 5`.

Run: `podman exec duolingo-clone-postgres psql -U lingo -d lingo -c "SELECT type, count(*) FROM challenges GROUP BY type ORDER BY type;"`
Expected: mostra `ARRANGE` (6), `ASSIST`/`SELECT` (os números de sempre + as 6 perguntas de compreensão novas em `SELECT`), `DIALOGUE` (3), `WRITE` (12).

- [ ] **Step 7: Verificação manual ponta-a-ponta no browser**

Com o servidor de dev a correr, sessão iniciada como Leonardo, curso "English" ativo:
- Abre a lição "Cumprimentos" (ou pratica-a de novo, se já estiver completa) e confirma que aparece pelo menos um desafio para escrever (campo de texto) e um para montar frase (blocos), espalhados entre os antigos — não todos seguidos.
- Confirma que um dos desafios esconde o texto e mostra só o botão "Ouvir", que o som toca, e que só depois de ouvir é que o botão de confirmar fica ativo.
- Confirma que esse desafio com áudio aparece depois dos outros, não no meio.
- No percurso de `/learn`, confirma que a 5ª posição de cada unidade do curso de Inglês mostra o ícone de raio (bónus), e que ao abrir essa lição aparece o diálogo como balões de conversa, seguido das perguntas, e que o botão de avançar no diálogo não precisa de nenhuma seleção.
- Completa um desafio da lição bónus e confirma no `psql` (`SELECT points FROM user_progress WHERE user_id = '...'`) que os pontos subiram 20, não 10.
- Escreve uma resposta errada deliberadamente a um desafio `WRITE` e confirma que aparece "Try again" (perde um coração), tal como um `SELECT` errado.

- [ ] **Step 8: Commit**

```bash
git add scripts/seed-interactive-content.ts package.json
git commit -m "feat: seed WRITE/ARRANGE content and bonus dialogue lessons with real audio"
```
