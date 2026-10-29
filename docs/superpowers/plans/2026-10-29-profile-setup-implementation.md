# Ecrã de completar perfil (pós-login) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depois do primeiro login, o utilizador preenche um ecrã `/profile-setup` (Nome, Apelido, Idade, Sexo, Nível de inglês, Objetivo) antes de chegar à escolha de curso; o Sexo decide o tema Leo/Juba aplicado só a este ecrã; em acessos seguintes o ecrã nunca mais aparece.

**Architecture:** Estende a tabela `user_progress` já existente com as colunas de perfil. Um novo server action (`completeUserProfile`) cria/atualiza essa linha antes de qualquer curso ser escolhido. Uma nova rota `app/profile-setup` (fora do grupo `(main)`) mostra o formulário com troca de tema ao vivo via estado local de React — sem mecanismo de tema global. `app/(main)/layout.tsx` passa a redirecionar para `/profile-setup` sempre que o perfil (linha inexistente ou `gender` nulo) estiver incompleto; `/profile-setup` redireciona para `/courses` se o perfil já estiver completo.

**Tech Stack:** Next.js 14 (App Router), Drizzle ORM + Postgres, Clerk (`@clerk/nextjs` v4.29.9), Tailwind CSS, `sonner` para toasts. Sem bibliotecas novas.

**Spec:** `docs/superpowers/specs/2026-10-29-profile-setup-design.md`

## Global Constraints

- Stack e versões exatas: Next.js 14 (App Router), Drizzle ORM, Postgres, `@clerk/nextjs@4.29.9`.
- Não introduzir novas dependências (sem `zod`, sem `react-hook-form`, sem `@radix-ui/react-select`) — usar elementos HTML nativos (`<input>`, `<select>`, `<button>`) e validação manual em TypeScript simples, consistente com o resto do projeto.
- Sem framework de testes instalado (nem Jest nem Vitest) — cada tarefa verifica-se com `npx tsc --noEmit`, `npm run lint`, e um passo manual explícito (comando `curl` ou ação no browser + resultado esperado), seguindo a convenção já usada neste projeto nesta mesma conversa.
- Só **Nome** e **Sexo** são obrigatórios; Apelido, Idade, Nível e Objetivo são opcionais (valor exato acordado).
- Lista fixa de objetivos: *viajar*, *trabalho*, *estudar no estrangeiro*, *falar com confiança*, *outro*.
- Lista fixa de níveis: *Iniciante*, *Básico*, *Intermédio*, *Avançado*.
- `gender IS NOT NULL` é o único sinal de "perfil completo" — sem coluna extra de flag.
- O tema Leo/Juba só se aplica dentro de `/profile-setup` nesta tarefa — nenhum outro ecrã muda de visual (non-goal explícito do design doc).
- Imagem do topo do tema Leo reutiliza `/public/hero-leolingo.png` (já existe, já usada na homepage) — não criar/recortar nova imagem. O tema Juba usa um gradiente Tailwind rosa/lilás (cores derivadas de `docs/superpowers/specs/assets/leolingo-juba-mockups.png`) com um ícone/emoji placeholder no lugar da mascote, sem ficheiro de imagem novo.

## Review Focus

- Visitar `/profile-setup` sem ter sessão criada (primeiro acesso absoluto, sem linha em `user_progress`) — o gateway em `app/(main)/layout.tsx` tem de tratar `userProgress === null`, não só `gender === null`.
- Submeter o formulário sem selecionar Sexo (campo obrigatório) — mesmo que a UI impeça, o server action tem de rejeitar e não criar uma linha com `gender` nulo.
- Visitar `/profile-setup` diretamente (bookmark/URL) depois de o perfil já estar completo — tem de redirecionar para `/courses` em vez de mostrar o formulário outra vez.
- Preencher Idade com um valor sem sentido (0, negativo, ou um número muito grande) — o server action tem de rejeitar antes de gravar.
- Alternar entre Masculino/Feminino no formulário depois de já ter preenchido Nível/Objetivo — a troca de tema não pode apagar os outros campos já escolhidos (é tudo estado local do mesmo componente).

---

### Task 1: Esquema da base de dados

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `genderEnum` (`pgEnum<"gender", ["MALE", "FEMALE"]>`), `englishLevelEnum` (`pgEnum<"english_level", ["BEGINNER", "BASIC", "INTERMEDIATE", "ADVANCED"]>`), `learningGoalEnum` (`pgEnum<"learning_goal", ["TRAVEL", "WORK", "STUDY_ABROAD", "SPEAK_CONFIDENTLY", "OTHER"]>`). Novas colunas em `userProgress`: `lastName: text("last_name")` (nullable), `age: integer("age")` (nullable), `gender: genderEnum("gender")` (nullable), `englishLevel: englishLevelEnum("english_level")` (nullable), `learningGoal: learningGoalEnum("learning_goal")` (nullable). Todas as tarefas seguintes dependem destes nomes exatos.

- [ ] **Step 1: Adicionar os três `pgEnum` e as cinco colunas em `db/schema.ts`**

Adicionar os enums a seguir ao `challengesEnum` existente (linha ~46), e as colunas na definição de `userProgress` (linha ~95), com os nomes e valores exatos listados em "Interfaces" acima.

- [ ] **Step 2: Verificar que o TypeScript compila**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados com `db/schema.ts`.

- [ ] **Step 3: Aplicar o esquema à base de dados de desenvolvimento**

Run: `npm run db:push`
Expected: o Drizzle Kit relata a criação dos 3 enums e das 5 colunas na tabela `user_progress`, sem pedir para apagar dados existentes.

- [ ] **Step 4: Confirmar as colunas na base de dados**

Run: `npx drizzle-kit studio` (ou uma query direta, ex. `psql` / script `tsx` com `db.select().from(userProgress).limit(1)`) e confirmar visualmente que `last_name`, `age`, `gender`, `english_level`, `learning_goal` existem na tabela `user_progress`.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts
git commit -m "feat(db): add profile fields to user_progress"
```

---

### Task 2: Server actions — parar de sobrescrever o nome e criar `completeUserProfile`

**Files:**
- Modify: `actions/user-progress.ts`

**Interfaces:**
- Consumes: `userProgress`, `genderEnum`, `englishLevelEnum`, `learningGoalEnum` de `db/schema.ts` (Task 1); `getUserProgress` de `db/queries.ts`.
- Produces:
  ```ts
  type CompleteUserProfileInput = {
    firstName: string;
    lastName?: string;
    age?: number;
    gender: "MALE" | "FEMALE";
    englishLevel?: "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";
    learningGoal?: "TRAVEL" | "WORK" | "STUDY_ABROAD" | "SPEAK_CONFIDENTLY" | "OTHER";
  };
  export const completeUserProfile = async (data: CompleteUserProfileInput): Promise<void>
  ```
  Lança `Error` se `firstName` (depois de `.trim()`) estiver vazio, se `gender` não for `"MALE"` nem `"FEMALE"`, ou se `age` for fornecido e não for um inteiro entre 1 e 120. Caso contrário, faz upsert da linha `user_progress` do utilizador autenticado (atualiza se já existir, insere se não) com todos os campos de `data` mais `userImageSrc` do Clerk, e termina com `redirect("/courses")`.
  Task 4 (página `/profile-setup`) e a Task 3 (`ProfileForm`) dependem deste nome e assinatura exatos.

- [ ] **Step 1: Remover `userName`/`userImageSrc` da branch de atualização de `upsertUserProgress`**

Em `actions/user-progress.ts`, na branch `if (existingUserProgress) { ... }`, o `db.update(userProgress).set({...})` passa a enviar só `{ activeCourseId: courseId }` — remover as linhas que definem `userName` e `userImageSrc` nesse `set`. A branch de inserção (`db.insert(...)`) mantém-se igual, continuando a usar os valores do Clerk como default para quem ainda não passou por `/profile-setup`.

- [ ] **Step 2: Implementar `completeUserProfile(data: CompleteUserProfileInput): Promise<void>`**

Validações no início da função, cada uma lançando `Error` com uma mensagem distinta (`"Name is required"`, `"Invalid gender"`, `"Invalid age"`). Depois, obter `userId` via `auth()` (lançar `"Unauthorized"` se ausente), ler `getUserProgress()` para decidir update vs insert (mesmo padrão de `upsertUserProgress`), gravar `userName: data.firstName.trim()`, `lastName: data.lastName?.trim() || null`, `age: data.age ?? null`, `gender: data.gender`, `englishLevel: data.englishLevel ?? null`, `learningGoal: data.learningGoal ?? null`, e no caso de inserção também `userImageSrc` vindo de `currentUser()` do Clerk (default `/mascot.svg` se ausente). Terminar com `revalidatePath("/courses")` e `redirect("/courses")`.

- [ ] **Step 3: Verificar que o TypeScript compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificação manual das validações**

Criar um script temporário `tsx` (fora do repositório, ex. no diretório de scratchpad) que importa `completeUserProfile` e chama com `gender` inválido e com `age: -5`, confirmando que ambos lançam erro antes de qualquer escrita na base de dados (basta observar o `throw`, não é preciso mock de BD). Apagar o script depois de confirmar.

- [ ] **Step 5: Commit**

```bash
git add actions/user-progress.ts
git commit -m "feat: stop overwriting user name on course switch; add completeUserProfile action"
```

---

### Task 3: Componente `Input` e formulário de perfil com troca de tema ao vivo

**Files:**
- Create: `components/ui/input.tsx`
- Create: `app/profile-setup/profile-form.tsx`

**Interfaces:**
- Consumes: `completeUserProfile` de `actions/user-progress.ts` (Task 2); `cn` de `@/lib/utils`; `Button` de `@/components/ui/button`; `toast` de `sonner`.
- Produces:
  ```ts
  // components/ui/input.tsx
  export const Input: React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>
  >;
  ```
  ```ts
  // app/profile-setup/profile-form.tsx
  "use client";
  type ProfileFormProps = {
    defaultFirstName: string;
    defaultLastName: string;
  };
  export const ProfileForm: React.FC<ProfileFormProps>;
  ```
  Task 4 (`app/profile-setup/page.tsx`) consome `ProfileForm` com estas duas props.

- [ ] **Step 1: Criar `components/ui/input.tsx`**

Seguir o padrão já usado em `components/ui/button.tsx` (export de um componente com `React.forwardRef`, `className` com `cn(...)`, `displayName`). Estilo Tailwind: `rounded-lg border px-3 py-2 text-base` (ajustar para aproximar do mockup `docs/superpowers/specs/assets/leolingo-profile-setup-mockup.png`).

- [ ] **Step 2: Criar `ProfileForm` com estado local para todos os campos**

Estado: `firstName` (default = `defaultFirstName`), `lastName` (default = `defaultLastName`), `age` (string, default vazio), `gender` (`"MALE" | "FEMALE" | null`, default `null`), `englishLevel` (`"BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED" | null`, default `null`), `learningGoal` (uma das 5 opções fixas, default `"TRAVEL"` ou vazio — escolher um default razoável), `pending` via `useTransition`.

Campos renderizados, por esta ordem (igual ao mockup): Nome (`Input`), Apelido (`Input`), Idade (`Input type="number"`), Sexo (dois `<button type="button">` lado a lado, "Masculino"/"Feminino", estado ativo com `aria-pressed` e `cn(...)` a aplicar as cores do tema correspondente), Nível atual de inglês (quatro `<button type="button">`, Iniciante/Básico/Intermédio/Avançado), Objetivo de aprendizagem (`<select>` nativo com as 5 opções fixas do Global Constraints), botão `Continuar` (`Button` existente, `disabled={pending || !firstName.trim() || !gender}`).

Tema ao vivo: quando `gender === "FEMALE"`, as cores de destaque (botão Continuar, borda do botão Sexo ativo, fundo do topo) mudam para a paleta rosa/lilás (derivada de `leolingo-juba-mockups.png`); quando `"MALE"` (ou `null`, default), mantêm o verde/azul-marinho atual do mockup Leo. Implementar com `cn(gender === "FEMALE" ? "bg-pink-500" : "bg-green-500", ...)` diretamente nas classes, sem sistema de tema separado.

- [ ] **Step 3: Implementar o `onSubmit`**

Ao submeter: construir o objeto `CompleteUserProfileInput` (convertendo `age` de string para `number | undefined`, usando `undefined` para `englishLevel`/`learningGoal` se não escolhidos), e chamar dentro de `startTransition`:
```ts
completeUserProfile(data).catch(() => toast.error("Something went wrong."));
```
(mesmo padrão de `app/(main)/courses/list.tsx:29-30`).

- [ ] **Step 4: Verificar que o TypeScript compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual — estado preservado ao trocar de tema**

Com o servidor dev a correr, abrir `/profile-setup` (ver Task 4 antes de este passo fazer sentido — pode adiar-se para depois da Task 4), escolher "Intermédio" e "Trabalho", depois clicar em "Feminino": confirmar visualmente que "Intermédio" e "Trabalho" continuam selecionados e só as cores mudaram.

- [ ] **Step 6: Commit**

```bash
git add components/ui/input.tsx app/profile-setup/profile-form.tsx
git commit -m "feat: add profile form with live Leo/Juba theme switch"
```

---

### Task 4: Página `/profile-setup`

**Files:**
- Create: `app/profile-setup/page.tsx`

**Interfaces:**
- Consumes: `getUserProgress` de `@/db/queries`; `currentUser` de `@clerk/nextjs`; `redirect` de `next/navigation`; `ProfileForm` de `./profile-form` (Task 3).
- Produces: rota `/profile-setup`, consumida pelo redirecionamento da Task 5.

- [ ] **Step 1: Implementar `app/profile-setup/page.tsx` como server component assíncrono**

```ts
const ProfileSetupPage = async () => { ... }
export default ProfileSetupPage;
```
Lógica: `const [userProgress, user] = await Promise.all([getUserProgress(), currentUser()]);` — se `userProgress?.gender` já estiver definido, `redirect("/courses")` (decisão do design doc: esta rota não serve para editar perfil depois de completo). Caso contrário, renderizar o ecrã: `<Image src="/hero-leolingo.png" fill .../>` de fundo (mesma imagem da homepage), sobreposto por um cartão branco com título "Criar o seu perfil", subtítulo, e `<ProfileForm defaultFirstName={user?.firstName ?? ""} defaultLastName={user?.lastName ?? ""} />`.

- [ ] **Step 2: Verificar que o TypeScript compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual end-to-end**

Com o servidor dev e o Postgres a correr: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/profile-setup` deve devolver `307`/`302` (redirect para sign-in, por não estar autenticado neste curl simples) — confirma que a rota está protegida pelo middleware. Depois, no browser com sessão iniciada e sem perfil completo, visitar `/profile-setup`, preencher Nome + Sexo, submeter, e confirmar redirecionamento para `/courses`. Visitar `/profile-setup` outra vez a seguir e confirmar redirecionamento imediato para `/courses` (perfil já completo).

- [ ] **Step 4: Commit**

```bash
git add app/profile-setup/page.tsx
git commit -m "feat: add /profile-setup page"
```

---

### Task 5: Gateway em `app/(main)/layout.tsx`

**Files:**
- Modify: `app/(main)/layout.tsx`

**Interfaces:**
- Consumes: `getUserProgress` de `@/db/queries`; `redirect` de `next/navigation`.

- [ ] **Step 1: Tornar `MainLayout` assíncrono e adicionar o redirecionamento**

```ts
const MainLayout = async ({ children }: Props) => {
  const userProgress = await getUserProgress();

  if (!userProgress || !userProgress.gender) {
    redirect("/profile-setup");
  }

  return ( ... );
};
```
Colocar a verificação antes do `return` existente; o resto do JSX (`MobileHeader`, `Sidebar`, `main`) mantém-se inalterado.

- [ ] **Step 2: Verificar que o TypeScript compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação manual end-to-end (fluxo completo)**

Com uma conta nova (sem linha em `user_progress`): login → confirmar redirecionamento automático para `/profile-setup` ao tentar visitar `/courses` ou `/learn` diretamente. Preencher e submeter o perfil → confirmar chegada a `/courses`. Escolher um curso → confirmar chegada a `/learn` e, ao voltar a `/courses` e consultar a base de dados (`drizzle-kit studio` ou query), confirmar que `user_name` continua com o nome escolhido no perfil (não voltou ao nome do Clerk) — isto cobre o bug corrigido na Task 2.

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/layout.tsx"
git commit -m "feat: redirect to /profile-setup until profile is complete"
```
