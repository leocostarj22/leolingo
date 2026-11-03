import Link from "next/link";
import Image from "next/image";
import { NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
};

export const UnitBanner = ({
  title,
  description,
}: Props) => {
  return (
    <div className="w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-5 flex items-center justify-between gap-x-4">
      <div className="flex items-center gap-x-4">
        <div className="flex shrink-0">
          <Image src="/leo-mini.png" alt="Leo" height={56} width={56} className="rounded-full" />
          <Image src="/juba-mini.png" alt="Juba" height={56} width={56} className="rounded-full -ml-[18px]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-2xl font-bold text-amber-900">
            {title}
          </h3>
          <p className="text-base text-amber-800">
            {description}
          </p>
        </div>
      </div>
      <Link href="/lesson">
        <Button
          size="lg"
          variant="secondaryOutline"
          className="hidden xl:flex border-2 border-b-4 active:border-b-2"
        >
          <NotebookText className="mr-2" />
          Continue
        </Button>
      </Link>
    </div>
  );
};
