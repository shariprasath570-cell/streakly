"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { HabitProvider } from "./habit-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HabitProvider>{children}</HabitProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
