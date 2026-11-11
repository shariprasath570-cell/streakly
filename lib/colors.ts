import type { HabitColor } from "./types";

export interface HabitColorSpec {
  key: HabitColor;
  label: string;
  hex: string;
}

export const HABIT_COLORS: HabitColorSpec[] = [
  { key: "emerald", label: "Emerald", hex: "#10b981" },
  { key: "teal", label: "Teal", hex: "#14b8a6" },
  { key: "cyan", label: "Cyan", hex: "#06b6d4" },
  { key: "sky", label: "Sky", hex: "#0ea5e9" },
  { key: "indigo", label: "Indigo", hex: "#6366f1" },
  { key: "violet", label: "Violet", hex: "#8b5cf6" },
  { key: "fuchsia", label: "Fuchsia", hex: "#d946ef" },
  { key: "rose", label: "Rose", hex: "#f43f5e" },
  { key: "orange", label: "Orange", hex: "#f97316" },
  { key: "amber", label: "Amber", hex: "#f59e0b" },
  { key: "lime", label: "Lime", hex: "#84cc16" },
  { key: "slate", label: "Slate", hex: "#64748b" },
];

const COLOR_MAP = new Map(HABIT_COLORS.map((color) => [color.key, color]));

export function habitColorHex(color: HabitColor): string {
  return COLOR_MAP.get(color)?.hex ?? HABIT_COLORS[0].hex;
}

export function habitColorLabel(color: HabitColor): string {
  return COLOR_MAP.get(color)?.label ?? "Emerald";
}

/** Convert a hex color to rgba with the given alpha (0–1). */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = Number.parseInt(full, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
