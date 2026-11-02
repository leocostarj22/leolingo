# Ecrã dos desafios de diálogo — Design

## Intenção e motivação

Os desafios do tipo `DIALOGUE` mostram hoje uma troca de falas genérica (`app/lesson/dialogue.tsx`): balões brancos com borda, alternados esquerda/direita por posição na lista, só com o nome do falante em texto pequeno — sem avatar, sem cor. Leonardo tem um mockup (`docs/superpowers/specs/assets/mockup dialogos.png`) com um visual bem mais acabado: avatares reais do Leo e da Juba ao lado de cada balão, balões coloridos por personagem (azul para o Leo, rosa para a Juba), e um cabeçalho ilustrado (banner com monumentos, progresso em pontos) em vez do cabeçalho atual (X, barra de progresso, corações). Quer experimentar este visual no ecrã real; se não resultar bem, volta atrás e tenta só os balões com avatar, sem o cabeçalho novo.

## Objetivos

- Os balões de diálogo mostram o avatar certo (Leo ou Juba) e a cor certa (azul/rosa) ao lado de cada fala, com base no nome do falante no texto do desafio (`"Leo: ..."` / `"Juba: ..."`).
- Um cabeçalho novo, só para quando o desafio atual é `DIALOGUE`: banner decorativo (fundo mais simples que o mockup, sem recriar os monumentos), progresso em pontos em vez da barra contínua, sem contador de corações, mantendo a mesma ação de sair (abre o modal de confirmação já existente).
- Os outros tipos de desafio (`SELECT`, `ASSIST`, `WRITE`, `ARRANGE`) continuam a usar o cabeçalho atual, sem alteração visual.
- Fácil de reverter: se o resultado não agradar, a mudança deve poder ser desfeita sem deixar a app pior do que estava (git é suficiente para isto — não é preciso um interruptor de funcionalidade).

## Não-objetivos

- Não recria os monumentos (Big Ben, Torre Eiffel, Coliseu) do mockup — usa um fundo decorativo mais simples (gradiente, folhas, patas), já que o Leonardo confirmou que essa parte do mockup é só referência de estilo.
- Não muda o cabeçalho dos outros tipos de desafio.
- Não muda a lógica de avaliação dos diálogos (continuam sem custar corações nem terem resposta errada — `isAnswerCorrect`/`isAnswerReady` para `DIALOGUE` não mudam).
- Não introduz um "modo anterior" configurável (feature flag) — reverter é feito por git, como já é prática neste projeto.

## Anti-objetivos

- Falharia se o nome do falante no texto do desafio não mapeasse de forma óbvia para um avatar — teria de haver um resultado razoável por omissão (não pode rebentar nem mostrar um balão em branco).
- Falharia se o cabeçalho novo aparecesse também nos outros tipos de desafio dentro da mesma lição, fazendo o topo da tela "saltar" de visual a cada desafio.
- Falharia se a ação de sair deixasse de funcionar (tem de continuar a abrir o modal de confirmação já existente, só com outro estilo).

## Restrições (do estado atual do código)

- `app/lesson/dialogue.tsx` recebe `script: string` (o campo `question` do desafio) e separa por linha, usando `speaker:texto`; hoje alterna esquerda/direita pela posição (`i % 2`), não pelo nome do falante.
- Confirmado na base de dados: todos os 71 desafios `DIALOGUE` existentes usam exatamente os nomes `"Leo"` e `"Juba"` como falantes — não há variação a prever para já.
- `app/lesson/header.tsx` é usado por `app/lesson/quiz.tsx` para todos os tipos de desafio, com `hearts`, `percentage`, `hasActiveSubscription`. A troca de cabeçalho para diálogos tem de acontecer a nível de `quiz.tsx` (escolher qual cabeçalho renderizar consoante `challenge.type`), não dentro do `Header` existente.
- O X do cabeçalho atual chama `useExitModal().open`, que abre `components/modals/exit-modal.tsx` — este comportamento deve ser reutilizado tal e qual no cabeçalho novo.
- `percentage` já existe e vem de `getLessonPercentage()` — o cabeçalho novo não precisa de uma métrica nova, só de a mostrar de outra forma (pontos em vez de barra).
- Os avatares já estão copiados para `public/leo-mini.png` e `public/juba-mini.png` (ficheiros de origem em `docs/superpowers/specs/assets/leominii.png` e `jubamini.png`).
- `DIALOGUE` nunca custa corações nem tem estado de erro (`isAnswerCorrect` devolve sempre `true`) — por isso o cabeçalho de diálogo não precisa de mostrar corações nem ter lógica de "resposta errada".

## Decisões já tomadas

- **Mapeamento de avatar/cor por falante:** `"Leo"` → avatar `leo-mini.png`, balão e nome à esquerda, cor azul. `"Juba"` → avatar `juba-mini.png`, balão e nome à direita, cor rosa. Um nome de falante desconhecido cai para a alternância atual por posição, sem avatar (nunca rebenta). Uma linha sem `:` (sem separador falante/texto) também nunca rebenta: trata-se a linha inteira como texto, sem avatar nem nome, alternando posição como hoje.
- **Lições com diálogo misturado com outros tipos:** `orderLessonChallenges` (`app/lesson/order-challenges.ts`) já coloca todos os desafios `DIALOGUE` por completar no início da fila, antes dos restantes (baralhados). Como `DIALOGUE` nunca falha (`isAnswerCorrect` devolve sempre `true`), nunca é reenviado para o fim da fila — por isso, numa lição com diálogo e outros tipos, o cabeçalho muda no máximo uma vez (do cabeçalho de diálogo para o atual), nunca alterna repetidamente. A troca por desafio atual (`challenge.type === "DIALOGUE"`) já descrita acima cobre isto sem alteração adicional.
- **Âmbito do cabeçalho novo:** só quando `challenge.type === "DIALOGUE"`. Os outros tipos mantêm o `Header` atual sem alterações. A troca acontece em `app/lesson/quiz.tsx`, onde o tipo do desafio já é conhecido.
- **Progresso no cabeçalho de diálogo:** pontos (não a barra atual), preenchidos proporcionalmente à mesma `percentage` já calculada — não é uma métrica nova, só uma forma diferente de a mostrar.
- **Corações:** não aparecem no cabeçalho de diálogo.
- **Sair:** o botão de sair no cabeçalho de diálogo chama o mesmo `useExitModal().open` já usado hoje, só com estilo novo (não é um botão de "voltar" com navegação distinta).
- **Banner/decoração:** fundo decorativo simples (gradiente + motivos de folha/pata), sem imagem de monumentos.
- **Reversibilidade:** sem feature flag — reverter esta funcionalidade é uma reversão normal de commits, como já é a prática neste projeto.

## O que fica por decidir pelo implementador

- O número exato de pontos de progresso a mostrar e o estilo exato (tamanho, cores exatas do gradiente de fundo, motivos decorativos) — seguir o espírito do mockup com liberdade, já que a imagem dos monumentos foi explicitamente dispensada.
- Nome e localização exatos do novo componente de cabeçalho de diálogo (ex.: `app/lesson/dialogue-header.tsx`).
- Estilo exato dos balões (raio da borda, sombra, tamanho do avatar) — seguir a paleta do mockup (azul/rosa) com liberdade de afinação visual.
