"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Check,
  Flame,
  Pencil,
  Plus,
  Target,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Heatmap } from "@/components/heatmap";
import { useHabits } from "@/components/habit-provider";
import { MonthCalendar } from "@/components/month-calendar";
import { CompletionChart } from "@/components/completion-chart";
import { Button, ConfirmDialog, EmptyState, ProgressBar, Skeleton } from "@/components/ui";
import { habitColorHex, withAlpha } from "@/lib/colors";
import { formatMedium, relativeDay, todayKey, toKey } from "@/lib/date";
import { completionRate, STREAK_MILESTONES, streakStats } from "@/lib/streaks";
import { completionSeries } from "@/lib/stats";
import { cn, plural } from "@/lib/utils";

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { habits, hydrated, toggleCompletion, openHabitForm, setArchived, deleteHabit } = useHabits();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const habitId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const habit = habits.find((entry) => entry.id === habitId) ?? null;

  const today = todayKey();
  const stats = useMemo(() => (habit ? streakStats(habit.completions, today) : null), [habit, today]);
  const series = useMemo(
    () => (habit ? completionSeries([habit], 30, today) : []),
    [habit, today],
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-56" />
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-64 lg:col-span-3" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!habit || !stats) {
    return (
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> All habits
        </Link>
        <EmptyState
          icon={<Target className="size-7" />}
          title="Habit not found"
          description="This habit may have been deleted, or it only exists in another browser. Your data lives locally on this device."
        >
          <Button onClick={() => router.push("/")}>Back to dashboard</Button>
        </EmptyState>
      </div>
    );
  }

  const hex = habitColorHex(habit.color);
  const done = habit.completions.includes(today);
  const nextMilestone = STREAK_MILESTONES.find((milestone) => milestone > stats.current) ?? null;
  const previousMilestone = [...STREAK_MILESTONES].reverse().find((milestone) => milestone <= stats.current) ?? 0;
  const milestoneProgress =
    nextMilestone === null
      ? 100
      : Math.round(((stats.current - previousMilestone) / (nextMilestone - previousMilestone)) * 100);
  const recent = [...habit.completions].sort((a, b) => b.localeCompare(a)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> All habits
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => openHabitForm(habit.id)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchived(habit.id, !habit.archived)}
            title={habit.archived ? "Restore habit" : "Archive habit"}
          >
            {habit.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
            <span className="hidden sm:inline">{habit.archived ? "Restore" : "Archive"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete habit"
            className="text-muted hover:text-danger"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <section className="card relative animate-fade-up overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{
            background: `radial-gradient(120% 100% at 0% 0%, ${withAlpha(hex, 0.22)}, transparent 68%)`,
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div
                className="grid size-12 shrink-0 place-items-center rounded-2xl border text-lg font-semibold sm:size-14 sm:text-xl"
                style={{
                  backgroundColor: withAlpha(hex, 0.16),
                  borderColor: withAlpha(hex, 0.3),
                  color: hex,
                }}
              >
                {habit.name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip" style={{ color: hex, borderColor: withAlpha(hex, 0.25) }}>
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
                    {habit.category ?? "Uncategorized"}
                  </span>
                  <span className="chip">Daily</span>
                  {habit.archived ? <span className="chip">Archived</span> : null}
                </div>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                  {habit.name}
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  {habit.description ?? "No description yet. Add one so future-you remembers why this matters."}
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  Tracking since {formatMedium(toKey(new Date(habit.createdAt)))} ·{" "}
                  {plural(stats.total, "check-in")}
                </p>
              </div>
            </div>

            <div className="flex w-full items-end gap-5 sm:w-auto">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Current</p>
                <p className="mt-1 flex items-baseline gap-1.5 text-4xl font-semibold tracking-tight" style={{ color: hex }}>
                  {stats.current}
                  <Flame className="size-5" />
                </p>
              </div>
              <div className="mb-1 h-10 w-px bg-line" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Longest</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-fg/80">{stats.longest}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "30-day rate", value: `${completionRate(habit.completions, 30, today)}%`, icon: Target },
              { label: "7-day rate", value: `${completionRate(habit.completions, 7, today)}%`, icon: Award },
              { label: "Check-ins", value: stats.total, icon: Check },
              { label: "Last done", value: stats.lastCompleted ? relativeDay(stats.lastCompleted, today) : "—", icon: CalendarDays },
            ].map((tile) => (
              <div key={tile.label} className="rounded-xl border border-line bg-surface/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{tile.label}</p>
                  <tile.icon className="size-3 text-muted/70" />
                </div>
                <p className="mt-1.5 truncate text-lg font-semibold tabular-nums text-fg">{tile.value}</p>
              </div>
            ))}
          </div>

          {!habit.archived ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => toggleCompletion(habit.id)}
                aria-pressed={done}
                className={cn(
                  "flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.995]",
                  !done && "text-[#06130e] hover:brightness-105",
                )}
                style={
                  done
                    ? { backgroundColor: withAlpha(hex, 0.14), color: hex, boxShadow: `inset 0 0 0 1px ${withAlpha(hex, 0.3)}` }
                    : { backgroundColor: hex }
                }
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border-2",
                    done ? "border-current bg-current" : "border-[#06130e]/40",
                  )}
                >
                  {done ? <Check className="animate-check size-3 text-[#06130e]" strokeWidth={3.5} /> : null}
                </span>
                {done ? "Completed today — tap to undo" : "Check in for today"}
              </button>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar value={milestoneProgress} color={hex} label="Progress to next streak milestone" />
                </div>
                <p className="shrink-0 text-[10px] text-muted">
                  {nextMilestone ? `${nextMilestone - stats.current} days to ${nextMilestone}` : "All milestones reached"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface2/40 px-4 py-3">
              <p className="text-xs text-muted">This habit is archived. Its history is preserved.</p>
              <Button size="sm" variant="secondary" onClick={() => setArchived(habit.id, false)}>
                <ArchiveRestore className="size-3.5" /> Restore
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-5 sm:p-6 lg:col-span-3">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">Consistency heatmap</h2>
              <p className="mt-0.5 text-xs text-muted">The last 26 weeks, one square per day.</p>
            </div>
            <span className="chip">
              <Flame className="size-3" style={{ color: hex }} />
              Best {stats.longest}
            </span>
          </div>
          <Heatmap completions={habit.completions} color={hex} weeks={26} />
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-xs font-medium text-fg-soft">30-day trend</h3>
            <div className="mt-2">
              <CompletionChart data={series} color={hex} />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-2">
          <MonthCalendar completions={habit.completions} color={hex} />
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-xs font-medium text-fg-soft">Recent activity</h3>
            {recent.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">
                No check-ins yet. Today is a great day to start.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recent.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-xs">
                    <span
                      className="grid size-4 place-items-center rounded-full"
                      style={{ backgroundColor: withAlpha(hex, 0.16), color: hex }}
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span className="text-fg-soft">{relativeDay(key, today)}</span>
                    <span className="ml-auto text-[10px] tabular-nums text-muted">{key}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/50 px-4 py-3">
        <p className="text-[11px] text-muted">Want another habit alongside this one?</p>
        <Button size="sm" variant="secondary" onClick={() => openHabitForm()}>
          <Plus className="size-3.5" /> New habit
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteHabit(habit.id);
          setConfirmOpen(false);
          router.push("/");
        }}
        title={`Delete "${habit.name}"?`}
        description="This permanently removes the habit and its entire completion history from this device. Archiving keeps the data instead."
        confirmLabel="Delete forever"
      />
    </div>
  );
}
