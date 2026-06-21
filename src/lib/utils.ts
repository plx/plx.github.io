import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

const WORDS_PER_MINUTE = 200;

export function readingTime(html: string): string {
  const textOnly = html.replace(/<[^>]+>/g, " ");
  const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function formatMonthYear(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getFullYear()}`;
}

/**
 * Format a date range as `MMM YYYY - MMM YYYY`.
 *
 * `endDate` may be:
 *  - a `Date`, formatted the same way as the start (`MMM YYYY`);
 *  - a string, used verbatim as the end label (e.g. `"Present"`);
 *  - omitted, in which case the range is treated as open-ended and the
 *    end label defaults to `"Present"`.
 */
export function dateRange(startDate: Date, endDate?: Date | string): string {
  const start = formatMonthYear(startDate);

  let end: string;
  if (endDate === undefined) {
    end = "Present";
  } else if (typeof endDate === "string") {
    end = endDate;
  } else {
    end = formatMonthYear(endDate);
  }

  return `${start} - ${end}`;
}