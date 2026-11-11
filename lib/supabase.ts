import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the build has public Supabase credentials. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client. Sessions are persisted by supabase-js and all data access is
 * constrained by row-level security using the signed-in user's JWT.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
