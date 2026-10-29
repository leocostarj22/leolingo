# Desenho: App de Aprendizagem de Inglês Gamificada

**Data:** 2026-10-28
**Estado:** aprovado pelo utilizador em brainstorming, pronto para planeamento de implementação

## Intenção e porquê

O utilizador quer aprender inglês de forma simples e objetiva, com progressão estruturada e gamificação (pontos, fases, avaliações). A motivação central é a frustração com apps existentes (ex. Duolingo) que trancam funcionalidades por trás de pagamento — quer uma app própria, sem limites artificiais e sem custos recorrentes.

Uso previsto: telemóvel, durante os trajetos de ida e volta do trabalho. O utilizador tem sempre rede móvel disponível nesses trajetos (sem troços sem sinal), por isso **não é necessário suporte offline**.

No futuro, outros membros da família (esposa e filhas) poderão usar a mesma app com perfis próprios.

## Público e nível

- Utilizador principal (agora): nível auto-descrito "intermediário 1".
- Apesar disso, a app deve cobrir a progressão completa, do zero ao avançado, porque outros utilizadores futuros (família) podem começar do nível A1.
- Uso: um único adulto por agora; multiutilizador é um requisito de arquitetura desde o início, mesmo que só um perfil exista inicialmente.

## Goals

1. Progressão por níveis **CEFR**: A1, A2, B1, B2, C1, C2 (escala oficial usada em certificações de inglês, escolhida deliberadamente em vez de uma escala simplificada "Básico/Intermédio/Avançado").
2. Cada nível CEFR dividido em lições. Cada lição mistura **vários tipos de exercício** (escolha múltipla, tradução PT↔EN, completar espaços em branco, ouvir áudio e escolher a resposta, correspondência/matching, etc.) — inspirado na variedade do Duolingo.
3. Gamificação:
   - **XP (pontos)** por lição concluída, com bónus por completar sem erros.
   - **Streak** (sequência de dias consecutivos com pelo menos uma lição concluída).
   - **Vidas/corações** por lição — ao esgotar, a lição repete-se (não avança com erros não corrigidos).
4. **Avaliação ao final de cada fase CEFR**: um teste que mistura exercícios de todas as lições dessa fase. É preciso atingir uma nota mínima para desbloquear a fase seguinte; se falhar, pode repetir o teste.
5. Progresso visual por lição e por fase (barra/percentagem, estilo "árvore de lições").
6. **Multiutilizador**: login simples por perfil (nome + password), progresso guardado de forma independente por perfil.
7. Conteúdo das lições é **criado de forma estática durante a construção da app** (escrito/gerado agora, guardado como dados), mas a arquitetura deve isolar o "fornecimento de conteúdo" por trás de uma camada que permita, no futuro, ligar um gerador por IA sem reescrever a aplicação.
8. Deploy final na VPS HostGator do utilizador, com domínio próprio.

## Identidade visual

O utilizador forneceu mockups próprios que definem a identidade visual a seguir — existem **duas variantes de tema**, escolhidas pelo utilizador consoante o sexo indicado no registo:

- **"Leo" (tema masculino, default)** — `docs/superpowers/specs/assets/leolingo-mockups.png`. Mascote leão "Leo". Verde como cor primária de ação (CTAs, progresso, sucesso); azul-marinho escuro para ecrãs de abertura/onboarding; cartões brancos com cantos arredondados.
- **"Juba" (tema feminino)** — `docs/superpowers/specs/assets/leolingo-juba-mockups.png`. Mascote leoa "Juba" (laço cor-de-rosa). Rosa/magenta como cor primária de ação; gradiente rosa-lilás nos ecrãs de abertura/onboarding; mesmo layout e estrutura do tema "Leo", só a paleta e o nome/género da mascote mudam.
- As duas variantes partilham exatamente a mesma estrutura de ecrãs (ver lista abaixo) — só paleta de cor e mascote diferem. Isto implica um **campo "sexo" no registo do perfil** (Masculino/Feminino), usado para escolher automaticamente o tema em toda a app a partir daí.
- **Elementos de gamificação visual**: coração (vidas), chama (streak), troféu (conclusão de unidade/fase), emblemas (conquistas), barra de XP.
- **Navegação principal**: barra inferior fixa com 4 separadores — *Aprender*, *Desafios*, *Revisão*, *Perfil*.
- Os mockups cobrem: ecrã inicial, onboarding (objetivo + nível), árvore de lições por unidade, exercícios (ouvir+escolher, traduzir com blocos de palavras), feedback de acerto, streak, unidade concluída, revisão de vocabulário, desafios/classificação e perfil.
- Nenhum dos dois mockups mostra um ecrã dedicado à escolha do sexo — essa escolha entra como um campo simples no formulário de registo (a par do nome e da password); o desenho exato desse controlo fica ao critério de quem implementar.
- Os mockups não incluem os ficheiros de ilustração da mascote como ativos separados — apenas os ecrãs compostos. Enquanto não houver ilustrações reais fornecidas, a implementação usa placeholders simples (ex. emoji ou SVG genérico) nos lugares onde o mockup mostra a mascote, mantendo layout, cores e tipografia fiéis a cada tema.

## Goals (adicionais, após ver os mockups)

8. **Onboarding no primeiro acesso de cada perfil**: duas perguntas — "Qual é o seu objetivo?" (viajar, trabalho, estudar no estrangeiro, falar com confiança, outro) e "Qual é o seu nível de inglês?" (Iniciante, Básico, Intermédio, Avançado). As respostas ficam guardadas no perfil; o objetivo é apenas informativo/personalização por agora, e o nível autoavaliado será usado para decidir a fase CEFR inicial do perfil quando a progressão por fases for implementada (Plano 3) — até lá, fica apenas guardado.
9. **Aba "Desafios"**: inclui um desafio semanal pessoal (ex. "completa 5 lições esta semana") e uma classificação/ranking — mas **apenas entre os perfis existentes na própria app** (ex. a família do utilizador), nunca com desconhecidos ou dados externos. Isto respeita o anti-goal de evitar funcionalidades sociais públicas.
10. **Aba "Revisão"**: lista de vocabulário já encontrado nas lições, com possibilidade de marcar palavras como favoritas e ouvir a pronúncia. Funcionalidade adicionada ao roadmap (Plano 2 ou 3), não faz parte da fundação (Plano 1).

## Non-goals (fora do âmbito deste projeto)

- Reconhecimento de voz ou avaliação de pronúncia.
- Funcionalidades sociais **públicas** (rankings com desconhecidos, amigos fora da app, partilha social externa). Um ranking apenas entre os perfis da própria app está dentro do âmbito (ver Goal 9).
- Monetização, pagamentos ou subscrições de qualquer tipo.
- App nativa para lojas (Android/iOS) — a app fica apenas como PWA web responsiva.
- Suporte offline (não necessário; o utilizador tem sempre rede nos momentos de uso previstos).

## Anti-goals (o que seria falha mesmo que "funcione")

- A app ficar demasiado complexa para o próprio utilizador conseguir manter ou ajustar o código sozinho no futuro.
- Introduzir custos recorrentes de API ou serviços pagos no uso diário — isto contradiz a motivação original do projeto.
- Uma interface confusa ou sobrecarregada — o pedido explícito foi "simples e objetiva".

## Decisões técnicas já tomadas

- **Stack**: Next.js (React + TypeScript), aplicação full-stack num único projeto (frontend e backend juntos).
- **Base de dados**: SQLite (ficheiro local, sem serviço de base de dados externo) — adequado ao baixo número de utilizadores previsto (uso familiar).
- **Autenticação**: perfil local por utilizador (nome + password), sem OAuth externo nem login social.
- **Formato**: Progressive Web App (PWA) responsiva, pensada para telemóvel, instalável no ecrã inicial via browser.
- **Conteúdo**: dados estruturados estáticos (ex. ficheiros JSON por lição/fase), organizados por trás de uma camada de abstração ("fornecedor de conteúdo") para permitir, mais tarde, complementar ou substituir por geração via IA sem alterar a lógica da aplicação.
- **Deploy**: o utilizador tem acesso root/SSH à VPS HostGator (não é um plano cPanel gerido), o que viabiliza a arquitetura abaixo sem adaptações. Faseado em duas etapas: (1) desenvolvimento e validação **local**, correndo a app na máquina do utilizador até estar satisfeito com o resultado; (2) só depois, deploy para a VPS — Node.js + Nginx como proxy reverso + certificado SSL via Let's Encrypt + domínio próprio do utilizador. O passo (2) não faz parte do plano de implementação imediato; é um passo seguinte, feito quando o utilizador decidir avançar.

## Estrutura de progressão e gamificação (desenho funcional)

- 6 fases CEFR (A1 a C2), cada uma com um número de lições a definir durante a implementação.
- Cada lição mistura tipos de exercício variados (ver Goal 2).
- Vidas/corações por lição: modelo clássico (como no Duolingo) — perde-se uma vida por cada erro cometido; ao esgotarem-se as vidas, a lição reinicia do início. Não é "corrigir o erro para avançar"; é um limite de tentativas falhadas por sessão de lição. Número exato de vidas é um default sensato, ajustável. *(decisão do construtor, não do utilizador)*
- XP: pontos por lição concluída + bónus por lição sem erros — valores exatos são defaults sensatos, ajustáveis.
- Streak: contagem de dias consecutivos com pelo menos uma lição concluída nesse dia.
- Teste de fase: não usa *todos* os exercícios de todas as lições da fase (seria demasiado longo); usa uma amostra de um banco de itens da fase, sorteada a cada tentativa (evita memorização do teste e mantém o teste com duração razoável). Nota mínima sugerida de 80% para desbloquear a fase seguinte; repetível em caso de reprovação, sem penalização além de ter de estudar novamente. *(decisão do construtor, não do utilizador)*
- Áudio dos exercícios de "ouvir e escolher": gerado uma única vez por text-to-speech (TTS) durante a construção da app e guardado como ficheiros estáticos (tal como o resto do conteúdo) — não é chamado em runtime, para não violar o anti-goal de custos recorrentes de API. *(decisão do construtor, não do utilizador)*

## O que fica a cargo de quem implementar (builder)

- Esquema exato da base de dados (tabelas, relações, migrações).
- Número exato de lições por fase CEFR e o conteúdo detalhado de cada lição (vocabulário, frases, áudio) — a escrever/gerar durante a implementação, respeitando a progressão A1→C2.
- Valores numéricos exatos de gamificação (XP por lição, bónus, número de vidas, limiar de aprovação do teste de fase) — defaults sensatos, documentados e fáceis de ajustar depois.
- Design visual/UI detalhado (paleta de cores, tipografia, componentes) — mantendo o pedido de simplicidade.
- Estrutura de pastas/ficheiros do projeto Next.js.
- Processo de build e deploy passo-a-passo para a VPS HostGator (gestor de processos — ex. PM2 ou systemd —, configuração Nginx, emissão de certificado SSL).
- Estratégia de testes automatizados.
- Desenho exato da interface do "fornecedor de conteúdo" (content provider) que permitirá, no futuro, inserir geração via IA.
