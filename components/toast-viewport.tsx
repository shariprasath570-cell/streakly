"use client";

import { CircleCheck, X } from "lucide-react";
import { useHabits } from "./habit-provider";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const { toasts, dismissToast } = useHabits();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-line bg-elevated/95 px-3.5 py-2.5 shadow-[var(--shadow-float)] backdrop-blur"
        >
          <CircleCheck className="size-4 shrink-0 text-accent" />
          <p className="flex-1 text-xs font-medium text-fg">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={cn("rounded-md p-1 text-muted transition hover:bg-surface2 hover:text-fg")}
            aria-label="Dismiss notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
