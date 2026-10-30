"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Tint = "blue" | "yellow" | "rose" | "green";

const tintStyles: Record<Tint, { tile: string; active: string }> = {
  blue: { tile: "bg-sky-100", active: "border-sky-300 bg-sky-50" },
  yellow: { tile: "bg-amber-100", active: "border-amber-300 bg-amber-50" },
  rose: { tile: "bg-rose-100", active: "border-rose-300 bg-rose-50" },
  green: { tile: "bg-emerald-100", active: "border-emerald-300 bg-emerald-50" },
};

type Props = {
  label: string;
  icon: string;
  tint: Tint;
  href: string;
};

export const SidebarItem = ({
  label,
  icon,
  tint,
  href,
}: Props) => {
  const pathname = usePathname();
  const active = pathname === href;
  const { tile, active: activeClass } = tintStyles[tint];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-x-3 rounded-2xl border-2 border-transparent px-3 py-3 transition hover:bg-slate-50",
        active && activeClass,
      )}
    >
      <div className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
        tile,
      )}>
        {icon}
      </div>
      <span className="flex-1 font-bold text-slate-700">
        {label}
      </span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </Link>
  );
};
