import { addDays, todayKey } from "./date";
import type { DateKey, Habit, StreakStats } from "./types";

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 300, 365];

/**
 * Streak rules:
 * - A streak counts consecutive completed days ending today.
 * - If today is not completed yet but yesterday was, the streak is still alive and
 *   keeps counting backwards from yesterday (it only breaks once the day is missed).
 * - Missing a full day resets the current streak to 0.
 * - Longest streak is the longest consecutive run in the whole history.
 */
export function streakStats(completions: DateKey[], today: DateKey = todayKey()): StreakStats {
  const set = new Set(completions.filter(Boolean));
  const completedToday = set.has(today);

  let current = 0;
  let cursor = completedToday ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const key of sorted) {
    if (previous !== null && addDays(previous, 1) === key) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    previous = key;
  }

  return {
    current,
    longest,
    total: set.size,
    lastCompleted: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    completedToday,
  };
}

/** Most recent streak milestones reached, newest first. */
export function reachedMilestones(streak: number): number[] {
  return STREAK_MILESTONES.filter((milestone) => milestone <= streak).sort((a, b) => b - a);
}

/** Returns the milestone just hit, or null. */
export function newMilestone(previousStreak: number, currentStreak: number): number | null {
  const hit = STREAK_MILESTONES.find(
    (milestone) => milestone > previousStreak && milestone <= currentStreak,
  );
  return hit ?? null;
}

/** Percentage of the last `days` days (including today) that were completed. */
export function completionRate(
  completions: DateKey[],
  days = 30,
  today: DateKey = todayKey(),
): number {
  if (days <= 0) return 0;
  const set = new Set(completions);
  let completed = 0;
  for (let offset = 0; offset < days; offset += 1) {
    if (set.has(addDays(today, -offset))) completed += 1;
  }
  return Math.round((completed / days) * 100);
}

export function isCompletedOn(habit: Habit, key: DateKey): boolean {
  return habit.completions.includes(key);
}

/** Last `count` days as date keys, oldest first, ending today. */
export function recentDays(count: number, today: DateKey = todayKey()): DateKey[] {
  const days: DateKey[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(today, -offset));
  }
  return days;
}
