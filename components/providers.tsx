"use client";

import type { ReactNode } from "react";
import { HabitProvider } from "./habit-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <HabitProvider>{children}</HabitProvider>
    </ThemeProvider>
  );
}
