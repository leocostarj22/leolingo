# Progressão de Nível (BASIC → INTERMEDIATE) — Design

## Intenção e porquê

Leonardo (único desenvolvedor e também utilizador real da app, perfil `englishLevel=BASIC`, `learningGoal=WORK`) terminou todo o conteúdo disponível para o seu nível e objetivo e ficou sem nada mais para fazer em `/learn`. A app já filtra `units` por `englishLevel`/`learningGoal` (`db/queries.ts`, `buildUnitsWhereClause`), mas nada move um utilizador de nível: `englishLevel` é gravado uma única vez no onboarding (`app/profile-setup/profile-form.tsx` → `completeUserProfile`) e, depois disso, só pode ser alterado manualmente pelo painel de admin. Este projeto cria a progressão automática `BASIC → INTERMEDIATE`: conteúdo INTERMEDIATE real e um mecanismo que avança o nível do utilizador quando ele esgota o nível atual, com uma celebração visível nesse momento.

Isto é a primeira fase de um tema mais amplo ("mais níveis e objetivos de conteúdo") que Leonardo escolheu entre quatro iniciativas desta sessão. A segunda fase (mais objetivos — estudar no estrangeiro, falar com confiança, outro) fica deliberadamente para depois.

## Objetivos

- Quando o utilizador termina **todas** as lições aplicáveis ao seu `englishLevel`/`learningGoal` atual, o seu `englishLevel` sobe automaticamente para o nível seguinte — sem qualquer ação manual do utilizador.
- Existe conteúdo INTERMEDIATE real para os dois objetivos que já têm conteúdo hoje (WORK, TRAVEL) e uma unidade genérica (sem objetivo) ao nível INTERMEDIATE — mesma forma estrutural das 3 units BASIC já existentes (1 genérica + 1 por objetivo).
- Cada unidade INTERMEDIATE nova segue a mesma forma das unidades BASIC existentes: 4 lições normais + 1 lição bónus `DIALOGUE` + 1 lição final "Revisão da Unidade", com volume de desafios semelhante (6–10 por lição normal, 3 na `DIALOGUE`, 8 na revisão).
- O momento da subida de nível tem uma celebração **visível e explícita** — nunca silenciosa.

## Não-objetivos (para esta fase)

- Nível `ADVANCED` — só se justifica construir depois de se validar que a progressão para `INTERMEDIATE` funciona bem na prática.
- Outros `learningGoal` (`STUDY_ABROAD`, `SPEAK_CONFIDENTLY`, `OTHER`) — fase 2 do tema mais amplo, explicitamente adiada por decisão de Leonardo.
- Uma página de perfil/definições para o utilizador escolher manualmente o seu nível — a subida é 100% automática; o painel de admin já permite forçar o campo manualmente para testes, e isso é suficiente.
- Qualquer teste/avaliação real de proficiência — o nível avança por ter esgotado o conteúdo disponível, não por uma medição de conhecimento.

## Anti-objetivos (seria falhar mesmo que funcionasse tecnicamente)

- Subir de nível de forma silenciosa, sem o utilizador perceber que subiu — contraria diretamente o que Leonardo pediu.
- Deixar o utilizador sem nenhuma unidade visível em `/learn` depois da subida — reproduzir, para INTERMEDIATE, o mesmo "ecrã vazio" que hoje atinge qualquer utilizador fora de BASIC. O conteúdo INTERMEDIATE relevante para o `learningGoal` de cada utilizador (mais a unidade genérica) tem de existir e estar completo antes de esse utilizador poder subir — o mecanismo entra em produção já na fase 1 (WORK + genérica), antes de TRAVEL existir, porque nenhum utilizador `TRAVEL` consegue subir sem a unidade TRAVEL correspondente.

## Decisões já tomadas (por Leonardo)

- Ordem de prioridade dentro do tema "mais níveis/objetivos": progressão de nível primeiro, mais objetivos depois.
- A subida de nível é automática ao terminar o nível atual — o utilizador não escolhe quando avançar.
- A celebração da subida de nível tem de ser visível (não silenciosa).
- **O trigger da subida de nível também dispara em modo prática**, não só em lições novas. Leonardo já terminou todo o conteúdo BASIC/WORK; um trigger restrito a lições novas nunca voltaria a disparar para ele sem um ajuste manual no admin. Consequência aceite: repetir uma lição BASIC já concluída, em modo prática, pode desencadear a celebração de subida de nível caso todo o resto do nível já esteja terminado — não é um bug, é o comportamento pretendido.
- **Entrega em duas fases:** primeiro a unidade genérica + a unidade WORK ao nível INTERMEDIATE, juntamente com o mecanismo de subida (desbloqueia Leonardo de imediato); a unidade TRAVEL ao nível INTERMEDIATE segue como incremento curto a seguir, sem bloquear a primeira entrega nem exigir alterações ao mecanismo.

## O que fica para quem constrói

- **Trigger exato:** a verificação corre nos dois ramos de `upsertChallengeProgress` (o de primeira conclusão e o de modo prática) sempre que `isLastChallenge` é verdadeiro — mesmos pontos onde o streak já é atualizado hoje. Nesse momento, verifica-se se **todas** as `units` que `buildUnitsWhereClause` devolveria para o `englishLevel`/`learningGoal` atual do utilizador (incluindo a unidade genérica, sem `targetGoal`) estão 100% terminadas; se sim, sobe o nível.
- **Definição de "nível terminado":** existe uma linha `challengeProgress` com `completed=true` para todos os `challenges` de todas as lições de todas as `units` que o filtro do nível/objetivo atual devolveria.
- **Progressão é sempre sequencial, um nível de cada vez** (`BASIC → INTERMEDIATE` apenas) — nunca salta dois níveis de uma vez, mesmo com dados antigos inconsistentes.
- **Unidade genérica ao nível INTERMEDIATE:** existe, espelhando a unidade genérica BASIC ("Noções básicas"), para manter a mesma arquitetura (1 unidade genérica + 1 por objetivo com conteúdo) e para exercitar corretamente a definição de "nível terminado" acima também para utilizadores sem `learningGoal` definido.
- **Onde aparece a celebração:** um ecrã dedicado, a seguir à lição que despoletou a subida, distinto do ecrã normal de fim de lição.
- **Conteúdo:** escrito em português → inglês, com vocabulário e gramática genuinamente de nível intermédio (acima do BASIC), seguindo a mesma estrutura pedagógica dos tipos de exercício já existentes (`SELECT`/`ASSIST`/`WRITE`/`ARRANGE`/`DIALOGUE`, com `MATCH` a usar onde fizer sentido).
