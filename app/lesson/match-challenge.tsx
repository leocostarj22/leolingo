import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { challengeOptions } from "@/db/schema";
import { parseMatchPair } from "@/lib/match";

type Props = {
  options: typeof challengeOptions.$inferSelect[];
  pairs: Record<number, number>;
  onPair: (leftId: number, rightId: number) => void;
  onUnpair: (leftId: number) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
};

// One fixed colour per row position so a paired PT/EN button always shares
// its colour — identified by that row's id, never by selection order, so a
// pair keeps the same colour however it was made or re-made.
const PAIR_COLORS = [
  "border-sky-400 bg-sky-100",
  "border-emerald-400 bg-emerald-100",
  "border-amber-400 bg-amber-100",
  "border-violet-400 bg-violet-100",
];

export const MatchChallenge = ({ options, pairs, onPair, onUnpair, status, disabled }: Props) => {
  // Starts in DB order so the server-rendered markup matches the first
  // client paint; the shuffle below only runs post-hydration, so it never
  // triggers a hydration mismatch — same pattern as ArrangeChallenge.
  const [rightOrder, setRightOrder] = useState(() => options.map((o) => o.id));
  useEffect(() => {
    setRightOrder([...options].sort(() => Math.random() - 0.5).map((o) => o.id));
  }, [options]);

  const [selectedLeftId, setSelectedLeftId] = useState<number>();
  const [selectedRightId, setSelectedRightId] = useState<number>();

  const pairedRightIds = new Set(Object.values(pairs));

  const handleLeftTap = (id: number) => {
    if (disabled) return;
    if (id in pairs) {
      onUnpair(id);
      return;
    }
    if (selectedRightId !== undefined) {
      onPair(id, selectedRightId);
      setSelectedRightId(undefined);
      return;
    }
    setSelectedLeftId(id);
  };

  const handleRightTap = (id: number) => {
    if (disabled) return;
    const pairedLeftId = Object.entries(pairs).find(([, rightId]) => rightId === id)?.[0];
    if (pairedLeftId !== undefined) {
      onUnpair(Number(pairedLeftId));
      return;
    }
    if (selectedLeftId !== undefined) {
      onPair(selectedLeftId, id);
      setSelectedLeftId(undefined);
      return;
    }
    setSelectedRightId(id);
  };

  const byId = new Map(options.map((o) => [o.id, parseMatchPair(o.id, o.text)]));
  const rowIndexById = new Map(options.map((o, index) => [o.id, index]));
  const colorForId = (id: number) => PAIR_COLORS[rowIndexById.get(id)! % PAIR_COLORS.length];

  return (
    <div className="flex gap-x-4">
      <div className="flex flex-1 flex-col gap-y-2">
        {options.map((o) => {
          const isPaired = o.id in pairs;
          const isSelected = selectedLeftId === o.id;

          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              onClick={() => handleLeftTap(o.id)}
              className={cn(
                "rounded-lg border-2 px-3 py-2 text-left text-sm lg:text-base",
                isPaired
                  ? colorForId(o.id)
                  : isSelected
                    ? "border-dashed border-neutral-400 bg-neutral-100"
                    : "border-neutral-200 hover:bg-black/5",
              )}
            >
              {byId.get(o.id)?.pt}
            </button>
          );
        })}
      </div>
      <div className="flex flex-1 flex-col gap-y-2">
        {rightOrder.map((id) => {
          const isPaired = pairedRightIds.has(id);
          const isSelected = selectedRightId === id;

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => handleRightTap(id)}
              className={cn(
                "rounded-lg border-2 px-3 py-2 text-left text-sm lg:text-base",
                isPaired
                  ? colorForId(id)
                  : isSelected
                    ? "border-dashed border-neutral-400 bg-neutral-100"
                    : "border-neutral-200 hover:bg-black/5",
              )}
            >
              {byId.get(id)?.en}
            </button>
          );
        })}
      </div>
    </div>
  );
};
