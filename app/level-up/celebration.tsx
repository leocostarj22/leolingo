"use client";

import Link from "next/link";
import Confetti from "react-confetti";
import { Crown } from "lucide-react";
import { useWindowSize } from "react-use";

import { Button } from "@/components/ui/button";

type Props = {
  levelLabel: string;
};

export const LevelUpCelebration = ({ levelLabel }: Props) => {
  const { width, height } = useWindowSize();

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        tweenDuration={10000}
      />
      <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
        <Crown className="h-16 w-16 text-yellow-500 lg:h-24 lg:w-24" />
        <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
          Subiste para {levelLabel}!
        </h1>
        <p className="text-neutral-500 text-sm lg:text-base">
          Terminaste todo o conteúdo do nível anterior. Há unidades novas à tua espera.
        </p>
        <Button size="lg" variant="primary" className="w-full" asChild>
          <Link href="/learn">Continuar</Link>
        </Button>
      </div>
    </>
  );
};
