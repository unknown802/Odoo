import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseAdminConfig, hasSupabaseConfig } from "./env.js";

let authClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseAuthClient() {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase auth configuration is missing");
  }

  authClient ??= createClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false }
  });

  return authClient;
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig) {
    throw new Error("Supabase service role configuration is missing");
  }

  adminClient ??= createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  });

  return adminClient;
}
