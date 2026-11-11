import { isSupabaseConfigured, supabase } from "./supabase";
import {
  HABIT_CATEGORIES,
  HABIT_COLOR_KEYS,
  type Habit,
  type HabitCategory,
  type HabitColor,
} from "./types";

/** Shape of a row in `public.habits` (remote data is untrusted). */
export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  category: string | null;
  frequency: string;
  created_at: string;
  archived: boolean;
  completions: string[] | null;
}

export interface HabitInsert {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: HabitColor;
  category: HabitCategory | null;
  frequency: "daily";
  created_at: string;
  archived: boolean;
  completions: string[];
}

function client() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function habitToRow(habit: Habit, userId: string): HabitInsert {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    description: habit.description ?? null,
    color: habit.color,
    category: habit.category ?? null,
    frequency: "daily",
    created_at: habit.createdAt,
    archived: habit.archived,
    completions: habit.completions,
  };
}

export function rowToHabit(row: HabitRow): Habit {
  const color = HABIT_COLOR_KEYS.includes(row.color as HabitColor)
    ? (row.color as HabitColor)
    : "emerald";
  const category = HABIT_CATEGORIES.includes(row.category as HabitCategory)
    ? (row.category as HabitCategory)
    : undefined;
  const completions = Array.isArray(row.completions)
    ? [...new Set(row.completions.filter(isDateKey))].sort()
    : [];

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color,
    category,
    frequency: "daily",
    createdAt: row.created_at,
    archived: Boolean(row.archived),
    completions,
  };
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await client()
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToHabit(row as HabitRow));
}

export async function insertHabit(row: HabitInsert): Promise<void> {
  const { error } = await client().from("habits").insert(row);
  if (error) throw error;
}

export async function upsertHabits(rows: HabitInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client().from("habits").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function updateHabitRow(
  id: string,
  patch: Partial<Pick<HabitInsert, "name" | "description" | "color" | "category" | "archived" | "completions">>,
): Promise<void> {
  const { error } = await client().from("habits").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteHabitRow(id: string): Promise<void> {
  const { error } = await client().from("habits").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllHabitRows(userId: string): Promise<void> {
  const { error } = await client().from("habits").delete().eq("user_id", userId);
  if (error) throw error;
}
