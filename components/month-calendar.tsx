"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, monthGrid, todayKey } from "@/lib/date";
import { withAlpha } from "@/lib/colors";
import type { DateKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEK_HEADER = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({ completions, color }: { completions: string[]; color: string }) {
  const today = todayKey();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const completed = useMemo(() => new Set(completions), [completions]);
  const weeks = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const isFuture = (year: number, month: number) =>
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  const shift = (direction: -1 | 1) => {
    setCursor((current) => {
      const date = new Date(current.year, current.month + direction, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const monthDays = weeks.flat().filter((key): key is DateKey => Boolean(key));
  const completedThisMonth = monthDays.filter((key) => completed.has(key)).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-fg">{formatMonth(cursor.year, cursor.month)}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {completedThisMonth} of {monthDays.length} days completed
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface2 hover:text-fg"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={isFuture(cursor.year, cursor.month + 1)}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface2 hover:text-fg disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_HEADER.map((label, index) => (
          <div key={`${label}-${index}`} className="pb-1 text-center text-[10px] font-medium uppercase text-muted">
            {label}
          </div>
        ))}
        {weeks.flat().map((key, index) => {
          if (!key) return <div key={`empty-${index}`} className="aspect-square" />;
          const isDone = completed.has(key);
          const isToday = key === today;
          const isFutureDay = key > today;
          return (
            <div
              key={key}
              title={key}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-[11px] transition",
                isDone ? "border-transparent font-semibold" : "border-line bg-surface2/40 text-muted",
                isFutureDay && "opacity-40",
                isToday && "ring-1 ring-accent/70 ring-offset-2 ring-offset-surface",
              )}
              style={
                isDone
                  ? { backgroundColor: withAlpha(color, 0.9), color: "#08120d" }
                  : undefined
              }
            >
              {new Date(`${key}T12:00:00`).getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
