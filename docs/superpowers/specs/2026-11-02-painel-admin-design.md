# Painel de Administrador — Design

## Intenção e motivação

Leonardo é o único programador deste projeto e, na prática, também a única conta de teste real. Testar manualmente esgota corações e pontos; hoje não há forma de recuperar corações por tempo (confirmado no código: só se recupera gastando pontos na loja, praticando uma lição já 100% completa, ou tendo subscrição Pro ativa), o que já o deixou bloqueado a meio de uma sessão de testes. Em vez de construir já a loja/compra de corações a sério (que fica deliberadamente para o final), quer um painel de administrador que lhe permita gerir contas de utilizador diretamente — resolve o bloqueio imediato e serve de base para gerir utilizadores reais no futuro.

## Objetivos

- Uma página de administrador que lista todas as contas (`userProgress`) e permite abrir uma conta específica para editar.
- Por conta, o admin pode:
  - Definir corações e pontos para um valor exato.
  - Ligar/desligar uma subscrição "Pro" simulada, sem passar pelo Stripe.
  - Editar os campos de perfil: nível de inglês, objetivo de aprendizagem, género.
  - Repor o progresso de uma lição específica (desafios dessa lição voltam a não-completos).
  - Repor todo o progresso do curso ativo dessa conta (todas as lições voltam a não-completas).
- Acesso restrito: só o id Clerk do Leonardo (fixo no código) pode ver ou usar qualquer parte do painel.

## Não-objetivos

- Não implementa compra real de corações nem a loja a sério — fica para depois, como já tinha sido dito.
- Não adiciona um papel de admin configurável na base de dados nem uma UI para promover outras contas — a lista de admins é fixa no código; alargar no futuro é uma alteração de código, não deste painel.
- Não lida com faturação real do Stripe de forma nenhuma — o toggle "Pro" é uma simulação isolada, nunca escreve na tabela `user_subscription` nem fala com a API do Stripe.
- Não tem paginação, pesquisa ou filtros na lista de utilizadores — há poucas contas reais por agora; isto fica para quando/se isso deixar de ser verdade.

## Anti-objetivos

- Falharia se o toggle "Pro" alguma vez corrompesse ou fosse sobreposto silenciosamente por um webhook real do Stripe, ou se violasse a restrição de unicidade de `stripeCustomerId`/`stripeSubscriptionId`.
- Falharia se qualquer conta fora da lista fixa de admins conseguisse ver ou chamar qualquer parte do painel (página ou ações do servidor) — a proteção tem de estar nos dois sítios, não só escondida da navegação.
- Falharia se uma reposição de progresso (lição ou curso) acontecesse sem confirmação explícita antes de executar.

## Restrições (do estado atual do código)

- `getUserSubscription()` em `db/queries.ts` devolve `null` se não existir nenhuma linha em `user_subscription`, ou um objeto com `isActive` calculado a partir de `stripePriceId` e `stripeCurrentPeriodEnd` (expira 1 dia depois dessa data). Todas as colunas de `user_subscription` (`stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`) são `.notNull().unique()` e alimentadas por webhooks reais do Stripe — nunca devem ser escritas por este painel.
- Os sítios que consomem `getUserSubscription()` (`app/(main)/leaderboard`, `app/(main)/shop`, `app/(main)/learn`, `app/lesson/page.tsx`, `app/lesson/[lessonId]/page.tsx`, `actions/challenge-progress.ts`, `actions/user-progress.ts`) só leem o campo `.isActive`. A única excepção é `actions/user-subscription.ts` (`createStripeUrl`), que já trata corretamente a ausência de `stripeCustomerId` (cai para criar uma nova sessão de checkout em vez de abrir o portal) — por isso é seguro que a simulação nunca tenha um `stripeCustomerId` real.
- `completed` em `db/queries.ts` (lições e desafios) é calculado como "existe pelo menos uma linha em `challenge_progress` para este desafio E todas estão `completed=true`" — tanto a ausência da linha como uma linha com `completed=false` contam como não-completo; por isso repor progresso pode apagar as linhas ou pô-las a `false`, sem diferença de comportamento.
- Não existe nenhuma tabela nem conceito de "role" hoje.
- **Já existe um painel de administrador no projeto, mas é de conteúdo, não de contas.** `app/admin/page.tsx` + `app/admin/app.tsx` montam uma consola react-admin na rota `/admin`, com recursos `courses`, `units`, `lessons`, `challenges`, `challengeOptions` (cada um com `list`/`edit`/`create`). A proteção é `lib/admin.ts`: uma função `isAdmin()` **sem parâmetros** (lê o utilizador autenticado via `auth()` do Clerk internamente), verificando o id contra uma lista fixa `adminIds`. É usada em **15 sítios**: a página `/admin` e os 14 handlers de `/api/{courses,units,lessons,challenges,challengeOptions}` (e as suas variantes `[id]`). A lista tinha apenas `user_2dGb6YEarBAQHrNYoB5dMtISRWK` — um resto da conta de demonstração do template original "Duolingo Clone", **não o id do Leonardo** (`user_3LN3ZpiSycpP83mFMmYe9D5cggd`), o que o deixava de fora da própria consola existente.
- O `<Admin>` do react-admin em `app/admin/app.tsx` usa routing por hash por padrão (navegação interna tipo `/admin/#/courses`), não rotas reais do Next.js — por isso uma rota Next.js nova fora de `/admin` exato (ex. `/admin/users`) não colide com esta consola.

## Decisões já tomadas

- **Quem é admin:** reutiliza-se a lista e a função já existentes em `lib/admin.ts`, corrigindo o id desatualizado para o do Leonardo (`user_3LN3ZpiSycpP83mFMmYe9D5cggd`). Não se cria um segundo mecanismo de admin — `isAdmin()` (sem parâmetros, como já está) passa a ser chamada também pelo novo painel de contas. Para adicionar outro admin no futuro, edita-se essa mesma lista.
- **Onde vive a verificação:** a `isAdmin()` já existente em `lib/admin.ts`, chamada tanto na página do painel de contas (para decidir se mostra ou redireciona) como no início de cada ação do servidor do painel de contas (defesa em profundidade — uma ação nunca deve confiar só em a página não ter sido mostrada).
- **Simulação de Pro:** nova coluna `adminOverridePro: boolean` (default `false`) em `user_progress` — nunca na tabela `user_subscription`. A lógica equivalente a "é Pro?" passa a devolver verdadeiro se `adminOverridePro` for verdadeiro, mesmo sem nenhuma linha real em `user_subscription`, mantendo `stripeCustomerId` como `null` nesse caso sintético (para a criação do link do Stripe continuar a cair no caminho seguro já existente).
- **Edição de corações/pontos:** campos diretos "definir para X" (não botões de "+N") — mais simples, e serve também para "dar créditos" fazendo a conta externamente. O campo de corações aceita qualquer valor (sem limitar a 0–5): mais flexível para testes, aceitando que um valor acima de 5 pode baixar sozinho para 5 na primeira resposta certa em modo prática (comportamento já existente em `actions/challenge-progress.ts`, não alterado por este painel).
- **Reposição de progresso:** duas granularidades, ambas disponíveis na página de edição de uma conta — repor uma lição escolhida, ou repor o curso ativo inteiro dessa conta. Ambas pedem confirmação explícita antes de executar (ver Anti-objetivos).
- **Rota:** `/admin` já pertence à consola de conteúdo existente. O painel de contas fica em `/admin/users` (lista) e numa rota de edição por utilizador sob esse caminho. Layout próprio, sem a barra lateral/mascote normal da app — é uma superfície de utilidade, não parte da experiência de aprendizagem.

## O que fica por decidir pelo implementador

- Exato layout da tabela de utilizadores e do formulário de edição (ordem dos campos, estilo visual) — seguir o estilo visual já usado no resto da app (Tailwind + shadcn, como os outros ficheiros em `app/(main)`).
- Rota exata da página de edição por utilizador (ex.: `/admin/users/[userId]`) e nome exato dos campos do formulário.
- Mecanismo exato de confirmação antes de repor progresso (diálogo nativo do browser, ou um componente de confirmação já existente no projeto) — só importa que exista um passo explícito antes de executar.
- Se apagar as linhas de `challenge_progress` ou marcá-las como `completed=false` ao repor progresso — ambas têm o mesmo efeito observável (ver Restrições); apagar é a opção mais simples e a recomendada.
