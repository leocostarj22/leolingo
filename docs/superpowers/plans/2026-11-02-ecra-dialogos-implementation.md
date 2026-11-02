# Ecrã dos desafios de diálogo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar aos desafios `DIALOGUE` balões com avatar/cor por falante (Leo azul, Juba rosa) e um cabeçalho decorativo só para esse tipo de desafio, mantendo a ação de sair.

**Architecture:** Duas peças independentes e independentemente revertíveis: (1) `app/lesson/dialogue.tsx` passa a mapear o nome do falante para avatar/cor/lado, com fallback seguro; (2) um novo componente `app/lesson/dialogue-header.tsx` é renderizado em `app/lesson/quiz.tsx` só quando `challenge.type === "DIALOGUE"`, no lugar do `Header` atual.

**Tech Stack:** Next.js 14 App Router, React, Tailwind, `lucide-react`, `zustand` (`useExitModal` já existente).

**Spec:** `docs/superpowers/specs/2026-11-02-ecra-dialogos-design.md`

## Global Constraints

- Este projeto não tem framework de testes automatizados. A verificação de cada tarefa é `npx tsc --noEmit` mais verificação manual (visual no browser quando disponível; quando a automação de browser não estiver disponível no ambiente de execução, a verificação visual fica para o Leonardo confirmar diretamente, como já aconteceu numa feature anterior deste projeto).
- `"Leo"` e `"Juba"` são os únicos nomes de falante confirmados em uso nos 71 desafios `DIALOGUE` existentes na base de dados.
- Os avatares já estão em `public/leo-mini.png` e `public/juba-mini.png` — não precisam de ser copiados de novo.
- A troca de cabeçalho acontece em `app/lesson/quiz.tsx`, nunca dentro do `Header` existente (`app/lesson/header.tsx` não é alterado).
- O botão de sair do cabeçalho novo tem de chamar `useExitModal().open` (de `@/store/use-exit-modal`) — o mesmo que o `Header` atual já usa — para abrir o `ExitModal` já existente.
- Sem feature flag: reverter esta funcionalidade é uma reversão normal de commits.

## Review Focus

- Uma linha do diálogo sem `:` (sem separador falante/texto) não pode rebentar nem mostrar um balão vazio — trata-se a linha toda como texto, sem nome nem avatar. → Tarefa 1.
- Um nome de falante que não seja `"Leo"` nem `"Juba"` não pode rebentar — cai para alternância por posição, sem avatar. → Tarefa 1.
- Uma lição que misture `DIALOGUE` com outros tipos não pode fazer o cabeçalho alternar repetidamente — `orderLessonChallenges` já coloca todos os `DIALOGUE` por completar no início da fila, e `DIALOGUE` nunca falha nem é reenviado para trás, por isso a troca de cabeçalho acontece no máximo uma vez por lição. → Tarefa 2.
- `percentage` em `0` e em `100` tem de dar um número de pontos preenchidos válido (nunca `NaN`, nunca fora de `0..5`). → Tarefa 2.
- O botão de sair no cabeçalho novo tem de abrir exatamente o mesmo modal de confirmação que o cabeçalho atual abre, não só parecer um botão. → Tarefa 2.

---

### Tarefa 1: Balões de diálogo com avatar e cor por falante

**Files:**
- Modify: `app/lesson/dialogue.tsx`

**Interfaces:**
- Consumes: nenhuma interface nova de outras tarefas.
- Produces: `Dialogue` continua a aceitar só `{ script: string }` — a assinatura pública não muda, só o interior.

- [ ] **Passo 1: Substituir a implementação de `app/lesson/dialogue.tsx`**

```tsx
import Image from "next/image";

type Props = {
  script: string;
};

type SpeakerStyle = {
  avatarSrc: string;
  side: "left" | "right";
  bubbleClassName: string;
};

const SPEAKER_STYLES: Record<string, SpeakerStyle> = {
  Leo: {
    avatarSrc: "/leo-mini.png",
    side: "left",
    bubbleClassName: "border-sky-400 bg-sky-50",
  },
  Juba: {
    avatarSrc: "/juba-mini.png",
    side: "right",
    bubbleClassName: "border-pink-400 bg-pink-50",
  },
};

export const Dialogue = ({ script }: Props) => {
  const lines = script.split("\n").filter(Boolean);

  return (
    <div className="flex flex-col gap-y-3">
      {lines.map((line, i) => {
        const [rawSpeaker, ...rest] = line.split(":");
        const hasColon = rest.length > 0;
        const speaker = hasColon ? rawSpeaker.trim() : "";
        const text = hasColon ? rest.join(":").trim() : line.trim();
        const style = SPEAKER_STYLES[speaker];
        const side = style?.side ?? (i % 2 === 1 ? "right" : "left");
        const isRight = side === "right";

        return (
          <div
            key={i}
            className={`flex items-end gap-x-2 ${isRight ? "justify-end" : "justify-start"}`}
          >
            {!isRight && style && (
              <Image src={style.avatarSrc} alt={speaker} height={36} width={36} className="rounded-full shrink-0" />
            )}
            <div className={`max-w-[75%] rounded-xl border-2 p-3 ${style?.bubbleClassName ?? ""}`}>
              {speaker && (
                <p className="mb-1 text-xs font-bold text-neutral-400">{speaker}</p>
              )}
              <p className="text-sm lg:text-base">{text}</p>
            </div>
            {isRight && style && (
              <Image src={style.avatarSrc} alt={speaker} height={36} width={36} className="rounded-full shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Passo 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 3 (Review Focus): Traçar os dois casos-limite à mão**

Para a linha `"Leo: Hi!"`: `rawSpeaker = "Leo"`, `hasColon = true`, `speaker = "Leo"`, `style = SPEAKER_STYLES.Leo` (avatar à esquerda, azul). Para a linha `"Oi tudo bem"` (sem `:`): `rawSpeaker` é a linha toda, `rest = []`, `hasColon = false`, `speaker = ""`, `text = "Oi tudo bem"`, `style = undefined` → sem avatar, sem nome, cai no `i % 2`. Para a linha `"Maria: Olá"` (falante desconhecido): `speaker = "Maria"`, `style = SPEAKER_STYLES["Maria"] = undefined` → sem avatar, mostra o nome "Maria", cai no `i % 2`. Nenhum dos três rebenta nem fica com um balão vazio.
Expected: os três casos acima, traçados contra o código do Passo 1, confirmam o comportamento descrito.

- [ ] **Passo 4: Verificação manual**

Com o servidor de desenvolvimento a correr, abrir uma lição com desafios `DIALOGUE` (ex.: lição "Cumprimentos") e confirmar visualmente: balões do Leo à esquerda com avatar azul, balões da Juba à direita com avatar rosa, nomes visíveis por cima do texto.
Expected: avatares e cores corretos por falante, texto legível, sem balões vazios.

- [ ] **Passo 5: Commit**

```bash
git add app/lesson/dialogue.tsx
git commit -m "feat: dialogue bubbles show speaker avatar and color (Leo/Juba)"
```

---

### Tarefa 2: Cabeçalho novo para desafios de diálogo

**Files:**
- Create: `app/lesson/dialogue-header.tsx`
- Modify: `app/lesson/quiz.tsx` (troca do `Header` por `DialogueHeader` quando `challenge.type === "DIALOGUE"`)

**Interfaces:**
- Consumes: `useExitModal` de `@/store/use-exit-modal` (já existente, `{ open: () => void }`).
- Produces: `DialogueHeader({ percentage: number })` — componente novo, usado só por `quiz.tsx`.

- [ ] **Passo 1: Criar `app/lesson/dialogue-header.tsx`**

```tsx
"use client";

import { X } from "lucide-react";

import { useExitModal } from "@/store/use-exit-modal";

const DOT_COUNT = 5;

type Props = {
  percentage: number;
};

export const DialogueHeader = ({ percentage }: Props) => {
  const { open } = useExitModal();
  const filledCount = Math.round((percentage / 100) * DOT_COUNT);

  return (
    <header className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 px-6 pb-8 pt-6">
      <span className="absolute left-4 top-10 text-2xl" aria-hidden>🍃</span>
      <span className="absolute right-6 top-16 text-2xl" aria-hidden>🐾</span>
      <span className="absolute right-10 bottom-4 text-xl" aria-hidden>🐾</span>
      <div className="relative flex items-center justify-between">
        <button
          type="button"
          onClick={open}
          aria-label="Sair da lição"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-x-2 rounded-full bg-white/90 px-3 py-2 shadow">
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <span
              key={i}
              className={
                i < filledCount
                  ? "h-3 w-3 rounded-full bg-emerald-500"
                  : i === filledCount
                  ? "h-3 w-3 rounded-full border-2 border-emerald-500"
                  : "h-3 w-3 rounded-full border-2 border-slate-300"
              }
            />
          ))}
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Passo 2: Trocar o cabeçalho em `app/lesson/quiz.tsx`**

Adicionar `import { DialogueHeader } from "./dialogue-header";` junto aos outros imports locais. Substituir o bloco (perto da linha 337, logo depois de `{correctAudio}`):

```tsx
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />
```

por:

```tsx
      {challenge.type === "DIALOGUE" ? (
        <DialogueHeader percentage={percentage} />
      ) : (
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription?.isActive}
        />
      )}
```

`challenge` já está garantidamente não-nulo neste ponto (o ecrã de conclusão, onde `challenge` é `undefined`, já retornou mais acima na função).

- [ ] **Passo 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 4 (Review Focus): Traçar os casos-limite de `percentage`**

Para `percentage = 0`: `filledCount = Math.round(0) = 0` — nenhum ponto preenchido, o primeiro ponto (`i === 0`) fica no estado "atual" (contorno verde), os restantes cinzentos. Para `percentage = 100`: `filledCount = Math.round(5) = 5` — todos os 5 pontos preenchidos, nenhum "atual" (já que `i === filledCount` nunca é verdadeiro para `i` até `DOT_COUNT - 1 = 4`). Nenhum dos dois casos dá `NaN` nem um índice fora de `0..5`.
Expected: os dois casos acima, traçados contra o código do Passo 1, confirmam o comportamento descrito.

- [ ] **Passo 5 (Review Focus): Confirmar que o cabeçalho não alterna dentro da mesma lição**

Ler `app/lesson/order-challenges.ts`: `orderLessonChallenges` coloca todos os `DIALOGUE` por completar no início da fila (antes dos restantes, baralhados), e `DIALOGUE` nunca é marcado como errado (`isAnswerCorrect` em `quiz.tsx` devolve sempre `true` para `DIALOGUE`), por isso nunca volta a aparecer depois de completado dentro da mesma sessão. Isto garante que `challenge.type === "DIALOGUE"` só é verdadeiro para um bloco contíguo no início da fila — o cabeçalho muda no máximo uma vez por lição.
Expected: leitura do ficheiro confirma esta garantia; não é preciso código novo para isto.

- [ ] **Passo 6 (Review Focus): Verificação manual — botão de sair**

Com o servidor de desenvolvimento a correr, abrir uma lição com desafios `DIALOGUE`, clicar no botão de sair do cabeçalho novo.
Expected: abre o mesmo modal "Wait, don't go!" que o `Header` atual já abre (`components/modals/exit-modal.tsx`), com os mesmos botões "Keep learning"/"End session".

- [ ] **Passo 7: Verificação manual — ecrã completo**

Abrir uma lição com desafios `DIALOGUE` seguidos de outros tipos (ex.: lição "Cumprimentos", que tem o diálogo 102 no início).
Expected: o cabeçalho ilustrado (banner, pontos de progresso) aparece durante os desafios de diálogo, sem corações; ao passar para o primeiro desafio não-`DIALOGUE`, o cabeçalho troca para o atual (X, barra, corações) e não volta a trocar dentro da mesma lição.

- [ ] **Passo 8: Commit**

```bash
git add app/lesson/dialogue-header.tsx app/lesson/quiz.tsx
git commit -m "feat: dedicated decorative header for dialogue challenges"
```
