"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Cloud,
  Flame,
  LayoutDashboard,
  LogOut,
  Plus,
  Sun,
  Moon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { AuthScreen } from "./auth-screen";
import { useHabits } from "./habit-provider";
import { useTheme } from "./theme-provider";
import { HabitFormDialog } from "./habit-form";
import { CelebrationLayer } from "./celebration";
import { ToastViewport } from "./toast-viewport";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_10px_24px_-12px_rgba(20,184,166,0.85)]">
        <Flame className="size-[18px] text-white" strokeWidth={2.4} />
      </div>
      {compact ? null : (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-fg">Streakly</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Habit tracker</p>
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, ready, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-line bg-surface2/50 text-muted transition hover:border-line-strong hover:text-fg",
        className,
      )}
    >
      {ready && !isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { openHabitForm, hydrated, habits } = useHabits();
  const { configured, ready, user, signOut } = useAuth();
  const activeCount = habits.filter((habit) => !habit.archived).length;
  const totalCheckIns = habits.reduce((sum, habit) => sum + habit.completions.length, 0);

  if (configured && !ready) {
    return (
      <div className="grid min-h-screen place-items-center px-6" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600">
            <Flame className="size-6 text-white" strokeWidth={2.4} />
          </div>
          <p className="text-sm text-muted">Loading your streaks…</p>
        </div>
      </div>
    );
  }

  if (configured && !user) {
    return <AuthScreen />;
  }

  return (
    <div className="relative min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-elevated/70 px-4 py-6 backdrop-blur-xl md:flex">
        <div className="px-2">
          <Logo />
        </div>

        <button
          type="button"
          onClick={() => openHabitForm()}
          className="mt-7 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:brightness-105 active:scale-[0.99]"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          New habit
        </button>

        <nav className="mt-7 flex flex-col gap-1" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-surface2 text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    : "text-muted hover:bg-surface2/60 hover:text-fg",
                )}
              >
                <Icon
                  className={cn("size-[18px]", active ? "text-accent" : "text-muted group-hover:text-fg-soft")}
                />
                {item.label}
                {item.href === "/" && activeCount > 0 ? (
                  <span className="ml-auto rounded-md bg-surface px-1.5 py-0.5 text-[10px] tabular-nums text-muted">
                    {activeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {user ? (
            <div className="rounded-xl border border-line bg-surface/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-fg-soft">
                <Cloud className="size-3 text-accent" />
                Synced
              </p>
              <p className="mt-1 truncate text-[11px] text-muted" title={user.email ?? undefined}>
                {user.email ?? "Signed in"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {hydrated
                  ? `${totalCheckIns} check-ins saved to your account.`
                  : "Loading your data…"}
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[11px] font-medium text-muted transition hover:border-line-strong hover:text-fg"
              >
                <LogOut className="size-3" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-surface/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-fg-soft">
                <span className="size-1.5 rounded-full bg-accent" />
                Local-first
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {hydrated
                  ? `${totalCheckIns} check-ins saved on this device.`
                  : "Loading your data…"}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl md:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label={user.email ? `Sign out of ${user.email}` : "Sign out"}
                title={user.email ?? "Sign out"}
                className="grid size-9 place-items-center rounded-lg border border-line bg-surface2/50 text-muted transition hover:border-line-strong hover:text-fg"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 md:pb-16 md:pt-10">
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={() => openHabitForm()}
        aria-label="New habit"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-5 z-40 grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-[0_18px_36px_-14px_rgba(20,184,166,0.8)] transition active:scale-95 md:hidden"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elevated/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-xl md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-20 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <HabitFormDialog />
      <CelebrationLayer />
      <ToastViewport />
    </div>
  );
}
