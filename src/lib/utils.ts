import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WORDS_PER_MINUTE = 200;

export function readingTime(html: string): string {
  const textOnly = html.replace(/<[^>]+>/g, " ");
  const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
