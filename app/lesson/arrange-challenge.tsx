import { useEffect, useState } from "react";
import { useAudio } from "react-use";

import { cn, slugifyWord } from "@/lib/utils";
import { challengeOptions } from "@/db/schema";

type Props = {
  options: typeof challengeOptions.$inferSelect[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
};

type TileProps = {
  text: string;
  disabled?: boolean;
  onClick: () => void;
  className: string;
};

const WordTile = ({ text, disabled, onClick, className }: TileProps) => {
  const [audio, _, controls] = useAudio({ src: `/audio/words/${slugifyWord(text)}.mp3` });

  const handleClick = () => {
    controls.play();
    onClick();
  };

  return (
    <button type="button" disabled={disabled} onClick={handleClick} className={className}>
      {audio}
      {text}
    </button>
  );
};

export const ArrangeChallenge = ({ options, selectedIds, onToggle, status, disabled }: Props) => {
  // Starts in DB order so the server-rendered markup matches the first
  // client paint; the shuffle below only runs post-hydration, so it never
  // triggers a hydration mismatch.
  const [bankOrder, setBankOrder] = useState(() => options.map((o) => o.id));
  useEffect(() => {
    setBankOrder([...options].sort(() => Math.random() - 0.5).map((o) => o.id));
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
          <WordTile
            key={id}
            text={byId.get(id)?.text ?? ""}
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-sky-300 bg-sky-100 px-3 py-2 text-sm lg:text-base"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((id) => (
          <WordTile
            key={id}
            text={byId.get(id)?.text ?? ""}
            disabled={disabled}
            onClick={() => onToggle(id)}
            className="rounded-lg border-2 border-neutral-200 px-3 py-2 text-sm hover:bg-black/5 lg:text-base"
          />
        ))}
      </div>
    </div>
  );
};
