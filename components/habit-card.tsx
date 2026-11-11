"use client";

import {
  Archive,
  ArchiveRestore,
  Check,
  Eye,
  Flame,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { habitColorHex, withAlpha } from "@/lib/colors";
import { WEEKDAY_INITIALS } from "@/lib/date";
import { recentDays, streakStats } from "@/lib/streaks";
import type { Habit } from "@/lib/types";
import { cn, plural } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { useHabits } from "./habit-provider";
import { Button, ConfirmDialog } from "./ui";

export function HabitCard({ habit, index = 0 }: { habit: Habit; index?: number }) {
  const { toggleCompletion, setArchived, deleteHabit, openHabitForm } = useHabits();
  const { configured } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hex = habitColorHex(habit.color);
  const stats = useMemo(() => streakStats(habit.completions), [habit.completions]);
  const week = useMemo(() => recentDays(7), []);
  const today = week[week.length - 1];
  const done = habit.completions.includes(today);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className={cn(
        "card group relative animate-fade-up overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong",
        habit.archived && "opacity-70 hover:opacity-100",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(130% 100% at 0% 0%, ${withAlpha(hex, 0.18)}, transparent 65%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-start gap-3">
          <div
            className="grid size-11 shrink-0 place-items-center rounded-2xl border text-sm font-semibold"
            style={{
              backgroundColor: withAlpha(hex, 0.14),
              borderColor: withAlpha(hex, 0.26),
              color: hex,
            }}
          >
            {habit.name.trim().charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/habits/${habit.id}`}
                className="truncate text-[15px] font-semibold tracking-tight text-fg transition hover:opacity-80"
              >
                {habit.name}
              </Link>
              {habit.archived ? (
                <span className="rounded-full border border-line bg-surface2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                  Archived
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 min-h-[1.25rem] text-[13px] leading-relaxed text-muted">
              {habit.description ?? "No description"}
            </p>
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label={`Actions for ${habit.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className={cn(
                "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg",
                menuOpen && "bg-surface2 text-fg",
              )}
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="animate-pop-in absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-line bg-elevated p-1 shadow-[var(--shadow-float)]"
                style={{ transformOrigin: "top right" }}
              >
                <Link
                  href={`/habits/${habit.id}`}
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-fg-soft transition hover:bg-surface2 hover:text-fg"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="size-3.5" /> View details
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-fg-soft transition hover:bg-surface2 hover:text-fg"
                  onClick={() => {
                    setMenuOpen(false);
                    openHabitForm(habit.id);
                  }}
                >
                  <Pencil className="size-3.5" /> Edit habit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-fg-soft transition hover:bg-surface2 hover:text-fg"
                  onClick={() => {
                    setMenuOpen(false);
                    setArchived(habit.id, !habit.archived);
                  }}
                >
                  {habit.archived ? (
                    <>
                      <ArchiveRestore className="size-3.5" /> Restore habit
                    </>
                  ) : (
                    <>
                      <Archive className="size-3.5" /> Archive habit
                    </>
                  )}
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-danger transition hover:bg-danger/10"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete habit
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex items-end gap-5">
            <div>
              <p
                className="flex items-baseline gap-1.5 text-[26px] font-semibold leading-none tracking-tight"
                style={{ color: stats.current > 0 ? hex : undefined }}
              >
                {stats.current}
                <Flame
                  className={cn("size-4 translate-y-[-2px]", stats.current > 0 ? "opacity-90" : "text-muted")}
                  style={{ color: stats.current > 0 ? hex : undefined }}
                />
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">Current</p>
            </div>
            <div className="mb-0.5 h-9 w-px bg-line" />
            <div>
              <p className="text-[26px] font-semibold leading-none tracking-tight text-fg/75">
                {stats.longest}
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">Longest</p>
            </div>
          </div>
          <span className="chip max-w-[46%] truncate">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
            {habit.category ?? "Daily"}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-1">
          {week.map((key, dayIndex) => {
            const completed = habit.completions.includes(key);
            const isToday = dayIndex === week.length - 1;
            return (
              <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "h-6 w-full max-w-[26px] rounded-md border transition-colors",
                    completed ? "border-transparent" : "border-line bg-surface2/50",
                    isToday && !completed && "border-line-strong bg-surface2",
                  )}
                  style={
                    completed
                      ? { backgroundColor: withAlpha(hex, isToday ? 0.95 : 0.55) }
                      : undefined
                  }
                  title={`${key}${completed ? " — completed" : ""}`}
                />
                <span
                  className={cn(
                    "text-[9px] font-medium uppercase",
                    isToday ? "text-fg" : "text-muted/70",
                  )}
                >
                  {WEEKDAY_INITIALS[new Date(`${key}T12:00:00`).getDay()]}
                </span>
              </div>
            );
          })}
        </div>

        {habit.archived ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface2/40 px-3 py-2.5">
            <span className="text-[12px] text-muted">Archived — history kept safe</span>
            <Button size="sm" variant="ghost" onClick={() => setArchived(habit.id, false)}>
              Restore
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => toggleCompletion(habit.id)}
            aria-pressed={done}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.99]",
              done
                ? "border-transparent"
                : "border-line bg-surface2/40 text-fg-soft hover:border-line-strong hover:bg-surface2",
            )}
            style={
              done
                ? {
                    backgroundColor: withAlpha(hex, 0.13),
                    borderColor: withAlpha(hex, 0.32),
                    color: hex,
                  }
                : undefined
            }
          >
            <span
              className={cn(
                "relative grid size-5 place-items-center rounded-full border-2 transition-all duration-200",
                done ? "border-current bg-current" : "border-current/40",
              )}
            >
              {done ? (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-ping-ring rounded-full"
                    style={{ backgroundColor: hex, opacity: 0.4 }}
                  />
                  <Check
                    className="animate-check size-3 text-[var(--bg)]"
                    strokeWidth={3.5}
                    aria-hidden
                  />
                </>
              ) : null}
            </span>
            {done
              ? `Completed today${stats.current > 0 ? ` · ${plural(stats.current, "day")}` : ""}`
              : stats.current > 0
                ? "Check in to keep the streak"
                : "Check in for today"}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteHabit(habit.id);
          setConfirmOpen(false);
        }}
        title={`Delete "${habit.name}"?`}
        description={
          configured
            ? "This permanently removes the habit and its entire completion history from your account and every device. Archiving keeps the data instead."
            : "This permanently removes the habit and its entire completion history from this device. Archiving keeps the data instead."
        }
        confirmLabel="Delete forever"
      />
    </article>
  );
}
