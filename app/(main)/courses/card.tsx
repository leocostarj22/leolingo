import Image from "next/image";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  id: number;
  imageSrc: string;
  onClick: (id: number) => void;
  disabled?: boolean;
  active?: boolean;
};

export const Card = ({
  title,
  id,
  imageSrc,
  disabled,
  onClick,
  active,
}: Props) => {
  return (
    <div
      onClick={() => onClick(id)}
      className={cn(
        "relative flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center gap-y-3 rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md",
        active && "border-emerald-400 bg-emerald-50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {active && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-4 w-4 stroke-[4] text-white" />
        </div>
      )}
      <Image
        src={imageSrc}
        alt={title}
        height={56}
        width={84}
        className="rounded-md object-cover drop-shadow-sm"
      />
      <p className="text-center font-bold text-slate-800">
        {title}
      </p>
    </div>
  );
};
