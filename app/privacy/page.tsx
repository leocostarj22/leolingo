import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — Leolingo",
};

const PrivacyPage = () => {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-slate-700">
      <Link href="/" className="text-sm font-bold text-primary underline">
        ← Voltar ao Leolingo
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold text-slate-800">
        Política de Privacidade
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Última atualização: novembro de 2026
      </p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          O Leolingo é uma aplicação de aprendizagem de inglês para falantes
          de português, desenvolvida e mantida por Leonardo Costa. Esta
          política explica que dados recolhemos e como são usados.
        </p>

        <section>
          <h2 className="text-xl font-bold text-slate-800">
            Que dados recolhemos
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Dados de conta (nome, email, imagem de perfil) através do nosso
              fornecedor de autenticação, incluindo quando entras com a tua
              conta Google.
            </li>
            <li>
              Progresso na aprendizagem: lições concluídas, pontos, corações,
              sequência diária, nível e objetivo de aprendizagem escolhidos.
            </li>
            <li>
              Dados de pagamento, quando subscreves o plano Pro — processados
              diretamente pela Stripe; não guardamos números de cartão.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">
            Como usamos os dados
          </h2>
          <p className="mt-2">
            Usamos estes dados apenas para disponibilizar e melhorar a
            aplicação: guardar o teu progresso, gerir a tua subscrição e
            mostrar a tua posição no placar aos outros utilizadores (nome e
            imagem de perfil, se tiveres ativado essa funcionalidade).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">
            Com quem partilhamos dados
          </h2>
          <p className="mt-2">
            Não vendemos os teus dados. Partilhamo-los apenas com os serviços
            necessários para a aplicação funcionar: o nosso fornecedor de
            autenticação (Clerk), o processador de pagamentos (Stripe), o
            alojamento da base de dados, e a Google, para anúncios (Google
            AdSense) mostrados a utilizadores do plano gratuito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">Os teus direitos</h2>
          <p className="mt-2">
            Podes pedir, a qualquer momento, para veres, corrigires ou
            apagares os teus dados, escrevendo para{" "}
            <a
              href="mailto:jetad062@gmail.com"
              className="font-bold text-primary underline"
            >
              jetad062@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
