"use client";

import { useEffect, useState } from "react";
import { HABIT_CATEGORIES, HABIT_COLOR_KEYS, type Habit, type HabitCategory, type HabitColor } from "@/lib/types";
import { HABIT_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { CalendarCheck, Check } from "lucide-react";
import { useHabits } from "./habit-provider";
import { Button, Modal } from "./ui";

interface HabitFormValues {
  name: string;
  description?: string;
  color: HabitColor;
  category?: HabitCategory;
}

export function HabitFormDialog() {
  const { habits, form, closeHabitForm, createHabit, updateHabit } = useHabits();
  const editing = form.habitId ? habits.find((habit) => habit.id === form.habitId) ?? null : null;

  return (
    <Modal
      open={form.open}
      onClose={closeHabitForm}
      title={editing ? "Edit habit" : "New habit"}
      description={
        editing ? "Tweak the details — your history stays intact." : "Small and specific beats big and vague."
      }
    >
      {form.open ? (
        <HabitFormFields
          habit={editing}
          onCancel={closeHabitForm}
          onSubmit={(values) => {
            if (editing) updateHabit(editing.id, values);
            else createHabit(values);
            closeHabitForm();
          }}
        />
      ) : null}
    </Modal>
  );
}

function HabitFormFields({
  habit,
  onSubmit,
  onCancel,
}: {
  habit: Habit | null;
  onSubmit: (values: HabitFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState<HabitColor>(habit?.color ?? HABIT_COLOR_KEYS[0]);
  const [category, setCategory] = useState<HabitCategory | "">(habit?.category ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) setError(null);
  }, [name]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your habit a name so you can recognise it later.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Keep the name under 60 characters.");
      return;
    }
    onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      color,
      category: category || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="habit-name" className="field-label">
          Habit name <span className="text-danger">*</span>
        </label>
        <input
          id="habit-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Read 20 pages"
          maxLength={60}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "habit-name-error" : undefined}
        />
        {error ? (
          <p id="habit-name-error" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="habit-description" className="field-label">
          Description <span className="font-normal normal-case tracking-normal text-muted/60">(optional)</span>
        </label>
        <textarea
          id="habit-description"
          className="input resize-none"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What does done look like?"
          maxLength={160}
        />
        <p className="mt-1 text-right text-[10px] text-muted">{description.length}/160</p>
      </div>

      <div>
        <span className="field-label">Color</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Habit color">
          {HABIT_COLORS.map((option) => {
            const selected = option.key === color;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                title={option.label}
                onClick={() => setColor(option.key)}
                className={cn(
                  "grid size-8 place-items-center rounded-full transition-transform duration-150 hover:scale-110",
                  selected && "ring-2 ring-offset-2 ring-offset-elevated",
                )}
                style={{
                  backgroundColor: option.hex,
                  boxShadow: selected ? `0 0 0 2px ${option.hex}55` : undefined,
                  // ring color follows the swatch
                  ["--tw-ring-color" as string]: option.hex,
                }}
              >
                {selected ? <Check className="size-4 text-black/70" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="habit-category" className="field-label">
            Category <span className="font-normal normal-case tracking-normal text-muted/60">(optional)</span>
          </label>
          <select
            id="habit-category"
            className="input appearance-none bg-surface2 pr-8"
            value={category}
            onChange={(event) => setCategory(event.target.value as HabitCategory | "")}
          >
            <option value="">No category</option>
            {HABIT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="field-label">Frequency</span>
          <div className="flex h-[42px] items-center gap-2 rounded-xl border border-line bg-surface2/40 px-3.5 text-sm text-fg-soft">
            <CalendarCheck className="size-4 text-accent" />
            Daily
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">Every day</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{habit ? "Save changes" : "Create habit"}</Button>
      </div>
    </form>
  );
}
