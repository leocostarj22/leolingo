"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ADSENSE_CLIENT_ID, ADSENSE_HEARTS_SLOT_ID } from "@/constants";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  title: string;
  description: string;
  durationSeconds?: number;
  onComplete: () => void;
};

export const AdSlot = ({
  title,
  description,
  durationSeconds = 5,
  onComplete,
}: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const pushedRef = useRef(false);

  // Pede ao script global (carregado no layout raiz) para preencher este
  // espaço assim que a unidade de anúncio real estiver configurada.
  useEffect(() => {
    if (!ADSENSE_HEARTS_SLOT_ID || pushedRef.current) {
      return;
    }
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Bloqueador de anúncios ou script ainda não carregado — a caixa
      // fica só vazia, não impede o resto do fluxo.
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const isReady = secondsLeft <= 0;

  return (
    <div className="flex flex-col items-center gap-y-5 w-full">
      <div className="flex w-full h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-100 border-2 border-slate-200">
        {ADSENSE_HEARTS_SLOT_ID ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={ADSENSE_HEARTS_SLOT_ID}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex flex-col items-center gap-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wide text-sm">
              Anúncio
            </span>
            <span className="font-bold text-slate-400 text-3xl">
              {isReady ? "✓" : secondsLeft}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-y-2">
        <h2 className="text-center font-bold text-2xl">{title}</h2>
        <p className="text-center text-base text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        variant="primary"
        className="w-full"
        size="lg"
        disabled={!isReady}
        onClick={onComplete}
      >
        Continuar
      </Button>
    </div>
  );
};
