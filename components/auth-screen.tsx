"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { Button } from "./ui";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    if (next === mode || busy) return;
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const message = await signIn(trimmed, password);
        if (message) setError(message);
      } else {
        const result = await signUp(trimmed, password);
        if (result.error) {
          setError(result.error);
        } else if (result.confirmEmail) {
          setNotice("Check your inbox to confirm your email, then sign in.");
        }
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 size-[28rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_16px_32px_-16px_rgba(20,184,166,0.9)]">
            <Flame className="size-6 text-white" strokeWidth={2.4} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
            {mode === "signin"
              ? "Sign in to pick up your streaks exactly where you left off."
              : "Your habits and check-ins stay private to you, on every device."}
          </p>
        </div>

        <div className="card p-6 sm:p-7">
          <div
            role="tablist"
            aria-label="Account access"
            className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface2/50 p-1"
          >
            {(
              [
                { key: "signin", label: "Sign in" },
                { key: "signup", label: "Create account" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => switchMode(tab.key)}
                className={cn(
                  "h-9 rounded-lg text-xs font-medium transition",
                  mode === tab.key
                    ? "bg-elevated text-fg shadow-[0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-muted hover:text-fg",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="field-label">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="field-label">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === "signup" ? (
                <p className="mt-1.5 text-[11px] text-muted">Minimum 8 characters.</p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs leading-relaxed text-danger"
              >
                {error}
              </p>
            ) : null}

            {notice ? (
              <p
                role="status"
                className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-xs leading-relaxed text-accent"
              >
                {notice}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            {mode === "signin" ? "New to Streakly? " : "Already tracking with us? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-accent transition hover:opacity-80"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
          <ShieldCheck className="size-3.5 text-accent" />
          Private to your account, protected by row-level security.
        </p>
      </div>
    </div>
  );
}
