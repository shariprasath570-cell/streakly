import type { DateKey } from "./types";

const pad = (value: number) => (value < 10 ? `0${value}` : String(value));

/** Local-calendar date key (YYYY-MM-DD). Never use toISOString for day keys. */
export function toKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a date key at local noon so DST shifts can never move the day. */
export function parseKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function isValidKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseKey(value);
  return !Number.isNaN(date.getTime()) && toKey(date) === value;
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

export function addDays(key: DateKey, amount: number): DateKey {
  const date = parseKey(key);
  date.setDate(date.getDate() + amount);
  return toKey(date);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function dayDiff(a: DateKey, b: DateKey): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
}

export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -parseKey(key).getDay());
}

export function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0, 12, 0, 0, 0);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return endOfMonth(year, monthIndex).getDate();
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatLong(key: DateKey): string {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMedium(key: DateKey): string {
  return parseKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShort(key: DateKey): string {
  return parseKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMonth(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Weeks (Sunday-first) covering a month, padded with nulls. */
export function monthGrid(year: number, monthIndex: number): (DateKey | null)[][] {
  const first = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const total = daysInMonth(year, monthIndex);
  const cells: (DateKey | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(toKey(new Date(year, monthIndex, day, 12, 0, 0, 0)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DateKey | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function relativeDay(key: DateKey, today: DateKey = todayKey()): string {
  const diff = dayDiff(key, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < 0) return formatShort(key);
  return formatMedium(key);
}
