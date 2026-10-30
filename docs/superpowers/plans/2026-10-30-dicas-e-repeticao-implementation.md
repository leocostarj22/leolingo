# Dicas e Repetição de Desafios Errados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao errar um desafio na lição, o utilizador avança de imediato para o seguinte em vez de repetir no mesmo sítio; o desafio errado volta para o fundo da fila e reaparece mais tarde com uma pista específica do seu tipo; se voltar a errar já com a pista, a resposta certa é revelada.

**Architecture:** `app/lesson/quiz.tsx` deixa de usar um array fixo + `activeIndex`; passa a usar uma fila rotativa (`queue`) onde o desafio ativo é sempre `queue[0]`: acertar remove o primeiro elemento, errar move-o para o fim. Um mapa `wrongAttempts` por id de desafio decide quando mostrar pista (reaparição) e quando revelar a resposta (nova submissão errada já com pista). O progresso deixa de ser incrementado manualmente e passa a ser derivado de um conjunto `completedIds` sobre um total fixo de desafios.

**Tech Stack:** Next.js App Router (client component `"use client"`), React `useState`/`useEffect`, sem framework de testes automatizado neste repositório (como no plano anterior desta funcionalidade).

**Spec:** docs/superpowers/specs/2026-10-30-dicas-e-repeticao-design.md

## Global Constraints

- Sem framework de testes automatizado no repositório — a verificação de cada tarefa é `npx tsc --noEmit` + verificação manual no browser (login real como Leonardo, via a mesma automação CDP usada no plano anterior), exceto onde indicado como verificação por leitura de código.
- Commits desta sessão não incluem linha de co-autoria (instrução explícita do utilizador, ainda em vigor).
- Textos novos introduzidos por este plano (frases de pista, frase de revelação da resposta) são em português, consistentes com o placeholder já em português de `write-challenge.tsx` ("Escreve a tua resposta em inglês..."). O rótulo do botão do `Footer` para o estado "wrong" muda de "Retry" para "Continue" (inglês), para ficar consistente com os outros rótulos do mesmo componente ("Check", "Next", "Continue"), que são todos em inglês — só o texto explicativo por cima muda de idioma, não os rótulos dos botões.
- A fila rotativa (`queue`) é sempre inicializada a partir de `initialLessonChallenges`, nunca de uma nova chamada ao servidor — nenhuma rota ou query muda neste plano.
- `app/lesson/order-challenges.ts` não muda de comportamento — só o comentário que já não descreve a realidade (menciona "resume at the first uncompleted index", mecanismo removido neste plano) é corrigido.

## Review Focus

- Esgotar corações a meio de uma submissão errada (`reduceHearts` devolve `{error: "hearts"}`): o modal de corações deve abrir e `wrongAttempts`/a revelação da resposta não devem ser avançados nesse desafio — senão um utilizador sem corações fica com uma pista "grátis" sem ter efetivamente errado. Teste na Task 1.
- Lição com um único desafio: errar deve rodar a fila de um elemento (continua no topo) sem nunca entrar em ciclo infinito nem crescer o total usado na percentagem. Verificado por leitura de código na Task 1 (não há lição de um só desafio nos dados semeados).
- Modo prática (lição já 100% completa a ser repetida): `completedIds` e `wrongAttempts` arrancam vazios a cada sessão de prática, logo um desafio que o utilizador erre nesta sessão de prática deve mostrar pista na sua reaparição dentro da mesma sessão, mesmo já tendo sido respondido certo em sessões passadas. Teste na Task 1.
- DIALOGUE nunca aciona `wrongAttempts` (a sua `isAnswerCorrect` é sempre `true`): confirmar que continua a ser removido da fila ao primeiro "Continue", nunca rodando para o fim. Teste na Task 1 (lição bónus já existente).
- Pista de ARRANGE (1ª peça pré-colocada) não deve, por si só, bastar para passar a resposta como certa quando a resposta completa tem mais do que uma peça — `isAnswerCorrect` de ARRANGE já exige o array completo correspondente; confirmar com submissão só com a peça pré-colocada. Teste na Task 4.

---

### Task 1: Fila rotativa, progresso derivado e revelação da resposta

**Files:**
- Modify: `app/lesson/quiz.tsx`
- Modify: `app/lesson/footer.tsx`
- Modify: `app/lesson/order-challenges.ts:9-12` (só o comentário)

**Interfaces:**
- Consumes: nada de tarefas anteriores (primeira tarefa do plano).
- Produces (para as Tasks 2-4, todas em `quiz.tsx`):
  - `queue: Props["initialLessonChallenges"]` (estado) — o desafio ativo é sempre `const challenge = queue[0]`; `const options = challenge?.challengeOptions ?? []` (nomes inalterados).
  - `wrongAttempts: Record<number, number>` (estado) + `setWrongAttempts`, indexado por `challenge.id`.
  - Um único `useEffect(() => { ... }, [challenge?.id])` que reinicia `selectedOption`, `writtenAnswer`, `arrangedTileIds` e `hasPlayedAudio` sempre que o desafio ativo muda (por avançar ou por rodar) — body exato nesta tarefa, estendido nas Tasks 3/4.
  - `Footer` ganha a prop `revealedAnswer?: string`.

- [ ] **Step 1: Substituir o modelo `challenges`/`activeIndex` por uma fila rotativa**

  Em `app/lesson/quiz.tsx`, remover `const [challenges] = useState(initialLessonChallenges);` e `const [activeIndex, setActiveIndex] = useState(...)`. Remover também `onNext` (`setActiveIndex((current) => current + 1)`), que deixa de ser necessário.

  Substituir por:
  ```ts
  const isPracticeSession = initialPercentage === 100;

  const [queue, setQueue] = useState(() =>
    isPracticeSession
      ? initialLessonChallenges
      : initialLessonChallenges.filter((c) => !c.completed)
  );
  const [completedIds, setCompletedIds] = useState<Set<number>>(() =>
    isPracticeSession
      ? new Set<number>()
      : new Set(initialLessonChallenges.filter((c) => c.completed).map((c) => c.id))
  );
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, number>>({});
  const totalChallengeCount = initialLessonChallenges.length;

  const challenge = queue[0];
  const options = challenge?.challengeOptions ?? [];
  const percentage = (completedIds.size / totalChallengeCount) * 100;
  ```
  Remover o antigo `const [percentage, setPercentage] = useState(...)` — a percentagem passa a ser sempre derivada, nunca estado próprio.

- [ ] **Step 2: Reset de estado por desafio via `useEffect`**

  Adicionar, a seguir às declarações de estado de resposta (`selectedOption`, `writtenAnswer`, `arrangedTileIds`, `hasPlayedAudio`):
  ```ts
  useEffect(() => {
    setSelectedOption(undefined);
    setWrittenAnswer("");
    setArrangedTileIds([]);
    setHasPlayedAudio(false);
  }, [challenge?.id]);
  ```
  Remover as linhas equivalentes que hoje fazem este reset manualmente dentro de `onContinue` (nos ramos `status === "wrong"` e `status === "correct"`) — o efeito acima passa a ser a única fonte deste reset.

- [ ] **Step 3: Revelação da resposta certa — função auxiliar**

  Adicionar em `quiz.tsx`, junto a `isAnswerCorrect`:
  ```ts
  const getCorrectAnswerText = () => {
    if (challenge.type === "WRITE") {
      return options.filter((o) => o.correct)[0]?.text ?? "";
    }
    if (challenge.type === "ARRANGE") {
      const byId = new Map(options.map((o) => [o.id, o]));
      const correctIds = options.filter((o) => o.correct).map((o) => o.id).sort((a, b) => a - b);
      return correctIds.map((id) => byId.get(id)?.text).join(" ");
    }
    return options.find((o) => o.correct)?.text ?? "";
  };
  ```
  Adicionar `const [revealedAnswer, setRevealedAnswer] = useState<string>();` junto aos outros estados de resposta.

- [ ] **Step 4: Reescrever `onContinue` para a fila rotativa**

  ```ts
  const onContinue = () => {
    if (pending) return;
    if (!isAnswerReady) return;

    if (status === "wrong") {
      setQueue((prev) => [...prev.slice(1), prev[0]]);
      setStatus("none");
      setRevealedAnswer(undefined);
      return;
    }

    if (status === "correct") {
      setQueue((prev) => prev.slice(1));
      setStatus("none");
      return;
    }

    if (!isAnswerCorrect()) {
      const alreadyFailedBefore = (wrongAttempts[challenge.id] ?? 0) >= 1;
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setWrongAttempts((prev) => ({
              ...prev,
              [challenge.id]: (prev[challenge.id] ?? 0) + 1,
            }));
            setRevealedAnswer(alreadyFailedBefore ? getCorrectAnswerText() : undefined);
            setStatus("wrong");

            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again."));
      });
      return;
    }

    startTransition(() => {
      upsertChallengeProgress(challenge.id)
        .then((response) => {
          if (response?.error === "hearts") {
            openHeartsModal();
            return;
          }

          correctControls.play();
          setCompletedIds((prev) => new Set(prev).add(challenge.id));
          setStatus("correct");

          if (isPracticeSession) {
            setHearts((prev) => Math.min(prev + 1, 5));
          }
        })
        .catch(() => toast.error("Something went wrong. Please try again."));
    });
  };
  ```
  Nota: `alreadyFailedBefore` lê `wrongAttempts` no momento do clique em "Check", antes da resposta assíncrona — nada mais altera esse valor entretanto, por isso não há condição de corrida.

- [ ] **Step 5: Atualizar o ecrã de conclusão e a chamada ao `Footer`**

  No ecrã final (`if (!challenge)`), trocar `challenges.length * (initialIsBonus ? 20 : 10)` por `totalChallengeCount * (initialIsBonus ? 20 : 10)`.

  Na chamada a `<Footer>`, passar `revealedAnswer={revealedAnswer}`.

- [ ] **Step 6: `Footer` — mensagem de revelação e rótulo do botão**

  Em `app/lesson/footer.tsx`, adicionar `revealedAnswer?: string;` ao tipo `Props` e ao destructuring. Trocar o bloco `status === "wrong"`:
  ```tsx
  {status === "wrong" && (
    <div className="text-rose-500 font-bold text-base lg:text-2xl flex items-center">
      <XCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
      {revealedAnswer ? `A resposta certa era: "${revealedAnswer}"` : "Try again."}
    </div>
  )}
  ```
  E o rótulo do botão: `{status === "wrong" && "Continue"}` (em vez de `"Retry"`).

- [ ] **Step 7: Corrigir o comentário desatualizado em `order-challenges.ts`**

  Em `app/lesson/order-challenges.ts:9-12`, o comentário atual explica que "Quiz resumes at the first uncompleted index and then just advances sequentially" — esse mecanismo foi removido na Task 1. Substituir por uma explicação de que `Quiz` filtra os `completed` da fila rotativa do lado do cliente (exceto em modo prática), pelo que a posição exata dos completos dentro deste array já não importa para a retoma — só a ordem relativa dos não-completos (DIALOGUE primeiro, depois baralhados) continua a ser usada.

- [ ] **Step 8: Verificar tipos**

  Run: `npx tsc --noEmit`
  Expected: sem erros.

- [ ] **Step 9: Verificação manual — fila rotativa e revelação**

  Via login real (Leonardo) e a mesma automação CDP do plano anterior, numa lição com várias perguntas SELECT/ASSIST (ex.: "Reuniões"):
  - Responder errado a uma pergunta: confirmar que avança de imediato para outra pergunta (não repete a mesma no lugar) e que um coração é perdido.
  - Continuar a responder; confirmar que a pergunta errada reaparece mais tarde na mesma lição.
  - Errar essa mesma pergunta outra vez (já reaparecida): confirmar que o `Footer` mostra agora a resposta certa em vez de "Try again.", e que ainda assim volta para o fundo da fila.
  - Confirmar que a barra de progresso nunca ultrapassa 100% e que a lição só termina quando todas as perguntas tiverem sido acertadas pelo menos uma vez.
  Expected: todos os quatro pontos confirmados.

- [ ] **Step 10: Verificação manual — modo prática, DIALOGUE e corações esgotados**

  - Abrir uma lição já 100% completa em modo prática; confirmar que a lição arranca com todas as perguntas (não vazia) e que errar uma delas pela primeira vez nesta sessão de prática a faz reaparecer com pista mais tarde (mesmo já tendo sido acertada em sessões passadas).
  - Numa lição bónus com DIALOGUE, confirmar que o desafio DIALOGUE continua a avançar ao primeiro "Continue", nunca rodando para o fundo.
  - Reduzir os corações do utilizador de teste a 0 via `psql` antes de submeter uma resposta errada; confirmar que o modal de corações abre e que essa tentativa **não** incrementa `wrongAttempts` para esse desafio (confirmável reabrindo a lição depois de repor corações e verificando que a próxima vez que a pergunta aparece ainda não tem pista).
  Expected: os três pontos confirmados; reverter os corações de teste a 5 no fim via `psql`, como no plano anterior.

- [ ] **Step 11: Verificação por leitura de código — lição de um único desafio**

  Não há lições de um só desafio nos dados semeados; confirmar por leitura do `onContinue` reescrito que, com `queue.length === 1`, o ramo `wrong` executa `[...queue.slice(1), queue[0]]` = `[queue[0]]` (fila inalterada em conteúdo, mesmo desafio continua no topo) sem nunca remover nem duplicar o elemento, e que `percentage`/`totalChallengeCount` não dependem do tamanho atual de `queue`, logo não são afetados por rotações.
  Expected: confirmado por leitura, sem necessidade de dados novos.

- [ ] **Step 12: Commit**

  ```bash
  git add app/lesson/quiz.tsx app/lesson/footer.tsx app/lesson/order-challenges.ts
  git commit -m "feat: requeue wrong answers instead of retrying in place, reveal answer on repeat miss"
  ```

---

### Task 2: Pista em SELECT/ASSIST — eliminar uma opção errada

**Files:**
- Modify: `app/lesson/card.tsx`
- Modify: `app/lesson/challenge.tsx`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `challenge`, `options`, `wrongAttempts` da Task 1 (mesmos nomes, mesmo ficheiro).
- Produces: `Card` ganha a prop `eliminated?: boolean`; `Challenge` ganha a prop `eliminatedOptionId?: number`. Nenhuma tarefa posterior consome isto.

- [ ] **Step 1: `Card` aceita `eliminated`**

  Em `app/lesson/card.tsx`, adicionar `eliminated?: boolean;` ao tipo `Props` e ao destructuring. Em `handleClick`, trocar `if (disabled) return;` por `if (disabled || eliminated) return;`. No `className` do `<div>` principal, adicionar `eliminated && "opacity-40 pointer-events-none"` à lista de classes condicionais.

- [ ] **Step 2: `Challenge` propaga `eliminatedOptionId`**

  Em `app/lesson/challenge.tsx`, adicionar `eliminatedOptionId?: number;` ao tipo `Props` e ao destructuring. Em `options.map`, passar `eliminated={option.id === eliminatedOptionId}` ao `<Card>`.

- [ ] **Step 3: `quiz.tsx` calcula e passa `eliminatedOptionId`**

  Junto a onde `shuffledOptions` é usado, adicionar:
  ```ts
  const eliminatedOptionId =
    (challenge?.type === "SELECT" || challenge?.type === "ASSIST") &&
    (wrongAttempts[challenge.id] ?? 0) >= 1
      ? options.find((o) => !o.correct)?.id
      : undefined;
  ```
  Passar `eliminatedOptionId={eliminatedOptionId}` na chamada a `<Challenge>`.

- [ ] **Step 4: Verificar tipos**

  Run: `npx tsc --noEmit`
  Expected: sem erros.

- [ ] **Step 5: Verificação manual**

  Numa lição com perguntas SELECT ou ASSIST, errar uma pergunta de propósito, deixá-la reaparecer, e confirmar que uma das opções erradas aparece visivelmente desativada (esbatida, não clicável) — e que a opção correta nunca é essa.
  Expected: confirmado.

- [ ] **Step 6: Commit**

  ```bash
  git add app/lesson/card.tsx app/lesson/challenge.tsx app/lesson/quiz.tsx
  git commit -m "feat: hint — eliminate one wrong option on SELECT/ASSIST retry"
  ```

---

### Task 3: Pista em WRITE — inicial e número de palavras

**Files:**
- Modify: `app/lesson/write-challenge.tsx`
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: `challenge`, `options`, `wrongAttempts` da Task 1.
- Produces: `WriteChallenge` ganha a prop `hint?: string`. Nenhuma tarefa posterior consome isto.

- [ ] **Step 1: `WriteChallenge` mostra `hint`**

  Em `app/lesson/write-challenge.tsx`, adicionar `hint?: string;` ao tipo `Props` e ao destructuring. Depois do `<input>`, adicionar:
  ```tsx
  {hint && (
    <p className="text-sm text-neutral-500 mt-2">{hint}</p>
  )}
  ```

- [ ] **Step 2: `quiz.tsx` calcula `writeHint`**

  ```ts
  const writeHint = (() => {
    if (challenge?.type !== "WRITE" || (wrongAttempts[challenge.id] ?? 0) < 1) return undefined;
    const accepted = options.filter((o) => o.correct)[0];
    if (!accepted) return undefined;
    const wordCount = accepted.text.trim().split(/\s+/).length;
    return `Começa por "${accepted.text[0].toUpperCase()}..." e tem ${wordCount} ${wordCount === 1 ? "palavra" : "palavras"}.`;
  })();
  ```
  Passar `hint={writeHint}` na chamada a `<WriteChallenge>`.

- [ ] **Step 3: Verificar tipos**

  Run: `npx tsc --noEmit`
  Expected: sem erros.

- [ ] **Step 4: Verificação manual**

  Numa lição com perguntas WRITE, errar de propósito, deixar reaparecer, e confirmar que a frase de pista aparece por baixo do campo de resposta com a inicial e o número de palavras corretos.
  Expected: confirmado.

- [ ] **Step 5: Commit**

  ```bash
  git add app/lesson/write-challenge.tsx app/lesson/quiz.tsx
  git commit -m "feat: hint — show first letter and word count on WRITE retry"
  ```

---

### Task 4: Pista em ARRANGE — primeira peça pré-colocada

**Files:**
- Modify: `app/lesson/quiz.tsx`

**Interfaces:**
- Consumes: o `useEffect` de reset por desafio da Task 1 (Step 2), para estender.
- Produces: nada consumido por tarefas posteriores (última tarefa do plano).

- [ ] **Step 1: Estender o `useEffect` de reset para pré-colocar a primeira peça certa**

  Substituir o corpo do `useEffect(() => { ... }, [challenge?.id])` da Task 1 por:
  ```ts
  useEffect(() => {
    setSelectedOption(undefined);
    setWrittenAnswer("");
    setHasPlayedAudio(false);

    if (challenge?.type === "ARRANGE" && (wrongAttempts[challenge.id] ?? 0) >= 1) {
      const correctIds = options.filter((o) => o.correct).map((o) => o.id).sort((a, b) => a - b);
      setArrangedTileIds(correctIds.length > 0 ? [correctIds[0]] : []);
    } else {
      setArrangedTileIds([]);
    }
  }, [challenge?.id]);
  ```

- [ ] **Step 2: Verificar tipos**

  Run: `npx tsc --noEmit`
  Expected: sem erros.

- [ ] **Step 3: Verificação manual — pré-colocação e exigência de resposta completa**

  Numa lição com perguntas ARRANGE, errar de propósito, deixar reaparecer, e confirmar que a primeira peça certa já está na tira de resposta. Submeter a resposta só com essa peça (sem adicionar mais nenhuma): confirmar que é avaliada como errada (a menos que a resposta completa tenha mesmo uma só peça). Adicionar as restantes peças pela ordem certa e confirmar que passa a ser avaliada como certa.
  Expected: ambos os casos confirmados.

- [ ] **Step 4: Commit**

  ```bash
  git add app/lesson/quiz.tsx
  git commit -m "feat: hint — pre-place first correct tile on ARRANGE retry"
  ```
