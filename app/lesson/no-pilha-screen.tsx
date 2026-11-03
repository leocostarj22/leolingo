"use client";

import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ad-slot";
import { refillPilha } from "@/actions/user-progress";

export const NoPilhaScreen = () => {
  const router = useRouter();
  const [showAd, setShowAd] = useState(false);
  const [pending, startTransition] = useTransition();

  const onAdComplete = () => {
    startTransition(() => {
      refillPilha()
        .then(() => {
          router.refresh();
        })
        .catch(() => toast.error("Something went wrong. Please try again."));
    });
  };

  if (showAd) {
    return (
      <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
        <AdSlot
          title="Quase lá!"
          description="Vê este anúncio para ganhares mais 5 lições hoje."
          onComplete={onAdComplete}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
      <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
        Sem Pilha por hoje
      </h1>
      <p className="text-muted-foreground">
        Já completaste as 5 lições novas de hoje. Vê um anúncio para
        ganhares mais lições, ou volta cá amanhã.
      </p>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => setShowAd(true)}
      >
        Ver anúncio
      </Button>
      <Link href="/shop" className="text-sm font-bold text-primary underline">
        Ir à loja
      </Link>
    </div>
  );
};
