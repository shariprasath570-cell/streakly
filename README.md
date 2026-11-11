# Streakly

A calm, local-first habit tracker with streaks, heatmaps and honest statistics. Dark by default, light on demand, and fully responsive.

![Stack](https://img.shields.io/badge/Next.js-App%20Router-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS%20v4-0ea5e9)

## Features

- **Habit management** — create, edit, archive, restore and delete habits with a name, optional description, category and one of 12 accent colors.
- **Daily check-ins** — one tap to complete today, one tap to undo. Past days are read-only so history stays honest.
- **Streaks** — current and longest streak per habit, plus milestone celebrations (3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 300, 365 days) with confetti.
- **Dashboard** — greeting, long date, total habits, done today, today's completion rate, best streak and a quote that changes daily.
- **Calendar** — a combined month view, one row per habit, color-coded by completion. Today's cell toggles with a click.
- **Habit detail** — 26-week consistency heatmap, per-day monthly calendar, 30-day trend, recent activity and milestone progress.
- **Statistics** — completion rate over 7/30/90 days, weekday rhythm, best-performing habits, category mix and streak leaders.
- **Search, category filters, archived toggle** — find any habit quickly.
- **Local-first** — everything is persisted to `localStorage`; no account, backend or tracking. Sample data is one click away in the empty state.
- **Light by default** with a dark mode toggle, persisted and applied before first paint.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + type checking
npm start          # serve the production build
```

## Project structure

```
app/
  layout.tsx              Root layout, fonts, theme bootstrap, providers
  page.tsx                Dashboard
  calendar/page.tsx       Combined monthly calendar
  statistics/page.tsx     Statistics and insights
  habits/[id]/page.tsx    Individual habit detail
  not-found.tsx           404
components/
  app-shell.tsx           Sidebar, mobile header/bottom nav, global overlays
  habit-provider.tsx      Store: localStorage persistence, CRUD, check-ins, milestones
  theme-provider.tsx      Dark/light theme with no-flash bootstrapping
  habit-card.tsx          Habit card, menus, animated check-in
  habit-form.tsx          Create/edit modal
  heatmap.tsx             GitHub-style contribution grid
  month-calendar.tsx      Monthly calendar for a habit
  completion-chart.tsx    SVG completion-rate chart
  stat-tile.tsx           Reusable metric card
  ui.tsx                  Buttons, modal, confirm dialog, empty state, skeleton
lib/
  types.ts                Habit, DateKey, StreakStats and other models
  date.ts                 Timezone-safe local date helpers
  streaks.ts              Streak, completion-rate and milestone logic
  stats.ts                Aggregations for dashboard and statistics
  colors.ts               Habit palette + alpha helpers
  quotes.ts               Deterministic daily quotes
  sample.ts               Demo habits
```

## Data model

```ts
interface Habit {
  id: string;
  name: string;
  description?: string;
  color: HabitColor;        // one of 12 preset palette keys
  category?: HabitCategory;
  frequency: "daily";
  createdAt: string;        // ISO timestamp
  archived: boolean;
  completions: string[];    // sorted unique local date keys, e.g. "2026-11-11"
}
```

`localStorage` holds a versioned envelope under `streakly.habits.v1`:

```json
{ "version": 1, "habits": [] }
```

The shape is intentionally simple so future additions (weekly frequency, notes per day, reminders) can extend it without a migration.

## Streak rules

- A completion is stored as a **local** calendar date key (`YYYY-MM-DD`), never a UTC timestamp — no timezone drift around midnight.
- **Current streak** counts consecutive completed days ending today. If today is not checked in yet but yesterday was, the streak is still alive and counts backwards from yesterday; it only resets once a full day is missed.
- **Longest streak** is the longest consecutive run anywhere in the history, recalculated from completions. Nothing goes stale if a day is unmarked.
- Only **today** can be toggled; history is read-only.
- Completion rates for a day only count habits that already existed and were not archived on that day.

## Notes

- The app is fully client-side. The root route renders a skeleton until data hydrates so server and client markup always match.
- Local date keys and noon-based date math avoid DST and timezone rounding issues.
- Animations respect `prefers-reduced-motion`.
