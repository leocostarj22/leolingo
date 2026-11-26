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
    .replace(/[,.!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
};

export const isWrittenAnswerCorrect = (
  written: string,
  options: { text: string; correct: boolean }[],
) => {
  return options
    .filter((o) => o.correct)
    .map((o) => normalizeAnswer(o.text))
    .includes(normalizeAnswer(written));
};

export const slugifyWord = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
