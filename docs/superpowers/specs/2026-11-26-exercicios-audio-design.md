# Exercícios de áudio (escuta + resposta falada) — Design

## Intenção e porquê

Leonardo quer aumentar a variedade de exercícios da Leolingo usando IA para
gerar conteúdo offline (mesma direção já aprovada para o rollout dos
exercícios MATCH). O ponto fraco identificado: hoje só existem 11
exercícios do tipo `DIALOGUE` (Leo e Juba conversam, seguido de perguntas de
compreensão), e são só texto para ler — não há áudio nenhum. Ele quer:

1. Diálogos reais em áudio (Leo e Juba a "falar" de verdade, com vozes
   diferentes), sobre temas ligados ao objetivo do utilizador (viagem,
   trabalho, geral).
2. Perguntas de compreensão a seguir, com correção imediata a cada erro
   (como já acontece hoje no `DIALOGUE`).
3. Três formas possíveis de responder, variando por pergunta: escolher a
   resposta certa, escrever a resposta, ou **falar** a resposta.
4. Muitos mais exercícios destes do que os 11 atuais, gerados offline por
   IA (modelo gratuito) e revistos por Leonardo antes de entrarem na base
   de dados — nunca gerados ao vivo por utilizador.

## Objetivos

- Dar áudio real aos diálogos `DIALOGUE` (vozes distintas para Leo e Juba),
  gerado offline e grátis via `node-edge-tts` (já é dependência do
  projeto).
- Criar uma nova modalidade de resposta, **falar** (`SPEAK`): o utilizador
  grava a resposta, é transcrita no servidor (Whisper via Groq, grátis), e
  avaliada com a mesma comparação tolerante que o `WRITE` já usa hoje.
- Aumentar substancialmente o número de exercícios de diálogo/escuta,
  gerados offline por um script (reaproveitando o padrão já estabelecido em
  `scripts/add-match-exercises.ts`), revistos por Leonardo antes do deploy.
- Dar áudio de brinde aos 11 `DIALOGUE` de texto já existentes (reaproveita
  o texto, só gera o áudio).

## Não-objetivos

- Nenhuma geração de exercícios ao vivo, por utilizador — tudo offline,
  revisto, inserido como conteúdo estático (igual ao MATCH).
- Nenhuma escolha de modo de resposta pelo utilizador em tempo real — o
  modo (escolher/escrever/falar) é fixo por pergunta, decidido na criação
  do conteúdo (decisão já tomada na conversa).
- Nenhuma alteração ao comportamento/avaliação dos tipos `SELECT`/`WRITE`/
  `ARRANGE`/`MATCH` já existentes fora do contexto de diálogo.
- Nenhuma tentativa de avaliação semântica/difusa da resposta falada além
  da comparação tolerante (`normalizeAnswer`) já existente — se na prática
  se mostrar demasiado rígida, é trabalho futuro, não deste projeto.
- Nenhum motor de personalização de temas — os diálogos são etiquetados por
  `targetLevel`/`targetGoal` exatamente como as unidades já são hoje.

## Anti-objetivos (o que tornaria isto um falhanço)

- Uma resposta falada falhar a avaliação silenciosamente (permissão de
  microfone negada, falha de rede ao chamar o Groq) sem alternativa clara
  — tem de haver sempre um caminho de erro/repetir visível, nunca um beco
  sem saída.
- Utilizadores de iPhone (o público que acabou de ganhar a instalação PWA)
  ficarem incapazes de usar o modo "falar" por limitações do Safari/iOS —
  tem de ser confirmado a funcionar num iPhone real antes de dar como
  terminado.
- A dependência gratuita do Groq tornar-se um ponto de falha silencioso
  (se o limite gratuito for atingido, o utilizador precisa de uma
  experiência razoável de "tenta outra vez", nunca uma lição partida).
- Conteúdo em inglês incorreto chegar a utilizadores reais sem revisão —
  nada entra na base de dados sem Leonardo rever primeiro.

## Restrições

- Reaproveitar o máximo possível do schema existente — `challenges` e
  `challengeOptions` já têm colunas `audioSrc`, prontas a usar sem
  migração. Única alteração de schema prevista: um novo valor `SPEAK` no
  `challengesEnum`.
- TTS: `node-edge-tts` (já é dependência), grátis, só geração offline/lote.
- Voz-para-texto: API Whisper alojada da Groq, camada gratuita, chamada ao
  vivo por cada resposta falada (a única dependência deliberadamente ao
  vivo desta funcionalidade; todo o resto é offline).
- Tem de funcionar no Safari do iOS (prioridade explícita, dado o PWA
  instalável recém-lançado).
- Geração de conteúdo tem de ser offline + revista antes de entrar na BD,
  consistente com o precedente do `scripts/add-match-exercises.ts`.
- Sem geração de exercícios dinâmica/ao vivo por pedido.

## Abordagens consideradas

(Esta secção documenta as abordagens já discutidas e decididas na
conversa com Leonardo.)

1. **Captura da resposta falada: Web Speech API (só no browser) vs.
   gravar + transcrever no servidor (MediaRecorder + Groq Whisper).**
   Escolhido: gravar + transcrever no servidor, porque o suporte da Web
   Speech API no Safari/iOS é fraco e inconsistente, o que excluiria o
   público do iPhone que a app acabou de conquistar com o PWA. Custo
   aceite: uma chamada externa ao vivo por resposta falada, mas limitada
   só a este tipo de resposta, não à geração de conteúdo.

2. **Seleção do modo de resposta: o utilizador escolhe ao vivo por
   pergunta vs. cada pergunta já nasce com um modo fixo.** Escolhido: modo
   fixo por pergunta (reaproveita o padrão já existente de `type` nos
   desafios — `SELECT`/`WRITE`/`ARRANGE` já são tipos separados), porque
   não precisa de um ecrã novo de escolha de modo nem de dados
   duplicados por pergunta (a alternativa obrigaria cada pergunta a ter
   sempre opções erradas E uma resposta-alvo em texto, ao mesmo tempo).

3. **Onde vivem os exercícios de áudio: estender o tipo `DIALOGUE`
   existente vs. criar um tipo totalmente novo.** Escolhido: estender o
   `DIALOGUE` existente — já tem exatamente a forma pretendida (bolhas de
   conversa Leo/Juba + perguntas de compreensão + correção imediata), e o
   schema já tem `audioSrc` em `challenges` e `challengeOptions`, prontos
   a usar sem migração. Um tipo novo duplicaria a renderização
   (`Dialogue`/`DialogueHeader`) e a lógica de avaliação sem benefício.

## Decisões já tomadas (como decidido na conversa)

- Leo e Juba ganham vozes `node-edge-tts` distintas: **Leo é masculino,
  Juba é feminina** — o implementador escolhe duas vozes Neural
  gratuitas em inglês que respeitem estes géneros (ex: uma voz
  `en-US-...` masculina para o Leo, uma feminina para a Juba).
- A transcrição do diálogo continua visível em bolhas de chat durante a
  reprodução (sem modo "escuta cega"/texto escondido) — reaproveita o
  componente `Dialogue` tal como está, só acrescenta um controlo de
  reprodução por fala.
- Novo valor no `challengesEnum`: `SPEAK`.
- Os desafios `SPEAK` são avaliados com a mesma comparação
  `normalizeAnswer` já usada no `WRITE`, aplicada à transcrição do
  Whisper.
- Novos diálogos são etiquetados por `targetLevel`/`targetGoal`
  exatamente como as unidades/lições já são hoje — sem lógica de
  personalização nova.
- Os 11 `DIALOGUE` de texto já existentes recebem áudio gerado a partir do
  texto que já têm (sem conteúdo novo, só TTS sobre o que já existe).
- Geração de conteúdo: um script offline (reaproveitando o padrão
  idempotente já estabelecido em `scripts/add-match-exercises.ts`) chama
  um modelo de IA gratuito para rascunhar os diálogos + perguntas de
  compreensão; Leonardo revê antes de entrar na BD, tal como no rollout
  do MATCH.
- **`SPEAK` tem de funcionar também na Revisão/prática espaçada**
  (`/review`, `getReviewQueue()` em `db/queries.ts`), não só na lição
  original. Ao contrário do `DIALOGUE` (excluído de propósito do
  `getReviewQueue` porque depende do diálogo por perto), `SPEAK` **não**
  deve ser excluído — a pergunta de compreensão já tem de ser
  autossuficiente em texto para funcionar na Revisão, exatamente como as
  perguntas `SELECT`/`WRITE` sobre diálogos já são hoje (uma
  particularidade pré-existente, fora do âmbito deste projeto corrigir).
  Como `/review` reutiliza o mesmo componente `Quiz` que a lição normal,
  isto deve resultar naturalmente desde que `SpeakChallenge` não assuma
  nada sobre existir um `DIALOGUE` anterior na mesma sessão.
- **O áudio gravado pelo utilizador nunca é guardado** — é enviado à Groq,
  transcrito, e descartado assim que a resposta de texto volta; nenhum
  ficheiro de voz é escrito em disco ou em qualquer armazenamento. Ainda
  assim, acrescentar uma linha à Política de Privacidade a mencionar que
  respostas faladas são enviadas a um terceiro (Groq) só para
  transcrição — texto exato fica a cargo de quem construir.
- **Se a Groq falhar/atingir o limite gratuito**, uma mensagem de erro
  clara + botão "tenta outra vez" é suficiente — não é preciso nenhuma
  saída de emergência (sem aceitar resposta escrita como alternativa,
  sem deixar avançar sem responder).

## O que fica para quem construir

- Migração exata para o novo valor `SPEAK` do enum (`ALTER TYPE ... ADD
  VALUE`, como script único idempotente, dado o limite já conhecido do
  prompt interativo do `drizzle-kit push:pg`).
- `scripts/generate-audio.ts` precisa de aceitar uma voz por chamada (hoje
  está fixo em `en-US-AvaNeural`) — passar `voice` como parâmetro,
  mantendo o valor atual como omissão para quem já chama a função.
- Escolher as duas vozes Neural exatas para Leo e Juba (livre de mudar
  mais tarde, não é uma dependência rígida).
- Um novo componente `SpeakChallenge` (paralelo ao `WriteChallenge`) —
  gravação via `MediaRecorder` (gravar/parar, ouvir antes de submeter é
  opcional), com um estado claro para permissão de microfone negada e
  falha de rede (ver anti-objetivo acima).
- Uma nova server action (ex: `actions/transcribe.ts`) que recebe o áudio
  gravado, chama o endpoint Whisper da Groq com a chave de API de
  Leonardo (variável de ambiente, nunca aparece no código nem é
  impressa em chat), e devolve o texto transcrito para avaliar no
  `quiz.tsx` com a comparação já existente.
- Geração de áudio por fala do diálogo: dividir o formato atual do script
  (`"Leo: ...\nJuba: ..."`, guardado em `challenge.question`) em chamadas
  TTS individuais (uma por linha) em vez de um único ficheiro para a
  conversa inteira — ou optar por um único ficheiro; decisão de quem
  constrói, conforme o que for mais simples contra o componente
  `dialogue.tsx` existente (um botão só para a conversa toda, ou um botão
  por bolha).
- O script de geração de conteúdo em si e qual modelo/API de IA gratuito
  usar para rascunhar os novos diálogos + perguntas (o rollout do MATCH já
  estabeleceu um padrão de trabalho para isto nesta mesma sessão — pode
  reaproveitar essa forma).
- Confirmar que `MediaRecorder` + permissão de microfone funcionam mesmo
  dentro de uma PWA instalada no iOS (não só numa aba do Safari) antes de
  dar isto como terminado — é o anti-objetivo acima, e precisa de teste
  num aparelho real, não só de um build a passar.
- Texto exato a acrescentar em `app/privacy/page.tsx` sobre o envio de
  respostas faladas à Groq para transcrição — a existência da linha já
  está decidida, só a redação fica a cargo de quem construir.

## Chave de API da Groq

Leonardo está a tratar disto agora (console.groq.com, camada gratuita).
Guardar como variável de ambiente, tanto em `.env.local` local como no
`.env.local` do VPS (nunca commitada, nunca impressa em chat) — mesmo
tratamento já dado aos segredos do Stripe/Clerk.
