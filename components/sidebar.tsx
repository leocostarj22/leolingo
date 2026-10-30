"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ClerkLoading,
  ClerkLoaded,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import { ChevronRight, Loader, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { SidebarItem } from "./sidebar-item";

type Props = {
  className?: string;
};

export const Sidebar = ({ className }: Props) => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  return (
    <div className={cn(
      "flex h-full lg:w-[256px] lg:fixed left-0 top-0 flex-col overflow-y-auto border-r-2 bg-white",
      className,
    )}>
      <Link href="/learn" className="relative block w-full aspect-[941/620] shrink-0">
        <Image
          src="/menu-background.png"
          alt="Leolingo"
          fill
          priority
          className="object-cover object-top"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-y-2 px-4 pt-4">
        <SidebarItem label="Aprender" href="/learn" icon="🏠" tint="blue" />
        <SidebarItem label="Placar" href="/leaderboard" icon="🏆" tint="yellow" />
        <SidebarItem label="Desafios" href="/quests" icon="🎯" tint="rose" />
        <SidebarItem label="Loja" href="/shop" icon="🛍️" tint="green" />
      </div>
      <div className="px-4 pb-4">
        <ClerkLoading>
          <div className="flex items-center justify-center py-4">
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex w-full items-center gap-x-3 py-3 text-left"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-violet-200" />
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-bold leading-tight text-slate-700">
                {user?.fullName ?? "Utilizador"}
              </p>
              <p className="text-sm text-slate-400">Ver perfil</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </button>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex w-full items-center gap-x-3 py-3 text-left"
          >
            <Settings className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="flex-1 font-bold text-slate-500">Definições</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </button>
        </ClerkLoaded>
      </div>
    </div>
  );
};
