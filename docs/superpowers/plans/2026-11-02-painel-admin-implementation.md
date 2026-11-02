# Painel de Administrador (gestão de contas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao Leonardo um painel de administrador para gerir contas de utilizador (corações, pontos, Pro simulado, perfil, reposição de progresso), restrito ao seu próprio id Clerk.

**Architecture:** Server actions em `actions/admin.ts` fazem as mutações, gated por `isAdmin()` (já existente, reutilizada); páginas Next.js App Router em `app/admin/users/` (lista + edição por utilizador) consomem funções de leitura novas em `db/admin-queries.ts`. Uma nova coluna `adminOverridePro` em `user_progress` simula a subscrição Pro sem tocar em `user_subscription`.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Postgres, Clerk (`@clerk/nextjs`), Tailwind, componentes `@/components/ui` existentes (`Button`, `Input`), `sonner` para toasts.

**Spec:** `docs/superpowers/specs/2026-11-02-painel-admin-design.md`

## Global Constraints

- Não existe framework de testes automatizados neste projeto (confirmado em `package.json`). Verificação por tarefa usa `npx tsc --noEmit`, consultas diretas via `podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "..."`, scripts `npx tsx -e "..."` para chamar funções diretamente, e passos manuais no browser — mesma convenção já usada na feature anterior deste projeto.
- Alterações de schema aplicam-se com `npm run db:push` (drizzle-kit push, sem ficheiros de migração neste projeto).
- A verificação de admin é a `isAdmin()` já existente em `lib/admin.ts` (sem parâmetros, lê `auth()` internamente). Não criar um segundo mecanismo de admin.
- `adminOverridePro` vive só em `user_progress`; nunca escrever em `user_subscription`.
- O campo de corações no painel aceita qualquer inteiro ≥ 0 (sem limite superior de 5).
- A rota `/admin` pertence à consola de conteúdo já existente (`app/admin/page.tsx` + `app/admin/app.tsx`) e não é tocada. O painel novo vive em `/admin/users` e `/admin/users/[userId]`.
- Trabalho direto em `main`, sem branch de funcionalidade (consentimento já dado pelo Leonardo neste projeto).
- `lib/admin.ts` já tem o id corrigido no working tree (não commitado) — a Tarefa 1 confirma e commita essa correção.

## Review Focus

- Um utilizador sem admin a aceder diretamente a `/admin/users` ou a chamar uma ação do painel (ex. via devtools) não deve conseguir ver dados de outra conta nem mutar nada — a página redireciona e a ação lança erro, mesmo que a página nunca tenha sido mostrada. → Tarefa 4 (ações) e Tarefa 6 (página de edição) têm um passo de verificação dedicado.
- Repor o progresso do curso para um utilizador sem `activeCourseId` (nunca escolheu curso) não deve apagar linhas de outro curso nem falhar de forma confusa — deve lançar um erro claro. → Tarefa 4.
- Abrir a página de edição com um `userId` que não existe em `user_progress` (id inválido ou já apagado) não deve rebentar com um erro 500 — deve mostrar "não encontrado". → Tarefa 6.
- Submeter corações/pontos com um valor negativo ou não-inteiro (ex. campo vazio convertido para `NaN`) deve ser rejeitado no servidor, não só escondido pela UI. → Tarefa 4.
- Ativar `adminOverridePro` numa conta que já tem uma subscrição Stripe real e ativa não pode corromper essa linha real nem impedir `createStripeUrl` de continuar a abrir o portal de faturação (precisa de `stripeCustomerId` real preservado). → Tarefa 2.

---

### Tarefa 1: Corrigir id de admin desatualizado

**Files:**
- Modify: `lib/admin.ts` (já editado no working tree, por commitar)

**Interfaces:**
- Produces: `isAdmin(): boolean` continua com a mesma assinatura; só a lista `adminIds` muda de valor.

- [ ] **Passo 1: Confirmar o conteúdo atual do ficheiro**

Ler `lib/admin.ts` e confirmar que `adminIds` contém exatamente `"user_3LN3ZpiSycpP83mFMmYe9D5cggd"` (id real do Leonardo) e já não contém `"user_2dGb6YEarBAQHrNYoB5dMtISRWK"`. Se o ficheiro ainda tiver o id antigo, corrigir agora.

- [ ] **Passo 2: Verificação manual**

Com o servidor de desenvolvimento a correr e sessão autenticada como Leonardo (`leocostadeveloper@icloud.com`), visitar `http://localhost:3000/admin`.
Expected: a consola react-admin de conteúdo carrega (não há redirecionamento para `/`).

- [ ] **Passo 3: Commit**

```bash
git add lib/admin.ts
git commit -m "fix: correct stale admin id in lib/admin.ts"
```

---

### Tarefa 2: Coluna `adminOverridePro` e suporte em `getUserSubscription`

**Files:**
- Modify: `db/schema.ts`
- Modify: `db/queries.ts`

**Interfaces:**
- Produces: coluna `userProgress.adminOverridePro: boolean` (default `false`, not null).
- Produces: `getUserSubscription(): Promise<{ isActive: boolean; stripeCustomerId: string | null } | null>` — assinatura de retorno estreitada (antes devolvia o objeto inteiro da linha de `user_subscription` mais `isActive`). Confirmado antes desta tarefa que todos os consumidores existentes só leem `.isActive` (`app/(main)/leaderboard`, `app/(main)/shop`, `app/(main)/learn`, `app/lesson/page.tsx`, `app/lesson/[lessonId]/page.tsx`, `actions/challenge-progress.ts`, `actions/user-progress.ts`) ou `.stripeCustomerId` (`actions/user-subscription.ts`).

- [ ] **Passo 1: Adicionar a coluna ao schema**

Em `db/schema.ts`, dentro de `userProgress`, acrescentar depois de `learningGoal`:

```ts
  adminOverridePro: boolean("admin_override_pro").notNull().default(false),
```

- [ ] **Passo 2: Aplicar a alteração de schema**

Run: `npm run db:push`
Expected: drizzle-kit reporta a coluna nova adicionada a `user_progress`, sem erros.

- [ ] **Passo 3: Atualizar `getUserSubscription` em `db/queries.ts`**

Substituir a implementação atual (linhas 245-265) por:

```ts
const DAY_IN_MS = 86_400_000;
export const getUserSubscription = cache(async (): Promise<{
  isActive: boolean;
  stripeCustomerId: string | null;
} | null> => {
  const { userId } = await auth();

  if (!userId) return null;

  const [subscriptionData, progressData] = await Promise.all([
    db.query.userSubscription.findFirst({
      where: eq(userSubscription.userId, userId),
    }),
    db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { adminOverridePro: true },
    }),
  ]);

  const adminOverridePro = progressData?.adminOverridePro ?? false;

  if (!subscriptionData) {
    return adminOverridePro
      ? { isActive: true, stripeCustomerId: null }
      : null;
  }

  const realIsActive =
    !!subscriptionData.stripePriceId &&
    subscriptionData.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return {
    isActive: realIsActive || adminOverridePro,
    stripeCustomerId: subscriptionData.stripeCustomerId,
  };
});
```

Manter a constante `DAY_IN_MS` existente (não duplicar se já estiver declarada acima).

- [ ] **Passo 4: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (confirma que nenhum consumidor lê um campo que deixou de existir no tipo de retorno).

- [ ] **Passo 5: Verificação manual — override isolado**

```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "UPDATE user_progress SET admin_override_pro = true WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
```

Visitar `http://localhost:3000/shop` autenticado como Leonardo.
Expected: o componente `Promo` (que só aparece quando `!isPro`) desaparece — confirma que `isActive` ficou `true` só por via do override.

```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "UPDATE user_progress SET admin_override_pro = false WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
```

Recarregar `/shop`. Expected: `Promo` volta a aparecer.

- [ ] **Passo 6 (Review Focus): Verificação manual — override com subscrição real coexistente**

```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "INSERT INTO user_subscription (user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end) VALUES ('user_3LN3ZpiSycpP83mFMmYe9D5cggd', 'cus_test_admin_override', 'sub_test_admin_override', 'price_test', NOW() + interval '30 days');"
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "UPDATE user_progress SET admin_override_pro = true WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
```

Run: `npx tsx -e "import('./db/queries').then(async (m) => { console.log(await m.getUserSubscription()); process.exit(0); })"`
Expected: imprime `{ isActive: true, stripeCustomerId: 'cus_test_admin_override' }` — confirma que `stripeCustomerId` real não foi anulado pelo override.

Limpar:
```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "DELETE FROM user_subscription WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "UPDATE user_progress SET admin_override_pro = false WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
```

- [ ] **Passo 7: Commit**

```bash
git add db/schema.ts db/queries.ts
git commit -m "feat: add adminOverridePro column and fold it into getUserSubscription"
```

---

### Tarefa 3: Funções de leitura para o painel (`db/admin-queries.ts`)

**Files:**
- Create: `db/admin-queries.ts`

**Interfaces:**
- Consumes: `db` de `@/db/drizzle`; tabelas `userProgress`, `units`, `lessons` de `@/db/schema`.
- Produces:
  - `getAllUserProgress(): Promise<Array<{ userId: string; userName: string; lastName: string | null; userImageSrc: string; hearts: number; points: number; englishLevel: EnglishLevel | null; learningGoal: LearningGoal | null; gender: Gender | null; adminOverridePro: boolean; activeCourse: { id: number; title: string } | null }>>`
  - `getUserProgressByIdForAdmin(userId: string): Promise<(mesma forma de um elemento do array acima com activeCourseId: number | null) | null>`
  - `getLessonsForCourse(courseId: number): Promise<Array<{ id: number; title: string; unitTitle: string }>>`
  - Tipos locais: `type EnglishLevel = NonNullable<typeof userProgress.$inferSelect["englishLevel"]>`, `type LearningGoal = NonNullable<typeof userProgress.$inferSelect["learningGoal"]>`, `type Gender = NonNullable<typeof userProgress.$inferSelect["gender"]>` — mesmo padrão já usado em `db/queries.ts`.

- [ ] **Passo 1: Implementar `getAllUserProgress`**

```ts
export const getAllUserProgress = async () => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { asc }) => [asc(userProgress.userName)],
    with: { activeCourse: true },
  });

  return data.map((row) => ({
    ...row,
    activeCourse: row.activeCourse
      ? { id: row.activeCourse.id, title: row.activeCourse.title }
      : null,
  }));
};
```

- [ ] **Passo 2: Implementar `getUserProgressByIdForAdmin`**

```ts
export const getUserProgressByIdForAdmin = async (userId: string) => {
  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: { activeCourse: true },
  });

  if (!data) return null;

  return {
    ...data,
    activeCourse: data.activeCourse
      ? { id: data.activeCourse.id, title: data.activeCourse.title }
      : null,
  };
};
```

- [ ] **Passo 3: Implementar `getLessonsForCourse`**

```ts
export const getLessonsForCourse = async (courseId: number) => {
  const unitsInCourse = await db.query.units.findMany({
    where: eq(units.courseId, courseId),
    orderBy: (units, { asc }) => [asc(units.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
      },
    },
  });

  return unitsInCourse.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      unitTitle: unit.title,
    })),
  );
};
```

- [ ] **Passo 4: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 5: Verificação manual**

Run: `npx tsx -e "import('./db/admin-queries').then(async (m) => { console.log(await m.getAllUserProgress()); console.log(await m.getUserProgressByIdForAdmin('user_3LN3ZpiSycpP83mFMmYe9D5cggd')); process.exit(0); })"`
Expected: imprime um array com pelo menos a linha do Leonardo e, de seguida, essa mesma linha isolada, ambos com `hearts`, `points`, `englishLevel`, `activeCourse` preenchidos corretamente (comparar com os valores reais conhecidos da conta).

Run: `npx tsx -e "import('./db/admin-queries').then(async (m) => { const u = await m.getUserProgressByIdForAdmin('user_3LN3ZpiSycpP83mFMmYe9D5cggd'); console.log(await m.getLessonsForCourse(u.activeCourseId)); process.exit(0); })"`
Expected: imprime a lista de lições do curso ativo do Leonardo, cada uma com `id`, `title`, `unitTitle`.

- [ ] **Passo 6: Commit**

```bash
git add db/admin-queries.ts
git commit -m "feat: add admin read queries for user list, single user, and course lessons"
```

---

### Tarefa 4: Ações do servidor do painel (`actions/admin.ts`)

**Files:**
- Create: `actions/admin.ts`

**Interfaces:**
- Consumes: `isAdmin` de `@/lib/admin`; `db` de `@/db/drizzle`; `userProgress`, `challengeProgress`, `challenges`, `lessons`, `units` de `@/db/schema`; `getUserProgressByIdForAdmin` de `@/db/admin-queries` (para `resetCourseProgress` obter `activeCourseId`).
- Produces:
  - `updateUserHeartsAndPoints(userId: string, hearts: number, points: number): Promise<void>`
  - `updateUserProfile(userId: string, data: { englishLevel: EnglishLevel | null; learningGoal: LearningGoal | null; gender: Gender | null }): Promise<void>`
  - `setAdminOverridePro(userId: string, enabled: boolean): Promise<void>`
  - `resetLessonProgress(userId: string, lessonId: number): Promise<void>`
  - `resetCourseProgress(userId: string): Promise<void>`

Cada função começa com:
```ts
"use server";
```
no topo do ficheiro, e cada ação individualmente começa por:
```ts
if (!isAdmin()) {
  throw new Error("Unauthorized");
}
```
antes de qualquer leitura ou escrita — defesa em profundidade, independente da página já ter bloqueado o acesso.

- [ ] **Passo 1: Implementar `updateUserHeartsAndPoints` com validação**

```ts
export const updateUserHeartsAndPoints = async (
  userId: string,
  hearts: number,
  points: number,
) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  if (!Number.isInteger(hearts) || hearts < 0) {
    throw new Error("Invalid hearts value");
  }

  if (!Number.isInteger(points) || points < 0) {
    throw new Error("Invalid points value");
  }

  await db.update(userProgress)
    .set({ hearts, points })
    .where(eq(userProgress.userId, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/shop");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
```

- [ ] **Passo 2: Implementar `updateUserProfile`**

Mesma estrutura (verificação `isAdmin()`, `db.update(userProgress).set({ englishLevel: data.englishLevel, learningGoal: data.learningGoal, gender: data.gender }).where(eq(userProgress.userId, userId))`, `revalidatePath` dos mesmos caminhos de `/admin/users/${userId}` e `/learn`).

- [ ] **Passo 3: Implementar `setAdminOverridePro`**

Mesma estrutura (`db.update(userProgress).set({ adminOverridePro: enabled }).where(eq(userProgress.userId, userId))`, `revalidatePath` de `/admin/users/${userId}`, `/shop`, `/learn`, `/quests`, `/leaderboard`).

- [ ] **Passo 4: Implementar `resetLessonProgress`**

```ts
export const resetLessonProgress = async (userId: string, lessonId: number) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  const challengesInLesson = await db.query.challenges.findMany({
    where: eq(challenges.lessonId, lessonId),
    columns: { id: true },
  });

  const challengeIds = challengesInLesson.map((c) => c.id);

  if (challengeIds.length > 0) {
    await db.delete(challengeProgress).where(
      and(
        eq(challengeProgress.userId, userId),
        inArray(challengeProgress.challengeId, challengeIds),
      ),
    );
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
};
```

(`inArray` importado de `drizzle-orm`.)

- [ ] **Passo 5: Implementar `resetCourseProgress`**

```ts
export const resetCourseProgress = async (userId: string) => {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }

  const targetUser = await getUserProgressByIdForAdmin(userId);

  if (!targetUser?.activeCourse) {
    throw new Error("User has no active course");
  }

  const lessonsInCourse = await getLessonsForCourse(targetUser.activeCourse.id);
  const lessonIds = lessonsInCourse.map((l) => l.id);

  const challengesInCourse = lessonIds.length > 0
    ? await db.query.challenges.findMany({
        where: inArray(challenges.lessonId, lessonIds),
        columns: { id: true },
      })
    : [];

  const challengeIds = challengesInCourse.map((c) => c.id);

  if (challengeIds.length > 0) {
    await db.delete(challengeProgress).where(
      and(
        eq(challengeProgress.userId, userId),
        inArray(challengeProgress.challengeId, challengeIds),
      ),
    );
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/learn");
  revalidatePath("/lesson");
};
```

- [ ] **Passo 6: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 7 (Review Focus): Verificação manual — valores inválidos rejeitados**

```bash
npx tsx -e "import('./actions/admin').then(async (m) => { try { await m.updateUserHeartsAndPoints('user_3LN3ZpiSycpP83mFMmYe9D5cggd', -1, 0); console.log('FAIL: did not throw'); } catch (e) { console.log('OK:', e.message); } process.exit(0); })"
```
Expected: imprime `OK:` seguido da mensagem de erro (lançado antes do `isAdmin()` ou da validação falhar fora de um pedido real do Next.js é esperado — qualquer rejeição, seja por `Invalid hearts value` seja por `auth()` falhar fora de contexto de pedido, confirma que a chamada nunca chega a escrever na base de dados). Confirmar com uma query direta que `hearts` do Leonardo não mudou:
```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT hearts FROM user_progress WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';"
```

- [ ] **Passo 8 (Review Focus): Verificação manual — reposição de curso sem curso ativo**

```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "INSERT INTO user_progress (user_id, user_name, hearts, points) VALUES ('user_test_no_course', 'Teste Sem Curso', 5, 0) ON CONFLICT (user_id) DO NOTHING;"
npx tsx -e "import('./actions/admin').then(async (m) => { try { await m.resetCourseProgress('user_test_no_course'); console.log('FAIL: did not throw'); } catch (e) { console.log('OK:', e.message); } process.exit(0); })"
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -c "DELETE FROM user_progress WHERE user_id = 'user_test_no_course';"
```
Expected: imprime `OK:` com uma mensagem de erro (de novo, tanto `User has no active course` como uma rejeição por `auth()` fora de contexto confirmam que a função nunca tenta apagar nada sem curso ativo válido).

- [ ] **Passo 9: Commit**

```bash
git add actions/admin.ts
git commit -m "feat: add admin server actions for hearts, points, profile, Pro override, and progress reset"
```

---

### Tarefa 5: Página de listagem `/admin/users`

**Files:**
- Create: `app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `isAdmin` de `@/lib/admin`; `getAllUserProgress` de `@/db/admin-queries` (Tarefa 3).

- [ ] **Passo 1: Implementar a página**

Server component assíncrono. No topo da função, `if (!isAdmin()) redirect("/");` (mesmo padrão de `app/admin/page.tsx`). Depois `const users = await getAllUserProgress();`. Renderiza uma tabela simples (Tailwind, consistente com o resto da app) com colunas: avatar (`next/image`, `userImageSrc`), nome (`userName` + `lastName`), corações, pontos, nível (`englishLevel`), objetivo (`learningGoal`), curso ativo (`activeCourse?.title ?? "—"`), Pro (badge "Sim"/"Não" conforme `adminOverridePro`), e uma coluna com um `Link` para `/admin/users/${user.userId}` com o texto "Editar".

Título da página: `<h1>Administração de contas</h1>`.

- [ ] **Passo 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 3: Verificação manual**

Visitar `http://localhost:3000/admin/users` autenticado como Leonardo.
Expected: tabela carrega com pelo menos a linha do Leonardo, valores de corações/pontos a bater certo com os da base de dados (comparar com `SELECT hearts, points FROM user_progress WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';`), e um link "Editar" por linha.

- [ ] **Passo 4: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat: add admin user list page at /admin/users"
```

---

### Tarefa 6: Página e formulário de edição `/admin/users/[userId]`

**Files:**
- Create: `app/admin/users/[userId]/page.tsx`
- Create: `app/admin/users/[userId]/user-edit-form.tsx`

**Interfaces:**
- Consumes: `isAdmin` de `@/lib/admin`; `getUserProgressByIdForAdmin`, `getLessonsForCourse` de `@/db/admin-queries` (Tarefa 3); `updateUserHeartsAndPoints`, `updateUserProfile`, `setAdminOverridePro`, `resetLessonProgress`, `resetCourseProgress` de `@/actions/admin` (Tarefa 4).

- [ ] **Passo 1: Implementar a página de servidor**

Em `app/admin/users/[userId]/page.tsx`: `if (!isAdmin()) redirect("/");`. Buscar `const user = await getUserProgressByIdForAdmin(params.userId);`. Se `!user`, chamar `notFound()` (do `next/navigation`) — Review Focus: id inexistente mostra 404, não rebenta. Se `user.activeCourse`, buscar `const lessons = await getLessonsForCourse(user.activeCourse.id);`, caso contrário `lessons = []`. Renderizar `<UserEditForm user={user} lessons={lessons} />`.

- [ ] **Passo 2: Implementar o formulário cliente — campos diretos**

Em `user-edit-form.tsx` (`"use client"`), com `useState` inicializado a partir de `user` (hearts, points, englishLevel, learningGoal, gender, adminOverridePro) e `useTransition` para cada submissão, seguindo o padrão já usado em `app/profile-setup/profile-form.tsx` (tipos locais `EnglishLevel`/`LearningGoal`/`Gender` redeclarados, arrays `ENGLISH_LEVEL_OPTIONS`/`LEARNING_GOAL_OPTIONS`/`GENDER_OPTIONS` com os mesmos rótulos em português já usados nesse ficheiro, `Input` para corações/pontos como `type="number"`, `<select>` nativo para os três campos de perfil, `toast.success`/`toast.error` do `sonner` após cada ação).

Um botão "Guardar corações e pontos" chama `updateUserHeartsAndPoints(user.userId, hearts, points)`. Um botão "Guardar perfil" chama `updateUserProfile(user.userId, { englishLevel, learningGoal, gender })`. Um checkbox/toggle "Pro simulado" chama `setAdminOverridePro(user.userId, enabled)` ao mudar.

- [ ] **Passo 3: Implementar o formulário cliente — reposição de progresso**

Um `<select>` com as opções de `lessons` (rótulo `${unitTitle} — ${title}`), e um botão "Repor esta lição" que, ao clicar, corre `if (!window.confirm("Repor o progresso desta lição? Esta ação não pode ser desfeita.")) return;` antes de chamar `resetLessonProgress(user.userId, selectedLessonId)`.

Um botão "Repor curso inteiro" (desativado se `lessons.length === 0`) que corre `if (!window.confirm("Repor TODO o progresso do curso ativo deste utilizador? Esta ação não pode ser desfeita.")) return;` antes de chamar `resetCourseProgress(user.userId)`.

- [ ] **Passo 4: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Passo 5: Verificação manual — fluxo completo como admin**

No browser, autenticado como Leonardo, visitar `/admin/users/user_3LN3ZpiSycpP83mFMmYe9D5cggd`. Mudar corações para `3` e pontos para `500`, clicar "Guardar corações e pontos".
Expected: toast de sucesso; `SELECT hearts, points FROM user_progress WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';` devolve `3` e `500`.

Restaurar para os valores reais do Leonardo (`5` corações, pontos originais) antes de continuar.

- [ ] **Passo 6 (Review Focus): Verificação manual — userId inexistente**

Visitar `/admin/users/user_isto_nao_existe`.
Expected: página 404 do Next.js, sem erro 500 nem página em branco.

- [ ] **Passo 7 (Review Focus): Verificação manual — acesso bloqueado para não-admin**

```bash
podman exec -i duolingo-clone-postgres psql -U lingo -d lingo -t -c "SELECT 1;"
```

Editar temporariamente `lib/admin.ts`, mudando `adminIds` para `["user_id_falso"]`. Reiniciar o servidor de dev (ou confiar no hot-reload). Visitar `/admin/users` autenticado como Leonardo.
Expected: redirecionamento para `/` (bloqueado, mesmo sendo a única conta real do projeto).

Reverter `lib/admin.ts` para `adminIds = ["user_3LN3ZpiSycpP83mFMmYe9D5cggd"]` antes de continuar.

- [ ] **Passo 8: Verificação manual — reposição de lição e de curso**

Escolher uma lição já completa (verificar via `getLesson`/UI de `/learn`), reparti-la pelo seletor, clicar "Repor esta lição" e confirmar o diálogo.
Expected: `SELECT count(*) FROM challenge_progress cp JOIN challenges c ON c.id = cp.challenge_id WHERE cp.user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd' AND c.lesson_id = <id_da_lição>;` devolve `0`.

Clicar "Repor curso inteiro" e confirmar o diálogo.
Expected: `SELECT count(*) FROM challenge_progress WHERE user_id = 'user_3LN3ZpiSycpP83mFMmYe9D5cggd';` devolve `0` (ou só linhas de outros cursos, se existirem — não aplicável aqui, só há um curso ativo).

- [ ] **Passo 9: Commit**

```bash
git add app/admin/users/[userId]/page.tsx "app/admin/users/[userId]/user-edit-form.tsx"
git commit -m "feat: add admin user edit page with profile, hearts/points, Pro override, and progress reset"
```
