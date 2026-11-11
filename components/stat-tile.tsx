"use client";

import type { LucideIcon } from "lucide-react";
import { withAlpha } from "@/lib/colors";
import { ProgressBar } from "./ui";

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tint = "#14b8a6",
  progress,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tint?: string;
  progress?: number;
  delay?: number;
}) {
  return (
    <div
      className="card animate-fade-up p-4 transition-colors hover:border-line-strong sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg border"
          style={{
            backgroundColor: withAlpha(tint, 0.12),
            borderColor: withAlpha(tint, 0.22),
            color: tint,
          }}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-fg sm:text-[30px]">
        {value}
      </p>
      {typeof progress === "number" ? <ProgressBar value={progress} color={tint} className="mt-3" /> : null}
      {hint ? <p className="mt-2 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}
