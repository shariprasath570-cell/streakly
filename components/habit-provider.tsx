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
import {
  deleteAllHabitRows,
  deleteHabitRow,
  fetchHabits,
  habitToRow,
  insertHabit,
  updateHabitRow,
  upsertHabits,
} from "@/lib/cloud";
import { todayKey } from "@/lib/date";
import { buildSampleHabits } from "@/lib/sample";
import { newMilestone, streakStats } from "@/lib/streaks";
import type { DateKey, Habit, HabitColor, HabitInput, PersistedData } from "@/lib/types";
import { createId } from "@/lib/utils";
import { useAuth } from "./auth-provider";

const STORAGE_KEY = "streakly.habits.v1";
const MIGRATED_KEY = "streakly.cloud-migrated.v1";

const cacheKeyFor = (userId: string | null) =>
  userId ? `${STORAGE_KEY}.${userId}` : STORAGE_KEY;

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

function readStoredHabits(key = STORAGE_KEY): Habit[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedData;
    if (!parsed || !Array.isArray(parsed.habits)) return [];
    return parsed.habits.filter(isHabitLike).map(normalizeHabit);
  } catch {
    return [];
  }
}

function hasMigratedGuestData(): boolean {
  try {
    return window.localStorage.getItem(MIGRATED_KEY) === "1";
  } catch {
    return false;
  }
}

function markGuestDataMigrated() {
  try {
    window.localStorage.setItem(MIGRATED_KEY, "1");
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; migration still completed in the cloud.
  }
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const { configured, ready, user } = useAuth();
  const userId = user?.id ?? null;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [form, setForm] = useState<FormState>({ open: false, habitId: null });

  const notify = useCallback((message: string) => {
    setToasts((current) => [...current.slice(-2), { id: createId(), message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const habitsRef = useRef<Habit[]>([]);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // Load the signed-in user's habits from Supabase; fall back to the local cache
  // when the network is unavailable. Guests read the original local envelope.
  useEffect(() => {
    if (!ready) {
      setHydrated(false);
      return;
    }

    if (!configured || !userId) {
      setHabits(readStoredHabits(STORAGE_KEY));
      setHydrated(true);
      return;
    }

    let active = true;
    const cacheKey = cacheKeyFor(userId);
    setHydrated(false);
    setHabits(readStoredHabits(cacheKey));

    void (async () => {
      try {
        let cloud = await fetchHabits(userId);

        // First sign-in: move habits created before accounts existed into the cloud.
        if (cloud.length === 0 && !hasMigratedGuestData()) {
          const guestHabits = readStoredHabits(STORAGE_KEY);
          if (guestHabits.length > 0) {
            await upsertHabits(guestHabits.map((habit) => habitToRow(habit, userId)));
            cloud = guestHabits;
            markGuestDataMigrated();
            if (active) {
              notify(
                `${guestHabits.length} ${guestHabits.length === 1 ? "habit" : "habits"} moved to your account`,
              );
            }
          }
        }

        if (!active) return;
        setHabits(cloud);
        setHydrated(true);
      } catch {
        if (!active) return;
        setHydrated(true);
        notify("Couldn’t reach the cloud. Showing the last copy saved on this device.");
      }
    })();

    return () => {
      active = false;
    };
  }, [configured, ready, userId, notify]);

  // Keep a per-user local cache so the first paint is instant and offline reads work.
  useEffect(() => {
    if (!hydrated) return;
    const key = cacheKeyFor(userId);
    const payload: PersistedData = { version: 1, habits };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore quota / private-mode write failures; state still lives in memory.
    }
  }, [habits, hydrated, userId]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const key = cacheKeyFor(userId);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setHabits(readStoredHabits(key));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const syncFailed = useCallback(() => {
    notify("Couldn’t sync that change. Check your connection and try again.");
  }, [notify]);

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

      if (userId) {
        void insertHabit(habitToRow(habit, userId)).catch(() => {
          setHabits((current) => current.filter((entry) => entry.id !== habit.id));
          syncFailed();
        });
      }
    },
    [notify, syncFailed, userId],
  );

  const updateHabit = useCallback(
    (id: string, input: HabitInput) => {
      const name = input.name.trim();
      if (!name) return;
      const previous = habitsRef.current.find((habit) => habit.id === id);
      if (!previous) return;

      const description = input.description?.trim() ? input.description.trim() : undefined;
      setHabits((current) =>
        current.map((habit) =>
          habit.id === id
            ? { ...habit, name, description, color: input.color, category: input.category }
            : habit,
        ),
      );
      notify("Habit updated");

      if (userId) {
        void updateHabitRow(id, {
          name,
          description: description ?? null,
          color: input.color,
          category: input.category ?? null,
        }).catch(() => {
          setHabits((current) =>
            current.map((habit) =>
              habit.id === id
                ? {
                    ...habit,
                    name: previous.name,
                    description: previous.description,
                    color: previous.color,
                    category: previous.category,
                  }
                : habit,
            ),
          );
          syncFailed();
        });
      }
    },
    [notify, syncFailed, userId],
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const target = habitsRef.current.find((habit) => habit.id === id);
      const index = habitsRef.current.findIndex((habit) => habit.id === id);
      setHabits((current) => current.filter((habit) => habit.id !== id));
      if (target) notify(`${target.name} deleted`);

      if (userId) {
        void deleteHabitRow(id).catch(() => {
          setHabits((current) => {
            if (!target || current.some((habit) => habit.id === id)) return current;
            const restored = [...current];
            restored.splice(Math.min(Math.max(index, 0), restored.length), 0, target);
            return restored;
          });
          syncFailed();
        });
      }
    },
    [notify, syncFailed, userId],
  );

  const setArchived = useCallback(
    (id: string, archived: boolean) => {
      const previous = habitsRef.current.find((habit) => habit.id === id);
      setHabits((current) =>
        current.map((habit) => (habit.id === id ? { ...habit, archived } : habit)),
      );
      notify(archived ? "Habit archived" : "Habit restored");

      if (userId) {
        void updateHabitRow(id, { archived }).catch(() => {
          if (previous) {
            setHabits((current) =>
              current.map((habit) =>
                habit.id === id ? { ...habit, archived: previous.archived } : habit,
              ),
            );
          }
          syncFailed();
        });
      }
    },
    [notify, syncFailed, userId],
  );

  const toggleCompletion = useCallback(
    (id: string, dateKey: DateKey = todayKey()) => {
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

      if (userId) {
        void updateHabitRow(id, { completions: nextCompletions }).catch(() => {
          setHabits((current) =>
            current.map((entry) =>
              entry.id === id ? { ...entry, completions: habit.completions } : entry,
            ),
          );
          syncFailed();
        });
      }

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
    },
    [syncFailed, userId],
  );

  const loadSample = useCallback(() => {
    const samples = buildSampleHabits();
    const sampleIds = new Set(samples.map((habit) => habit.id));
    setHabits((current) => [...samples, ...current]);
    notify("Sample habits loaded");

    if (userId) {
      void upsertHabits(samples.map((habit) => habitToRow(habit, userId))).catch(() => {
        setHabits((current) => current.filter((habit) => !sampleIds.has(habit.id)));
        syncFailed();
      });
    }
  }, [notify, syncFailed, userId]);

  const clearHabits = useCallback(() => {
    const previous = habitsRef.current;
    setHabits([]);
    notify("All habits cleared");

    if (userId) {
      void deleteAllHabitRows(userId).catch(() => {
        setHabits(previous);
        syncFailed();
      });
    }
  }, [notify, syncFailed, userId]);

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
