"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string | null;
}

interface SignUpResult {
  error: string | null;
  /** True when Supabase requires the user to confirm their email before signing in. */
  confirmEmail: boolean;
}

interface AuthContextValue {
  configured: boolean;
  ready: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email and password don’t match. Try again or create an account.";
  }
  if (lower.includes("already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email address first, then sign in.";
  }
  if (lower.includes("invalid email")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toAuthUser(data.session?.user ?? null));
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
      setReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Cloud sync isn’t configured for this build.";
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? friendlyError(error.message) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    if (!supabase) return { error: "Cloud sync isn’t configured for this build.", confirmEmail: false };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { error: friendlyError(error.message), confirmEmail: false };
    return { error: null, confirmEmail: Boolean(data.user && !data.session) };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ configured: isSupabaseConfigured, ready, user, signIn, signUp, signOut }),
    [ready, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
