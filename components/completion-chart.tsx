"use client";

import { useId } from "react";
import { formatShort } from "@/lib/date";
import type { DailyCompletion } from "@/lib/stats";

export function CompletionChart({ data, color = "#14b8a6" }: { data: DailyCompletion[]; color?: string }) {
  const gradientId = useId();

  if (data.length === 0) return null;

  const width = 640;
  const height = 200;
  const top = 14;
  const bottom = 8;
  const usable = height - top - bottom;

  const xFor = (index: number) =>
    data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
  const yFor = (rate: number) => height - bottom - (Math.max(0, Math.min(100, rate)) / 100) * usable;

  const line = data
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)},${yFor(point.rate).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = data[data.length - 1];
  const average = Math.round(data.reduce((sum, point) => sum + point.rate, 0) / data.length);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-40 w-full sm:h-48"
          role="img"
          aria-label={`Daily completion rate for the last ${data.length} days, averaging ${average}%`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((value) => (
            <line
              key={value}
              x1="0"
              x2={width}
              y1={yFor(value)}
              y2={yFor(value)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray={value === 0 ? undefined : "3 5"}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={xFor(data.length - 1)}
            cy={yFor(last.rate)}
            r="4"
            fill={color}
            stroke="var(--surface)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-1 text-[10px] text-muted">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <span>{formatShort(data[0].key)}</span>
        <span className="rounded-full border border-line bg-surface2/60 px-2 py-0.5 font-medium text-fg-soft">
          Avg {average}%
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}
