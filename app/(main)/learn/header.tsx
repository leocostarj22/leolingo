import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
};

export const Header = ({ title }: Props) => {
  return (
    <div className="sticky top-0 lg:pt-[28px] lg:mt-[-28px] mb-5 lg:z-50">
      <div className="flex items-center justify-between rounded-full border-2 bg-white px-4 py-2 shadow-sm text-neutral-400">
        <Link href="/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-5 w-5 stroke-2 text-neutral-400" />
          </Button>
        </Link>
        <h1 className="font-bold text-lg text-slate-700">
          {title}
        </h1>
        <div />
      </div>
    </div>
  );
};
