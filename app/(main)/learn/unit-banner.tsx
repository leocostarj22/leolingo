import Image from "next/image";

type Props = {
  title: string;
  description: string;
};

export const UnitBanner = ({
  title,
  description,
}: Props) => {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "2172 / 724", containerType: "inline-size" }}
    >
      <Image
        src="/avisos.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 620px, 100vw"
        className="object-contain"
        priority
      />
      <div
        className="absolute flex items-center"
        style={{ left: "52%", top: "22%", width: "41%", height: "23%" }}
      >
        <h3
          className="font-extrabold leading-tight text-amber-900"
          style={{ fontSize: "3.6cqw" }}
        >
          {title}
        </h3>
      </div>
      <div
        className="absolute flex items-start pt-[2%]"
        style={{ left: "52%", top: "47%", width: "41%", height: "46%" }}
      >
        <p
          className="leading-snug text-amber-800"
          style={{ fontSize: "2.3cqw" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};
