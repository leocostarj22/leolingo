import Image from "next/image";

export const TopBanner = () => {
  return (
    <div
      className="relative mb-5 w-full overflow-hidden rounded-3xl"
      style={{ aspectRatio: "2172 / 500" }}
    >
      <Image
        src="/topo.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 620px, 100vw"
        className="object-cover"
        priority
      />
    </div>
  );
};
