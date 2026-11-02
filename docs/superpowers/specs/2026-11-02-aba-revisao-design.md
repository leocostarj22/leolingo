# Aba Revisão — Design

## Intenção e porquê

Dos quatro temas de conteúdo/engajamento escolhidos por Leonardo nesta sessão (sequência diária, tipo de exercício de correspondência, mais níveis/objetivos, aba Revisão), este é o último. O gap original: a app nunca tem um sítio para rever vocabulário já visto fora do fluxo linear de lições — a única forma de "repetir" algo é reabrir uma lição concreta (`/lesson/{id}`) ou esperar pela lição "Revisão da Unidade" no fim de cada unidade (conteúdo fixo, só aparece uma vez por unidade, só cobre essa unidade).

Esta sessão de brainstorming foi feita em modo "avança" — Leonardo optou por não responder a perguntas e deixar as decisões comigo. As escolhas abaixo são todas minhas, documentadas para que ele as possa rever sem teres de as adivinhar.

## O que isto é

Uma nova aba na barra lateral ("Revisão"), ao lado de Aprender/Placar/Desafios/Loja, que leva diretamente a uma **sessão ativa**: um conjunto de desafios já respondidos corretamente antes, escolhidos aleatoriamente entre **todas** as lições que o utilizador já terminou — de qualquer unidade e qualquer nível, não só o nível/objetivo atual. Não é uma lista para consultar; é mais uma ronda de perguntas, exatamente como qualquer lição, só que a reunir conteúdo de sítios diferentes.

Isto resolve de propósito um problema que já tínhamos identificado no projeto anterior (progressão de nível): depois de subir de nível, as unidades BASIC deixam de aparecer em `/learn` (filtradas pelo nível atual). A aba Revisão continua a dar acesso a esse vocábulo antigo, independentemente do nível em que o utilizador está agora.

## Objetivos

- Uma aba nova, sempre visível, que nunca está vazia de propósito a não ser que o utilizador genuinamente ainda não tenha terminado nada.
- Cada visita constrói uma sessão nova (até 10 desafios, aleatórios, sem repetir dentro da mesma sessão) a partir de **tudo** o que o utilizador já terminou em qualquer unidade/nível — não filtrada pelo nível/objetivo atual.
- Reaproveita por completo o mecanismo de "modo prática" já existente (sem custo de corações, com regeneração de corações em respostas certas, sem bloqueio por corações a zero) — não é um conceito novo, é o mesmo mecanismo aplicado a uma fila que atravessa várias lições.
- Terminar uma sessão de revisão conta para a sequência diária e, se aplicável, para a subida de nível — exatamente como qualquer outra prática, sem código novo para isso (já generaliza).

## Não-objetivos (para esta fase)

- Repetição espaçada / qualquer noção de "este utilizador costuma errar esta palavra, mostra-a mais vezes" — não existe hoje nenhum histórico de erros persistido (`wrongAttempts` só vive em memória durante uma lição), e construir isso é um projeto à parte. Nesta fase, a amostragem é puramente aleatória.
- Desafios do tipo `DIALOGUE` ficam de fora da amostra — não são testáveis (`isAnswerCorrect` devolve sempre verdadeiro para DIALOGUE), por isso rever um não tem qualquer efeito de aprendizagem.
- Nenhuma página de listagem/consulta de vocabulário à parte da sessão ativa.

## Decisão (minha, por Leonardo ter optado por "avança")

Sessão ativa, não lista de consulta — porque toda a app é construída à volta de desafios, nunca de referência passiva, e misturar os dois paradigmas seria inconsistente com o resto.

## O que fica para quem constrói

- **Tamanho da sessão:** até 10 desafios; se o utilizador tiver menos de 10 terminados (excluindo DIALOGUE), usa todos os que existirem; se tiver zero, mostra um estado vazio simpático em vez de uma sessão sem nada.
- **Amostragem:** aleatória entre todos os `challengeProgress.completed = true` do utilizador, de tipo diferente de `DIALOGUE`, sem filtrar por `englishLevel`/`learningGoal` atual (ao contrário de `buildUnitsWhereClause`, que é só para o mapa de `/learn`).
- **Rota:** `/review`, fora do grupo `(main)` — rota de topo própria com o seu próprio layout mínimo, tal como `/lesson` e `/level-up` já são hoje (a sessão ocupa o ecrã todo, sem barra lateral, exatamente como estar dentro de qualquer lição). O link da barra lateral vai direto para lá — sem ecrã intermédio de "estás pronto?", tal como clicar num nó do mapa em `/learn` também vai direto para a lição.
- **Reaproveitamento do componente `Quiz` existente:** como todos os desafios da amostra já estão `completed = true`, a sessão é automaticamente tratada como modo prática pelo mecanismo já existente (`initialPercentage === 100`) — sem nenhuma flag nova para isso.
- **Pontuação exibida no ecrã final:** a premissa inicial ("nenhuma lição bónus tem desafios fora de DIALOGUE") está errada — as 3 lições bónus seedadas por `scripts/seed-interactive-content.ts` têm, cada uma, 1 desafio DIALOGUE **e 2 desafios SELECT**, estes sim amostráveis. Em vez de encolher a amostra para evitar o problema, a conta de pontos do ecrã final deixa de assumir um único valor "bónus ou não" para toda a sessão (`initialIsBonus: boolean` em `Quiz`) e passa a somar o valor real de cada desafio amostrado (10 ou 20, consoante a lição real desse desafio seja bónus ou não) — calculado uma vez no servidor, ao construir a amostra, e passado a `Quiz` como um único número já pronto (substitui `initialIsBonus` por algo como `initialPointsAvailable: number`; `/lesson/page.tsx` passa a calcular esse número da forma de sempre — `totalChallengeCount * (lesson.isBonus ? 20 : 10)` — só que agora no sítio que já conhece cada ponto, em vez de o ecrã final o inferir de uma flag isolada).
- **Botão "Practice again" no ecrã final:** para uma sessão de revisão, repetir "a mesma lição" não faz sentido (a sessão atravessa várias lições). Este botão fica escondido para sessões de revisão; o botão "Continuar" leva para `/learn` como de costume. Para rever outra vez, o utilizador volta a clicar na aba Revisão (cada visita gera uma amostra nova).
- **Item novo na barra lateral:** mesmo padrão dos quatro já existentes (`SidebarItem`, ícone emoji + cor de destaque); a lista de cores (`Tint`) tem de crescer uma entrada.
