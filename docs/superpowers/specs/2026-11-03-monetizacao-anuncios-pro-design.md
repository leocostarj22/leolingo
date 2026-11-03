# Monetização com Anúncios e Pro — Design

## Intenção e motivação

Leonardo quer começar a rentabilizar o Leolingo, inspirando-se no modelo do Duolingo: anúncios para quem não paga, e uma subscrição Pro barata e simbólica para remover essa fricção — servindo também como forma de rentabilizar o trabalho de desenvolvimento dele. A app está pré-lançamento (pouco ou nenhum tráfego real ainda), por isso a prioridade é ter a mecânica toda a funcionar, não ligar já uma rede de anúncios real.

## Objetivos

- Reduzir o preço da subscrição Pro de $20,00/mês (atual, em USD) para 4,99€/mês.
- Dar aos utilizadores sem Pro uma terceira forma de recuperar corações: ver um anúncio (recompensa = refill completo, tal como já acontece ao gastar 10 pontos).
- Criar um novo limite diário de lições novas — nome escolhido: **Pilha** — separado dos corações: 5 lições novas por dia para quem não é Pro; ver um anúncio dá refill completo (volta a ter as 5 disponíveis nesse dia).
- Mostrar um anúncio interstitial quando o utilizador termina a última lição de uma unidade e avança para a unidade seguinte (não a cada lição).
- Utilizadores Pro nunca veem anúncios e nunca são limitados por corações nem por Pilha (mantém o comportamento Pro já existente para corações, estende-o à Pilha).
- Construir os anúncios como um módulo substituível: hoje mostra um placeholder (sem rede de anúncios real ligada); mais tarde troca-se a implementação interna por uma rede real (ex. AdSense/rewarded ads) sem tocar no resto do código que o chama.

## Não-objetivos

- Não integra uma rede de anúncios real agora — não há tráfego real ainda para justificar o esforço de aprovação de conta/SDK; o placeholder é funcional (desbloqueia a recompensa) mas não gera receita.
- Não migra preços nem dados de subscritores existentes no Stripe — o preço é definido no código a cada checkout (`price_data` inline, não um Price ID fixo no dashboard), por isso não há nenhum registo antigo para migrar; e, pela app estar pré-lançamento, não há (ou são poucos) subscritores reais hoje.
- Não limita quantas vezes por dia um utilizador pode ver um anúncio para recuperar corações ou Pilha — cada visualização é uma oportunidade de receita, sem razão para capar.
- Não adiciona nenhuma loja/compra direta de Pilha com pontos (ao contrário dos corações, que já têm essa opção) — fica só anúncio ou Pro.

## Anti-objetivos

- Falharia se um utilizador Pro alguma vez visse um anúncio, fosse bloqueado por falta de Pilha, ou fosse bloqueado por falta de corações.
- Falharia se repetir uma lição já 100% completa (modo prática) ou uma sessão de `/review` consumisse Pilha — só lições novas (ainda não completas) devem contar para o limite diário, tal como os corações já não são gastos em modo prática.
- Falharia se o limite de Pilha nunca se repusesse (bug no reset diário) ou se se repusesse a meio do dia por engano (bug no fuso horário).
- Falharia se a mudança de preço do Pro ($20→4,99€) afetasse subscrições Stripe já ativas de forma inesperada (cobrança dupla, cancelamento acidental, etc.).

## Restrições (do estado atual do código)

- O preço do Pro é criado inline em cada checkout (`actions/user-subscription.ts`, `price_data.unit_amount: 2000`, `currency: "USD"`) — não existe um Price ID fixo no dashboard do Stripe a atualizar; basta mudar estes dois valores no código.
- Corações já têm 3 caminhos de recuperação: gastar 10 pontos (`refillHearts`), ficar Pro (`isActive` → `reduceHearts`/`upsertChallengeProgress` nunca descontam), e (novo) ver um anúncio.
- `isLastChallenge` (calculado em `app/lesson/quiz.tsx`, passado para `upsertChallengeProgress`) já marca exatamente o momento em que uma lição é terminada, e já distingue sessão nova (`isPractice=false`) de repetição de lição já completa (`isPractice=true`, via `existingChallengeProgress`). Este é o sinal certo para incrementar Pilha, sem repetir essa lógica.
- O streak diário (`currentStreak`/`lastActivityDate`) já resolve o mesmo problema que a Pilha vai ter — "contar algo por dia civil, sem cron job" — com `getTodayDateString()` (fuso `Europe/Lisbon`) e `daysSince()` em `lib/streak.ts`. A Pilha deve reutilizar exatamente este padrão (comparar a data guardada com `getTodayDateString()` e, se for diferente, tratar a contagem como 0 antes de voltar a escrever).
- `app/lesson/page.tsx` e `app/lesson/[lessonId]/page.tsx` já calculam `initialPercentage` a partir de `lesson.challenges` antes de renderizar `<Quiz>` — este é o sítio certo (e já existe) para decidir se se mostra o ecrã de "sem Pilha" em vez da `<Quiz>`, porque já se sabe ali se a lição está a 100% (prática) ou não.
- `HeartsModal` já existe (`components/modals/hearts-modal.tsx`, controlado por `store/use-hearts-modal.ts`) com um botão "Get unlimited hearts" que aponta para `/store` — rota que não existe (a loja real é `/shop`); é um bug pré-existente, não introduzido por este trabalho, mas o botão novo de "ver anúncio" fica no mesmo modal, por isso vale a pena corrigir esse link de passagem.
- Não existe hoje nenhum conceito de "unidade seguinte" explícito no fluxo de fim de lição — `quiz.tsx` só decide entre `/level-up` e `/learn` (linha 367). Saber se a lição terminada é a última da sua unidade exige comparar `lesson.order` com o máximo `order` das lições dessa unidade — isto já é calculável a partir dos dados que `getUnits()`/`getLesson()` devolvem, mas a `Quiz` não recebe essa informação hoje; tem de passar a receber uma prop nova (ex. `isLastLessonInUnit`) calculada no servidor.

## Decisões já tomadas

- **Preço Pro:** `unit_amount: 499`, `currency: "eur"` em `actions/user-subscription.ts` (mantém o resto igual: mensal, cartão).
- **Nome do novo limite:** "Pilha". Guardado em `userProgress` com duas colunas novas, ao estilo de `currentStreak`/`lastActivityDate`: `dailyLessonsCompleted: integer not null default 0` e `dailyLessonsDate: text` (nullable).
- **Quando a Pilha é gasta:** só ao terminar (não repetir) uma lição nova — mesmo sinal que já distingue `isPractice` em `actions/challenge-progress.ts`. Incrementa-se `dailyLessonsCompleted` no mesmo `isLastChallenge && !isPractice` que hoje atualiza o streak; se `dailyLessonsDate` não for a data de hoje, a contagem reinicia para 1 (não 0+1) nesse update.
- **Quando a Pilha bloqueia:** à entrada da lição (`app/lesson/page.tsx`/`[lessonId]/page.tsx`), antes de renderizar `<Quiz>` — se `initialPercentage < 100` (lição nova, não prática) e não é Pro e `dailyLessonsCompleted` de hoje já é `>= 5`, mostra um novo ecrã/componente em vez da `<Quiz>`, com um botão para ver anúncio (reinicia a contagem de hoje para 0) ou ir para a loja (upgrade Pro). Sessões de `/review` e lições já a 100% nunca são bloqueadas.
- **Recompensa do anúncio:** sempre refill completo — corações a 5, ou Pilha de hoje a 0 — igual em ambos os casos, sem limite de quantas vezes por dia.
- **Módulo de anúncios:** um componente novo (ex. `components/ad-slot.tsx`) que mostra um placeholder (ex. contagem decrescente de alguns segundos com um botão "Continuar" só ativo no fim) e chama um `onComplete` quando "termina" — hoje simulado, preparado para no futuro mostrar um anúncio real de uma rede (AdSense ou outra rede de rewarded ads para web) sem mudar a assinatura do componente nem quem o usa.
- **Confiança no cliente:** como o anúncio é um placeholder sem rede real, a confirmação de "anúncio visto" vem só do cliente (não há nada para verificar no servidor ainda) — as novas ações do servidor (`refillHeartsWithAd`, `refillPilhaWithAd`) confiam nessa chamada tal como confiam hoje em `refillHearts` ser chamado só pelo botão certo. Quando houver rede real, normalmente dá um callback/token do lado do servidor para verificar antes de dar a recompensa — isso fica para quando essa integração acontecer, e deve ser tratado como uma revisão de segurança nessa altura, não antes.
- **Interstitial entre unidades:** calculado no servidor (`isLastLessonInUnit`, comparando `lesson.order` com o máximo da sua unidade) e passado como prop nova à `<Quiz>`; ao continuar a partir do ecrã de fim de lição, se for a última lição da unidade, não for sessão de prática/`/review`, e o utilizador não for Pro, mostra sempre o anúncio primeiro — mesmo quando a conclusão também sobe de nível — e só depois segue para o destino (`/level-up` se subiu de nível, senão `/learn`). Prática e sessões de `/review` nunca disparam este anúncio, pela mesma razão que já não gastam Pilha. Mostra-se também na última lição da última unidade do curso (não há necessidade de verificar se existe "próxima unidade").
- **Verificação/conta AdSense:** o script de carregamento (`client=ca-pub-4456402604074753`) fica no `app/layout.tsx`, carregado em todas as páginas — é só o loader da conta, não mostra anúncios por si só. A ligação dos **Rewarded Ads** (corações/Pilha) e dos **interstitials** reais (entre unidades) à conta AdSense fica para quando esse produto estiver aprovado/disponível na conta — até lá, o `ad-slot` continua em modo placeholder (ver "Confiança no cliente" acima).
- **Pro:** passa a bypassar também a Pilha, da mesma forma que já bypassa corações — nenhuma mudança na lógica existente de corações.

## O que fica por decidir pelo implementador

- Estilo visual exato do ecrã de "sem Pilha" e do componente de anúncio (seguir Tailwind + componentes shadcn já usados no resto da app).
- Duração exata do placeholder do anúncio (sugestão: 5 segundos) e texto exato mostrado.
- Se o botão "ver anúncio" nos corações fica dentro do `HeartsModal` existente (como terceira opção, ao lado de "Get unlimited hearts") ou num sítio novo — a recomendação é dentro do modal existente, por já ser o ponto de entrada quando os corações chegam a 0.
- Corrigir o link `/store` → `/shop` no `HeartsModal` enquanto se edita esse ficheiro (bug pré-existente, não relacionado com este trabalho, mas trivial de corrigir de passagem).
- Nome exato das novas colunas/ações do servidor, desde que sigam o padrão já usado (`dailyLessonsCompleted`/`dailyLessonsDate` são sugestões, não obrigatório).
