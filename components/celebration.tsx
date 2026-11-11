"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Flame } from "lucide-react";
import { useHabits } from "./habit-provider";

const CONFETTI_COLORS = ["#2dd4bf", "#34d399", "#a3e635", "#fbbf24", "#38bdf8", "#f472b6", "#22d3ee"];

/** Confetti + milestone banner shown when a streak milestone is reached. */
export function CelebrationLayer() {
  const { celebration, clearCelebration } = useHabits();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(clearCelebration, 4200);
    return () => window.clearTimeout(timer);
  }, [celebration, clearCelebration]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 64 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 240,
        spin: 360 + Math.random() * 900,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        width: 5 + Math.random() * 6,
        height: 9 + Math.random() * 11,
        rounded: Math.random() > 0.7,
      })),
    // A new burst for every celebration.
    [celebration?.id],
  );

  if (!mounted || !celebration) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-live="polite">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            borderRadius: piece.rounded ? "999px" : "2px",
            ["--drift" as string]: `${piece.drift}px`,
            ["--spin" as string]: `${piece.spin}deg`,
            ["--duration" as string]: `${piece.duration}s`,
            ["--delay" as string]: `${piece.delay}s`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 top-5 flex justify-center px-4">
        <div className="animate-toast-in flex items-center gap-3 rounded-2xl border border-accent/30 bg-elevated px-4 py-3 shadow-[var(--shadow-float)]">
          <div className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">
              {celebration.milestone}-day milestone unlocked!
            </p>
            <p className="text-xs text-muted">
              {celebration.streak} days in a row · {celebration.habitName}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
