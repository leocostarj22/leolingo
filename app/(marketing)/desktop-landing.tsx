import Image from "next/image";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { ChevronDown, ChevronLeft, ChevronRight, Globe, Loader } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { flag: "🇬🇧", label: "Inglês" },
  { flag: "🇪🇸", label: "Espanhol" },
  { flag: "🇫🇷", label: "Francês" },
  { flag: "🇩🇪", label: "Alemão" },
  { flag: "🇮🇹", label: "Italiano" },
  { flag: "🇵🇹", label: "Português" },
];

export const DesktopLanding = () => {
  return (
    <div className="hidden min-h-screen w-full flex-col lg:flex">
      <nav className="flex w-full items-center justify-between border-b px-10 py-4">
        <Image src="/home/01_logomarca.png" alt="Leolingo" width={148} height={38} priority />

        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-500">
          Início
        </span>

        <div className="flex items-center gap-x-6">
          <div className="flex items-center gap-x-1 text-sm font-semibold text-slate-600">
            <Globe className="h-4 w-4" />
            Português (PT)
            <ChevronDown className="h-4 w-4" />
          </div>

          <ClerkLoaded>
            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                <button
                  type="button"
                  className="rounded-full border-2 border-sky-500 px-5 py-1.5 text-sm font-bold text-sky-500 transition-colors hover:bg-sky-50"
                >
                  Entrar
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button size="sm" variant="primaryOutline" asChild>
                <Link href="/learn">Continuar</Link>
              </Button>
            </SignedIn>
          </ClerkLoaded>
        </div>
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
            <h1 className="max-w-[420px] text-4xl font-extrabold leading-tight text-slate-800">
              Aprende idiomas de forma{" "}
              <span className="bg-yellow-300 px-1">divertida</span>, fácil e eficaz!
            </h1>
            <p className="max-w-[400px] text-lg text-slate-500">
              Com o Leo e a Juba, transforma o estudo num jogo e alcança os teus objetivos, passo a
              passo.
            </p>

            <ClerkLoading>
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <div className="flex flex-col items-start gap-y-3">
                  <SignUpButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                    <button
                      type="button"
                      className="rounded-full border-b-4 border-green-600 bg-green-500 px-10 py-3 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-green-500/90 active:border-b-0"
                    >
                      Comece agora
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                    <button
                      type="button"
                      className="rounded-full border-2 border-sky-500 px-10 py-3 text-base font-bold uppercase tracking-wide text-sky-500 transition-colors hover:bg-sky-50"
                    >
                      Já tenho uma conta
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

      <section className="flex w-full flex-col bg-gradient-to-b from-lime-100 to-green-50">
        <div className="flex items-center justify-center gap-x-6 px-10 py-8">
          <ChevronLeft className="h-5 w-5 shrink-0 text-slate-400" />

          <div className="flex items-center gap-x-6 rounded-full bg-white px-8 py-3 shadow-sm">
            <ClerkLoaded>
              <SignedOut>
                <SignUpButton mode="modal" afterSignInUrl="/learn" afterSignUpUrl="/learn">
                  <button
                    type="button"
                    className="flex items-center gap-x-2 text-sm font-bold text-slate-700 transition-colors hover:text-sky-500"
                  >
                    <span>{LANGUAGES[0].flag}</span>
                    {LANGUAGES[0].label}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/learn"
                  className="flex items-center gap-x-2 text-sm font-bold text-slate-700 transition-colors hover:text-sky-500"
                >
                  <span>{LANGUAGES[0].flag}</span>
                  {LANGUAGES[0].label}
                </Link>
              </SignedIn>
            </ClerkLoaded>

            {LANGUAGES.slice(1).map(({ flag, label }) => (
              <span key={label} className="flex items-center gap-x-2 text-sm font-semibold text-slate-400">
                <span>{flag}</span>
                {label}
              </span>
            ))}
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </div>
      </section>
    </div>
  );
};
