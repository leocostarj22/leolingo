import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader } from "lucide-react";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <Image
        src="/hero-leolingo.png"
        alt="Leo, a mascote do Leolingo, em frente ao Big Ben em Londres"
        fill
        priority
        className="object-cover object-center"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center px-6 pb-10 pt-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          Le<span className="text-green-500">o</span>lingo
        </h1>
        <p className="mt-4 max-w-[280px] text-lg font-semibold leading-snug text-white drop-shadow-md">
          Aprende inglês numa aventura para a vida real.
        </p>

        <div className="mt-auto flex w-full max-w-[330px] flex-col items-center gap-y-4">
          <ClerkLoading>
            <Loader className="h-6 w-6 animate-spin text-white" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedOut>
              <SignUpButton
                mode="modal"
                afterSignInUrl="/learn"
                afterSignUpUrl="/learn"
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full gap-x-2 rounded-full border-0 text-base shadow-lg active:border-0"
                >
                  Começar
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </SignUpButton>
              <SignInButton
                mode="modal"
                afterSignInUrl="/learn"
                afterSignUpUrl="/learn"
              >
                <button className="text-sm font-semibold text-white underline underline-offset-2 drop-shadow-md">
                  Já tenho conta
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                variant="secondary"
                className="w-full gap-x-2 rounded-full border-0 text-base shadow-lg active:border-0"
                asChild
              >
                <Link href="/learn">
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}
