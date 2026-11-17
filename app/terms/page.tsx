import Link from "next/link";

export const metadata = {
  title: "Termos de Serviço — Leolingo",
};

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-slate-700">
      <Link href="/" className="text-sm font-bold text-primary underline">
        ← Voltar ao Leolingo
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold text-slate-800">
        Termos de Serviço
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Última atualização: novembro de 2026
      </p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          Ao usares o Leolingo, aceitas estes termos. Lê-os com atenção.
        </p>

        <section>
          <h2 className="text-xl font-bold text-slate-800">A conta</h2>
          <p className="mt-2">
            Precisas de criar uma conta para usar o Leolingo. És responsável
            por manter as tuas credenciais seguras e por tudo o que acontece
            através da tua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">
            O plano Pro e pagamentos
          </h2>
          <p className="mt-2">
            O Leolingo oferece um plano gratuito e um plano Pro pago,
            cobrado mensalmente através da Stripe. Podes cancelar a
            subscrição a qualquer momento; o acesso Pro mantém-se até ao
            final do período já pago.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">Uso aceitável</h2>
          <p className="mt-2">
            Pede-se que uses o Leolingo de boa fé: não tentes contornar os
            mecanismos da aplicação (corações, limites diários, anúncios),
            nem uses a conta de outra pessoa sem autorização.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">
            Alterações e disponibilidade
          </h2>
          <p className="mt-2">
            O Leolingo pode mudar, adicionar ou remover funcionalidades a
            qualquer momento. Fazemos o possível para manter a aplicação
            disponível, mas não garantimos que esteja sempre acessível sem
            interrupções.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">Contacto</h2>
          <p className="mt-2">
            Para qualquer questão sobre estes termos, escreve para{" "}
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

export default TermsPage;
