"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

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
      <div className="flex items-center justify-center w-full h-40 rounded-xl bg-slate-100 border-2 border-slate-200">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-sm">
          Ad
        </span>
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
        {isReady ? "Continuar" : `Continuar (${secondsLeft})`}
      </Button>
    </div>
  );
};
