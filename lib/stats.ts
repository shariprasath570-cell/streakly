import { addDays, todayKey, toKey } from "./date";
import { completionRate, streakStats } from "./streaks";
import type { DateKey, Habit, HabitCategory } from "./types";

export type CategoryKey = HabitCategory | "Uncategorized";

export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((habit) => !habit.archived);
}

export function habitCreatedKey(habit: Habit): DateKey {
  const date = new Date(habit.createdAt);
  return Number.isNaN(date.getTime()) ? toKey(new Date()) : toKey(date);
}

/** Habits that already existed on the given day and were not archived. */
export function eligibleHabitsOn(habits: Habit[], key: DateKey): Habit[] {
  return habits.filter((habit) => !habit.archived && habitCreatedKey(habit) <= key);
}

export interface DashboardStats {
  totalHabits: number;
  completedToday: number;
  todayRate: number;
  longestStreak: number;
  totalCheckIns: number;
  averageStreak: number;
}

export function dashboardStats(habits: Habit[], today: DateKey = todayKey()): DashboardStats {
  const active = activeHabits(habits);
  const completedToday = active.filter((habit) => habit.completions.includes(today)).length;
  const streaks = active.map((habit) => streakStats(habit.completions, today));
  return {
    totalHabits: active.length,
    completedToday,
    todayRate: active.length === 0 ? 0 : Math.round((completedToday / active.length) * 100),
    longestStreak: active.length === 0 ? 0 : Math.max(...streaks.map((entry) => entry.longest)),
    totalCheckIns: habits.reduce((sum, habit) => sum + habit.completions.length, 0),
    averageStreak:
      active.length === 0
        ? 0
        : Math.round((streaks.reduce((sum, entry) => sum + entry.current, 0) / active.length) * 10) /
          10,
  };
}

export interface DailyCompletion {
  key: DateKey;
  completed: number;
  eligible: number;
  rate: number;
}

/** Daily completion rate for the last `days` days (oldest first, today last). */
export function completionSeries(
  habits: Habit[],
  days: number,
  today: DateKey = todayKey(),
): DailyCompletion[] {
  const series: DailyCompletion[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = addDays(today, -offset);
    const eligible = eligibleHabitsOn(habits, key);
    const completed = eligible.filter((habit) => habit.completions.includes(key)).length;
    series.push({
      key,
      completed,
      eligible: eligible.length,
      rate: eligible.length === 0 ? 0 : Math.round((completed / eligible.length) * 100),
    });
  }
  return series;
}

export interface WeekdayPerformance {
  label: string;
  rate: number;
  completed: number;
  eligible: number;
}

/** Aggregate completion rate by weekday over the last `weeks` weeks. */
export function weekdayPerformance(
  habits: Habit[],
  weeks = 8,
  today: DateKey = todayKey(),
): WeekdayPerformance[] {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = labels.map((label) => ({ label, completed: 0, eligible: 0, rate: 0 }));
  for (let offset = weeks * 7 - 1; offset >= 0; offset -= 1) {
    const key = addDays(today, -offset);
    const eligible = eligibleHabitsOn(habits, key);
    if (eligible.length === 0) continue;
    const weekday = new Date(`${key}T12:00:00`).getDay();
    const completed = eligible.filter((habit) => habit.completions.includes(key)).length;
    buckets[weekday].completed += completed;
    buckets[weekday].eligible += eligible.length;
  }
  return buckets.map((bucket) => ({
    ...bucket,
    rate: bucket.eligible === 0 ? 0 : Math.round((bucket.completed / bucket.eligible) * 100),
  }));
}

export function habitRate(habit: Habit, days = 30, today: DateKey = todayKey()): number {
  return completionRate(habit.completions, Math.max(1, days), today);
}

export function topHabits(
  habits: Habit[],
  days = 30,
  limit = 4,
  today: DateKey = todayKey(),
): { habit: Habit; rate: number; checkIns: number }[] {
  return activeHabits(habits)
    .map((habit) => ({
      habit,
      rate: completionRate(habit.completions, days, today),
      checkIns: habit.completions.filter((key) => key >= addDays(today, -(days - 1)) && key <= today)
        .length,
    }))
    .sort((a, b) => b.rate - a.rate || b.checkIns - a.checkIns)
    .slice(0, limit);
}

export interface CategorySlice {
  category: CategoryKey;
  checkIns: number;
  habits: number;
  share: number;
}

export function categoryBreakdown(habits: Habit[]): CategorySlice[] {
  const map = new Map<CategoryKey, { checkIns: number; habits: number }>();
  for (const habit of habits) {
    const key: CategoryKey = habit.category ?? "Uncategorized";
    const entry = map.get(key) ?? { checkIns: 0, habits: 0 };
    entry.checkIns += habit.completions.length;
    entry.habits += 1;
    map.set(key, entry);
  }
  const total = [...map.values()].reduce((sum, entry) => sum + entry.checkIns, 0);
  return [...map.entries()]
    .map(([category, entry]) => ({
      category,
      checkIns: entry.checkIns,
      habits: entry.habits,
      share: total === 0 ? 0 : Math.round((entry.checkIns / total) * 100),
    }))
    .sort((a, b) => b.checkIns - a.checkIns);
}

export function streakLeaders(
  habits: Habit[],
  limit = 4,
  today: DateKey = todayKey(),
): { habit: Habit; current: number; longest: number }[] {
  return activeHabits(habits)
    .map((habit) => {
      const stats = streakStats(habit.completions, today);
      return { habit, current: stats.current, longest: stats.longest };
    })
    .sort((a, b) => b.longest - a.longest || b.current - a.current)
    .slice(0, limit);
}
