# Streakly

A calm habit tracker with streaks, heatmaps and honest statistics — now with secure, per-user cloud sync. Light by default, dark on demand, and fully responsive.

![Stack](https://img.shields.io/badge/Next.js-App%20Router-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS%20v4-0ea5e9) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e)

## Features

- **Accounts and cloud sync** — email/password sign-in backed by Supabase Auth. Every habit and check-in is stored against the signed-in user, so streaks follow you to any device.
- **Habit management** — create, edit, archive, restore and delete habits with a name, optional description, category and one of 12 accent colors.
- **Daily check-ins** — one tap to complete today, one tap to undo. Past days are read-only so history stays honest.
- **Streaks** — current and longest streak per habit, plus milestone celebrations (3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 300, 365 days) with confetti.
- **Dashboard** — greeting, long date, total habits, done today, today's completion rate, best streak and a quote that changes daily.
- **Calendar** — a combined month view, one row per habit, color-coded by completion. Today's cell toggles with a click.
- **Habit detail** — 26-week consistency heatmap, per-day monthly calendar, 30-day trend, recent activity and milestone progress.
- **Statistics** — completion rate over 7/30/90 days, weekday rhythm, best-performing habits, category mix and streak leaders.
- **Search, category filters, archived toggle** — find any habit quickly.
- **Private by default** — Postgres row-level security scopes every row to `auth.uid()`. The browser only receives the public anon key; no service key is shipped.
- **Offline-tolerant** — the last synced copy is cached per user in `localStorage`, and failed writes roll back with a toast instead of silently diverging.
- **Light by default** with a dark mode toggle, persisted and applied before first paint.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your Supabase values
npm run dev                  # http://localhost:3000
npm run build                # production build + type checking
npm start                    # serve the production build
```

Required environment variables (safe for the browser):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Set the same two variables in Vercel for Production, Preview and Development before deploying.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the schema below.
3. Copy **Project URL** and the **anon/publishable key** from Project Settings → API.
4. Under Authentication → Providers, keep Email enabled. New accounts work instantly when “Confirm email” is off; otherwise users confirm before signing in.
5. Add your deployed origin (and `http://localhost:3000`) to Authentication → URL Configuration.

```sql
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'emerald',
  category text,
  frequency text not null default 'daily',
  created_at timestamptz not null default now(),
  archived boolean not null default false,
  completions text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_created_at_idx
  on public.habits (user_id, created_at desc);

alter table public.habits enable row level security;

create policy "Users read own habits" on public.habits
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own habits" on public.habits
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own habits" on public.habits
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own habits" on public.habits
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger habits_touch_updated_at
  before update on public.habits
  for each row execute function public.touch_updated_at();

grant select, insert, update, delete on public.habits to authenticated;
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
  app-shell.tsx           Sidebar, mobile header/bottom nav, account card
  auth-provider.tsx       Supabase session state and auth actions
  auth-screen.tsx         Sign in / create account screen
  habit-provider.tsx      Store: cloud sync, per-user cache, CRUD, milestones
  theme-provider.tsx      Dark/light theme with no-flash bootstrapping
  habit-card.tsx          Habit card, menus, animated check-in
  habit-form.tsx          Create/edit modal
  heatmap.tsx             GitHub-style contribution grid
  month-calendar.tsx      Monthly calendar for a habit
  completion-chart.tsx    SVG completion-rate chart
  stat-tile.tsx           Reusable metric card
  ui.tsx                  Buttons, modal, confirm dialog, empty state, skeleton
lib/
  supabase.ts             Browser client from public env vars
  cloud.ts                Typed habit queries and row mapping
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
  id: string;               // UUID generated on the client
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

`public.habits` stores one row per habit, keyed by `id` and owned by `user_id`. `completions` is a `text[]` of local date keys, so no timezone conversion happens in the database. `localStorage` keeps a per-user cache (`streakly.habits.v1.<user-id>`) for fast first paint and offline reads; habits created before accounts existed are migrated to the cloud once on first sign-in.

Writes are optimistic: the UI updates immediately, the row is written through the user's JWT, and a failed write rolls the change back and surfaces a toast. RLS means a user can only ever read or modify rows whose `user_id` matches their token, even though the anon key is public.

## Streak rules

- A completion is stored as a **local** calendar date key (`YYYY-MM-DD`), never a UTC timestamp — no timezone drift around midnight.
- **Current streak** counts consecutive completed days ending today. If today is not checked in yet but yesterday was, the streak is still alive and counts backwards from yesterday; it only resets once a full day is missed.
- **Longest streak** is the longest consecutive run anywhere in the history, recalculated from completions. Nothing goes stale if a day is unmarked.
- Only **today** can be toggled; history is read-only.
- Completion rates for a day only count habits that already existed and were not archived on that day.

## Notes

- All Supabase calls happen in the browser; the app has no custom API routes to deploy. The anon key is public by design and every table has RLS enabled.
- The root route renders a skeleton until the session and data hydrate so server and client markup always match.
- Local date keys and noon-based date math avoid DST and timezone rounding issues.
- Animations respect `prefers-reduced-motion`.
