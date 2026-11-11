import { addDays, todayKey, toKey } from "./date";
import type { Habit, HabitCategory, HabitColor } from "./types";
import { createId } from "./utils";

interface SampleDefinition {
  name: string;
  description: string;
  color: HabitColor;
  category: HabitCategory;
  pattern: number;
  history: number;
  today: boolean;
}

const SAMPLE_DEFINITIONS: SampleDefinition[] = [
  {
    name: "Morning run",
    description: "30 minutes outside before the day starts.",
    color: "orange",
    category: "Fitness",
    pattern: 0.82,
    history: 48,
    today: true,
  },
  {
    name: "Read 20 pages",
    description: "Fiction at night, non-fiction in the morning.",
    color: "violet",
    category: "Learning",
    pattern: 0.74,
    history: 62,
    today: true,
  },
  {
    name: "Meditate",
    description: "10 quiet minutes, no phone.",
    color: "teal",
    category: "Mindfulness",
    pattern: 0.61,
    history: 34,
    today: false,
  },
  {
    name: "Deep work block",
    description: "90 minutes of uninterrupted focus.",
    color: "indigo",
    category: "Productivity",
    pattern: 0.7,
    history: 40,
    today: false,
  },
  {
    name: "Drink 2L of water",
    description: "Refill the bottle at lunch.",
    color: "sky",
    category: "Health",
    pattern: 0.9,
    history: 75,
    today: true,
  },
  {
    name: "Evening stretch",
    description: "Five minutes of mobility before bed.",
    color: "rose",
    category: "Health",
    pattern: 0.5,
    history: 22,
    today: false,
  },
];

/** Deterministic pseudo-random generator so sample data is stable per habit. */
function seededRandom(seed: number): () => number {
  let state = seed % 2_147_483_647;
  if (state <= 0) state += 2_147_483_646;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

export function buildSampleHabits(today = todayKey()): Habit[] {
  return SAMPLE_DEFINITIONS.map((definition, index) => {
    const random = seededRandom(index * 7_919 + 104_729);
    const completions: string[] = [];
    for (let offset = definition.history; offset >= 0; offset -= 1) {
      const key = addDays(today, -offset);
      if (offset === 0) {
        if (definition.today) completions.push(key);
        continue;
      }
      // Occasional two-day gaps keep the history realistic.
      const chance = definition.pattern * (random() < 0.08 ? 0 : 1);
      if (random() < chance) completions.push(key);
    }

    const createdAt = new Date(`${addDays(today, -definition.history)}T08:00:00`);

    return {
      id: createId(),
      name: definition.name,
      description: definition.description,
      color: definition.color,
      category: definition.category,
      frequency: "daily",
      createdAt: createdAt.toISOString(),
      archived: false,
      completions,
    } satisfies Habit;
  });
}

export function habitStamp(date: Date): string {
  return toKey(date);
}
