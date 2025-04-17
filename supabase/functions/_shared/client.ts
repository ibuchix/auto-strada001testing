
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Create a Supabase client with admin privileges
 * @returns Supabase client instance
 */
export function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
