export type ClassValue = string | false | null | undefined;

/** Tiny class name joiner (keeps JSX readable without a dependency). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

export function plural(count: number, singular: string, pluralWord?: string): string {
  return `${count} ${count === 1 ? singular : pluralWord ?? `${singular}s`}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `habit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
