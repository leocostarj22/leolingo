# Desenho: Tipo de Exercício "Correspondência" (Matching)

**Data:** 2026-11-02
**Estado:** aprovado pelo utilizador em brainstorming, pronto para planeamento de implementação

## Intenção e porquê

Segunda das quatro funcionalidades escolhidas pelo utilizador para continuar o roteiro original (`docs/superpowers/specs/2026-10-28-ingles-app-design.md`), que já previa "correspondência/matching" como um dos tipos de exercício (Goal 2) mas nunca foi construído — só existem hoje SELECT, ASSIST, WRITE, ARRANGE e DIALOGUE.

## Goal

Um novo tipo de desafio, `MATCH`, onde o utilizador liga frases curtas em português às respetivas traduções em inglês.

## Decisões já tomadas (em conversa com o utilizador)

- **Conteúdo:** frases curtas (não palavras isoladas).
- **4 pares por exercício.**
- **Interação por toque, sem arrastar nada** — tal como o tipo ARRANGE já existente (que também não usa nenhuma biblioteca de drag-and-drop em todo o projeto): tocar numa frase à esquerda e depois na tradução correspondente à direita liga as duas; tocar numa ligação já feita desfaz-a. Coluna da esquerda em português, ordem fixa; coluna da direita em inglês, baralhada (tal como o ARRANGE baralha as suas peças só depois da hidratação, para nunca desincronizar do HTML gerado pelo servidor).
- **Avaliação tudo-ou-nada, só ao clicar em "Verificar"** — tal como todos os outros tipos hoje (nenhum dá feedback por par individual enquanto se liga). Se alguma ligação estiver errada, conta como erro (perde-se um coração) e repete-se o exercício do início, exatamente como já acontece no ARRANGE. Sem acerto parcial.
- **Sem dica de repetição nesta primeira versão** (ao contrário do ARRANGE, que pré-coloca a primeira peça certa numa segunda tentativa) — mantém o âmbito mais simples; pode ser adicionado depois se fizer falta.

## Como se encaixa no código existente

- Novo valor `"MATCH"` no enum `challenges.type` (hoje `SELECT`, `ASSIST`, `WRITE`, `ARRANGE`, `DIALOGUE`).
- **Sem novas colunas na base de dados.** Cada par usa uma linha de `challengeOptions` já existente, com o texto a codificar os dois lados separados por um delimitador (`"<frase PT>|||<frase EN>"`) — o mesmo espírito do tipo DIALOGUE, que já codifica várias falas dentro de um único campo de texto (`challenge.question`, separadas por quebras de linha) em vez de criar tabelas novas. O campo `correct` de cada linha fica sempre `true` (não tem significado de certo/errado aqui — a correspondência é a própria linha); `imageSrc`/`audioSrc` ficam vazios.
- `challenge.question` guarda a instrução mostrada como título do ecrã (ex. "Liga cada frase à tradução correta."), exatamente como já é mostrado hoje para todos os tipos exceto ASSIST/DIALOGUE (que têm título fixo) — não precisa de nenhum caso especial novo no título.
- Novo componente `MatchChallenge` (ao lado de `ArrangeChallenge`/`WriteChallenge` em `app/lesson/`), seguindo o mesmo padrão de props (`options`, `status`, `disabled`) mais o estado de pares já ligados e um handler de toque.
- Em `app/lesson/quiz.tsx`: um novo ramo de resultado (`isAnswerReady`, `isAnswerCorrect`, `getCorrectAnswerText`) e um novo estado para os pares atuais (ao lado de `arrangedTileIds`), tal como o ARRANGE já tem os seus.

## Decisões adicionais (após verificação técnica do documento)

Uma revisão técnica deste documento levantou pontos que resolvo aqui, como decisões do construtor:

- **Botão "Verificar" só fica pronto com os 4 pares ligados** (não basta 1, ao contrário do `isAnswerReady` do ARRANGE que fica pronto com 1 peça colocada) — mais correto do que deixar verificar uma correspondência incompleta e falhar sempre.
- **Desfazer uma ligação:** tocar em qualquer um dos dois lados de um par já feito desfaz-o (simétrico). Enquanto um par não está feito, só os itens ainda não ligados de cada lado podem ser tocados — para trocar um par já feito por outro, desfaz-se primeiro, depois liga-se de novo (sem "relink" direto).
- **Trocar a seleção pendente:** se se tocar numa frase à esquerda ainda não ligada, e depois noutra frase à esquerda também não ligada (sem tocar primeiro em nenhuma da direita), a seleção pendente passa simplesmente para a segunda — não é preciso cancelar explicitamente.
- **Revelar a resposta na segunda tentativa errada:** o mecanismo genérico que já existe para todos os tipos (`getCorrectAnswerText`/`revealedAnswer`) aplica-se também ao MATCH — mostra todos os 4 pares corretos (ex. "Bom dia → Good morning; Como estás? → How are you?"). O "sem dica de repetição" já decidido refere-se só ao prefill estilo ARRANGE (pré-colocar a primeira peça certa), não a este mecanismo transversal, que já existe para todos os tipos sem exceção.
- **Baralhar a coluna EN:** segue exatamente o mesmo padrão já existente no ARRANGE — o baralhamento só corre num `useEffect` ligado à referência de `options`; como essa referência não muda quando o mesmo desafio volta à cabeça da fila após um erro, a ordem baralhada mantém-se nessa repetição (comportamento herdado, não uma escolha nova).
- **Validação no painel admin:** confirmado por leitura do código (`app/admin/challengeOption/*.tsx`) que não há nenhuma validação que exija uma opção `correct=false` por desafio — um MATCH com as 4 linhas sempre `correct=true` já funciona sem nenhuma alteração ao painel admin.
- **Frases duplicadas:** a correspondência é feita pelo id da linha, nunca pelo texto, por isso frases PT ou EN repetidas dentro do mesmo desafio (mesmo que o conteúdo real nunca o faça) não partem a lógica.
- **Áudio por desafio (`challenges.audioSrc`, distinto das opções):** já funciona para qualquer tipo sem nenhuma alteração — o ramo `AudioPrompt`/`hasPlayedAudio` em `quiz.tsx` é agnóstico ao tipo. Um MATCH não precisa de áudio por omissão, mas nada o impede no futuro.

## O que fica a cargo de quem implementar

- Nome exato do delimitador de texto e tratamento de uma linha malformada (sem o delimitador) — não deve rebentar a app, mesmo que nunca aconteça com conteúdo real.
- Nomes exatos dos novos estados/handlers em `quiz.tsx` e `MatchChallenge`.
- Texto exato da instrução por omissão e redação do conteúdo das lições que vão usar este tipo (fica para quando se escrever conteúdo novo, próximo projeto da lista).
- Estilo visual exato das duas colunas e das ligações (cores, destaque do item selecionado).
