"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { todayKey } from "@/lib/date";
import { buildSampleHabits } from "@/lib/sample";
import { newMilestone, streakStats } from "@/lib/streaks";
import type { DateKey, Habit, HabitColor, HabitInput, PersistedData } from "@/lib/types";
import { createId } from "@/lib/utils";

const STORAGE_KEY = "streakly.habits.v1";

export interface Celebration {
  id: string;
  habitName: string;
  streak: number;
  milestone: number;
}

export interface Toast {
  id: string;
  message: string;
}

export interface FormState {
  open: boolean;
  habitId: string | null;
}

interface HabitContextValue {
  habits: Habit[];
  hydrated: boolean;
  createHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  deleteHabit: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  toggleCompletion: (id: string, dateKey?: DateKey) => void;
  loadSample: () => void;
  clearHabits: () => void;
  form: FormState;
  openHabitForm: (habitId?: string) => void;
  closeHabitForm: () => void;
  celebration: Celebration | null;
  clearCelebration: () => void;
  toasts: Toast[];
  notify: (message: string) => void;
  dismissToast: (id: string) => void;
}

const HabitContext = createContext<HabitContextValue | null>(null);

const FALLBACK_COLOR: HabitColor = "emerald";

function normalizeHabit(value: Habit): Habit {
  const completions = Array.isArray(value.completions)
    ? [...new Set(value.completions.filter((key) => typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key)))].sort()
    : [];
  return {
    id: value.id,
    name: value.name.trim() || "Untitled habit",
    description: typeof value.description === "string" && value.description.trim() ? value.description : undefined,
    color: value.color ?? FALLBACK_COLOR,
    category: value.category,
    frequency: "daily",
    createdAt:
      value.createdAt && !Number.isNaN(new Date(value.createdAt).getTime())
        ? value.createdAt
        : new Date().toISOString(),
    archived: Boolean(value.archived),
    completions,
  };
}

function isHabitLike(value: unknown): value is Habit {
  if (!value || typeof value !== "object") return false;
  const habit = value as Partial<Habit>;
  return typeof habit.id === "string" && typeof habit.name === "string";
}

function readStoredHabits(): Habit[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedData;
    if (!parsed || !Array.isArray(parsed.habits)) return [];
    return parsed.habits.filter(isHabitLike).map(normalizeHabit);
  } catch {
    return [];
  }
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [form, setForm] = useState<FormState>({ open: false, habitId: null });
  const habitsRef = useRef<Habit[]>([]);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  useEffect(() => {
    setHabits(readStoredHabits());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedData = { version: 1, habits };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota / private-mode write failures; state still lives in memory.
    }
  }, [habits, hydrated]);

  // Keep multiple open tabs of Streakly in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setHabits(readStoredHabits());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const notify = useCallback((message: string) => {
    setToasts((current) => [...current.slice(-2), { id: createId(), message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const openHabitForm = useCallback((habitId?: string) => {
    setForm({ open: true, habitId: habitId ?? null });
  }, []);

  const closeHabitForm = useCallback(() => {
    setForm({ open: false, habitId: null });
  }, []);

  const createHabit = useCallback(
    (input: HabitInput) => {
      const name = input.name.trim();
      if (!name) return;
      const habit: Habit = {
        id: createId(),
        name,
        description: input.description?.trim() ? input.description.trim() : undefined,
        color: input.color,
        category: input.category,
        frequency: "daily",
        createdAt: new Date().toISOString(),
        archived: false,
        completions: [],
      };
      setHabits((current) => [habit, ...current]);
      notify(`${name} added`);
    },
    [notify],
  );

  const updateHabit = useCallback(
    (id: string, input: HabitInput) => {
      const name = input.name.trim();
      if (!name) return;
      setHabits((current) =>
        current.map((habit) =>
          habit.id === id
            ? {
                ...habit,
                name,
                description: input.description?.trim() ? input.description.trim() : undefined,
                color: input.color,
                category: input.category,
              }
            : habit,
        ),
      );
      notify("Habit updated");
    },
    [notify],
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const target = habitsRef.current.find((habit) => habit.id === id);
      setHabits((current) => current.filter((habit) => habit.id !== id));
      if (target) notify(`${target.name} deleted`);
    },
    [notify],
  );

  const setArchived = useCallback(
    (id: string, archived: boolean) => {
      setHabits((current) =>
        current.map((habit) => (habit.id === id ? { ...habit, archived } : habit)),
      );
      notify(archived ? "Habit archived" : "Habit restored");
    },
    [notify],
  );

  const toggleCompletion = useCallback((id: string, dateKey: DateKey = todayKey()) => {
    const today = todayKey();
    // Only the current day can be (un)marked; history stays untouched.
    if (dateKey !== today) return;

    const habit = habitsRef.current.find((entry) => entry.id === id);
    if (!habit || habit.archived) return;

    const wasCompleted = habit.completions.includes(dateKey);
    const nextCompletions = wasCompleted
      ? habit.completions.filter((key) => key !== dateKey)
      : [...habit.completions, dateKey].sort();

    const before = streakStats(habit.completions, dateKey);
    const after = streakStats(nextCompletions, dateKey);

    setHabits((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, completions: nextCompletions } : entry)),
    );

    if (!wasCompleted) {
      const milestone = newMilestone(before.current, after.current);
      if (milestone) {
        setCelebration({
          id: createId(),
          habitName: habit.name,
          streak: after.current,
          milestone,
        });
      }
    }
  }, []);

  const loadSample = useCallback(() => {
    setHabits((current) => [...buildSampleHabits(), ...current]);
    notify("Sample habits loaded");
  }, [notify]);

  const clearHabits = useCallback(() => {
    setHabits([]);
    notify("All habits cleared");
  }, [notify]);

  const value = useMemo<HabitContextValue>(
    () => ({
      habits,
      hydrated,
      createHabit,
      updateHabit,
      deleteHabit,
      setArchived,
      toggleCompletion,
      loadSample,
      clearHabits,
      form,
      openHabitForm,
      closeHabitForm,
      celebration,
      clearCelebration: () => setCelebration(null),
      toasts,
      notify,
      dismissToast,
    }),
    [
      habits,
      hydrated,
      createHabit,
      updateHabit,
      deleteHabit,
      setArchived,
      toggleCompletion,
      loadSample,
      clearHabits,
      form,
      openHabitForm,
      closeHabitForm,
      celebration,
      toasts,
      notify,
      dismissToast,
    ],
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits(): HabitContextValue {
  const context = useContext(HabitContext);
  if (!context) throw new Error("useHabits must be used inside HabitProvider");
  return context;
}
