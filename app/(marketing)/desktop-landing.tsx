import Image from "next/image";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const DesktopLanding = () => {
  return (
    <div className="hidden min-h-screen w-full flex-col lg:flex">
      <nav className="flex w-full items-center justify-between border-b px-10 py-4">
        <Image src="/home/01_logomarca.png" alt="Leolingo" width={148} height={38} priority />

        <div className="relative h-[38px] w-[78px] overflow-hidden">
          <Image
            src="/home/02_menu_navegacao.png"
            alt="Início"
            width={575}
            height={75}
            className="absolute left-0 top-1/2 h-auto w-[290px] max-w-none -translate-y-1/2"
          />
        </div>

        <ClerkLoaded>
          <SignedOut>
            <div className="relative h-[40px] w-[215px]">
              <Image
                src="/home/03_seletor_idioma_entrar.png"
                alt=""
                width={430}
                height={79}
                className="pointer-events-none h-auto w-[215px]"
              />
              <SignInButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                <button
                  aria-label="Entrar"
                  className="absolute right-0 top-0 h-full w-[90px] cursor-pointer"
                />
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <Button size="sm" variant="primaryOutline" asChild>
              <Link href="/learn">Continuar</Link>
            </Button>
          </SignedIn>
        </ClerkLoaded>
      </nav>

      <section className="flex flex-1 items-center justify-center bg-gradient-to-b from-sky-100 to-white px-10 py-12">
        <div className="flex w-full max-w-[1100px] items-center justify-between gap-x-16">
          <div className="relative h-[430px] w-[560px] shrink-0">
            <Image
              src="/home/04_leo_juba_cenario.png"
              alt="Leo e Juba, as mascotes do Leolingo, em frente ao Big Ben, à Torre Eiffel e ao Coliseu"
              fill
              priority
              className="rounded-3xl object-cover"
            />
          </div>

          <div className="flex flex-col items-start gap-y-6">
            <Image
              src="/home/05_titulo_principal.png"
              alt="Aprende idiomas de forma divertida, fácil e eficaz!"
              width={665}
              height={200}
              className="h-auto w-[420px]"
              priority
            />
            <Image
              src="/home/06_texto_apresentacao.png"
              alt="Com o Leo e a Juba, transforma o estudo num jogo e alcança os teus objetivos, passo a passo."
              width={625}
              height={95}
              className="h-auto w-[400px]"
            />

            <ClerkLoading>
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <div className="flex flex-col items-start gap-y-3">
                  <SignUpButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                    <button aria-label="Comece agora" className="cursor-pointer">
                      <Image
                        src="/home/07_botao_comece_agora.png"
                        alt="Comece agora"
                        width={515}
                        height={92}
                        className="h-auto w-[260px]"
                      />
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                    <button aria-label="Já tenho uma conta" className="cursor-pointer">
                      <Image
                        src="/home/08_botao_ja_tenho_conta.png"
                        alt="Já tenho uma conta"
                        width={515}
                        height={102}
                        className="h-auto w-[260px]"
                      />
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <Button size="lg" variant="super" asChild>
                  <Link href="/learn">Continuar</Link>
                </Button>
              </SignedIn>
            </ClerkLoaded>
          </div>
        </div>
      </section>

      <section className="relative flex w-full items-center justify-center py-8">
        <Image
          src="/home/10_fundo_paisagem.png"
          alt=""
          fill
          className="pointer-events-none -z-10 object-cover"
        />
        <div className="relative h-[70px] w-[850px]">
          <Image
            src="/home/09_barra_idiomas.png"
            alt="Idiomas disponíveis: Inglês, Espanhol, Francês, Alemão, Italiano, Português"
            width={1325}
            height={108}
            className="h-auto w-[850px]"
          />
          <ClerkLoaded>
            <SignedOut>
              <SignUpButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                <button
                  aria-label="Começar a aprender Inglês"
                  className="absolute left-[55px] top-0 h-full w-[135px] cursor-pointer"
                />
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/learn"
                aria-label="Continuar a aprender Inglês"
                className="absolute left-[55px] top-0 h-full w-[135px]"
              />
            </SignedIn>
          </ClerkLoaded>
        </div>
      </section>
    </div>
  );
};
