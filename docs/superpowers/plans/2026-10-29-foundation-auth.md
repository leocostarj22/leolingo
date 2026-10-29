# Foundation & Profile Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js app and build local multi-profile authentication (create a profile, log in, access a protected page, log out), so the project has a working, testable base before any lesson content is built.

**Architecture:** A single Next.js (App Router, TypeScript) project. SQLite via Prisma stores `User` profiles. Business logic (validation, password hashing, profile lookup) lives in plain, unit-tested TypeScript modules under `lib/`; Next.js Server Actions and middleware are thin wrappers around that logic, verified manually through the browser since they depend on the request/cookie lifecycle.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, Prisma ORM + SQLite, bcryptjs for password hashing, iron-session for cookie sessions, Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-28-ingles-app-design.md`

**Roadmap context:** this is Plan 1 of the project. It covers the foundation (scaffold + auth + onboarding) and the visual identity ("Leolingo", per the user-supplied mockup). Later plans (written after this one is built and validated) will cover: Plan 2 — content model, content-provider abstraction, lesson session UI, exercise types, vidas/XP, bottom navigation shell (Aprender/Desafios/Revisão/Perfil); Plan 3 — CEFR phase progression (using the self-assessed level from onboarding), phase tests, streak, family-only ranking in Desafios, vocabulary Revisão tab, PWA manifest.

**Visual identity:** follows two user-supplied mockups with identical layout but different palettes, chosen by the profile's `gender` at registration — "Leo" (male, default): `docs/superpowers/specs/assets/leolingo-mockups.png`, green primary / dark navy hero. "Juba" (female): `docs/superpowers/specs/assets/leolingo-juba-mockups.png`, pink-magenta primary / pink-lilac gradient hero. No mascot illustration assets were supplied (only the composed mockup images), so this plan uses simple placeholders (emoji or a generic SVG) wherever a mockup shows the lion/lioness mascot.

## Global Constraints

- Sem custos recorrentes de API ou serviços pagos no uso diário (anti-goal do spec) — todas as dependências usadas aqui são livres e correm localmente.
- Sem OAuth externo nem login social — apenas perfil local (nome + password), por decisão técnica do spec.
- Stack obrigatória: Next.js (React + TypeScript) full-stack num único projeto; base de dados SQLite em ficheiro local (decisões técnicas do spec).
- Multiutilizador desde o início: cada perfil (futuramente: utilizador, esposa, filhas) tem progresso independente — a autenticação é a base disso.
- Interface simples e objetiva (anti-goal do spec: nada sobrecarregado).
- Desenvolvimento e validação correm **localmente** primeiro; o deploy na VPS é uma etapa posterior, fora deste plano.

## Review Focus

- Duas pessoas tentam criar um perfil com o mesmo nome, incluindo variações de maiúsculas/minúsculas e espaços (`"Maria"`, `"MARIA"`, `" maria "`) — deve ser rejeitado como duplicado, nunca criar dois perfis que colidem.
- Login com password errada — deve falhar com uma mensagem genérica, sem revelar se o nome de perfil existe ou não.
- Criar perfil com nome vazio ou password demasiado curta — deve ser validado antes de tocar na base de dados, com mensagem clara, sem gravar nada.
- Aceder a uma rota protegida (`/dashboard`) sem sessão válida — deve redirecionar para `/login` e nunca renderizar o conteúdo protegido.
- Autenticar com um nome de perfil escrito com capitalização ou espaços diferentes dos usados no registo (`"MARIA"` para um perfil registado como `"Maria"`) deve funcionar como o mesmo perfil, não falhar por diferença de formatação.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `.gitignore`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a running Next.js dev server; project root is the git repo root; subsequent tasks add files under `lib/`, `app/`, `prisma/`.

- [ ] **Step 1: Initialize git**

Run: `git init` in `/mnt/c/Users/lcsilva/Desktop/codes/Ingles` (the `docs/` folder with the spec already exists and should be kept).

- [ ] **Step 2: Scaffold Next.js**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*"` (accept prompts; if asked about the non-empty directory, proceed — only `docs/` exists and is unrelated to the template).

- [ ] **Step 3: Verify dev server**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: default Next.js starter page loads with no errors in the terminal.

- [ ] **Step 4: Replace placeholder home page**

Edit `app/page.tsx` to render a minimal heading, e.g. `<h1>Leolingo</h1>`. No logic needed yet.

- [ ] **Step 5: Define the two theme palettes as CSS variables**

The app has two visual themes, picked per-profile by `gender` (Task 2/4/6): "leo" (green/navy, default) and "juba" (pink-magenta/lilac). Because Tailwind config values are static at build time but the theme must switch per logged-in profile at runtime, define the palettes as CSS custom properties scoped by a `data-theme` attribute, and point Tailwind's theme colors at those variables so ordinary utility classes (`bg-primary`, `text-primary`) stay theme-agnostic in every component.

In `app/globals.css`:

```css
.theme-root[data-theme="leo"] {
  --color-primary: #58cc02;
  --color-primary-fg: #ffffff;
  --color-hero-from: #16213e;
  --color-hero-to: #1e2a4a;
}
.theme-root[data-theme="juba"] {
  --color-primary: #e91e8c;
  --color-primary-fg: #ffffff;
  --color-hero-from: #c2185b;
  --color-hero-to: #7b2d8e;
}
```

Exact hex values are this task's call — pick values that visually match each mockup; they don't need to be pixel-exact. In `tailwind.config.ts`, extend `theme.colors` with `primary: "var(--color-primary)"` (and `primary-fg`), and extend `theme.backgroundImage` with a `hero` gradient built from `--color-hero-from`/`--color-hero-to`. Every page that needs theming wraps its content in a `<div className="theme-root" data-theme={...}>`; the public `/login` landing screen (Task 6) hardcodes `data-theme="leo"` since no profile is known yet, while authenticated pages (Task 7 onward) read it from the session once `gender` is known.

- [ ] **Step 6: Add `.gitignore` entries**

Ensure `.gitignore` includes `node_modules`, `.next`, `prisma/*.db`, `.env`, `.env*.local`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project"
```

---

## Task 2: Database Setup (Prisma + SQLite)

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`, `.env`, `.env.example`

**Interfaces:**
- Consumes: nothing new.
- Produces: `prisma` singleton client exported from `lib/db.ts` as `prisma`; `User` model with fields `id: String`, `name: String`, `nameKey: String` (unique, lowercase-normalized), `passwordHash: String`, `gender: String` (`"M"` or `"F"`, chosen at registration — picks the "leo"/"juba" visual theme), `createdAt: DateTime`, `goal: String?`, `selfLevel: String?`, `onboardingCompletedAt: DateTime?`.

- [ ] **Step 1: Install Prisma**

Run: `npm install prisma --save-dev` and `npm install @prisma/client`

- [ ] **Step 2: Initialize Prisma with SQLite**

Run: `npx prisma init --datasource-provider sqlite`
This creates `prisma/schema.prisma` and `.env` with a `DATABASE_URL`.

- [ ] **Step 3: Define the `User` model**

In `prisma/schema.prisma`, add:

```prisma
model User {
  id                    String    @id @default(cuid())
  name                  String
  nameKey               String    @unique
  passwordHash          String
  gender                String
  createdAt             DateTime  @default(now())
  goal                  String?
  selfLevel             String?
  onboardingCompletedAt DateTime?
}
```

`nameKey` exists specifically so profile lookup and the uniqueness constraint are case/whitespace-insensitive (Review Focus items 1 and 5) — callers always write `name.trim()` into `name` and `name.trim().toLowerCase()` into `nameKey`. `goal`, `selfLevel`, and `onboardingCompletedAt` are filled in by Task 8 (Onboarding); they stay nullable here because a freshly-registered profile hasn't been through onboarding yet.

- [ ] **Step 4: Run the migration**

Run: `npx prisma migrate dev --name init_user`
Expected: migration succeeds, `prisma/dev.db` is created, `@prisma/client` is generated.

- [ ] **Step 5: Create the Prisma client singleton**

Create `lib/db.ts` exporting `prisma: PrismaClient`, using the standard Next.js dev pattern (store on `globalThis` to avoid creating a new client per hot-reload).

- [ ] **Step 6: Add `.env.example`**

Create `.env.example` with `DATABASE_URL="file:./dev.db"` as a placeholder (no real secrets), so the real `.env` can stay gitignored.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Prisma + SQLite User model"
```

---

## Task 3: Password Hashing Utility

**Files:**
- Create: `lib/auth/password.ts`
- Test: `lib/auth/password.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`.

- [ ] **Step 1: Install dependencies**

Run: `npm install bcryptjs` and `npm install -D @types/bcryptjs vitest`

- [ ] **Step 2: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("produces a hash different from the original password", async () => {
    const hash = await hashPassword("minhaSenha123");
    expect(hash).not.toBe("minhaSenha123");
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("minhaSenha123");
    expect(await verifyPassword("minhaSenha123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("minhaSenha123");
    expect(await verifyPassword("outraSenha", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: FAIL with "Cannot find module './password'" (file doesn't exist yet).

- [ ] **Step 4: Implement `lib/auth/password.ts`**

Implement `hashPassword` and `verifyPassword` using `bcryptjs.hash` / `bcryptjs.compare` with a cost factor of 10.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: all 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/password.ts lib/auth/password.test.ts package.json package-lock.json
git commit -m "feat: add password hashing utility"
```

---

## Task 4: Profile Registration & Authentication Logic

**Files:**
- Create: `lib/auth/profile.ts`
- Test: `lib/auth/profile.test.ts`

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword` from `lib/auth/password.ts` (Task 3); `prisma` from `lib/db.ts` (Task 2); `User` model (`id`, `name`, `nameKey`, `passwordHash`).
- Produces:
  - `type ProfileResult = { ok: true; user: { id: string; name: string; gender: "M" | "F"; onboardingCompleted: boolean } } | { ok: false; error: string }`
  - `registerProfile(name: string, password: string, gender: "M" | "F"): Promise<ProfileResult>`
  - `authenticateProfile(name: string, password: string): Promise<ProfileResult>`

`onboardingCompleted` is `onboardingCompletedAt !== null`; a freshly registered profile always has it `false`. `gender` drives which visual theme ("leo"/"juba", Task 1 Step 5) the profile sees from here on.

Validation rules pinned here (builder's call, not in the spec): name must be non-empty after trimming; password must be at least 6 characters; gender must be exactly `"M"` or `"F"` (error `"Seleciona uma opção."`). Error messages are plain Portuguese strings shown directly to the user.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { registerProfile, authenticateProfile } from "./profile";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

describe("registerProfile", () => {
  it("creates a profile with valid name, password and gender, pending onboarding", async () => {
    const result = await registerProfile("Maria", "senha123", "F");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.onboardingCompleted).toBe(false);
      expect(result.user.gender).toBe("F");
    }
  });

  it("rejects an empty name", async () => {
    const result = await registerProfile("   ", "senha123", "F");
    expect(result).toEqual({ ok: false, error: "Nome é obrigatório." });
  });

  it("rejects a password shorter than 6 characters", async () => {
    const result = await registerProfile("Maria", "123", "F");
    expect(result).toEqual({ ok: false, error: "A password deve ter pelo menos 6 caracteres." });
  });

  it("rejects an invalid gender value", async () => {
    const result = await registerProfile("Maria", "senha123", "X" as "M" | "F");
    expect(result).toEqual({ ok: false, error: "Seleciona uma opção." });
  });

  it("rejects a duplicate name regardless of case or spacing", async () => {
    await registerProfile("Maria", "senha123", "F");
    const result = await registerProfile(" MARIA ", "outraSenha1", "F");
    expect(result).toEqual({ ok: false, error: "Já existe um perfil com esse nome." });
  });
});

describe("authenticateProfile", () => {
  it("authenticates with the correct password", async () => {
    await registerProfile("Maria", "senha123", "F");
    const result = await authenticateProfile("Maria", "senha123");
    expect(result.ok).toBe(true);
  });

  it("authenticates even if name casing/spacing differs from registration", async () => {
    await registerProfile("Maria", "senha123", "F");
    const result = await authenticateProfile(" MARIA ", "senha123");
    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect password with a generic error", async () => {
    await registerProfile("Maria", "senha123", "F");
    const result = await authenticateProfile("Maria", "outraSenha");
    expect(result).toEqual({ ok: false, error: "Nome ou password incorretos." });
  });

  it("rejects an unknown profile with the same generic error", async () => {
    const result = await authenticateProfile("Ninguem", "qualquerSenha");
    expect(result).toEqual({ ok: false, error: "Nome ou password incorretos." });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/auth/profile.test.ts`
Expected: FAIL with "Cannot find module './profile'".

- [ ] **Step 3: Implement `lib/auth/profile.ts`**

Implement `registerProfile` and `authenticateProfile` per the signatures above. `registerProfile`: trim name, validate non-empty, then password length, then `gender === "M" || gender === "F"`, compute `nameKey = name.trim().toLowerCase()`, check `prisma.user.findUnique({ where: { nameKey } })` for a duplicate, hash the password, create the user (storing `gender`), return `{ ok: true, user: { id, name, gender, onboardingCompleted: false } }`. `authenticateProfile`: compute `nameKey`, look up the user, return the generic `"Nome ou password incorretos."` error both when the user doesn't exist and when `verifyPassword` fails (never distinguish the two cases); on success return `{ ok: true, user: { id, name, gender: user.gender as "M" | "F", onboardingCompleted: user.onboardingCompletedAt !== null } }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/auth/profile.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/profile.ts lib/auth/profile.test.ts
git commit -m "feat: add profile registration and authentication logic"
```

---

## Task 5: Session Management, Server Actions & Route Protection

**Files:**
- Create: `lib/auth/session.ts`, `app/actions/auth.ts`, `middleware.ts`

**Interfaces:**
- Consumes: `registerProfile`, `authenticateProfile`, `ProfileResult` from `lib/auth/profile.ts` (Task 4).
- Produces:
  - `lib/auth/session.ts`: `SESSION_COOKIE_NAME` constant; `type SessionData = { userId?: string; userName?: string; gender?: "M" | "F"; onboardingCompleted?: boolean }`; `getSession(): Promise<IronSession<SessionData>>`.
  - `app/actions/auth.ts`: `createProfileAction(formData: FormData): Promise<{ error: string } | void>`, `loginAction(formData: FormData): Promise<{ error: string } | void>`, `logoutAction(): Promise<void>`.
  - `middleware.ts`: redirects unauthenticated requests on any protected path (`/dashboard`, `/onboarding`) to `/login`; redirects authenticated requests with `onboardingCompleted: false` away from `/dashboard` to `/onboarding`; redirects authenticated requests with `onboardingCompleted: true` away from `/onboarding` to `/dashboard`.

This task has no automated tests: `getSession`, the Server Actions, and `middleware.ts` only work inside a real Next.js request (cookies, redirects), which automated unit tests can't exercise meaningfully without heavy mocking. Correctness is verified manually end-to-end in Task 7, once there's a UI to drive it.

- [ ] **Step 1: Install iron-session**

Run: `npm install iron-session`

- [ ] **Step 2: Add a session secret**

Run: `openssl rand -base64 32` and put the result in `.env` as `SESSION_SECRET=...`. Add `SESSION_SECRET=` (empty) to `.env.example`.

- [ ] **Step 3: Implement `lib/auth/session.ts`**

Use `getIronSession(await cookies(), { cookieName: SESSION_COOKIE_NAME, password: process.env.SESSION_SECRET!, cookieOptions: { secure: process.env.NODE_ENV === "production" } })` per iron-session's App Router pattern, typed with `SessionData`.

- [ ] **Step 4: Implement `app/actions/auth.ts`**

`createProfileAction`: read `name`/`password`/`gender` from `formData`, call `registerProfile`; on `ok: false` return `{ error }`; on `ok: true`, get the session, set `session.userId`/`session.userName`/`session.gender`/`session.onboardingCompleted` from `result.user`, save it, then `redirect("/dashboard")` (the middleware from Step 5 will bounce it to `/onboarding`). `loginAction`: same shape calling `authenticateProfile` (no `gender` field to read from the login form). `logoutAction`: get the session, call `session.destroy()`, then `redirect("/login")`.

- [ ] **Step 5: Implement `middleware.ts`**

Match `/dashboard` and `/onboarding` (and nested paths). Read the session cookie: no valid `userId` → redirect to `/login`. Valid session with `onboardingCompleted: false` on a `/dashboard` path → redirect to `/onboarding`. Valid session with `onboardingCompleted: true` on an `/onboarding` path → redirect to `/dashboard`. Leave `/login` and `/` unprotected.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/session.ts app/actions/auth.ts middleware.ts .env.example
git commit -m "feat: add sessions, auth server actions, and route protection"
```

---

## Task 6: Login & Signup Page

**Files:**
- Create: `app/login/page.tsx`, `app/login/LoginForm.tsx`

**Interfaces:**
- Consumes: `createProfileAction`, `loginAction` from `app/actions/auth.ts` (Task 5).
- Produces: a page at `/login` with a toggle between "Criar perfil" and "Entrar", each a form bound to the corresponding Server Action, showing the returned `error` string when present.

Visual reference: the first mockup screen (`docs/superpowers/specs/assets/leolingo-mockups.png`) — dark navy background, "Leolingo" title, tagline "Aprende inglês numa aventura para a vida real.", green "Começar" button, "Já tenho conta" link below it. Use that as the entry screen before the form, wrapped in `<div className="theme-root" data-theme="leo">` (Task 1 Step 5) — no profile is known yet, so the public landing page always uses the "leo" palette regardless of which theme the visitor will end up picking.

Neither mockup shows a dedicated screen for choosing gender (it's not part of either flow's screenshots) — the registration form (not the login form) adds a simple two-option control ("Masculino" / "Feminino") alongside name and password; exact control styling is this task's call.

- [ ] **Step 1: Implement `LoginForm.tsx`**

Client component with local state for which mode is active ("register" | "login"), text inputs (name, password), and — only in "register" mode — a gender selector with two options ("Masculino" → `"M"`, "Feminino" → `"F"`). Submit button bound to the active Server Action via `useFormState`/`useActionState`, error message rendered when the action returns one.

- [ ] **Step 2: Implement `app/login/page.tsx`**

Server component. Default view matches the mockup's entry screen: navy background, "Leolingo" heading, tagline, a green "Começar" button that reveals `<LoginForm mode="register" />`, and a "Já tenho conta" link that reveals `<LoginForm mode="login" />`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/login`.
Expected: can switch between "Criar perfil" and "Entrar"; submitting an empty name shows "Nome é obrigatório."; submitting a short password shows the length error; submitting without picking a gender shows "Seleciona uma opção."; these match Task 4's validation messages exactly.

- [ ] **Step 4: Commit**

```bash
git add app/login
git commit -m "feat: add login and signup page"
```

---

## Task 7: Onboarding (Objetivo & Nível)

**Files:**
- Create: `lib/onboarding/options.ts`, `app/actions/onboarding.ts`, `app/onboarding/page.tsx`, `app/onboarding/OnboardingForm.tsx`
- Modify: `lib/auth/profile.ts`, `lib/auth/profile.test.ts`

**Interfaces:**
- Consumes: `getSession` from `lib/auth/session.ts` (Task 5); `prisma` from `lib/db.ts` (Task 2).
- Produces:
  - `lib/onboarding/options.ts`: `GOAL_OPTIONS: readonly string[]` = `["Viajar pelo mundo", "Melhorar no trabalho", "Estudar no estrangeiro", "Falar com confiança", "Outros objetivos"]`; `SELF_LEVEL_OPTIONS: readonly string[]` = `["Iniciante", "Básico", "Intermédio", "Avançado"]` (exact copy from the mockup).
  - `lib/auth/profile.ts`: `completeOnboarding(userId: string, goal: string, selfLevel: string): Promise<{ id: string; name: string; onboardingCompleted: true }>`.
  - `app/actions/onboarding.ts`: `completeOnboardingAction(formData: FormData): Promise<{ error: string } | void>`.

Visual reference: mockup screens 2 and 3 of either theme — back arrow + progress bar at top, question heading, a vertical list of selectable option cards (radio-style, selected state shown with a checkmark and colored border), "Continuar" button at the bottom. From this task onward, the profile's `gender` is known, so `app/onboarding/page.tsx` wraps its content in `<div className="theme-root" data-theme={session.gender === "F" ? "juba" : "leo"}>` (Task 1 Step 5) instead of hardcoding `"leo"`.

- [ ] **Step 1: Write the failing test**

Add to `lib/auth/profile.test.ts`:

```typescript
import { completeOnboarding } from "./profile";

describe("completeOnboarding", () => {
  it("stores goal and self-assessed level and marks onboarding complete", async () => {
    const registered = await registerProfile("Maria", "senha123", "F");
    if (!registered.ok) throw new Error("setup failed");
    const result = await completeOnboarding(registered.user.id, "Viajar pelo mundo", "Iniciante");
    expect(result.onboardingCompleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/profile.test.ts`
Expected: FAIL with "completeOnboarding is not a function" (or similar import error).

- [ ] **Step 3: Implement `completeOnboarding` in `lib/auth/profile.ts`**

`prisma.user.update({ where: { id: userId }, data: { goal, selfLevel, onboardingCompletedAt: new Date() } })`, then return `{ id: user.id, name: user.name, onboardingCompleted: true }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/auth/profile.test.ts`
Expected: all tests PASS (including the ones from Task 4).

- [ ] **Step 5: Implement `lib/onboarding/options.ts`**

Export `GOAL_OPTIONS` and `SELF_LEVEL_OPTIONS` exactly as listed above.

- [ ] **Step 6: Implement `app/actions/onboarding.ts`**

`completeOnboardingAction`: get the session; if no `userId`, `redirect("/login")`. Read `goal`/`selfLevel` from `formData`; if either isn't a member of `GOAL_OPTIONS` / `SELF_LEVEL_OPTIONS`, return `{ error: "Escolhe uma opção válida." }`. Otherwise call `completeOnboarding(session.userId, goal, selfLevel)`, set `session.onboardingCompleted = true`, save the session, then `redirect("/dashboard")`.

- [ ] **Step 7: Implement `OnboardingForm.tsx`**

Client component, two-step wizard local to the component: step 1 shows "Qual é o seu objetivo?" with `GOAL_OPTIONS` as selectable cards and a "Continuar" button that advances to step 2 (no submit yet); step 2 shows "Qual é o seu nível de inglês?" with `SELF_LEVEL_OPTIONS`, and its "Continuar" button submits both selections via `completeOnboardingAction` (`useActionState`), rendering the returned `error` if present.

- [ ] **Step 8: Implement `app/onboarding/page.tsx`**

Server component: call `getSession()`, wrap `<OnboardingForm />` in `<div className="theme-root" data-theme={session.gender === "F" ? "juba" : "leo"}>`.

- [ ] **Step 9: Manual verification**

Run: `npm run dev`.
1. Create a new profile via `/login`. Expected: redirected straight to `/onboarding` (not `/dashboard`), because `onboardingCompleted` is `false`.
2. Pick a goal, continue, pick a level, continue. Expected: redirected to `/dashboard`.
3. Navigate to `/onboarding` directly afterward. Expected: redirected to `/dashboard` (already completed, per the middleware rule from Task 5).
4. Log out and log back in with the same profile. Expected: goes straight to `/dashboard`, onboarding is not shown again.

- [ ] **Step 10: Commit**

```bash
git add lib/onboarding lib/auth/profile.ts lib/auth/profile.test.ts app/actions/onboarding.ts app/onboarding
git commit -m "feat: add onboarding flow (objetivo & nível)"
```

---

## Task 8: Protected Dashboard Shell

**Files:**
- Create: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `getSession` from `lib/auth/session.ts`, `logoutAction` from `app/actions/auth.ts` (Task 5).
- Produces: a protected page at `/dashboard` proving the full auth + onboarding loop works end-to-end.

- [ ] **Step 1: Implement `app/dashboard/page.tsx`**

Server component: call `getSession()`; if `session.userId` is missing, `redirect("/login")` (belt-and-suspenders alongside the middleware). Otherwise wrap the content in `<div className="theme-root" data-theme={session.gender === "F" ? "juba" : "leo"}>` (Task 1 Step 5) and render `Olá, {session.userName}!` plus a form with a submit button bound to `logoutAction`.

- [ ] **Step 2: Manual end-to-end verification**

Run: `npm run dev`.
1. Open `http://localhost:3000/dashboard` directly without logging in. Expected: redirected to `/login` (Review Focus item 4).
2. On `/login`, create a new profile ("Maria", "senha123", gender "Feminino"). Expected: redirected to `/onboarding` first (Task 7, pink/lilac "juba" theme visible), then after completing it, to `/dashboard` (still "juba" theme), showing "Olá, Maria!".
3. Click logout. Expected: redirected to `/login` (back to the default "leo" theme landing page).
4. Log in again with `"MARIA"` (different casing) and the same password. Expected: succeeds, redirected straight to `/dashboard` with the "juba" theme still applied (onboarding already done) (Review Focus item 5).
5. Create a second profile ("Pedro", gender "Masculino"). Expected: onboarding and dashboard show the green/navy "leo" theme instead.
6. Try to create a third profile named `" maria "` (different casing/spacing). Expected: rejected with the duplicate-name error (Review Focus item 1).
7. Try to log in as `"Maria"` with the wrong password. Expected: rejected with the generic "Nome ou password incorretos." (Review Focus item 2).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard
git commit -m "feat: add protected dashboard shell"
```
