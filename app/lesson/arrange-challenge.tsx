import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { challengeOptions } from "@/db/schema";

type Props = {
  options: typeof challengeOptions.$inferSelect[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
};

export const ArrangeChallenge = ({ options, selectedIds, onToggle, status, disabled }: Props) => {
  const bankOrder = useMemo(() => {
    return [...options].sort(() => Math.random() - 0.5).map((o) => o.id);
  }, [options]);

  const byId = new Map(options.map((o) => [o.id, o]));
  const available = bankOrder.filter((id) => !selectedIds.includes(id));

  return (
    <div className="flex flex-col gap-y-6">
      <div className={cn(
        "flex flex-wrap gap-2 min-h-[48px] border-b-2 pb-4",
        status === "correct" && "border-green-300",
        status === "wrong" && "border-rose-300",
      )}>
        {selectedIds.map((id) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-sky-300 bg-sky-100 px-3 py-2 text-sm lg:text-base"
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((id) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm hover:bg-black/5 lg:text-base"
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>
    </div>
  );
};
