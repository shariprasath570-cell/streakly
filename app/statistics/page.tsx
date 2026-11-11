"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Award,
  CalendarCheck,
  Flame,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { CompletionChart } from "@/components/completion-chart";
import { useHabits } from "@/components/habit-provider";
import { StatTile } from "@/components/stat-tile";
import { Button, EmptyState, ProgressBar, Skeleton } from "@/components/ui";
import { HABIT_COLORS, habitColorHex, withAlpha } from "@/lib/colors";
import { todayKey } from "@/lib/date";
import {
  activeHabits,
  categoryBreakdown,
  completionSeries,
  dashboardStats,
  streakLeaders,
  topHabits,
  weekdayPerformance,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

const CATEGORY_TINTS: Record<string, string> = {
  Health: "#10b981",
  Fitness: "#f97316",
  Productivity: "#6366f1",
  Learning: "#8b5cf6",
  Mindfulness: "#14b8a6",
  Creative: "#d946ef",
  Social: "#0ea5e9",
  Finance: "#f59e0b",
  Other: "#64748b",
  Uncategorized: "#94a3b8",
};

export default function StatisticsPage() {
  const { habits, hydrated, openHabitForm } = useHabits();
  const [range, setRange] = useState<number>(30);
  const today = todayKey();

  const active = useMemo(() => activeHabits(habits), [habits]);
  const overview = useMemo(() => dashboardStats(habits, today), [habits, today]);
  const series = useMemo(() => completionSeries(habits, range, today), [habits, range, today]);
  const weekday = useMemo(() => weekdayPerformance(habits, 8, today), [habits, today]);
  const best = useMemo(() => topHabits(habits, range, 5, today), [habits, range, today]);
  const categories = useMemo(() => categoryBreakdown(habits), [habits]);
  const leaders = useMemo(() => streakLeaders(habits, 4, today), [habits, today]);

  const rangeCheckIns = series.reduce((sum, point) => sum + point.completed, 0);
  const rangeEligible = series.reduce((sum, point) => sum + point.eligible, 0);
  const rangeRate = rangeEligible === 0 ? 0 : Math.round((rangeCheckIns / rangeEligible) * 100);
  const bestWeekday = [...weekday].sort((a, b) => b.rate - a.rate)[0];
  const maxWeekdayRate = Math.max(1, ...weekday.map((day) => day.rate));

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="animate-fade-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Insights</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Statistics
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              A clear look at your consistency — where you shine and where a little more care would help.
            </p>
          </div>
          <div className="flex rounded-xl border border-line bg-surface2/40 p-1">
            {RANGES.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setRange(option.days)}
                aria-pressed={range === option.days}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium transition",
                  range === option.days
                    ? "bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    : "text-muted hover:text-fg",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {active.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="size-7" />}
          title="Your stats will appear here"
          description="Create a habit and check in for a few days. Streakly turns those check-ins into trends, heatmaps and honest averages."
        >
          <Button onClick={() => openHabitForm()}>
            <Sparkles className="size-4" />
            Create a habit
          </Button>
        </EmptyState>
      ) : (
        <>
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={CalendarCheck}
              label="Total check-ins"
              value={overview.totalCheckIns}
              hint="All habits, all time"
              tint="#14b8a6"
            />
            <StatTile
              icon={TrendingUp}
              label={`${RANGES.find((option) => option.days === range)?.label} rate`}
              value={`${rangeRate}%`}
              hint={`${rangeCheckIns} of ${rangeEligible} possible check-ins`}
              tint="#22d3ee"
              progress={rangeRate}
            />
            <StatTile
              icon={Activity}
              label="Avg. streak"
              value={overview.averageStreak}
              hint="Average current streak across habits"
              tint="#60a5fa"
            />
            <StatTile
              icon={Trophy}
              label="Best streak"
              value={overview.longestStreak}
              hint="Your longest run ever"
              tint="#fbbf24"
            />
          </section>

          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-fg">Completion over time</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Percentage of habits completed each day across the last {range} days.
                </p>
              </div>
              <span className="chip">
                <span className="size-1.5 rounded-full bg-accent" />
                {rangeRate}% average
              </span>
            </div>
            <CompletionChart data={series} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-fg">Best performing habits</h2>
                  <p className="mt-0.5 text-xs text-muted">Completion rate over the last {range} days.</p>
                </div>
                <Award className="size-4 text-muted" />
              </div>
              <ul className="space-y-3.5">
                {best.map((entry) => {
                  const hex = habitColorHex(entry.habit.color);
                  return (
                    <li key={entry.habit.id}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                        <span className="truncate text-[13px] font-medium text-fg">{entry.habit.name}</span>
                        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">
                          {entry.rate}%
                        </span>
                      </div>
                      <ProgressBar value={entry.rate} color={hex} />
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-fg">Weekday rhythm</h2>
                  <p className="mt-0.5 text-xs text-muted">Your consistency by day of the week.</p>
                </div>
                <span className="chip">
                  Best: {bestWeekday?.label ?? "—"} {bestWeekday ? `${bestWeekday.rate}%` : ""}
                </span>
              </div>
              <div className="flex h-40 items-end gap-2">
                {weekday.map((day) => (
                  <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-medium tabular-nums text-muted">
                      {day.eligible === 0 ? "–" : `${day.rate}%`}
                    </span>
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-accent/40 to-accent transition-[height] duration-500"
                      style={{
                        height: `${Math.max(day.rate / maxWeekdayRate, 0.04) * 100}%`,
                        opacity: day.eligible === 0 ? 0.25 : 1,
                      }}
                      title={`${day.label}: ${day.rate}%`}
                    />
                    <span className="text-[10px] font-medium text-muted">{day.label.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold tracking-tight text-fg">Category mix</h2>
                <p className="mt-0.5 text-xs text-muted">Where your check-ins come from.</p>
              </div>
              <ul className="space-y-3.5">
                {categories.map((slice) => {
                  const tint = CATEGORY_TINTS[slice.category] ?? HABIT_COLORS[0].hex;
                  return (
                    <li key={slice.category}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
                        <span className="truncate text-[13px] text-fg-soft">{slice.category}</span>
                        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">
                          {slice.checkIns} · {slice.share}%
                        </span>
                      </div>
                      <ProgressBar value={slice.share} color={withAlpha(tint, 0.85)} />
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-fg">Streak leaders</h2>
                  <p className="mt-0.5 text-xs text-muted">Longest runs, still alive or completed.</p>
                </div>
                <Flame className="size-4 text-muted" />
              </div>
              <ul className="divide-y divide-line">
                {leaders.map((entry, index) => (
                  <li key={entry.habit.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-4 text-center text-[11px] font-semibold tabular-nums text-muted">
                      {index + 1}
                    </span>
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg border text-[11px] font-semibold"
                      style={{
                        backgroundColor: withAlpha(habitColorHex(entry.habit.color), 0.12),
                        borderColor: withAlpha(habitColorHex(entry.habit.color), 0.24),
                        color: habitColorHex(entry.habit.color),
                      }}
                    >
                      {entry.habit.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-fg">{entry.habit.name}</p>
                      <p className="text-[10px] text-muted">Current {entry.current} days</p>
                    </div>
                    <span className="flex shrink-0 items-baseline gap-1 text-sm font-semibold tabular-nums text-fg">
                      {entry.longest}
                      <Flame className="size-3 text-amber-400" />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
