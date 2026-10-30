# Curso de Inglês: conteúdo inicial, personalizado por nível e objetivo

**Data:** 2026-10-30
**Estado:** aprovado pelo utilizador em brainstorming, pronto para planeamento de implementação

## Intenção e porquê

O curso de Inglês ainda não existe na base de dados — hoje só existem os
cursos de exemplo do template original (`Spanish`, `Italian`, `French`,
`Croatian`), sem relação com o objetivo real da app. O ecrã de perfil
(`/profile-setup`) já recolhe `englishLevel` e `learningGoal`, mas estes
dados ainda não influenciam nada: ficam só guardados.

Este documento cobre a criação do curso de Inglês com conteúdo real,
mostrado de forma diferente consoante o nível e o objetivo que a pessoa
indicou no perfil — sem reescrever a app para isso, só personalizando
quais unidades aparecem.

A ideia de gerar/renovar conteúdo com IA gratuita (de vez em quando, em
lote, nunca em tempo de execução por utilizador, para não violar o
anti-goal de custos recorrentes do documento original) fica deliberadamente
fora do âmbito deste documento — o utilizador pediu para primeiro existir
conteúdo real, só depois pensar nisso.

## Goals

1. Existe um curso "English" (`courses.title`), com ícone de bandeira
   britânica, selecionável em `/courses` como qualquer outro curso.
2. As unidades do curso são filtradas por `englishLevel` e `learningGoal`
   do perfil de quem está autenticado — cada pessoa só vê as unidades que
   lhe dizem respeito, sem escolher nada manualmente para além do que já
   escolheu no perfil.
3. Dentro de um nível, há sempre uma unidade **genérica** (sem tema) e,
   quando existir, uma unidade **temática** correspondente ao objetivo da
   pessoa — a pessoa vê as duas, pela ordem: genérica primeiro, temática
   a seguir.
4. Conteúdo real para o nível **Básico**, em três percursos: genérico,
   Trabalho e Viagem (ver "Conteúdo" abaixo) — cobre o perfil real do
   utilizador (Básico/Trabalho) e o segundo objetivo mais comum.
5. Os outros níveis (Iniciante, Intermédio, Avançado) e os outros
   objetivos (Estudar no estrangeiro, Falar com confiança, Outro) ficam
   sem unidades próprias por agora — alguém nessa combinação só vê a
   unidade genérica do seu nível, se existir, ou nada.

## Non-goals (fora desta tarefa)

- Gerar ou integrar qualquer IA de conteúdo (ver "Intenção").
- Áudio nos exercícios ("ouvir e escolher") — fica para quando se tratar
  de IA/TTS. Os exercícios desta entrega são só texto e imagem.
- Criar novos tipos de exercício (preenchimento de espaços, correspondência
  pergunta-resposta por arrastar, etc.) — usa-se só os dois tipos já
  suportados pela app (`SELECT`, `ASSIST`).
- Editar ou re-equilibrar os cursos de exemplo existentes (Spanish,
  Italian, French, Croatian) — ficam exatamente como estão.
- Um ecrã para escolher manualmente nível/objetivo depois do registo —
  isso já é decidido no `/profile-setup`, este documento só consome esse
  dado. `completeUserProfile` só corre uma vez (bloqueado assim que
  `gender` já está definido), por isso os dois perfis reais já
  existentes ficam fixados nos valores atuais (`Leonardo`: Básico/
  Trabalho; `Giovana`: Avançado/Estudar no estrangeiro) até existir um
  ecrã de edição — aceitável para esta entrega.

## Anti-goals

- Qualquer pessoa cujo nível ainda não tenha conteúdo ficar presa num ecrã
  partido (sem unidades, sem explicação). Fica com a lista de unidades
  vazia — comportamento aceitável e já esperado para este primeiro corte,
  mas não pode dar erro.
- O novo filtro por nível/objetivo mudar o comportamento dos cursos
  existentes (Spanish, etc.). Essas unidades não têm nível/objetivo
  definidos e devem continuar visíveis para todos, exatamente como hoje.

## Decisões já tomadas

### Esquema

- `units` ganha duas colunas opcionais, reaproveitando os enums que já
  existem em `db/schema.ts`:
  - `targetLevel` (`english_level` enum, nullable)
  - `targetGoal` (`learning_goal` enum, nullable)
- `NULL` em qualquer uma das colunas significa "aplica-se a todos" nessa
  dimensão — é o que preserva o comportamento atual dos cursos de
  exemplo (todas as suas unidades ficam com as duas colunas a `NULL`,
  sem precisar de migração de dados).

### Regra de filtragem (nível + objetivo)

Ao listar as unidades de um curso para a pessoa autenticada, uma unidade
aparece quando **as duas condições** se verificam:

- **Nível**: `units.targetLevel IS NULL` OU `units.targetLevel = `
  (nível do perfil, com `BASIC` como default quando a pessoa não definiu
  nível no perfil — é opcional no `/profile-setup`).
- **Objetivo**: `units.targetGoal IS NULL` OU `units.targetGoal = `
  (objetivo do perfil). Quando a pessoa não definiu objetivo, só as
  unidades com `targetGoal IS NULL` aparecem (não há objetivo para
  comparar). **Nota:** com o formulário de `/profile-setup` tal como
  está hoje (`learningGoal` nasce sempre a `"TRAVEL"` no `useState` e o
  `<select>` não tem opção "sem objetivo"), este ramo nunca é alcançado
  por quem passa por esse ecrã — é só uma salvaguarda defensiva para
  dados que não tenham `learningGoal` definido (perfis antigos, ou um
  futuro ecrã de edição). O formulário em si não é alterado por esta
  tarefa; o facto de não ter uma opção "ainda não sei" é um gap de UX já
  identificado anteriormente e deliberadamente fora deste âmbito.
- O default `BASIC`, quando `englishLevel` é `NULL`, é aplicado só em
  memória, no momento de montar a condição da query (`userProgress.englishLevel ?? "BASIC"`)
  — a coluna em `userProgress` continua nullable, sem `.default()`.

Isto dá automaticamente o comportamento do Goal 3 (genérica + temática,
pela ordem de `units.order`) sem precisar de lógica "tenta X, senão Y": a
unidade genérica (`targetGoal = NULL`) aparece sempre que o nível bate
certo; a temática só aparece quando o objetivo também bate certo.

- Esta regra aplica-se em **todos** os sítios que hoje listam unidades de
  um curso **para a pessoa autenticada**: `getUnits` e o
  `unitsInActiveCourse` de `getCourseProgress` (`db/queries.ts`). As duas
  queries devem chamar literalmente o mesmo auxiliar — por exemplo
  `buildUnitsWhereClause(courseId: number, level: (typeof englishLevelEnum.enumValues)[number], goal: (typeof learningGoalEnum.enumValues)[number] | null)` —
  para não haver risco de divergirem.
- `getCourseById` (usado em `upsertUserProgress` só para validar que o
  curso tem pelo menos uma unidade/lição antes de o atribuir) fica
  **deliberadamente fora** desta regra — continua a listar todas as
  unidades do curso, sem filtro de nível/objetivo, para nunca bloquear a
  escolha de um curso só porque a combinação nível/objetivo de quem
  escolhe não tem unidades próprias ainda.
- Com as unidades filtradas a dar uma lista vazia, o código atual já se
  comporta bem sem alterações adicionais: `getCourseProgress` devolve
  `{ activeLesson: undefined, activeLessonId: undefined }` (não `null`),
  e `/learn` renderiza normalmente com zero unidades. Isto é uma
  verificação a confirmar durante a implementação, não algo a construir.

### Conteúdo (nível Básico)

Três unidades, todas do curso "English", nível `BASIC`:

1. **"Noções básicas"** (`targetGoal = NULL`, `order = 1`) — 4 lições:
   Cumprimentos, Pessoas, Números, Verbos "be" e "have".
2. **"Inglês no trabalho"** (`targetGoal = WORK`, `order = 2`) — 4 lições:
   No escritório, Reuniões, Email, Conversas de trabalho.
3. **"Inglês em viagem"** (`targetGoal = TRAVEL`, `order = 3`) — 4 lições:
   No aeroporto, No hotel, Pedir direções, No restaurante.

Cada lição tem 5-6 desafios, a maioria `ASSIST` (tradução PT→EN em lista,
sem imagem) e alguns `SELECT` com imagem — mas **só** na lição "Pessoas"
(unidade "Noções básicas"), reaproveitando as pessoas placeholder já
existentes (`man.svg`, `woman.svg`, `boy.svg`, `girl.svg`, `robot.svg`),
tal como o template já fazia. Todas as outras lições (Cumprimentos,
Números, Verbos, e as três lições de Trabalho e de Viagem) são só texto
— não há imagens para esse vocabulário (mala, reunião, etc.), e não se
criam imagens novas nesta tarefa. O texto exato de cada desafio e opção
é escrito no plano de implementação (não fica em aberto para quem
implementar).

### Curso e ícone

- Novo curso `"English"` (consistente com os títulos em inglês dos
  cursos existentes), ícone `/gb.svg` — criado neste documento a partir
  do mesmo estilo plano dos outros ícones de bandeira já em `public/`.
- `courses.id`/`units.id`/`lessons.id`/`challenges.id` são gerados pela
  base de dados (`serial`), nunca escritos à mão — evita colidir com os
  ids já existentes (1-4).

### Script de inserção

- Os scripts existentes (`scripts/seed.ts`, `scripts/reset.ts`) usam o
  driver Neon (`@neondatabase/serverless`), incompatível com o Postgres
  local em Podman usado neste projeto — e são **destrutivos** (apagam
  todas as tabelas, incluindo perfis e progresso reais). Não são tocados
  nem reaproveitados.
- Novo script `scripts/seed-english.ts`, só de inserção (sem `delete`),
  usando o mesmo driver da app (`pg` + `drizzle-orm/node-postgres`,
  `DATABASE_URL` de `.env.local`, tal como `db/drizzle.ts`). Corre uma
  vez para popular o curso de Inglês; voltar a correr sem apagar antes
  criaria duplicados (aceitável — é uma ferramenta de desenvolvimento,
  não corre em produção/build).
- A base de dados local de desenvolvimento tem hoje algum desalinhamento
  nos dados de exemplo (a tabela `units` só tem 1 linha, mas as sequences
  de `lessons`/`challenges` já estão mais avançadas) — não relacionado
  com este documento, e sem efeito no script novo (que só insere dados
  próprios, com ids gerados pela sequence). Ainda assim, ao testar
  manualmente, vale confirmar que os cursos de exemplo (Spanish, etc.)
  continuam a funcionar como hoje, como verificação de regressão.

## O que fica a cargo de quem implementar

- Pequenas diferenças de redação nos enunciados dos desafios (desde que
  o sentido e a tradução estejam corretos) — o texto principal já vem
  decidido no plano.
- Ordem exata dos distratores (opções erradas) dentro de cada desafio.
