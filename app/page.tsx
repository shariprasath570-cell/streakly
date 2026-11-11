"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Flame,
  Plus,
  Quote,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Archive,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { HabitCard } from "@/components/habit-card";
import { useHabits } from "@/components/habit-provider";
import { StatTile } from "@/components/stat-tile";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { formatLong, todayKey } from "@/lib/date";
import { quoteForDay } from "@/lib/quotes";
import { dashboardStats } from "@/lib/stats";
import type { HabitCategory } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

export default function DashboardPage() {
  const { habits, hydrated, openHabitForm, loadSample } = useHabits();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  const today = todayKey();
  const stats = useMemo(() => dashboardStats(habits, today), [habits, today]);
  const quote = useMemo(() => quoteForDay(), []);
  const archivedCount = habits.filter((habit) => habit.archived).length;

  const categories = useMemo(
    () =>
      [
        ...new Set(
          habits
            .map((habit) => habit.category)
            .filter((value): value is HabitCategory => Boolean(value)),
        ),
      ].sort(),
    [habits],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return habits.filter((habit) => {
      if (!showArchived && habit.archived) return false;
      if (category !== "all" && habit.category !== category) return false;
      if (!term) return true;
      return (
        habit.name.toLowerCase().includes(term) ||
        (habit.description ?? "").toLowerCase().includes(term) ||
        (habit.category ?? "").toLowerCase().includes(term)
      );
    });
  }, [habits, search, category, showArchived]);

  if (!hydrated) return <DashboardSkeleton />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const remaining = stats.totalHabits - stats.completedToday;
  const summary =
    stats.totalHabits === 0
      ? "Create your first habit and start stacking small wins."
      : remaining === 0
        ? "Every habit checked in. That's a perfect day."
        : `${plural(remaining, "habit")} left today — a few minutes is all it takes.`;

  const hasFilters = search.trim().length > 0 || category !== "all" || showArchived;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="animate-fade-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          {formatLong(today)}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              {greeting}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{summary}</p>
          </div>
          <Button className="hidden md:inline-flex" onClick={() => openHabitForm()}>
            <Plus className="size-4" strokeWidth={2.5} />
            New habit
          </Button>
        </div>
      </header>

      <section aria-label="Today's overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Target}
          label="Total habits"
          value={stats.totalHabits}
          hint={stats.totalHabits === 0 ? "Nothing tracked yet" : `${archivedCount} archived`}
          tint="#60a5fa"
          delay={0}
        />
        <StatTile
          icon={Check}
          label="Done today"
          value={`${stats.completedToday}/${stats.totalHabits}`}
          hint={stats.totalHabits === 0 ? "Add a habit to begin" : `${plural(remaining, "habit")} remaining`}
          tint="#34d399"
          delay={50}
        />
        <StatTile
          icon={TrendingUp}
          label="Completion"
          value={`${stats.todayRate}%`}
          hint="Today's completion rate"
          tint="#22d3ee"
          progress={stats.todayRate}
          delay={100}
        />
        <StatTile
          icon={Flame}
          label="Best streak"
          value={stats.longestStreak}
          hint={stats.averageStreak > 0 ? `Avg ${stats.averageStreak} days current` : "Longest streak so far"}
          tint="#fbbf24"
          delay={150}
        />
      </section>

      <section className="card relative animate-fade-up overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-accent/10 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="hidden size-10 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent sm:grid">
            <Quote className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              <Sparkles className="size-3 text-accent" />
              Daily motivation
            </div>
            <p className="text-[15px] leading-relaxed text-fg-soft text-balance sm:text-base">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-2 text-xs text-muted">— {quote.author}</p>
          </div>
        </div>
      </section>

      {habits.length === 0 ? (
        <EmptyState
          icon={<Flame className="size-7" />}
          title="Start your first streak"
          description="Habits are built one check-in at a time. Pick something small enough that you can't say no, and show up for it today."
        >
          <Button onClick={() => openHabitForm()}>
            <Plus className="size-4" />
            Create a habit
          </Button>
          <Button variant="secondary" onClick={loadSample}>
            <Sparkles className="size-4" />
            Explore with sample data
          </Button>
        </EmptyState>
      ) : (
        <section aria-label="Your habits" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-fg">
                {showArchived ? "All habits" : "Active habits"}
              </h2>
              <span className="rounded-md border border-line bg-surface2/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted">
                {filtered.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search habits"
                  aria-label="Search habits"
                  className="input h-9 w-full py-0 pl-8 pr-3 text-xs sm:w-52"
                />
              </div>
              {archivedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowArchived((value) => !value)}
                  aria-pressed={showArchived}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
                    showArchived
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-line bg-surface2/40 text-muted hover:text-fg",
                  )}
                >
                  <Archive className="size-3.5" />
                  Archived
                  <span className="tabular-nums opacity-70">{archivedCount}</span>
                </button>
              ) : null}
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
              <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
                All
              </FilterChip>
              {categories.map((option) => (
                <FilterChip
                  key={option}
                  active={category === option}
                  onClick={() => setCategory(option === category ? "all" : option)}
                >
                  {option}
                </FilterChip>
              ))}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="card px-6 py-12 text-center">
              <p className="text-sm font-medium text-fg">No habits match those filters</p>
              <p className="mt-1 text-xs text-muted">Try a different search or category.</p>
              {hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setShowArchived(false);
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((habit, index) => (
                <HabitCard key={habit.id} habit={habit} index={index} />
              ))}
            </div>
          )}
        </section>
      )}

      {habits.length > 0 ? (
        <p className="pb-2 text-center text-[11px] text-muted">
          {user
            ? "Synced securely to your account — available on every device."
            : "Everything is saved in this browser — no account, no server."}{" "}
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-accent" />
            {user ? "Cloud sync" : "Local-first"}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-line bg-surface2/40 text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}
