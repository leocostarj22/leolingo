# Atividades mais interativas: novos tipos de exercício, voz e mascote

**Data:** 2026-10-30
**Estado:** o utilizador optou por avançar sem mais perguntas de brainstorming ("Avance") — este documento regista as decisões já tomadas, incluindo as que ficaram a cargo de quem constrói, e segue diretamente para o plano de implementação.

## Intenção e porquê

O curso de Inglês (criado em `docs/superpowers/specs/2026-10-30-curso-ingles-design.md`) só tem dois tipos de desafio (`SELECT`, `ASSIST`), ambos só texto. O utilizador quer que as atividades sejam "bem lúdicas e interativas ao ponto do utilizador não sentir a necessidade de procurar por outra aplicação" — ou seja, aproximar a experiência da variedade de um Duolingo real: escrever respostas, montar frases arrastando palavras, ouvir e responder, e diálogos com perguntas de compreensão como tarefa bónus.

## Goals

1. Dois tipos de desafio novos: **`WRITE`** (escrever a resposta) e **`ARRANGE`** (tocar em blocos de palavras, pela ordem certa, para montar a frase).
2. **Áudio como propriedade transversal**, não um tipo à parte: qualquer desafio (`SELECT`, `ASSIST`, `WRITE`, `ARRANGE`) pode opcionalmente ter som do enunciado. Quando tem, o texto do enunciado fica escondido e a pessoa tem de ouvir antes de responder — isto cobre "escutar e responder" (`SELECT`/`WRITE` + áudio) e "escutar e completar frase" (`WRITE` + áudio, a pessoa escreve o que ouviu).
3. O áudio é **gerado uma única vez**, durante a construção do conteúdo, por uma ferramenta de TTS gratuita, e guardado como ficheiros estáticos em `public/audio/`. Nunca é gerado em tempo de execução — mantém o anti-goal original de zero custos recorrentes de API (`docs/superpowers/specs/2026-10-28-ingles-app-design.md`, que já previa exatamente este desenho para o áudio).
4. **Ordem dentro de uma lição**: a cada vez que a pessoa abre a lição, os desafios sem áudio aparecem numa ordem e mistura de tipos baralhada (nunca a mesma sequência duas vezes); os desafios com áudio ficam sempre no fim, também baralhados entre si.
5. **Diálogos como tarefa bónus**: uma lição extra por unidade, marcada como "bónus", com um diálogo curto entre duas personagens (tipo novo `DIALOGUE`, mostrado como balões de conversa alternados) seguido de 2-3 perguntas de compreensão (tipo `SELECT`, já existente — sem tipo novo para as perguntas em si). Completar qualquer desafio dentro de uma lição bónus dá o dobro dos pontos (20 em vez de 10).
6. **Mascote Leo/Juba real** nos ecrãs de atividade: bolha de pergunta (`question-bubble.tsx`), modal de corações esgotados (`hearts-modal.tsx`) e modal de saída da lição (`exit-modal.tsx`) passam a mostrar a imagem real do Leo ou da Juba (`docs/superpowers/specs/assets/leo.png` / `juba.png`), consoante o género do perfil, em vez do `/mascot.svg`/`/mascot_sad.svg`/`/mascot_bad.svg` genéricos.

## Non-goals (fora desta entrega)

- Reescrever os 71 desafios já existentes do curso de Inglês — ficam como estão; o conteúdo novo (`WRITE`/`ARRANGE`/áudio/diálogos) é **acrescentado**, nunca substitui ou apaga o que já existe (mesma regra "só insert" das entregas anteriores).
- Trocar o mascote fora dos ecrãs de atividade (ex. `/profile-setup`, página inicial) — o pedido foi especificamente "mascote das atividades". A Juba em `/profile-setup` continua como emoji placeholder por agora; pode ser atualizada depois, é um ajuste pequeno e separado.
- Reconhecimento de voz / avaliação de pronúncia do utilizador — o áudio é só para ouvir, nunca para gravar/avaliar a voz da pessoa (alinhado com o non-goal já definido no documento original).
- Gerar áudio por IA generativa de texto (esse tema, quando vier, é só para texto — ver non-goal equivalente no documento do curso de Inglês); TTS é síntese de voz, uma ferramenta diferente, já aceite aqui porque não tem custo nem é chamada em runtime.

## Anti-goals

- Qualquer chamada de TTS (ou de outro serviço pago) acontecer em tempo de execução, por utilizador — violaria o anti-goal original de zero custos recorrentes.
- Perder o progresso já registado (`challenge_progress`) de qualquer desafio existente ao adicionar os tipos novos.
- A ordem aleatória esconder desafios ou repeti-los — tem de mostrar exatamente os mesmos desafios de sempre, só numa ordem diferente.

## Decisões já tomadas

### Esquema

- `challenges_enum` ("type") ganha três valores novos: `WRITE`, `ARRANGE`, `DIALOGUE` (ficam cinco ao todo: `SELECT`, `ASSIST`, `WRITE`, `ARRANGE`, `DIALOGUE`).
- `challenges` ganha uma coluna nova, `audio_src` (texto, nullable) — o caminho do ficheiro de áudio do enunciado, quando existir. É independente da coluna `audio_src` que já existe em `challenge_options` (essa fica como estava, por opção, ainda sem uso).
- `lessons` ganha uma coluna nova, `is_bonus` (boolean, not null, default `false`) — marca uma lição como bónus (diálogo + perguntas), para a lógica de pontos em dobro e para o ícone distinto no percurso de lições.
- Nenhuma coluna nova em `challenge_options` — `WRITE` e `ARRANGE` reaproveitam a tabela tal como está:
  - **`WRITE`**: as opções marcadas `correct: true` são as respostas aceites (pode haver mais do que uma grafia aceite); não precisa de opções erradas.
  - **`ARRANGE`**: as opções marcadas `correct: true` são os blocos de palavras da frase certa, **pela ordem do `id` ascendente** (sem coluna de posição nova); as marcadas `correct: false` são blocos-isco, mostrados mas que não fazem parte da frase certa.

### Áudio

- Ferramenta: `node-edge-tts` (pacote npm, usa o serviço de voz do Microsoft Edge, sem conta nem chave de API, sem custo). Fica como dependência só para um script de geração de conteúdo, nunca usada pela aplicação em produção.
- Ficheiros guardados em `public/audio/<slug>.mp3`, gerados por um script novo, não destrutivo, à parte do `scripts/seed-english.ts` já existente.
- Quando `challenges.audioSrc` está definido, a interface esconde o texto do enunciado e mostra um botão "Ouvir" (pode repetir-se); só depois de ouvir pelo menos uma vez é que a pessoa pode responder.

### Ordem dentro da lição

- A baralhada acontece no cliente (`app/lesson/quiz.tsx`), não na base de dados: ao carregar a lição, separa os desafios em "sem áudio" e "com áudio", baralha cada grupo independentemente, e concatena (sem áudio primeiro, com áudio no fim). A contagem de progresso (`challengeProgress`) continua a ser por `challengeId`, não por posição, por isso a baralhada não interfere com "continuar onde ficaste".

### Diálogos e bónus de XP

- Uma lição com `isBonus = true` tem um primeiro desafio do tipo `DIALOGUE` (o `question` guarda o diálogo em texto simples, uma linha por fala, convenção `"Nome: fala"`, ex. `"Leo: Hi! How are you?\nJuba: I'm great, thanks!"`) renderizado como balões de conversa alternados (esquerda/direita), e a seguir 2-3 desafios `SELECT` normais, a perguntar sobre o que foi dito no diálogo.
- `actions/challenge-progress.ts` passa a procurar a lição do desafio (`with: { lesson: true }`) e atribui 20 pontos em vez de 10 quando `challenge.lesson.isBonus` é verdadeiro — único sítio alterado para a lógica de pontos.
- No percurso de lições (`app/(main)/learn/lesson-button.tsx`), uma lição bónus usa um ícone distinto (ex. um raio/"zap", em vez da estrela normal) para se destacar visualmente como extra.

### Mascote

- `leo.png`/`juba.png` copiados para `public/` (tal como `gb.svg` foi copiado na entrega anterior).
- Novo store `store/use-mascot.ts` (zustand, mesmo padrão de `use-exit-modal.ts`), guardando só `gender` — `app/lesson/quiz.tsx` define-o ao montar (`useMount`), a partir do `gender` do perfil que a página do servidor já busca (`getUserProgress`) e passa como prop nova (`initialGender`). `question-bubble.tsx`, `exit-modal.tsx` e `hearts-modal.tsx` passam a ler esse store (`gender === "FEMALE" ? "/juba.png" : "/leo.png"`, default masculino quando ainda não definido).
- Como só existe uma pose de cada mascote (sem variante "triste"/"zangada"), a mesma imagem é usada nos três ecrãs (pergunta, corações esgotados, sair da lição) — chamada do construtor, por falta de arte dedicada a cada emoção.

### Conteúdo novo

- Por cada uma das 3 unidades do curso de Inglês já existentes: acrescentar, em pelo menos duas das suas lições, uma mistura de novos desafios `WRITE`/`ARRANGE` (inseridos a seguir aos já existentes, nunca a substituí-los), e gerar áudio para pelo menos alguns deles (variantes "escutar e responder"/"escutar e escrever").
- Acrescentar uma 5ª lição bónus por unidade (diálogo + perguntas), com `isBonus = true`.
- O texto exato de cada desafio/diálogo novo fica decidido no plano de implementação, tal como aconteceu no curso de Inglês original.

## O que fica a cargo de quem implementar

- Texto exato de cada novo desafio/diálogo (dentro do tema de cada unidade).
- Nome do ícone exato para lições bónus.
- Pequenos detalhes de normalização da resposta em `WRITE` (maiúsculas/minúsculas, pontuação, espaços) — tem de aceitar variações razoáveis sem ser permissivo ao ponto de aceitar respostas erradas.
