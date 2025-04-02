
/**
 * Shared Supabase client for edge functions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Global client instance
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get a Supabase client instance
 * @param supabaseUrl Optional Supabase URL (uses env var by default)
 * @param supabaseKey Optional Supabase key (uses env var by default)
 * @returns Supabase client
 */
export function getSupabaseClient(
  supabaseUrl?: string,
  supabaseKey?: string
) {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  const url = supabaseUrl || Deno.env.get("SUPABASE_URL") || "";
  const key = supabaseKey || Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  if (!url || !key) {
    throw new Error("Missing Supabase URL or key");
  }
  
  supabaseClient = createClient(url, key);
  return supabaseClient;
}
