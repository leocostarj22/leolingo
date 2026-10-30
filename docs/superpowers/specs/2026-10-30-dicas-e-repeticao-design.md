# Dicas e repetição de desafios errados — Design

## Intenção e motivação

Hoje, quando o utilizador erra um desafio na lição (`app/lesson/quiz.tsx`), o
`Footer` mostra "Try again." e um botão "Retry": ao clicar, o mesmo desafio
reaparece imediatamente, sem pista nenhuma, até acertar. O utilizador pediu
um fluxo mais parecido com o Duolingo: ao errar, avança para a pergunta
seguinte e só volta a ver o desafio errado mais tarde, no fim da fila da
lição — e, quando volta a aparecer, quer que haja uma pista a ajudar, sem
entregar a resposta de imediato.

Porquê agora: a funcionalidade "Atividades mais interativas" (WRITE,
ARRANGE, DIALOGUE, áudio, lições bónus) acabou de ser entregue e já alterou
profundamente a máquina de estados do `quiz.tsx`; esta é a próxima melhoria
natural sobre a mesma máquina de estados, antes que mais funcionalidades se
acumulem por cima.

## Objetivos

- Ao errar um desafio, o utilizador avança de imediato para o desafio
  seguinte, em vez de ficar bloqueado a repetir o mesmo até acertar.
- O desafio errado volta a aparecer mais tarde, no fim da fila da lição
  atual (comportamento "rotativo": erra, vai para o fim; acerta, sai da
  fila).
- Quando um desafio que já foi errado pelo menos uma vez volta a aparecer,
  mostra uma pista específica ao tipo de desafio, sem revelar a resposta
  completa.
- Se o utilizador errar esse mesmo desafio outra vez (já com pista), a
  resposta certa é revelada — para nunca ficar preso sem saber — mas o
  desafio continua a voltar ao fundo da fila até ser respondido certo.
- A barra de progresso só avança na primeira vez que cada desafio é
  respondido certo; repetições não contam e nunca a fazem passar de 100%.
- A lição só termina quando todos os desafios tiverem sido respondidos
  certo pelo menos uma vez.

## Não-objetivos

- Não há repetição espaçada entre lições ou dias (isto é só dentro de uma
  única sessão de lição).
- Não há uma funcionalidade geral de "praticar pontos fracos" fora da
  lição atual.
- Não muda a lógica de corações (perder coração ao errar, modal de
  corações esgotados) nem o gate de áudio (`audioSrc`/`hasPlayedAudio`) já
  existentes — ambos continuam exatamente como estão.
- Não se aplica a desafios DIALOGUE, que nunca podem ser "errados"
  (`isAnswerCorrect` devolve sempre `true` para este tipo).
- Não altera o comportamento de resumo de lição parcialmente completa
  (`order-challenges.ts`): desafios já completos antes de abrir a lição
  continuam excluídos da fila rotativa logo de início (ver Constraints).
  Isto é distinto do modo prática (ver Decisões já tomadas) — lá, a lição
  já está 100% completa de propósito e o utilizador escolheu repeti-la.

## Anti-objetivos

- Falharia se a pista alguma vez entregasse a resposta certa à primeira
  tentativa errada (isso anula o propósito de aprender).
- Falharia se a barra de progresso pudesse ultrapassar 100% ou recuar por
  causa das repetições.
- Falharia se o utilizador pudesse ficar preso num ciclo sem nunca ver a
  resposta certa (daí a revelação já na segunda tentativa errada do mesmo
  desafio).

## Restrições (do estado atual do código)

- `app/lesson/quiz.tsx` guarda hoje `challenges` como array fixo
  (`useState(initialLessonChallenges)`, nunca mutado) e navega com
  `activeIndex` incremental. Este design implica que `challenges` passe a
  ser mutável (fila rotativa) e que `activeIndex` deixe de ser necessário
  — o desafio atual passa a ser sempre `challenges[0]`.
- `app/lesson/order-challenges.ts` (`orderLessonChallenges`) já separa
  desafios completos (prefixo, resumo de lição) de não-completos
  (baralhados, DIALOGUE fixado primeiro). Os desafios já completos antes
  de abrir a lição **não entram na fila rotativa** — já estão terminados,
  não há razão para passarem outra vez por ela. A fila rotativa arranca
  apenas com os não-completos dessa ordenação.
- O ecrã de conclusão usa `challenges.length * (initialIsBonus ? 20 : 10)`
  para o XP total (`quiz.tsx` linha ~249). Como a fila rotativa vai
  encolher a cada acerto (itens saem) e não voltar a crescer no total
  (só reordena), `challenges.length` deixa de servir para este cálculo —
  precisa de um total fixo independente, calculado a partir da contagem
  original de desafios não-completos (mais os já completos antes de
  abrir, para o XP da lição completa fazer sentido).
- `Footer` (`app/lesson/footer.tsx`) não revela hoje a resposta certa em
  nenhum momento — só mostra "Try again." Este design introduz a primeira
  revelação de resposta no fluxo da lição.
- `Card` (usado por `Challenge` em `challenge.tsx`) já aceita `disabled`;
  a pista de "eliminar uma opção errada" em SELECT/ASSIST deve reusar/
  estender essa prop em vez de introduzir um mecanismo novo.

## Decisões já tomadas

- **Modelo de fila:** `challenges` em `quiz.tsx` passa a ser uma fila
  rotativa. Acertar remove o primeiro elemento (`prev.slice(1)`); errar
  move o primeiro para o fim (`[...prev.slice(1), prev[0]]`). O desafio
  atual é sempre `challenges[0]`; `activeIndex` é removido.
- **Progresso:** mantém-se um conjunto de ids já respondidos certo nesta
  sessão (`completedIds`). A percentagem é
  `completedIds.size / totalChallengeCount * 100`, onde
  `totalChallengeCount` é fixo (desafios completos antes de abrir +
  desafios na fila rotativa inicial), nunca `challenges.length`.
- **Fim da lição:** quando a fila rotativa fica vazia
  (`challenges.length === 0`), tal como hoje (`if (!challenge)`).
- **Contagem de tentativas por desafio:** um mapa `wrongAttempts:
  Record<number, number>` (chave = id do desafio) incrementado a cada
  erro. É consultado por id, não por posição, porque o mesmo desafio pode
  reaparecer várias vezes na fila.
- **Regra de pista/revelação**, por `wrongAttempts[challenge.id]` no
  momento em que esse desafio volta a ficar ativo (`challenges[0]`):
  - `0` (primeira vez a aparecer): sem pista, comportamento normal.
  - `>=1` (já errou pelo menos uma vez antes): mostra a pista específica
    do tipo (ver abaixo) desde que o desafio fique ativo — mas nunca
    revela a resposta certa só por mostrar a pergunta. A pista é sempre
    a mesma a partir daqui (não fica mais forte com mais erros).
  - A revelação da resposta certa (ver "Revelação" abaixo) é sempre
    reativa — só acontece em resposta a um novo erro, nunca ao mostrar a
    pergunta — e passa a acontecer a partir do momento em que
    `wrongAttempts[challenge.id] >= 2` no instante da submissão (ou
    seja: 1º erro → avança sem pista; 2ª aparição e eventual novo erro →
    é esse 2º erro que já revela a resposta, porque a pista já estava
    visível desde que a pergunta apareceu).
- **Pistas por tipo de desafio:**
  - SELECT/ASSIST: uma opção incorreta fica visivelmente desativada
    (reusa `disabled` por opção no `Card`, com estilo distinto de
    "eliminada" vs. "a aguardar resposta") e não pode ser escolhida.
  - WRITE: mostra a inicial da resposta aceite e o número de palavras
    (ex.: "Começa por "L..." e tem 3 palavras") por baixo do campo.
  - ARRANGE: a primeira peça da resposta certa já aparece pré-colocada na
    tira de resposta quando o desafio fica ativo.
  - DIALOGUE: não aplicável (nunca erra).
- **Revelação:** só é desencadeada por uma submissão errada (nunca ao
  simplesmente mostrar a pergunta). Quando o utilizador erra uma
  submissão e, nesse momento, `wrongAttempts[challenge.id]` já é `>= 1`
  (ou seja, esta não é a primeira vez que erra este desafio), o `Footer`
  substitui "Try again." por uma linha com a resposta certa (ex.: "A
  resposta certa era: <texto>"), antes de avançar — o desafio continua a
  ir para o fim da fila da mesma forma, só muda a mensagem mostrada. Na
  prática: erra a 1ª vez (sem pista, sem revelação) → reaparece com
  pista → se errar outra vez já com a pista, essa submissão revela a
  resposta.
- **Reset de estado por desafio:** sempre que `challenges[0]` muda (quer
  por entrar novo, quer por voltar da rotação), o estado de resposta
  local (`selectedOption`, `writtenAnswer`, `arrangedTileIds`,
  `hasPlayedAudio`) é limpo, tal como já acontece hoje ao avançar.
- **Corações e áudio:** sem alterações — perder coração ao errar e o gate
  de áudio continuam exatamente como estão hoje.
- **Modo prática** (lição já 100% completa, utilizador escolhe praticar —
  `initialPercentage === 100`, `openPracticeModal`): a fila rotativa
  ignora o campo `completed` e arranca com **todos** os desafios da
  lição, não só os "não-completos". É um refazer completo de propósito,
  consistente com o comportamento já existente (`percentage` reinicia a
  0, pontos/corações tratados pelo ramo `isPractice` de
  `upsertChallengeProgress`). A regra de excluir completos da fila
  rotativa (ver Constraints) só se aplica ao resumo de uma lição ainda a
  decorrer, nunca ao modo prática — são dois conceitos distintos que
  partilham o mesmo campo `completed` por acidente de implementação.
- **WRITE com várias respostas aceites:** se a pista precisar de inicial
  e número de palavras e houver mais do que uma resposta aceite, usa
  sempre a primeira da lista devolvida por
  `options.filter(o => o.correct)` — mesma ordem já usada no resto do
  código para este tipo.

## O que fica por decidir pelo implementador

- O texto exato das mensagens novas no `Footer` (feedback de "errado sem
  revelar" e a linha de revelação da resposta) — manter o mesmo tom
  informal já usado ("Nicely done!", "Try again.").
- Qual opção incorreta eliminar em SELECT/ASSIST quando há mais do que
  uma errada (ex.: sempre a primeira errada da lista, ou aleatória) — o
  importante é nunca eliminar a opção correta.
- Detalhes de estilo visual da opção "eliminada" (ex.: opacidade,
  traço) e da peça pré-colocada no ARRANGE — seguir o estilo visual já
  usado nos componentes existentes (`card.tsx`, `arrange-challenge.tsx`).
- Como expor `totalChallengeCount` ao `Quiz` (prop nova calculada no
  servidor a partir de `lesson.challenges.length`, ou calculado no
  cliente a partir do array completo recebido antes de filtrar a fila) —
  qualquer uma é válida desde que o valor seja fixo e não dependa da fila
  rotativa.
