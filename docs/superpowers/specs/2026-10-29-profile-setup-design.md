# Ecrã de completar perfil (pós-login, primeiro acesso)

## Intenção e porquê

O Leolingo usa o Clerk para autenticação, e a maioria dos registos entra
pelo Google (OAuth) — por isso nunca temos oportunidade de perguntar sexo,
idade ou apelido no próprio registo. O documento de design original
(`2026-10-28-ingles-app-design.md`, secção "Identidade visual") definia
o campo "sexo" como parte do formulário de registo local (nome+password),
mas isso deixou de ser viável assim que o registo passou a ser
maioritariamente via Google. Este documento substitui essa decisão
pontual: passamos a recolher sexo (e outros dados de perfil) num ecrã
próprio, a seguir ao primeiro login, antes de o utilizador escolher um
curso.

O campo "sexo" continua a decidir o tema visual da mascote em toda a app
— "Leo" (verde/azul-marinho) para masculino, "Juba" (rosa/lilás) para
feminino — conforme já definido no documento original.

## Goals

- Depois do primeiro login (qualquer que seja o método — Google ou
  password), o utilizador vê um ecrã "Criar o seu perfil" antes de
  chegar à escolha de curso.
- Recolhe: Nome, Apelido, Idade, Sexo (Masculino/Feminino), Nível atual
  de inglês, Objetivo de aprendizagem.
- Só Nome e Sexo são obrigatórios para avançar; Apelido, Idade, Nível e
  Objetivo são opcionais.
- O ecrã muda de tema (cores + mascote placeholder) ao vivo, consoante o
  utilizador escolhe Masculino ou Feminino — antes mesmo de submeter.
- Em acessos seguintes (sexo já preenchido), o utilizador nunca mais vê
  este ecrã — vai direto para a escolha de curso / `/learn`.
- Nome, Apelido, Idade, Nível e Objetivo ficam guardados no perfil para
  uso futuro (o Nível, por agora, é só armazenado — será usado para
  decidir a fase CEFR inicial quando a progressão por fases for
  implementada, conforme o Plano 3 do documento original).

## Non-goals (fora desta tarefa)

- Re-estilizar os restantes ecrãs existentes (cursos, lições, loja,
  desafios, leaderboard, perfil/menu) com o tema Leo/Juba. Isso fica
  para uma tarefa futura — esta tarefa só aplica o tema dentro do
  próprio ecrã de perfil.
- Criar ilustrações reais da mascote Juba. Usa-se um placeholder simples
  (ex. emoji ou SVG genérico), tal como já previsto no documento
  original para qualquer tema sem ilustração fornecida.
- Mudar o sistema de autenticação (continua Clerk, com Google e
  password).
- Permitir editar estes dados mais tarde a partir de um ecrã de "Perfil"
  da app — isso não existe ainda (a secção "Perfil" da navegação
  principal é trabalho futuro).

## Anti-goals

- Bloquear o utilizador no ecrã de perfil por falta de campos que não
  são essenciais (por isso só Nome e Sexo são obrigatórios).
- Obrigar quem já tem perfil completo a passar outra vez por este ecrã.

## Constraints

- Stack atual: Next.js 14 (App Router), Drizzle ORM, Postgres, Clerk
  (`@clerk/nextjs` v4.29.9).
- A tabela `user_progress` (ver `db/schema.ts`) só é criada hoje quando
  o utilizador escolhe um curso (`upsertUserProgress` em
  `actions/user-progress.ts`). Este fluxo passa a criar essa linha mais
  cedo, logo após o preenchimento do perfil, sem `activeCourseId` (fica
  `null` até o utilizador escolher um curso em `/courses`, como já
  acontece hoje).
- Mockup de referência (tema Leo): `docs/superpowers/specs/assets/leolingo-profile-setup-mockup.png`.
  Paleta Juba de referência (para derivar cores/gradiente):
  `docs/superpowers/specs/assets/leolingo-juba-mockups.png`.

## Decisões já tomadas

- **Esquema de dados**: estender a tabela `user_progress` com as
  colunas:
  - `lastName` (text, opcional)
  - `age` (integer, opcional)
  - `gender` (enum: `"MALE" | "FEMALE"`, opcional — `null` é o sinal de
    "perfil por completar")
  - `englishLevel` (enum: `"BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED"`, opcional)
  - `learningGoal` (enum: `"TRAVEL" | "WORK" | "STUDY_ABROAD" | "SPEAK_CONFIDENTLY" | "OTHER"`, opcional)

  O campo `userName` já existente passa a guardar o "Nome" indicado
  neste ecrã (pré-preenchido com o nome do Clerk, mas editável).
  Não se cria uma coluna extra "perfil completo" — usa-se `gender IS
  NOT NULL` como sinal.

- **Lista de objetivos de aprendizagem**: mantém-se a lista do
  documento original — *viajar*, *trabalho*, *estudar no estrangeiro*,
  *falar com confiança*, *outro* — em vez do valor de exemplo que
  aparecia no mockup ("Conversação no dia a dia").

- **Nova rota `/profile-setup`**: fora do grupo `app/(main)`, com
  layout próprio (sem Sidebar/MobileHeader), a ocupar o ecrã inteiro —
  hero com imagem de fundo + mascote no topo, cartão branco por baixo
  com o formulário, à semelhança do mockup. O tema (cores do cartão,
  botão "Continuar", mascote) muda em tempo real conforme o utilizador
  seleciona Masculino ou Feminino, antes de submeter.

- **Redirecionamento**: `app/(main)/layout.tsx` passa a verificar o
  perfil do utilizador autenticado; se `gender` for `null`, redireciona
  para `/profile-setup`. Depois de submeter o formulário (server
  action), a linha em `user_progress` é criada/atualizada e o
  utilizador é redirecionado para `/courses`, tal como já acontece hoje
  quando se escolhe um curso.

- **Tema app-wide**: a decisão de Leo/Juba a aplicar-se à app inteira
  fica confirmada para o futuro (fora do âmbito desta tarefa) — o valor
  de `gender` guardado é o que uma tarefa futura vai usar para decidir
  o tema em todos os outros ecrãs.

- **`upsertUserProgress` deixa de reescrever `userName`/`userImageSrc`
  na branch de atualização.** Hoje, sempre que o utilizador escolhe/troca
  de curso, `actions/user-progress.ts` sobrescreve incondicionalmente
  `userName`/`userImageSrc` com os valores do Clerk (`firstName`,
  `imageUrl`). Como `/profile-setup` passa a criar a linha de
  `user_progress` antes de qualquer curso ser escolhido, a próxima
  escolha de curso apagaria silenciosamente o Nome (e a foto, se no
  futuro vier a ser editável) introduzido no perfil. A branch de
  atualização deixa de definir `userName`/`userImageSrc` — só a
  inserção inicial (seja no `/profile-setup`, seja no próprio
  `upsertUserProgress` para quem já tinha perfil antes desta mudança)
  continua a usar os valores do Clerk como default.

- **`/profile-setup` redireciona para fora se o perfil já estiver
  completo.** Coerente com o goal "o utilizador nunca mais vê este
  ecrã": se alguém visitar `/profile-setup` diretamente (bookmark,
  recuar no browser, URL escrita à mão) e já tiver `gender` preenchido,
  a página redireciona de imediato para `/courses`, em vez de permitir
  reabrir o formulário. Isto evita que esta rota se torne um ecrã de
  edição não documentado (incluindo mudar o `gender` depois de
  definido), o que contradiria o non-goal sobre edição de perfil ainda
  não existir.

## O que fica por decidir pelo implementador

- Nomes exatos de ficheiros/componentes dentro de `/profile-setup`
  (ex. `page.tsx`, `profile-form.tsx`), seguindo as convenções já
  usadas no resto do projeto (ex. `app/lesson/` tem o seu próprio
  `layout.tsx`).
- Validação de formulário (ex. Idade como número positivo razoável) —
  usar a biblioteca já presente no projeto se houver uma (verificar
  `package.json`), ou validação simples manual se não houver.
- Exato texto/ícones do placeholder da mascote Juba (SVG genérico ou
  emoji), desde que a paleta rosa/lilás de `leolingo-juba-mockups.png`
  seja respeitada.
- Mensagens de erro e estados de carregamento do formulário.
