"use client";

import { useMemo } from "react";
import { addDays, formatMedium, MONTH_LABELS, parseKey, todayKey } from "@/lib/date";
import { withAlpha } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  completions: string[];
  color: string;
  weeks?: number;
  className?: string;
}

/** GitHub-style contribution grid ending today. */
export function Heatmap({ completions, color, weeks = 26, className }: HeatmapProps) {
  const today = todayKey();
  const set = useMemo(() => new Set(completions), [completions]);

  const { columns, monthColumns } = useMemo(() => {
    const day = parseKey(today);
    const end = addDays(today, 6 - day.getDay()); // Saturday of the current week
    const start = addDays(end, -(weeks * 7 - 1));
    const cols: { key: string; future: boolean; completed: boolean; isToday: boolean }[][] = [];
    const labels: (string | null)[] = [];
    let lastLabeledMonth: number | null = null;

    for (let week = 0; week < weeks; week += 1) {
      const column: { key: string; future: boolean; completed: boolean; isToday: boolean }[] = [];
      let label: string | null = null;
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const key = addDays(start, week * 7 + weekday);
        const future = key > today;
        column.push({ key, future, completed: set.has(key), isToday: key === today });
        const date = parseKey(key);
        if (
          !future &&
          label === null &&
          date.getDate() <= 7 &&
          date.getMonth() !== lastLabeledMonth
        ) {
          label = MONTH_LABELS[date.getMonth()].slice(0, 3);
          lastLabeledMonth = date.getMonth();
        }
      }
      cols.push(column);
      labels.push(label);
    }
    return { columns: cols, monthColumns: labels };
  }, [set, today, weeks]);

  return (
    <div className={cn("w-full overflow-x-auto pb-1 scrollbar-thin", className)}>
      <div className="min-w-max">
        <div className="mb-1.5 flex gap-[3px]">
          {monthColumns.map((label, index) => (
            <div key={index} className="h-3 w-3 text-[9px] leading-3 text-muted">
              {label ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-[3px]">
              {column.map((cell) => (
                <div
                  key={cell.key}
                  title={`${formatMedium(cell.key)}${cell.completed ? " · completed" : ""}`}
                  className={cn(
                    "size-3 rounded-[3px] border transition-colors",
                    cell.future && "border-transparent bg-transparent",
                    !cell.future && !cell.completed && "border-line bg-surface2/60",
                    cell.isToday && "ring-1 ring-line-strong ring-offset-1 ring-offset-surface",
                  )}
                  style={
                    cell.completed
                      ? {
                          backgroundColor: withAlpha(color, cell.isToday ? 1 : 0.8),
                          borderColor: "transparent",
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted">
          <span>{weeks} weeks ago</span>
          <span className="inline-flex items-center gap-1.5">
            Less
            <span className="size-2.5 rounded-[2px] border border-line bg-surface2/60" />
            <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: withAlpha(color, 0.45) }} />
            <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: withAlpha(color, 0.8) }} />
            <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            More
          </span>
        </div>
      </div>
    </div>
  );
}
