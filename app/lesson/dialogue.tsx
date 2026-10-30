type Props = {
  script: string;
};

export const Dialogue = ({ script }: Props) => {
  const lines = script.split("\n").filter(Boolean);

  return (
    <div className="flex flex-col gap-y-3">
      {lines.map((line, i) => {
        const [speaker, ...rest] = line.split(":");
        const text = rest.join(":").trim();
        const isRight = i % 2 === 1;

        return (
          <div
            key={i}
            className={`flex ${isRight ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[80%] rounded-xl border-2 p-3">
              <p className="mb-1 text-xs font-bold text-neutral-400">{speaker.trim()}</p>
              <p className="text-sm lg:text-base">{text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
