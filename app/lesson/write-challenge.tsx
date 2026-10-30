import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  status: "correct" | "wrong" | "none";
  disabled?: boolean;
  hint?: string;
};

export const WriteChallenge = ({ value, onChange, status, disabled, hint }: Props) => {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoFocus
        placeholder="Escreve a tua resposta em inglês..."
        className={cn(
          "w-full rounded-xl border-2 p-4 text-base lg:text-lg outline-none",
          status === "correct" && "border-green-300 bg-green-100",
          status === "wrong" && "border-rose-300 bg-rose-100",
          status === "none" && "border-neutral-200 focus:border-neutral-400",
        )}
      />
      {hint && (
        <p className="text-sm text-neutral-500 mt-2">{hint}</p>
      )}
    </>
  );
};
