
/**
 * Shared utility for creating a Supabase client
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Create a Supabase client for edge functions
 * @returns Supabase client
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}
