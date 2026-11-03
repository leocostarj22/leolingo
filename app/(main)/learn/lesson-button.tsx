"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";

import { cn } from "@/lib/utils";
import { LessonIcon } from "@/components/lesson-icon";
import { getLessonIndentationLevel, LESSON_OFFSET_PX } from "@/lib/lesson-layout";

import "react-circular-progressbar/dist/styles.css";

type Props = {
  id: number;
  index: number;
  title: string;
  icon: string;
  locked?: boolean;
  current?: boolean;
  percentage: number;
};

export const LessonButton = ({
  id,
  index,
  title,
  icon,
  locked,
  current,
  percentage,
}: Props) => {
  const rightPosition = getLessonIndentationLevel(index) * LESSON_OFFSET_PX;

  const isFirst = index === 0;
  const isCompleted = !current && !locked;

  const href = isCompleted ? `/lesson/${id}` : "/lesson";

  const iconCircle = (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        locked ? "bg-neutral-100" : "bg-emerald-100",
      )}
    >
      <LessonIcon
        name={icon}
        className={cn("h-6 w-6", locked ? "text-neutral-400" : "text-emerald-600")}
      />
    </div>
  );

  return (
    <Link
      href={href}
      aria-disabled={locked}
      style={{ pointerEvents: locked ? "none" : "auto" }}
    >
      <div
        className="relative"
        style={{
          right: `${rightPosition}px`,
          marginTop: isFirst && !isCompleted ? 60 : 24,
        }}
      >
        {current && (
          <div className="absolute -top-6 left-9 px-3 py-2.5 border-2 font-bold uppercase text-green-500 bg-white rounded-xl animate-bounce tracking-wide z-10">
            Start
            <div
              className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-x-1/2"
            />
          </div>
        )}
        <div
          className={cn(
            "flex items-center gap-x-3 rounded-full border-2 border-b-4 bg-white pl-1.5 pr-4 py-1.5 max-w-[190px]",
            locked ? "border-neutral-300" : "border-emerald-500",
            current && "ring-4 ring-emerald-200",
          )}
        >
          {current ? (
            <div className="h-14 w-14 shrink-0">
              <CircularProgressbarWithChildren
                value={Number.isNaN(percentage) ? 0 : percentage}
                styles={{
                  path: { stroke: "#4ade80" },
                  trail: { stroke: "#e5e7eb" },
                }}
              >
                {iconCircle}
              </CircularProgressbarWithChildren>
            </div>
          ) : (
            iconCircle
          )}
          <span className="flex-1 font-bold text-sm text-slate-700">
            {title}
          </span>
          {isCompleted && (
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-4 w-4 stroke-[4]" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
