# Redesenho do mapa de atividades em /learn — Design

**Intenção:** o `/learn` atual (`app/(main)/learn/`) mostra o percurso de lições de cada unidade como círculos genéricos (Check/Estrela/Raio/Coroa) ligados por nada visualmente — sem título, sem tema, sem sensação de "percurso". O Leonardo trouxe uma imagem de referência (`docs/superpowers/specs/assets/atividades.png`) com um visual mais rico: botões em pílula com ícone temático + título da lição, um banner de unidade com os mascotes Leo e Juba, e um caminho sinuoso ligado por uma estrada ponteada, com marcador de início e bandeira de fim.

## Decisão de "como se constrói" (não negociada com o Leonardo, registada aqui)

A imagem de referência é uma ilustração pintada (colinas, monumentos, mascotes em pose). Decidimos **não** replicar essa pintura — não vamos gerar/obter uma imagem de fundo ilustrada nova. Em vez disso, replicamos a **estrutura e cor** (forma dos botões, paleta verde/azul/amarelo, mascotes) usando o mesmo estilo leve já usado no resto da app (gradientes CSS + emojis decorativos, como em `app/lesson/dialogue-header.tsx`) e os assets de mascote que já existem (`leo-mini.png` + `juba-mini.png`, o mesmo par já usado em `app/lesson/dialogue.tsx`). Esta troca foi proposta ao Leonardo e confirmada via protótipo no navegador (duas iterações, ambas aprovadas: "parece melhor", "ficou bom").

## Protótipos aprovados

Três iterações no companheiro visual (`.superpowers/brainstorm/.../content/learn-redesign-v{1,2,3}.html`), com conteúdo real da Unidade 1 ("Noções básicas"):
- v1: estrutura base (cabeçalho em pílula, banner, botões em pílula com ícone+título+check). Mascotes ainda como emoji.
- v2: mascotes trocados pelos PNGs reais (`leo-mini.png`/`juba-mini.png`), sobrepostos como em `dialogue.tsx`. Aprovado: "Parece melhor".
- v3: acrescentada a estrada ponteada verde a ligar os botões (SVG). Aprovado: "ficou bom".

Os ícones nos protótipos são emoji — só esboço. Na implementação são ícones `lucide-react` (biblioteca já usada em toda a app), confirmados como existentes na versão instalada (`lucide-react@0.344.0`).

## Goals

- Cada lição mostra o seu título real (já existe em `lessons.title`, já é temático: "Cumprimentos", "Pessoas", "Números"...) dentro do botão.
- Cada lição mostra um ícone temático ligado ao seu conteúdo (não só ao seu papel genérico completo/bónus/atual/última).
- O banner de unidade mostra os mascotes Leo e Juba lado a lado.
- O percurso de lições de cada unidade é ligado visualmente por uma linha/estrada, com marcador de início e fim.
- Paleta e formas alinhadas com o mockup (verde para progresso/borda, pílulas arredondadas, cartão creme/amarelo para o banner).

## Non-goals

- Não gerar imagens de fundo ilustradas novas (colinas, monumentos, árvores pintadas).
- Não redesenhar `/courses`, a barra lateral, ou qualquer página fora de `/learn`.
- Não mudar a lógica de desbloqueio de lições, XP, corações, ou qualquer mecânica — isto é só o mapa de atividades (visual).
- Não adicionar spaced-repetition nem alterar `getUnits`/`getCourseProgress` além do necessário para expor o novo campo `icon`.

## Anti-goals

- Isto falha se o percurso ficar mais lento a carregar ou a renderizar por causa da nova estrada SVG.
- Isto falha se alguma lição ficar sem ícone (ecrã com um buraco visual) — por isso o campo `icon` na base de dados é `NOT NULL` com um valor de recurso genérico (`Star`), e todos os scripts de seed passam a enviá-lo explicitamente.

## Decisões de implementação

### 1. Novo campo `lessons.icon`

Schema (`db/schema.ts`): novo `pgEnum` `lessonIconEnum` com os nomes exatos dos componentes `lucide-react` usados, mais um valor genérico de reserva:

```
"Handshake", "Users", "Hash", "BookOpen", "MessageCircle", "Trophy",
"Briefcase", "Mail", "MessageSquare", "Plane", "Hotel", "MapPin",
"UtensilsCrossed", "Clock", "Scale", "GitBranch", "Presentation",
"BarChart3", "Puzzle", "UserCheck", "Tag", "Star"
```

Coluna: `icon: lessonIconEnum("icon").notNull().default("Star")`. O `default("Star")` existe só para o `drizzle-kit push` não falhar sobre as 35 linhas já existentes — logo a seguir ao push, uma única `UPDATE` SQL (não um script TS) atribui o ícone correto a cada uma das 35 lições existentes, pelo `id`. Todos os scripts de seed (`seed.ts`, `seed-english.ts`, `prod.ts`, `seed-interactive-content.ts`, `seed-unit-review.ts`, `seed-intermediate.ts`) passam a enviar `icon` explicitamente em cada `insert(schema.lessons).values(...)` — nenhuma lição nova depende do valor por omissão.

Mapeamento tema → ícone (atribuído por mim, já que o Leonardo delegou este detalhe):

| Unidade | Lição | Ícone |
|---|---|---|
| Noções básicas | 1. Cumprimentos | Handshake |
| | 2. Pessoas | Users |
| | 3. Números | Hash |
| | 4. Be e Have | BookOpen |
| | 5. Primeira conversa (bónus) | MessageCircle |
| | 6. Revisão da Unidade | Trophy |
| Inglês no trabalho | 1. No escritório | Briefcase |
| | 2. Reuniões | Users |
| | 3. Email | Mail |
| | 4. Conversas de trabalho | MessageSquare |
| | 5. Uma reunião rápida (bónus) | MessageCircle |
| | 6. Revisão da Unidade | Trophy |
| Inglês em viagem | 1. No aeroporto | Plane |
| | 2. No hotel | Hotel |
| | 3. Pedir direções | MapPin |
| | 4. No restaurante | UtensilsCrossed |
| | 5. No check-in do hotel (bónus) | MessageCircle |
| | 6. Revisão da Unidade | Trophy |
| Inglês intermédio — Base | 1. Tempos verbais | Clock |
| | 2. Comparações | Scale |
| | 3. Frases condicionais | GitBranch |
| | 4. Expressões do dia a dia | MessageSquare |
| | 5. Uma conversa sobre planos (bónus) | MessageCircle |
| | 6. Revisão da Unidade | Trophy |
| Inglês intermédio no trabalho | 1. Reuniões e apresentações | Presentation |
| | 2. Relatórios e dados | BarChart3 |
| | 3. Resolver problemas | Puzzle |
| | 4. Entrevistas e feedback | UserCheck |
| | 5. Uma reunião de equipa (bónus) | MessageCircle |
| | 6. Revisão da Unidade | Trophy |
| Spanish — Unit 1 (curso legado, sem conteúdo ativo) | 1. Nouns | Tag |
| | 2-5. Verbs | BookOpen |

`getUnits()` em `db/queries.ts` não precisa de alteração — não restringe colunas, por isso `lesson.icon` já vem incluído assim que existir no schema.

### 2. Resolução do ícone no cliente

Novo `components/lesson-icon.tsx`: mapa `Record<LessonIcon, LucideIcon>` (todas as 22 entradas do enum) + um componente `<LessonIcon name={...} className={...} />` que escolhe o componente lucide certo. Recurso a `Star` se, por algum motivo, `name` não estiver no mapa (defesa na fronteira entre a base de dados e o código — o enum garante o valor na BD, mas o mapa no cliente é escrito à mão e pode ficar desatualizado se o enum crescer sem atualizar este ficheiro).

### 3. `LessonButton` — pílula em vez de círculo

Reescrita de `app/(main)/learn/lesson-button.tsx`:
- Mantém a fórmula de posicionamento em ziguezague já existente (`indentationLevel`/`cycleLength`/`rightPosition`) — não se re-deriva a matemática do caminho, só se ajusta a constante do multiplicador (hoje `40`px por nível) para um valor maior adequado à pílula, bem mais larga que o círculo de 70px. Valor exato fica ao critério de quem implementa, afinado visualmente (sugestão inicial: `70`-`90`px por nível).
- O botão passa a ser `<Link>` → pílula: círculo de ícone (44px, fundo `bg-emerald-100`/ícone `text-emerald-600` quando desbloqueado, `bg-neutral-100`/ícone `text-neutral-400` quando bloqueado) + título da lição (`lesson.title`, `font-bold text-sm text-slate-700`) + badge de check (26px, `bg-green-500` com ✓ branco) **só visível quando a lição está completa** — nunca aparece bloqueada nem na lição atual ainda por completar.
- Estado atual (`current`): mantém o anel de progresso (`CircularProgressbarWithChildren`) e a etiqueta "Start" a saltar, ambos já existentes — só aplicados agora ao círculo de ícone dentro da pílula, e com box-shadow verde (`ring-4 ring-emerald-200` equivalente) à volta de toda a pílula.
- Estado bloqueado: pílula com borda `border-neutral-300`, sem badge de check, `pointer-events: none` como já acontece.
- O ícone mostrado é sempre `lesson.icon` (tema) — deixa de haver troca de ícone por bónus/última lição (`Zap`/`Crown` saem; `isBonus` deixa de influenciar o ícone, já que cada lição tem agora o seu próprio ícone temático. `isBonus` continua a existir no schema/queries para outras lógicas, ex. `computePointsAvailable`).

### 4. Ligação entre lições — estrada SVG

Novo `app/(main)/learn/lesson-path.tsx`: um `<svg>` absolutamente posicionado atrás das pílulas (`position:absolute; inset:0; z-index:0; pointer-events:none`), que desenha uma curva (`stroke-dasharray` para o efeito ponteado, `stroke="#86efac"`) ligando o centro de cada lição ao seguinte. Os pontos de ancoragem usam a **mesma** fórmula de `rightPosition`/altura de linha que `LessonButton` já calcula — nunca uma curva fixa à parte, para nunca desalinhar se o layout mudar. `Unit` passa a renderizar `<LessonPath>` como irmão do mapa de `LessonButton`s, dentro de um contentor `position: relative`.

Marcador de início: pequena etiqueta "▶ Início" acima da primeira lição da unidade. Marcador de fim: "🏁 Fim da unidade" abaixo da última (a "Revisão da Unidade"). Ambos por unidade, não por curso — consistente com `Unit` já ser a unidade de renderização do percurso.

### 5. `UnitBanner` — cartão creme com mascotes

Reescrita de `app/(main)/learn/unit-banner.tsx`: troca o bloco verde liso por um cartão com gradiente creme/âmbar (`from-amber-50 to-amber-100`, borda `border-amber-300`), mostrando `leo-mini.png` + `juba-mini.png` sobrepostos (como already feito em `dialogue.tsx`) à esquerda, e `title`/`description` à direita, com as mesmas props de hoje (sem alterar a assinatura do componente). O botão "Continue" existente mantém-se, restyled para caber no novo cartão.

### 6. `Header` (de `/learn`) — estilo pílula

`app/(main)/learn/header.tsx`: mesma estrutura (seta-de-voltar + título centrado), só com novo estilo visual — fundo branco, borda arredondada completa (`rounded-full`), sombra subtil — em vez da barra com borda inferior atual.

### 7. Fundo decorativo por unidade

`app/(main)/learn/page.tsx`: o `<div className="mb-10">` que hoje envolve cada `<Unit>` passa a ter o gradiente verde/azul suave (`from-sky-100 to-emerald-50`) + alguns emojis decorativos (folha/pegada, como em `dialogue-header.tsx`), aplicado só à área de conteúdo de cada unidade — não à página toda, para não colidir com o painel lateral (`StickyWrapper`/`UserProgress`/`Quests`) que fica branco como hoje.

## Review Focus

- Lição com `icon` desconhecido do mapa do cliente (enum cresceu sem atualizar `lesson-icon.tsx`) → deve cair no ícone `Star`, nunca quebrar a renderização.
- Unidade com só 1 lição (não deveria existir hoje, mas a fórmula de posicionamento/estrada não pode assumir ≥2 lições sem rebentar).
- Lição bloqueada não deve mostrar o badge de check nem reagir a clique — comportamento já existente, só precisa de sobreviver à reescrita.
- `englishLevel`/`learningGoal` filtram que unidades aparecem (`buildUnitsWhereClause`) — o redesenho não pode quebrar esse filtro, só o visual dentro de cada unidade já devolvida.
- As 35 lições existentes na base de dados têm de ficar todas com o ícone correto depois do `UPDATE` — nenhuma pode ficar presa no valor por omissão `Star` depois da migração (seria um "buraco visual" silencioso).

## O que fica para quem implementa

- Valor exato do multiplicador de deslocamento horizontal do ziguezague (pílula vs círculo).
- Curva exata da estrada SVG (cúbicas de Bézier) — a lógica de pontos de ancoragem é fixa (ligada à posição real dos botões), a curvatura visual é afinação.
- Classes Tailwind exatas de cor/sombra/espaçamento — a paleta (verde para progresso, âmbar para o banner, cinza para bloqueado) está fixa acima, os valores exatos (`emerald-100` vs `emerald-200`, etc.) não.
