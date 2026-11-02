import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizeAnswer = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "");
};

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
};
