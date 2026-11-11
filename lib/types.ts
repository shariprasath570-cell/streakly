export const HABIT_COLOR_KEYS = [
  "emerald",
  "teal",
  "cyan",
  "sky",
  "indigo",
  "violet",
  "fuchsia",
  "rose",
  "orange",
  "amber",
  "lime",
  "slate",
] as const;

export type HabitColor = (typeof HABIT_COLOR_KEYS)[number];

export const HABIT_CATEGORIES = [
  "Health",
  "Fitness",
  "Productivity",
  "Learning",
  "Mindfulness",
  "Creative",
  "Social",
  "Finance",
  "Other",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export type DateKey = string; // YYYY-MM-DD in the user's local timezone

/** Daily habits are the only supported frequency for now. */
export type HabitFrequency = "daily";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: HabitColor;
  category?: HabitCategory;
  frequency: HabitFrequency;
  /** ISO timestamp of creation. */
  createdAt: string;
  archived: boolean;
  /** Unique, sorted list of completed days. */
  completions: DateKey[];
}

export interface HabitInput {
  name: string;
  description?: string;
  color: HabitColor;
  category?: HabitCategory;
}

export interface PersistedData {
  version: 1;
  habits: Habit[];
}

export interface StreakStats {
  current: number;
  longest: number;
  total: number;
  lastCompleted: DateKey | null;
  completedToday: boolean;
}
