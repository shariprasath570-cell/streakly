"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { useHabits } from "@/components/habit-provider";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { habitColorHex, withAlpha } from "@/lib/colors";
import { addDays, daysInMonth, formatLong, formatMonth, todayKey, WEEKDAY_INITIALS } from "@/lib/date";
import { activeHabits } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { DateKey } from "@/lib/types";

export default function CalendarPage() {
  const { habits, hydrated, openHabitForm, toggleCompletion } = useHabits();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const today = todayKey();
  const active = useMemo(() => activeHabits(habits), [habits]);

  const totalDays = daysInMonth(cursor.year, cursor.month);
  const firstKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-01`;
  const days = Array.from({ length: totalDays }, (_, index) =>
    addDays(firstKey, index),
  ) as DateKey[];

  const isFutureMonth =
    cursor.year > now.getFullYear() ||
    (cursor.year === now.getFullYear() && cursor.month > now.getMonth());

  const checkInsThisMonth = active.reduce(
    (sum, habit) => sum + days.filter((key) => habit.completions.includes(key)).length,
    0,
  );
  const elapsedDays = days.filter((key) => key <= today).length;
  const possible = active.length * elapsedDays;
  const monthRate = possible === 0 ? 0 : Math.round((checkInsThisMonth / possible) * 100);

  const shift = (direction: -1 | 1) => {
    setCursor((current) => {
      const date = new Date(current.year, current.month + direction, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">History</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Calendar
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Every habit, side by side. Past days are read-only, so your history stays honest.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="secondary" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[8.5rem] text-center text-sm font-medium text-fg">
              {formatMonth(cursor.year, cursor.month)}
            </span>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Next month"
              onClick={() => shift(1)}
              disabled={isFutureMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {active.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-7" />}
          title="No history yet"
          description="Your monthly calendar fills up as you check in. Add a habit and today's square is yours to claim."
        >
          <Button onClick={() => openHabitForm()}>
            <Flame className="size-4" />
            Create a habit
          </Button>
        </EmptyState>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-3">
            {[
              { label: "Check-ins this month", value: checkInsThisMonth, tint: "#14b8a6" },
              { label: "Month completion", value: `${monthRate}%`, tint: "#22d3ee" },
              { label: "Active habits", value: active.length, tint: "#60a5fa" },
            ].map((stat) => (
              <div key={stat.label} className="card p-3.5 sm:p-4">
                <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted sm:text-[10px]">
                  {stat.label}
                </p>
                <p
                  className="mt-2 text-xl font-semibold tabular-nums leading-none sm:text-2xl"
                  style={{ color: stat.tint }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          <section className="card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-max p-4 sm:p-5">
                <div className="mb-2 flex items-end gap-1">
                  <div className="sticky left-0 z-10 w-32 shrink-0 bg-surface pr-2 sm:w-44">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Habit</span>
                  </div>
                  {days.map((key) => {
                    const date = new Date(`${key}T12:00:00`);
                    const isToday = key === today;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "w-7 shrink-0 text-center",
                          isToday ? "text-fg" : "text-muted",
                          key > today && "opacity-40",
                        )}
                      >
                        <div className="text-[8px] uppercase leading-3">
                          {WEEKDAY_INITIALS[date.getDay()]}
                        </div>
                        <div className={cn("text-[10px] leading-4 tabular-nums", isToday && "font-semibold text-accent")}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  {active.map((habit) => {
                    const hex = habitColorHex(habit.color);
                    return (
                      <div key={habit.id} className="flex items-center gap-1">
                        <div className="sticky left-0 z-10 w-32 shrink-0 bg-surface pr-2 sm:w-44">
                          <Link
                            href={`/habits/${habit.id}`}
                            className="flex items-center gap-2 rounded-md py-0.5 text-[11px] font-medium text-fg-soft transition hover:text-fg sm:text-xs"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="truncate">{habit.name}</span>
                          </Link>
                        </div>
                        {days.map((key) => {
                          const done = habit.completions.includes(key);
                          const isToday = key === today;
                          const future = key > today;
                          const shared = "relative h-7 w-7 shrink-0 rounded-[6px] border transition-colors";
                          const style = done
                            ? { backgroundColor: withAlpha(hex, 0.9), borderColor: "transparent" }
                            : { backgroundColor: future ? "transparent" : "var(--surface-2)" };

                          if (isToday) {
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleCompletion(habit.id)}
                                title={`${habit.name} · Today${done ? " · completed" : ""} — click to toggle`}
                                aria-pressed={done}
                                aria-label={`Toggle today's check-in for ${habit.name}`}
                                className={cn(
                                  shared,
                                  "border-line-strong hover:border-accent/60 hover:bg-accent/10 active:scale-95",
                                )}
                                style={style}
                              >
                                {done ? (
                                  <Check className="absolute inset-0 m-auto size-3.5 text-black/60" strokeWidth={3} />
                                ) : null}
                              </button>
                            );
                          }

                          return (
                            <div
                              key={key}
                              title={`${habit.name} · ${key}${done ? " · completed" : ""}`}
                              className={cn(shared, "border-line", future && "border-dashed opacity-40")}
                              style={style}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[10px] text-muted sm:px-5">
              <span>Click today&apos;s square to toggle a check-in.</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[4px] border border-line bg-surface2" /> Missed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[4px] bg-accent/90" /> Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-[4px] border border-dashed border-line-strong" /> Upcoming
                </span>
              </div>
            </div>
          </section>

          <p className="text-center text-[11px] text-muted">
            Showing {formatMonth(cursor.year, cursor.month)} · weeks start on Sunday · today is{" "}
            {formatLong(today)}
          </p>
        </>
      )}
    </div>
  );
}
