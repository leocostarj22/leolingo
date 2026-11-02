"use client";

import { X } from "lucide-react";

import { useExitModal } from "@/store/use-exit-modal";

const DOT_COUNT = 5;

type Props = {
  percentage: number;
};

export const DialogueHeader = ({ percentage }: Props) => {
  const { open } = useExitModal();
  const filledCount = Math.round((percentage / 100) * DOT_COUNT);

  return (
    <header className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 px-6 pb-8 pt-6">
      <span className="absolute left-4 top-10 text-2xl" aria-hidden>🍃</span>
      <span className="absolute right-6 top-16 text-2xl" aria-hidden>🐾</span>
      <span className="absolute right-10 bottom-4 text-xl" aria-hidden>🐾</span>
      <div className="relative flex items-center justify-between">
        <button
          type="button"
          onClick={open}
          aria-label="Sair da lição"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-x-2 rounded-full bg-white/90 px-3 py-2 shadow">
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <span
              key={i}
              className={
                i < filledCount
                  ? "h-3 w-3 rounded-full bg-emerald-500"
                  : i === filledCount
                  ? "h-3 w-3 rounded-full border-2 border-emerald-500"
                  : "h-3 w-3 rounded-full border-2 border-slate-300"
              }
            />
          ))}
        </div>
      </div>
    </header>
  );
};
