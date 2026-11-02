# Desenho: Sequência Diária (Streak)

**Data:** 2026-11-02
**Estado:** aprovado pelo utilizador em brainstorming, pronto para planeamento de implementação

## Intenção e porquê

Esta é a primeira de quatro funcionalidades escolhidas pelo utilizador para continuar o roteiro original (`docs/superpowers/specs/2026-10-28-ingles-app-design.md`), que já previa a sequência diária como uma das três pedras angulares da gamificação (junto com XP e vidas) mas nunca foi construída. As outras três (tipo de exercício "matching", mais níveis/objetivos de conteúdo, aba "Revisão") têm os seus próprios documentos, nesta ordem.

## Goal

Contar quantos dias consecutivos o utilizador completou pelo menos uma lição, e mostrar essa contagem com um ícone de chama 🔥, tal como já estava previsto no desenho original.

## Decisões já tomadas (em conversa com o utilizador)

- **Sem "congelamento" de sequência, sem item de loja associado.** Decisão explícita do utilizador: a app nasceu da frustração com apps que trancam funcionalidades por trás de pagamento (ver "Intenção e porquê" do desenho original); um "streak freeze" comprável seria exatamente esse tipo de trava. Sem tolerância de nenhum tipo: a sequência quebra-se sempre que passa um dia de calendário completo sem nenhuma lição concluída.
- **Regra de contagem:** ao completar uma lição,
  - se a última atividade foi "hoje" → não muda nada (já contava para hoje).
  - se a última atividade foi "ontem" → soma 1 à sequência.
  - se a última atividade foi há 2 ou mais dias (ou nunca) → a sequência reinicia para 1.
- **Qualquer lição conta**, incluindo lições-bónus de diálogo e a nova "Revisão da Unidade", e incluindo lições já completadas que estão a ser repetidas em modo de prática — tal como no Duolingo real, repetir uma lição já dominada também conta como atividade do dia.
- **Local de exibição:** no widget `UserProgress` (`components/user-progress.tsx`), partilhado pelas páginas `/learn`, `/quests`, `/leaderboard`, `/shop`, `/courses` — ao lado dos pontos e corações já existentes, exatamente onde o desenho original colocava os elementos de gamificação (coração, chama, troféu, XP). Não aparece dentro do cabeçalho da lição em si (`app/lesson/header.tsx` / `dialogue-header.tsx`) — esses ficam como estão, focados na lição em curso.

## Decisões adicionais (após verificação técnica do documento)

Uma revisão técnica deste documento (comparando-o com `db/schema.ts`, `app/lesson/quiz.tsx` e `components/user-progress.tsx`) levantou pontos que resolvo aqui, como decisões do construtor — nenhum muda o essencial já combinado com o utilizador:

- **Âmbito da sequência:** `userProgress` tem uma única linha por utilizador (`userId` é chave primária), não por curso — `activeCourseId` é só o curso selecionado de momento, não há progresso paralelo por curso. A sequência é, portanto, necessariamente global à conta, tal como já são os corações e os pontos hoje. Não há aqui nenhuma decisão nova a tomar, só uma consequência direta da arquitetura existente.
- **Fuso horário:** fixar o cálculo do "dia de calendário" em `Europe/Lisbon`, independentemente do fuso onde o servidor Node corre (não confiar no fuso local do processo) — simples e correto para o uso familiar previsto, sem suporte a fuso por utilizador.
- **Momento exato do gatilho:** a sequência atualiza-se no mesmo momento em que o último desafio da fila é respondido corretamente (mesmo instante em que hoje já se chama `upsertChallengeProgress`), não só quando o ecrã "lição concluída" chega a ser desenhado — mais simples e já é o padrão existente para pontos/corações.
- **Leitura vs. escrita:** o valor mostrado no widget `UserProgress` é calculado no momento da leitura a partir de `lastActivityDate` (se a última atividade foi há 2+ dias, mostra-se 0, mesmo que a coluna `currentStreak` ainda não tenha sido atualizada) — mais correto do que deixar o número antigo visível até à próxima lição. A escrita em `currentStreak`/`lastActivityDate` continua a só acontecer na conclusão de uma lição.
- **Sem histórico para preencher ao lançar:** não existe nenhuma coluna de data/hora em `challengeProgress` nem em mais nenhuma tabela que permita reconstruir a atividade passada real. Todos os utilizadores (incluindo os já ativos hoje) começam com `lastActivityDate` nulo e a sequência arranca do zero na próxima lição que completarem — aceitável, não há dados para um backfill correto mesmo que se quisesse.
- **Sem notificação de marco/quebra na primeira versão:** só o número muda no widget; sem toast, animação ou mensagem especial quando a sequência sobe ou se perde. Pode ser adicionado mais tarde se fizer falta.

## O que fica a cargo de quem implementar

- Esquema exato das novas colunas em `userProgress` (nome, tipo — ex. `currentStreak` inteiro, `lastActivityDate` data).
- Se a atualização da sequência é uma nova server action dedicada ou é incorporada numa já existente (ex. `upsertChallengeProgress`).
- Estilo exato do ícone de chama e onde fica posicionado dentro do `UserProgress` (antes ou depois dos pontos/corações).
- Comportamento visual quando a sequência é 0 (utilizador nunca completou nenhuma lição) — mostrar "0" simples é suficiente.
