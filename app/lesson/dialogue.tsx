import Image from "next/image";

type Props = {
  script: string;
};

type SpeakerStyle = {
  avatarSrc: string;
  side: "left" | "right";
  bubbleClassName: string;
};

const SPEAKER_STYLES: Record<string, SpeakerStyle> = {
  Leo: {
    avatarSrc: "/leo-mini.png",
    side: "left",
    bubbleClassName: "border-sky-400 bg-sky-50",
  },
  Juba: {
    avatarSrc: "/juba-mini.png",
    side: "right",
    bubbleClassName: "border-pink-400 bg-pink-50",
  },
};

export const Dialogue = ({ script }: Props) => {
  const lines = script.split("\n").filter(Boolean);

  return (
    <div className="flex flex-col gap-y-3">
      {lines.map((line, i) => {
        const [rawSpeaker, ...rest] = line.split(":");
        const hasColon = rest.length > 0;
        const speaker = hasColon ? rawSpeaker.trim() : "";
        const text = hasColon ? rest.join(":").trim() : line.trim();
        const style = SPEAKER_STYLES[speaker];
        const side = style?.side ?? (i % 2 === 1 ? "right" : "left");
        const isRight = side === "right";

        return (
          <div
            key={i}
            className={`flex items-end gap-x-2 ${isRight ? "justify-end" : "justify-start"}`}
          >
            {!isRight && style && (
              <Image src={style.avatarSrc} alt={speaker} height={36} width={36} className="rounded-full shrink-0" />
            )}
            <div className={`max-w-[75%] rounded-xl border-2 p-3 ${style?.bubbleClassName ?? ""}`}>
              {speaker && (
                <p className="mb-1 text-xs font-bold text-neutral-400">{speaker}</p>
              )}
              <p className="text-sm lg:text-base">{text}</p>
            </div>
            {isRight && style && (
              <Image src={style.avatarSrc} alt={speaker} height={36} width={36} className="rounded-full shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};
